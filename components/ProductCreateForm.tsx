"use client";
import axios from "axios";
import Cookies from "js-cookie";
import { Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import Select from "react-select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Editor } from "@tinymce/tinymce-react";
import {
  Trash2,
  UploadCloud,
  Image as ImageIcon,
  ArrowRight,
  ArrowLeft,
  List,
  FileText,
  GalleryHorizontalEnd,
  CheckCircle2,
} from "lucide-react";
import type { CategoryItem, Product } from "@/types/type";
import ProductFeaturesBox from "./ProductFeaturesBox";

// Type fallback (اگر در "@/types/type" نداری)

// ----------- Utility: ساخت درخت دسته‌بندی ------------
function buildCategoryTree(list: CategoryItem[]): CategoryItem[] {
  const map: Record<string, CategoryItem & { children: CategoryItem[] }> = {};
  const roots: CategoryItem[] = [];
  list.forEach((item) => {
    map[item.id] = { ...item, children: [] };
  });
  list.forEach((item) => {
    if (item.fatherId) {
      if (map[item.fatherId]) map[item.fatherId].children.push(map[item.id]);
    } else {
      roots.push(map[item.id]);
    }
  });
  return roots;
}

// Utility: پیدا‌کردن دسته بر اساس id در درخت
function findCategoryById(
  tree: CategoryItem[],
  id?: string
): CategoryItem | undefined {
  if (!id) return undefined;
  const stack = [...tree];
  while (stack.length) {
    const node = stack.pop();
    if (!node) continue;
    if (node.id === id) return node;
    if (node.children) stack.push(...node.children);
  }
  return undefined;
}
// Utility: پیدا کردن مسیر کامل تا یک دسته (حتما میخوای موقع edit مسیر رو بسازی)
function findPathToCategory(
  tree: CategoryItem[],
  targetId: string
): string[] | undefined {
  const stack: Array<{ node: CategoryItem; path: string[] }> = tree.map(
    (root) => ({ node: root, path: [root.id] })
  );
  while (stack.length) {
    const { node, path } = stack.pop()!;
    if (node.id === targetId) return path;
    if (node.children) {
      for (const child of node.children) {
        stack.push({ node: child, path: [...path, child.id] });
      }
    }
  }
  return undefined;
}

// ----------- درخت انتخابگر مرحله‌به‌مرحله فقط برای یک مسیر ----------
function CategoryTreePicker(props: {
  tree: CategoryItem[];
  steps: string[];
  setSteps: (s: string[]) => void;
  disabled?: boolean;
}) {
  const { tree, steps, setSteps, disabled } = props;
  let currentList = tree;
  let levels: {
    options: { value: string; label: string; cat: CategoryItem }[];
    value: string;
    index: number;
  }[] = [];
  // Build select levels
  for (let i = 0; ; i++) {
    levels.push({
      options: currentList.map((cat) => ({
        value: cat.id,
        label: cat.title,
        cat,
      })),
      value: steps[i] || "",
      index: i,
    });
    const found = currentList.find((cat) => cat.id === steps[i]);
    if (found && found.children && found.children.length > 0) {
      currentList = found.children;
    } else break;
  }
  return (
    <div className="flex flex-wrap gap-3">
      {levels.map((lvl, i) => (
        <select
          key={i}
          value={lvl.value}
          disabled={disabled}
          onChange={(e) => {
            const newSteps = steps.slice(0, i);
            newSteps[i] = e.target.value;
            setSteps(newSteps);
          }}
          className={`border rounded-xl px-3 py-2 min-w-[160px]`}
        >
          <option value="">انتخاب...</option>
          {lvl.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
// -- stepper config
const steps = [
  { label: "اطلاعات محصول", icon: <FileText size={20} /> },
  { label: "گالری و ویژگی‌ها", icon: <GalleryHorizontalEnd size={20} /> },
];
// style for react-select
const selectStyle = {
  control: (base: any, state: any) => ({
    ...base,
    backgroundColor: "white",
    borderRadius: "0.75rem",
    minHeight: "2.5rem",
    borderColor: state.isFocused ? "#60a5fa" : "#e5e7eb",
    boxShadow: state.isFocused ? "0 0 0 2px #93c5fd" : "none",
    direction: "rtl",
    fontWeight: 600,
    fontFamily: "inherit",
  }),
  menu: (base: any) => ({
    ...base,
    zIndex: 50,
    borderRadius: "0.75rem",
    direction: "rtl",
    fontFamily: "inherit",
  }),
};

export default function ProductCreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productIdQuery = searchParams.get("id") || "";
  // گام: 1=فرم٬ 2=گالری و ویژگی‌ها
  const [step, setStep] = React.useState<1 | 2>(productIdQuery ? 2 : 1);
  const [realProductId, setRealProductId] =
    React.useState<string>(productIdQuery);
  const [form, setForm] = React.useState({
    name: "",
    slug: "",
    isAvailable: true,
    count: "",
    price: "",
    off: "",
    description: { text: "" },
    categoryId: [] as string[],
    tagId: [] as string[],
    deliveryId: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    ogTitle: "",
    ogDescription: "",
    canonicalUrl: "",
    altText: "",
  });
  // دسته‌های مرحله‌ای:
  const [categoryOptions, setCategoryOptions] = React.useState<any[]>([]);
  const [catTree, setCatTree] = React.useState<CategoryItem[]>([]);
  const [tagOptions, setTagOptions] = React.useState<any[]>([]);
  const [deliveryOptions, setDeliveryOptions] = React.useState<any[]>([]);
  // دسته چندتایی (مهم!)
  const [categoryPaths, setCategoryPaths] = React.useState<string[][]>([]);
  const [currentCategorySteps, setCurrentCategorySteps] = React.useState<
    string[]
  >([]);
  //
  const [gallery, setGallery] = React.useState<any[]>([]);
  const [imgFile, setImgFile] = React.useState<File | null>(null);
  const [imgUploading, setImgUploading] = React.useState(false);
  const [message, setMessage] = React.useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [loading, setLoading] = React.useState(false);

  // ---------- گرفتن داده‌های اولیه ----------
  React.useEffect(() => {
    (async () => {
      try {
        const [cat, tag, del] = await Promise.all([
          axios.get("https://api.pooladmotor.com/category/getAllCategory"),
          axios.get("https://api.pooladmotor.com/tag"),
          axios.get("https://api.pooladmotor.com/delivery/delivery"),
        ]);
        setCategoryOptions(
          cat.data.data.map((c: any) => ({ value: c.id, label: c.title }))
        );
        setCatTree(buildCategoryTree(cat.data.data));
        setTagOptions(
          tag.data.data.map((t: any) => ({ value: t.id, label: t.title }))
        );
        setDeliveryOptions(
          del.data.data.map((d: any) => ({
            value: d.id,
            label: d.deliveryType,
          }))
        );
      } catch {
        setMessage({ text: "خطا در دریافت اطلاعات فیلترها", type: "error" });
      }
    })();
  }, []);

  // ---------- در حالت ویرایش: مقداردهی categoryPaths ----------
  React.useEffect(() => {
    if (!realProductId) return;
    (async () => {
      try {
        const res = await axios.get(
          `https://api.pooladmotor.com/product/${realProductId}`
        );
        const p: Product = res.data.data;
        setGallery(p.media_item || []);
        setForm((prev) => ({
          ...prev,
          name: p.name || "",
          slug: p.slug || "",
          isAvailable: p.isAvailable ?? true,
          count: p.count?.toString() || "",
          price: p.price?.toString() || "",
          off: p.off?.toString() || "",
          description: { text: p.description?.text || "" },
          categoryId:
            p.CategoriesOnProduct?.map((c: any) => c.categoryId) || [],
          tagId: p.tagOnProduct?.map((t: any) => t.tagId) || [],
          deliveryId: p.deliveryId || "",
          metaTitle: p.metaTitle || "",
          metaDescription: p.metaDescription || "",
          metaKeywords: p.metaKeywords || "",
          ogTitle: p.ogTitle || "",
          ogDescription: p.ogDescription || "",
          canonicalUrl: p.canonicalUrl || "",
          altText: p.altText || "",
        }));
        // فقط زمانی که دسته‌بندی‌ها مشخص شد (catTree)
        setTimeout(() => {
          if (!p.CategoriesOnProduct?.length) return;
          setCategoryPaths((old) => {
            // اگر از قبل مقدار ندارد، مقداردهی کن:
            if (old.length) return old;
            const paths = p.CategoriesOnProduct.map((c: any) =>
              findPathToCategory(catTree, c.categoryId)
            ).filter(Boolean) as string[][];
            return paths;
          });
        }, 300);
      } catch {
        setMessage({ text: "خطا در دریافت اطلاعات محصول", type: "error" });
      }
    })();
    // eslint-disable-next-line
  }, [realProductId, catTree.length]);

  // =========== توابع فرم ============
  function formatMoneyInput(value: string) {
    let cleaned = value.replace(/,/g, "").replace(/^0+/, "");
    if (!cleaned) return "";
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  function handlePriceInput(e: React.ChangeEvent<HTMLInputElement>) {
    let value = e.target.value.replace(/[^0-9]/g, "");
    let formatted = formatMoneyInput(value);
    setForm((prev) => ({ ...prev, price: formatted }));
  }
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  }
  function handleEditorChange(content: string) {
    setForm((f) => ({
      ...f,
      description: { ...f.description, text: content },
    }));
  }

  // ========== ثبت مرحله ۱ ===========
  async function handleSubmitStep1(e: React.FormEvent) {
    e.preventDefault();
    const token = Cookies.get("token");
    if (!token) return setMessage({ text: "توکن یافت نشد!", type: "error" });
    setLoading(true);
    setMessage(null);
    try {
      // دسته‌های نهایی (فقط leafها)
      const finalCategoryIds = categoryPaths
        .map((path) => path.at(-1))
        .filter(Boolean);

      const payload = {
        ...form,
        categoryId: finalCategoryIds,
        count: parseInt(form.count),
        price: parseInt(form.price.replace(/,/g, "")),
        off: form.off ? parseInt(form.off) : undefined,
      };

      if (!realProductId) {
        const res = await axios.post(
          "https://api.pooladmotor.com/product/create",
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setRealProductId(res.data.data.id);
        setMessage({
          text: "محصول با موفقیت ایجاد شد. حالا عکس را بارگذاری کنید.",
          type: "success",
        });
        setStep(2);
      } else {
        await axios.put(
          `https://api.pooladmotor.com/product/update/${realProductId}`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setMessage({
          text: "محصول به‌روزرسانی شد. حالا عکس‌ها را مدیریت کنید.",
          type: "success",
        });
        setStep(2);
      }
    } catch {
      setMessage({ text: "❌ خطا در ثبت اطلاعات محصول", type: "error" });
    }
    setLoading(false);
  }
  // ==================== آپلود و حذف عکس ===================
  async function handleUploadImage() {
    if (!imgFile) return;
    const token = Cookies.get("token");
    if (!token) {
      setMessage({ text: "توکن یافت نشد.", type: "error" });
      return;
    }
    setImgUploading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append("file", imgFile);
    if (realProductId) formData.append("productId", realProductId);
    else {
      setImgUploading(false);
      return setMessage({
        text: "ابتدا محصول را ایجاد کنید.",
        type: "error",
      });
    }
    formData.append("alt", form.name || "محصول");
    formData.append("description", form.name || "محصول");
    try {
      await axios.post(
        "https://api.pooladmotor.com/media/uploadProduct",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const res = await axios.get(
        `https://api.pooladmotor.com/product/${realProductId}`
      );
      setGallery(res.data.data.media_item || []);
      setMessage({ text: "تصویر با موفقیت آپلود شد", type: "success" });
      setImgFile(null);
    } catch {
      setMessage({ text: "خطا در آپلود تصویر", type: "error" });
    }
    setImgUploading(false);
  }
  async function handleDeleteImage(mediaId: string) {
    if (!realProductId) return;
    const token = Cookies.get("token");
    if (!token) {
      setMessage({ text: "توکن یافت نشد.", type: "error" });
      return;
    }
    try {
      await axios.delete(
        `https://api.pooladmotor.com/media/delete/${mediaId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const res = await axios.get(
        `https://api.pooladmotor.com/product/${realProductId}`
      );
      setGallery(res.data.data.media_item || []);
      setMessage({ text: "تصویر حذف شد", type: "success" });
    } catch {
      setMessage({ text: "خطا در حذف تصویر", type: "error" });
    }
  }
  // ---------- Stepper UI ----------
  function Stepper() {
    return (
      <div className="flex items-center justify-center mb-12 mt-3 select-none">
        {steps.map((s, i) => {
          const stepNum = (i + 1) as 1 | 2;
          const isActive = step === stepNum;
          const isDone = stepNum < step;
          const canClick = realProductId ? true : i === 0;
          return (
            <React.Fragment key={i}>
              <button
                type="button"
                title={s.label}
                disabled={!canClick}
                tabIndex={canClick ? 0 : -1}
                className={`
                  flex flex-col items-center w-28 group transition
                  ${canClick ? "cursor-pointer" : "cursor-not-allowed"}
                  focus:outline-none
                `}
                onClick={() => {
                  if (!canClick) return;
                  if (stepNum === 1) setStep(1);
                  if (stepNum === 2 && realProductId) setStep(2);
                }}
              >
                <div
                  className={`rounded-full w-11 h-11 flex items-center justify-center border-2 mb-1
                    transition 
                    ${
                      isActive
                        ? "border-blue-500 bg-blue-100 text-blue-700 shadow-lg scale-110"
                        : isDone
                        ? "border-green-400 bg-green-100 text-green-700"
                        : "border-gray-200 bg-gray-100 text-gray-400"
                    }
                    group-hover:border-blue-400 group-hover:bg-blue-50
                  `}
                >
                  {s.icon}
                </div>
                <span
                  className={
                    "text-sm mt-1 text-center font-bold leading-5 transition " +
                    (isActive
                      ? "text-blue-700"
                      : isDone
                      ? "text-green-700"
                      : "text-gray-400")
                  }
                >
                  {s.label}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div
                  className={`h-1 w-11 md:w-24 mx-1 rounded transition
                    ${isDone ? "bg-green-400" : "bg-gray-200"}
                  `}
                ></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // -------------------- STEP1/UI کپی کن ------------------
  function renderStep1() {
    return (
      <>
        <form
          onSubmit={handleSubmitStep1}
          className="grid grid-cols-1 md:grid-cols-5 gap-7 items-start"
          dir="rtl"
        >
          <section className="md:col-span-3 relative">
            <Card className="bg-white border border-gray-100 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
                  <FileText size={20} /> اطلاعات محصول
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">نام محصول</Label>
                    <Input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      autoFocus
                    />
                  </div>
                  {!productIdQuery && (
                    <div>
                      <Label htmlFor="slug">اسلاگ (Slug)</Label>
                      <Input
                        id="slug"
                        name="slug"
                        value={form.slug}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2 sm:col-span-2">
                    <Checkbox
                      id="isAvailable"
                      checked={form.isAvailable}
                      onCheckedChange={(checked) =>
                        setForm((f) => ({
                          ...f,
                          isAvailable: checked === true,
                        }))
                      }
                      className="h-5 w-5"
                    />
                    <Label
                      htmlFor="isAvailable"
                      className="cursor-pointer text-sm"
                    >
                      موجودی فعال؟
                    </Label>
                  </div>
                  <div>
                    <Label htmlFor="count">تعداد</Label>
                    <Input
                      id="count"
                      name="count"
                      type="number"
                      min={0}
                      value={form.count}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">قیمت (تومان)</Label>
                    <Input
                      id="price"
                      name="price"
                      value={form.price}
                      onChange={handlePriceInput}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="off">درصد تخفیف</Label>
                    <Input
                      id="off"
                      name="off"
                      type="number"
                      min={0}
                      max={100}
                      value={form.off}
                      onChange={handleChange}
                    />
                  </div>
                  {/* ------------ دسته‌بندی درختی چندتایی --------------- */}
                  <div className="sm:col-span-2">
                    <Label className="mb-1 block">
                      انتخاب دسته‌بندی (درختی چندتایی)
                    </Label>
                    <CategoryTreePicker
                      tree={catTree}
                      steps={currentCategorySteps}
                      setSteps={setCurrentCategorySteps}
                      disabled={catTree.length === 0}
                    />
                    <Button
                      type="button"
                      style={{ marginTop: 6 }}
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const leaf = currentCategorySteps.at(-1);
                        if (!leaf) return;
                        // تکراری نباشد
                        if (categoryPaths.some((path) => path.at(-1) === leaf))
                          return;
                        setCategoryPaths((prev) => [
                          ...prev,
                          currentCategorySteps,
                        ]);
                        setCurrentCategorySteps([]);
                      }}
                      disabled={
                        !currentCategorySteps.length ||
                        !currentCategorySteps.at(-1) ||
                        categoryPaths.some(
                          (path) => path.at(-1) === currentCategorySteps.at(-1)
                        )
                      }
                    >
                      افزودن این دسته
                    </Button>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {categoryPaths.map((arr, idx) => {
                        const leafId = arr.at(-1);
                        const leafCat = findCategoryById(catTree, leafId);
                        // نمایش مسیر کامل:
                        const titles: string[] = arr.map(
                          (id) => findCategoryById(catTree, id)?.title || id
                        );
                        return (
                          <Badge
                            key={leafId}
                            variant="secondary"
                            className="flex gap-1 items-center px-2 py-1 text-sm"
                          >
                            {titles.join(" ← ")}
                            <button
                              type="button"
                              className="ml-1 text-red-600 hover:text-red-800 px-1"
                              onClick={() =>
                                setCategoryPaths((paths) =>
                                  paths.filter((_, i) => i !== idx)
                                )
                              }
                            >
                              ×
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="tagId">برچسب‌ها</Label>
                    <Select
                      id="tagId"
                      name="tagId"
                      isMulti
                      options={tagOptions}
                      value={tagOptions.filter((t) =>
                        form.tagId.includes(t.value)
                      )}
                      onChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          tagId: v.map((i: any) => i.value),
                        }))
                      }
                      styles={selectStyle}
                      placeholder="انتخاب برچسب"
                      className="mt-1 z-40"
                      noOptionsMessage={() => "موردی نیست"}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="deliveryId">روش ارسال</Label>
                    <Select
                      id="deliveryId"
                      name="deliveryId"
                      options={deliveryOptions}
                      value={
                        deliveryOptions.find(
                          (d) => d.value === form.deliveryId
                        ) || null
                      }
                      onChange={(v) =>
                        setForm((f) => ({ ...f, deliveryId: v ? v.value : "" }))
                      }
                      styles={selectStyle}
                      placeholder="انتخاب روش ارسال"
                      className="mt-1 z-30"
                      noOptionsMessage={() => "موردی نیست"}
                      isClearable
                    />
                  </div>
                </div>
                {/* دکمه ذخیره و ادامه */}
                <div className="mt-8 flex flex-col sm:flex-row gap-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 text-lg flex gap-2 items-center bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-md rounded-xl transition"
                  >
                    {loading
                      ? "در حال ذخیره‌سازی..."
                      : realProductId
                      ? "ذخیره تغییرات و مدیریت تصاویر"
                      : "ثبت محصول و افزودن عکس"}
                    <ArrowLeft size={20} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
          {/* --- RIGHT: SEO ---- */}
          <section className="md:col-span-2 w-full">
            <Card className="bg-zinc-50 border border-gray-100 rounded-2xl shadow-sm h-full">
              <CardHeader>
                <CardTitle className="text-base font-bold text-sky-700 mb-2 flex items-center gap-2">
                  <List size={20} /> تنظیمات سئو
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="metaTitle">تایتل</Label>
                    <Input
                      id="metaTitle"
                      name="metaTitle"
                      value={form.metaTitle}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="metaKeywords">کلمات کلیدی متا</Label>
                    <Input
                      id="metaKeywords"
                      name="metaKeywords"
                      value={form.metaKeywords}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ogTitle">OG Title</Label>
                    <Input
                      id="ogTitle"
                      name="ogTitle"
                      value={form.ogTitle}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ogDescription">OG Description</Label>
                    <Textarea
                      id="ogDescription"
                      name="ogDescription"
                      value={form.ogDescription}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="canonicalUrl">Canonical URL</Label>
                    <Input
                      id="canonicalUrl"
                      name="canonicalUrl"
                      value={form.canonicalUrl}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="altText">Alt Text</Label>
                    <Input
                      id="altText"
                      name="altText"
                      value={form.altText}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="metaDescription">توضیحات متا</Label>
                    <Textarea
                      id="metaDescription"
                      name="metaDescription"
                      value={form.metaDescription}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </form>
        <Card className="mt-8 mb-2 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
              <FileText size={20} /> توضیحات کامل محصول
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="description" className="mb-2 block">
              توضیحات کامل
            </Label>
            <Editor
              apiKey="jdzgmpo5yskgqy6fppsq5zbw64a3n8lufg7rp1jg9t2v82sx"
              value={form.description.text}
              init={{
                directionality: "rtl",
                height: 220,
                menubar: true,
                plugins: "lists link image table code directionality",
                toolbar:
                  "undo redo | styleselect | bold italic | alignright alignleft aligncenter alignjustify | bullist numlist outdent indent | link image table | code ltr rtl",
                content_style: `body { font-family: Vazir, Tahoma, Arial, sans-serif; font-size:16px; direction: rtl; }`,
              }}
              onEditorChange={handleEditorChange}
            />
          </CardContent>
        </Card>
      </>
    );
  }

  // ------------------ گالری و ویژگی‌ها ------------------
  function renderStep2() {
    return (
      <div
        className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start"
        dir="rtl"
      >
        {/* -- RIGHT: Gallery -- */}
        <section className="md:col-span-2 w-full">
          <Card className="mb-6 to-white border-1 border-gray-100 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-blue-900">
                <ImageIcon className="text-blue-400" size={20} /> گالری محصول
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 mt-1 mb-4 min-h-20">
                {gallery && gallery.length > 0 ? (
                  gallery.map((item) => (
                    <div
                      key={item.id}
                      className="relative rounded-xl border border-gray-300 bg-white hover:shadow-xl overflow-hidden flex items-center justify-center w-[92px] h-[92px] cursor-pointer transition group"
                    >
                      <img
                        src={`https://api.pooladmotor.com/media/${
                          item.media?.url || item.url
                        }`}
                        alt={item.alt || "تصویر محصول"}
                        className="object-cover w-full h-full group-hover:scale-110 group-hover:brightness-90 transition"
                        loading="lazy"
                        style={{ borderRadius: "0.75rem" }}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        onClick={() =>
                          handleDeleteImage(item.media?.id || item.id)
                        }
                        className="absolute top-1 left-1 bg-white/80 z-20"
                        aria-label="حذف"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">
                    تصویری ثبت نشده است.
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) =>
                    setImgFile(
                      e.target.files && e.target.files[0]
                        ? e.target.files[0]
                        : null
                    )
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-lg py-3 px-4 border-blue-300"
                >
                  <UploadCloud size={18} /> انتخاب عکس جدید
                </Button>
                {imgFile && (
                  <>
                    <Badge className="text-xs truncate max-w-[110px] px-2 py-1 bg-blue-100 text-blue-700 border border-blue-400">
                      {imgFile.name}
                    </Badge>
                    <Button
                      type="button"
                      onClick={handleUploadImage}
                      disabled={imgUploading}
                      size="sm"
                      variant="default"
                      className="flex items-center rounded-lg"
                    >
                      {imgUploading ? "در حال آپلود..." : "آپلود"}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
        {/* -- LEFT: Features & next/prev -- */}
        <section className="md:col-span-3 w-full flex flex-col gap-6">
          <ProductFeaturesBox productId={realProductId || ""} />
          <div className="flex flex-row justify-between gap-3 mt-3">
            <Button
              variant="secondary"
              className="flex gap-2 items-center w-1/2 text-base h-12 rounded-xl"
              type="button"
              onClick={() => setStep(1)}
            >
              <ArrowRight size={18} /> مرحله قبل
            </Button>
            <Button
              variant="default"
              className="flex gap-2 items-center w-1/2 text-base h-12 rounded-xl border border-green-400 bg-gradient-to-l from-green-200 to-green-50 text-green-900"
              type="button"
              onClick={() => router.push("/super-dashboard/products")}
            >
              اتمام و بازگشت
              <CheckCircle2 size={18} className="text-green-600" />
            </Button>
          </div>
        </section>
      </div>
    );
  }
  //---------------- رندر کلی -----------------
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <main className="container mx-auto max-w-5xl p-4 mb-10">
        <Card className="rounded-3xl shadow-md border-gray-100 border-2">
          <CardHeader>
            <CardTitle className="flex gap-2 items-center">
              <ImageIcon size={24} className="ml-1 text-blue-500" />
              {realProductId ? "ویرایش/مدیریت محصول" : "ایجاد محصول جدید"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Stepper />
            {message && (
              <Alert
                variant={message.type === "success" ? "default" : "destructive"}
                className="mb-6"
              >
                <AlertTitle>
                  {message.type === "success" ? "موفق" : "خطا"}
                </AlertTitle>
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}
            {step === 1 ? renderStep1() : renderStep2()}
          </CardContent>
        </Card>
      </main>
    </Suspense>
  );
}
