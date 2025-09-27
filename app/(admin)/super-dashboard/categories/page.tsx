"use client";
import CustomTreeSelect from "@/components/CustomTreeSelect";
import { slugify } from "@/components/slugify.util";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Editor } from "@tinymce/tinymce-react";
import axios from "axios";
import Cookies from "js-cookie";
import { ChevronDown, ChevronRight, ImageIcon, Trash, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const defaultFormState = {
  id: null as string | null,
  title: "",
  description: "",
  fatherId: null as string | null,
  metaTitle: "",
  metaDescription: "",
  ogTitle: "",
  ogDescription: "",
  canonicalUrl: "",
  altText: "",
  structuredData: `{
    "@context": "https://schema.org",
    "@type": "CategoryCode",
    "name": "",
    "description": ""
  }`,
};
interface CategoryNode {
  fatherId: string | null;
  id: string;
  title: string;
  children?: CategoryNode[];
  description?: { text: string } | null;
  metaTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonicalUrl?: string;
  altText?: string;
  structuredData?: any;
  mediaOnCat?: any[];
}
const CreateCategoryPage: React.FC = () => {
  const [form, setForm] = useState({ ...defaultFormState });
  const [descOpen, setDescOpen] = useState(false);
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDeleteId, setLoadingDeleteId] = useState<string | null>(null);
  const [catImages, setCatImages] = useState<any[]>([]);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgUploading, setImgUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const token = Cookies.get("token");
  const [openNodes, setOpenNodes] = useState<Record<string, boolean>>({});
  function handleSeoChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }
  const fetchCategories = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${NEXT_PUBLIC_BASE_URL}/category`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategoryTree(res.data.data || []);
      setOpenNodes({});
    } catch {
      setMessage({ text: "خطا در دریافت دسته‌بندی‌ها", type: "error" });
    }
  };
  const fetchCategoryImages = async (categoryId: string) => {
    try {
      const res = await axios.get(
        `${NEXT_PUBLIC_BASE_URL}/category/findCat/${categoryId}`
      );
      setCatImages(res.data.data.mediaOnCat || []);
    } catch {
      setCatImages([]);
    }
  };
  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line
  }, []);
  useEffect(() => {
    if (form.id) fetchCategoryImages(form.id);
    else setCatImages([]);
    // eslint-disable-next-line
  }, [form.id]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setMessage({ text: "خطا: توکن موجود نیست", type: "error" });
      return;
    }
    setLoading(true);
    setMessage(null);
    let structuredDataObj = {};
    try {
      if (form.structuredData && form.structuredData.trim())
        structuredDataObj = JSON.parse(form.structuredData);
    } catch {
      setMessage({ text: "ساختار داده ساختاریافته معتبر نیست", type: "error" });
      setLoading(false);
      return;
    }
    try {
      const baseCanonical = "https://koohnegar.com/product/";

      let canonicalUrl = form.canonicalUrl?.trim();

      if (!canonicalUrl) {
        canonicalUrl = baseCanonical + slugify(form.title);
      } else {
        canonicalUrl = baseCanonical + slugify(canonicalUrl);
      }
      const body = {
        title: form.title,
        description: form.description ? { text: form.description } : null,
        fatherId: form.fatherId,
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
        ogTitle: form.metaTitle,
        ogDescription: form.metaDescription,
        canonicalUrl,
        altText: form.altText,
        structuredData: structuredDataObj,
      };
      if (form.id) {
        await axios.put(
          `${NEXT_PUBLIC_BASE_URL}/category/update/${form.id}`,
          body,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        setMessage({ text: "دسته‌بندی با موفقیت ویرایش شد.", type: "success" });
      } else {
        const res = await axios.post(
          `${NEXT_PUBLIC_BASE_URL}/category/create`,
          body,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        setMessage({
          text: "دسته‌بندی جدید با موفقیت ایجاد شد.",
          type: "success",
        });
        setForm((old) => ({ ...defaultFormState, id: res.data.data.id }));
      }
      setDescOpen(false);
      fetchCategories();
    } catch (err: any) {
      setMessage({
        text:
          "خطا در ثبت: " +
          (err?.response?.data?.message ||
            err?.message ||
            "لطفاً دوباره تلاش کنید"),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleUploadCategoryImage = async () => {
    if (!imgFile) return;
    if (!form.id) {
      setMessage({ text: "ابتدا دسته‌بندی را ایجاد کنید.", type: "error" });
      return;
    }
    setImgUploading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append("file", imgFile);
    formData.append("categoryId", form.id);
    formData.append("alt", form.title || "دسته‌بندی");
    formData.append("description", form.title || "دسته‌بندی");
    try {
      await axios.post(
        `${NEXT_PUBLIC_BASE_URL}/media/uploadCategory`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setMessage({ text: "تصویر با موفقیت آپلود شد.", type: "success" });
      setImgFile(null);
      fetchCategoryImages(form.id);
    } catch {
      setMessage({ text: "خطا در آپلود تصویر!", type: "error" });
    } finally {
      setImgUploading(false);
    }
  };
  const handleDeleteCategoryImage = async (mediaId: string) => {
    if (!window.confirm("آیا مطمئنید می‌خواهید این عکس را حذف کنید؟")) return;
    try {
      await axios.delete(`${NEXT_PUBLIC_BASE_URL}/media/category/${mediaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage({ text: "عکس با موفقیت حذف شد.", type: "success" });
      if (form.id) fetchCategoryImages(form.id);
    } catch {
      setMessage({ text: "خطا در حذف عکس!", type: "error" });
    }
  };
  const handleDelete = async (id: string) => {
    if (!token)
      return setMessage({ text: "خطا: توکن موجود نیست", type: "error" });
    if (
      !window.confirm(
        "آیا از حذف این دسته‌بندی و تمام زیردسته‌های آن مطمئن هستید؟"
      )
    )
      return;
    setLoadingDeleteId(id);
    setMessage(null);
    try {
      await axios.delete(`${NEXT_PUBLIC_BASE_URL}/category/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage({
        text: "دسته‌بندی و زیردسته‌های آن حذف شدند",
        type: "success",
      });
      fetchCategories();
      if (form.id === id) closeForm();
    } catch {
      setMessage({ text: "خطا در حذف دسته‌بندی!", type: "error" });
    } finally {
      setLoadingDeleteId(null);
    }
  };

  // ** تغییر این تابع: گرفتن event و جلوگیری از bubble **
  const handleCategorySelect = (cat: CategoryNode, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    console.log("انتخاب دسته:", cat);

    setForm({
      id: cat.id,
      title: cat.title,
      description: cat.description?.text || "",
      fatherId: cat.fatherId,
      metaTitle: cat.metaTitle || "",
      metaDescription: cat.metaDescription || "",
      ogTitle: cat.ogTitle || "",
      ogDescription: cat.ogDescription || "",
      canonicalUrl: cat.canonicalUrl || "",
      altText: cat.altText || "",
      structuredData: cat.structuredData
        ? JSON.stringify(cat.structuredData, null, 2)
        : `{
    "@context": "https://schema.org",
    "@type": "CategoryCode",
    "name": "${cat.title || ""}",
    "description": ""
  }`,
    });
    setDescOpen(!!cat.description?.text);
    setMessage(null);
  };

  const toggleNode = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ** رندر لیست با stopPropagation مناسب **
  const renderCategoryList = (
    nodes: CategoryNode[],
    depth = 0
  ): React.ReactNode =>
    nodes.map((node) => {
      const isOpen = openNodes[node.id] || false;
      const hasChildren = node.children && node.children.length > 0;
      return (
        <div
          key={node.id}
          className={`mb-1 bg-white/95 rounded-xl shadow group border border-blue-100 hover:shadow-md transition cursor-pointer ${
            form.id === node.id ? "ring-2 ring-indigo-300 ring-inset" : ""
          }`}
          style={{ marginRight: depth * 16 }}
          onClick={(e) => handleCategorySelect(node, e)}
        >
          <div className="flex justify-between items-center py-2 px-3">
            <div className="flex items-center gap-2">
              {hasChildren ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  tabIndex={-1}
                  className="text-gray-400 hover:text-blue-500"
                  // ** دسته فقط با stopPropagation **
                  onClick={(e: any) => {
                    e.stopPropagation();
                    toggleNode(node.id, e);
                  }}
                >
                  {isOpen ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </Button>
              ) : (
                <span className="w-5 block" />
              )}
              <span className="font-semibold text-[15px]">{node.title}</span>
              {form.id === node.id && (
                <span className="text-xs px-2 py-0.5 rounded bg-blue-50 border text-blue-700 ml-2">
                  انتخاب‌شده
                </span>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e: any) => {
                  e.stopPropagation();
                  handleDelete(node.id);
                }}
                disabled={loadingDeleteId === node.id}
                className="text-red-500 hover:text-red-700"
                tabIndex={-1}
              >
                {loadingDeleteId === node.id ? (
                  <span className="text-xs animate-pulse">...</span>
                ) : (
                  <Trash size={16} />
                )}
              </Button>
            </div>
          </div>
          {hasChildren && isOpen && (
            <div className="mr-3 border-r border-blue-50">
              {renderCategoryList(node.children || [], depth + 1)}
            </div>
          )}
        </div>
      );
    });
  const closeForm = () => {
    setForm({ ...defaultFormState });
    setDescOpen(false);
    setMessage(null);
    setCatImages([]);
    setImgFile(null);
  };
  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <div className="md:hidden mb-6 flex items-center justify-center">
        <h2 className="text-xl font-bold text-center">پولاد موتور</h2>
      </div>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl text-center text-blue-700">
            مدیریت دسته‌بندی‌ها
          </CardTitle>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert
              variant={message.type === "success" ? "default" : "destructive"}
              className="mb-4"
            >
              <AlertTitle>
                {message.type === "success" ? "موفق" : "خطا"}
              </AlertTitle>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}
          {/* فرم */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4 border-b border-blue-100 pb-6 mb-6 rounded-xl shadow px-4 py-3 bg-white/90"
            autoComplete="off"
          >
            <div className="grid md:grid-cols-2 gap-4 mb-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="category-title">h1 دسته‌بندی *</Label>
                <Input
                  id="category-title"
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((old) => ({ ...old, title: e.target.value }))
                  }
                  placeholder="مثلاً: موتورسیکلت"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="father-category">دسته‌بندی والد</Label>
                <CustomTreeSelect
                  value={form.fatherId}
                  onChange={(val) =>
                    setForm((old) => ({ ...old, fatherId: val }))
                  }
                  treeData={categoryTree}
                />
              </div>
            </div>
            <div>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="mb-2 gap-2"
                onClick={() => setDescOpen((v) => !v)}
              >
                {descOpen ? (
                  <>
                    <X size={15} /> بستن توضیحات
                  </>
                ) : (
                  <>
                    <ChevronDown size={15} /> افزودن/ویرایش توضیحات
                  </>
                )}
              </Button>
              {descOpen && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-1">
                  <Label
                    htmlFor="category-desc"
                    className="block mb-1 text-blue-800"
                  >
                    توضیحات دسته‌بندی
                  </Label>
                  <Editor
                    apiKey="yw03fqi9za918p3jhar6jjb4ou0n370z1xchlhfum0ynp81z"
                    value={form.description}
                    init={{
                      height: 210,
                      menubar: true,
                      directionality: "rtl",
                      plugins: "lists link image table code directionality",
                      toolbar:
                        "undo redo | styleselect | bold italic | alignright alignleft aligncenter alignjustify | bullist numlist outdent indent | link image table | code ltr rtl",
                      content_style:
                        "body { font-family:Roboto,Arial,sans-serif; font-size:15px; direction:rtl; }",
                      placeholder: "توضیحات دسته‌بندی ...",
                    }}
                    onEditorChange={(content) =>
                      setForm((old) => ({ ...old, description: content }))
                    }
                  />
                </div>
              )}
            </div>
            {/* 🟦 فیلدهای سئو */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="metaTitle">تایتل</Label>
                <Input
                  id="metaTitle"
                  name="metaTitle"
                  value={form.metaTitle}
                  onChange={handleSeoChange}
                />
              </div>
              <div>
                <Label htmlFor="metaDescription">توضیحات متا</Label>
                <Textarea
                  id="metaDescription"
                  name="metaDescription"
                  value={form.metaDescription}
                  onChange={handleSeoChange}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="canonicalUrl">Canonical URL</Label>
                <Input
                  id="canonicalUrl"
                  name="canonicalUrl"
                  value={form.canonicalUrl}
                  onChange={handleSeoChange}
                />
              </div>
              <div>
                <Label htmlFor="altText">Alt Text</Label>
                <Input
                  id="altText"
                  name="altText"
                  value={form.altText}
                  onChange={handleSeoChange}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="structuredData">
                  Structured Data (JSON-LD)
                </Label>
                <Textarea
                  id="structuredData"
                  name="structuredData"
                  rows={6}
                  className="font-mono text-xs"
                  value={form.structuredData}
                  onChange={handleSeoChange}
                />
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <Button type="submit" disabled={loading} className="font-bold">
                {form.id
                  ? loading
                    ? "در حال ویرایش..."
                    : "ثبت تغییرات"
                  : loading
                  ? "در حال ثبت..."
                  : "ایجاد دسته‌بندی"}
              </Button>
              {form.id && (
                <Button onClick={closeForm} type="button" variant="outline">
                  انصراف و فرم جدید
                </Button>
              )}
            </div>
          </form>
          {/* === گالری تصاویر === */}
          {form.id && (
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2 text-lg text-blue-700">
                  <ImageIcon size={20} className="inline" /> تصاویر دسته‌بندی
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    افزودن تصویر
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    accept="image/*"
                    onChange={(e) => setImgFile(e.target.files?.[0] || null)}
                  />
                  <span className="text-xs text-slate-700">
                    {imgFile ? imgFile.name : "تصویری انتخاب نشده"}
                  </span>
                  {imgFile && (
                    <Button
                      type="button"
                      variant="default"
                      onClick={handleUploadCategoryImage}
                      disabled={imgUploading}
                    >
                      {imgUploading ? "در حال آپلود..." : "آپلود تصویر"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-row gap-3 flex-wrap mt-2">
                  {catImages.length === 0 ? (
                    <span className="text-gray-400 text-xs">
                      تصویری ثبت نشده است.
                    </span>
                  ) : (
                    catImages.map((item: any) => (
                      <div
                        key={item.id}
                        className="relative w-28 h-24 rounded-xl border shadow-md bg-white flex items-center justify-center overflow-hidden"
                      >
                        <img
                          src={`${NEXT_PUBLIC_BASE_URL}/media/${item.media?.url}`}
                          alt={item.alt || ""}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() =>
                            handleDeleteCategoryImage(item.media.id)
                          }
                          className="absolute top-1 left-1 z-10 p-1"
                          title="حذف عکس"
                          tabIndex={-1}
                        >
                          <Trash size={15} />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          {/* === دسته‌بندی‌ها درختی === */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-blue-700">
                ساختار دسته‌بندی‌ها (برای ویرایش کلیک کن)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categoryTree.length === 0 ? (
                <p className="text-center text-gray-600 text-sm py-4">
                  هنوز دسته‌بندی‌ای ایجاد نشده است.
                </p>
              ) : (
                <div className="border border-blue-100 rounded-2xl p-3 max-h-[405px] overflow-auto bg-white/95">
                  {renderCategoryList(categoryTree)}
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};
export default CreateCategoryPage;
