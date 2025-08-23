"use client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import Cookies from "js-cookie";
import { Loader2, Link as LucideLink, Unlink } from "lucide-react";
import { useEffect, useState } from "react";
import { Edit2, Tag as TagIcon, Trash2 } from "react-feather";
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

// اگر مدل داده تگ تغییر می‌کند حتما اینجا نیز آپدیت کنید
interface TagType {
  id: string;
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonicalUrl?: string;
  altText?: string;
  tagOnProduct?: TagOnProductType[];
}
interface TagOnProductType {
  productId: string;
  tagId: string;
  assignedAt: string;
  product: {
    id: string;
    name: string;
  };
}
interface ProductWithTags {
  id: string;
  name: string;
  tags: TagType[];
}

export default function TagManager() {
  const [tags, setTags] = useState<TagType[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [tagForm, setTagForm] = useState({
    title: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    ogTitle: "",
    ogDescription: "",
    canonicalUrl: "",
    altText: "",
  });
  const [editTagId, setEditTagId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [assignData, setAssignData] = useState<{
    productId: string;
    tagId: string;
  }>({ productId: "all", tagId: "all" });
  // Token & API
  const token = Cookies.get("token");
  const axiosApi = axios.create({
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  // --- Fetch Data ---
  const fetchTags = async () => {
    try {
      const res = await axiosApi.get(`${NEXT_PUBLIC_BASE_URL}/tag`);
      setTags(res.data.data);
    } catch {
      setMessage({ text: "❌ خطا در دریافت برچسب‌ها", type: "error" });
    }
  };
  const fetchProducts = async () => {
    try {
      const res = await axiosApi.get(`${NEXT_PUBLIC_BASE_URL}/product`);
      setProducts(
        res.data.data.map((p: any) => ({
          id: p.id,
          name: p.name,
        }))
      );
    } catch {
      setMessage({ text: "❌ خطا در دریافت محصولات", type: "error" });
    }
  };
  useEffect(() => {
    fetchTags();
    fetchProducts();
    // eslint-disable-next-line
  }, []);
  // --- CRUD Tag ---
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setTagForm({ ...tagForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagForm.title.trim()) {
      setMessage({ text: "عنوان برچسب الزامی است", type: "error" });
      return;
    }
    setLoading(true);
    try {
      if (editTagId) {
        await axiosApi.put(`${NEXT_PUBLIC_BASE_URL}/tag/${editTagId}`, tagForm);
        setMessage({ text: "برچسب ویرایش شد", type: "success" });
      } else {
        await axiosApi.post(`${NEXT_PUBLIC_BASE_URL}/tag`, tagForm);
        setMessage({ text: "برچسب جدید افزوده شد", type: "success" });
      }
      setEditTagId(null);
      setTagForm({
        title: "",
        metaTitle: "",
        metaDescription: "",
        metaKeywords: "",
        ogTitle: "",
        ogDescription: "",
        canonicalUrl: "",
        altText: "",
      });
      fetchTags();
    } catch {
      setMessage({ text: "خطا در ثبت اطلاعات", type: "error" });
    }
    setLoading(false);
  };

  const handleEdit = (tag: TagType) => {
    setEditTagId(tag.id);
    setTagForm({
      title: tag.title ?? "",
      metaTitle: tag.metaTitle ?? "",
      metaDescription: tag.metaDescription ?? "",
      metaKeywords: tag.metaKeywords ?? "",
      ogTitle: tag.ogTitle ?? "",
      ogDescription: tag.ogDescription ?? "",
      canonicalUrl: tag.canonicalUrl ?? "",
      altText: tag.altText ?? "",
    });
  };
  const handleDelete = async (id: string) => {
    if (!window.confirm("برچسب حذف شود؟")) return;
    setLoading(true);
    try {
      await axiosApi.delete(`${NEXT_PUBLIC_BASE_URL}/tag/${id}`);
      setMessage({ text: "برچسب حذف شد", type: "success" });
      fetchTags();
    } catch {
      setMessage({ text: "خطا در حذف برچسب", type: "error" });
    }
    setLoading(false);
  };
  // --- Assign / Unassign ---
  const handleAssign = async () => {
    if (
      !assignData.productId ||
      assignData.productId === "all" ||
      !assignData.tagId ||
      assignData.tagId === "all"
    ) {
      setMessage({ text: "محصول و برچسب را انتخاب کنید!", type: "error" });
      return;
    }
    setAssigning(true);
    try {
      await axiosApi.post(`${NEXT_PUBLIC_BASE_URL}/tag/assign`, assignData);
      setMessage({ text: "برچسب به محصول اساین شد", type: "success" });
      fetchTags();
      setAssignData({ productId: "all", tagId: "all" });
    } catch {
      setMessage({ text: "خطا در اساین برچسب", type: "error" });
    }
    setAssigning(false);
  };
  const handleUnassign = async (pid: string, tid: string) => {
    if (!window.confirm("حذف برچسب از این محصول؟")) return;
    setAssigning(true);
    try {
      await axiosApi.delete(`${NEXT_PUBLIC_BASE_URL}/tag/remove/${pid}/${tid}`);
      setMessage({ text: "برچسب از محصول حذف شد", type: "success" });
      fetchTags();
    } catch {
      setMessage({ text: "خطا در حذف برچسب از محصول", type: "error" });
    }
    setAssigning(false);
  };
  // --- محصولات همراه هر برچسب ---
  const productsWithTags: Record<string, ProductWithTags> = {};
  tags.forEach((tag) => {
    tag.tagOnProduct?.forEach((top: any) => {
      const prod = top.product;
      if (prod) {
        if (!productsWithTags[prod.id]) {
          productsWithTags[prod.id] = {
            id: prod.id,
            name: prod.name,
            tags: [],
          };
        }
        productsWithTags[prod.id].tags.push({
          id: tag.id,
          title: tag.title,
        });
      }
    });
  });
  const productList: ProductWithTags[] = Object.values(productsWithTags);

  // --- رندر ---
  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <div className="md:hidden mb-6 flex items-center justify-center">
        <h2 className="text-xl font-bold text-center">پولاد موتور</h2>
      </div>
      <Card className="mb-8 shadow-xl border border-blue-100 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex gap-2 items-center text-xl text-blue-800">
            <TagIcon size={21} className="text-indigo-800" /> مدیریت برچسب‌ها
          </CardTitle>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert
              variant={message.type === "success" ? "default" : "destructive"}
              className="mb-5"
            >
              <AlertTitle>
                {message.type === "success" ? "موفق" : "خطا"}
              </AlertTitle>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}
          {/* فرم افزودن/ویرایش برچسب - فیلدهای سئو اضافه شده */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-wrap gap-2 md:gap-4 items-end bg-white/90 border border-gray-200 rounded-xl shadow px-4 py-3 mb-7"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              <div className="flex flex-col gap-1">
                <Label htmlFor="tag-title">عنوان برچسب</Label>
                <Input
                  id="tag-title"
                  name="title"
                  placeholder="عنوان برچسب جدید"
                  value={tagForm.title}
                  onChange={handleFormChange}
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  name="metaTitle"
                  placeholder="Meta title"
                  value={tagForm.metaTitle}
                  onChange={handleFormChange}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Input
                  id="metaDescription"
                  name="metaDescription"
                  placeholder="Meta description"
                  value={tagForm.metaDescription}
                  onChange={handleFormChange}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="metaKeywords">Meta Keywords</Label>
                <Input
                  id="metaKeywords"
                  name="metaKeywords"
                  placeholder="meta,keywords"
                  value={tagForm.metaKeywords}
                  onChange={handleFormChange}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="ogTitle">OG Title</Label>
                <Input
                  id="ogTitle"
                  name="ogTitle"
                  placeholder="OG title"
                  value={tagForm.ogTitle}
                  onChange={handleFormChange}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="ogDescription">OG Description</Label>
                <Input
                  id="ogDescription"
                  name="ogDescription"
                  placeholder="OG description"
                  value={tagForm.ogDescription}
                  onChange={handleFormChange}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="canonicalUrl">Canonical URL</Label>
                <Input
                  id="canonicalUrl"
                  name="canonicalUrl"
                  placeholder="Canonical URL"
                  value={tagForm.canonicalUrl}
                  onChange={handleFormChange}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="altText">Alt Text</Label>
                <Input
                  id="altText"
                  name="altText"
                  placeholder="Alt text"
                  value={tagForm.altText}
                  onChange={handleFormChange}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="min-w-[90px] font-bold mt-2"
              variant={editTagId ? "secondary" : "default"}
            >
              {loading ? (
                <Loader2 className="animate-spin size-5 mx-auto" />
              ) : editTagId ? (
                "ویرایش"
              ) : (
                "افزودن"
              )}
            </Button>
            {editTagId && (
              <Button
                type="button"
                variant="outline"
                className="font-bold mt-2"
                onClick={() => {
                  setEditTagId(null);
                  setTagForm({
                    title: "",
                    metaTitle: "",
                    metaDescription: "",
                    metaKeywords: "",
                    ogTitle: "",
                    ogDescription: "",
                    canonicalUrl: "",
                    altText: "",
                  });
                }}
              >
                انصراف از ویرایش
              </Button>
            )}
          </form>
          {/* لیست برچسب‌ها */}
          <div className="overflow-x-auto mb-10 border rounded-2xl bg-white/95 shadow">
            <table className="min-w-full text-[15px]">
              <thead>
                <tr className="bg-gradient-to-l from-blue-50/60 to-white border-b border-blue-100">
                  <th className="py-2 px-4 text-right w-3/5 font-bold">
                    عنوان
                  </th>
                  <th className="py-2 px-4 text-center font-bold">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((tag) => (
                  <tr
                    key={tag.id}
                    className="border-b border-blue-50 hover:bg-indigo-50 transition"
                  >
                    <td className="py-2 px-4">{tag.title}</td>
                    <td className="py-2 px-4 flex gap-2 justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(tag)}
                        className="hover:bg-yellow-50"
                      >
                        <Edit2 size={18} className="text-yellow-500" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(tag.id)}
                        className="hover:bg-red-50"
                      >
                        <Trash2 size={18} className="text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {tags.length === 0 && (
                  <tr>
                    <td colSpan={2} className="text-center text-gray-400 py-4">
                      هیچ برچسبی وجود ندارد!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* اساین برچسب به محصول */}
          <Card className="bg-gradient-to-l from-indigo-50/80 to-blue-50/70 border-blue-100 mb-10 rounded-2xl shadow p-5 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 font-bold text-blue-700 mb-2">
              <LucideLink size={20} className="text-blue-400" /> اساین برچسب به
              محصول
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Select
                value={assignData.productId}
                onValueChange={(val: any) =>
                  setAssignData((d) => ({ ...d, productId: val }))
                }
              >
                <SelectTrigger className="min-w-[160px]">
                  <SelectValue placeholder="انتخاب محصول..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" disabled>
                    انتخاب محصول...
                  </SelectItem>
                  {products.map((p) => (
                    <SelectItem value={p.id} key={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={assignData.tagId}
                onValueChange={(val: any) =>
                  setAssignData((d) => ({ ...d, tagId: val }))
                }
              >
                <SelectTrigger className="min-w-[150px]">
                  <SelectValue placeholder="انتخاب برچسب..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" disabled>
                    انتخاب برچسب...
                  </SelectItem>
                  {tags.map((t) => (
                    <SelectItem value={t.id} key={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="default"
                disabled={assigning}
                onClick={handleAssign}
              >
                {assigning ? (
                  <Loader2 className="animate-spin mx-auto size-5" />
                ) : (
                  "افزودن"
                )}
              </Button>
            </div>
          </Card>
          {/* محصولات و برچسب‌هایشان */}
          <Card className="overflow-x-auto border rounded-2xl bg-white/95 shadow mt-10">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-700 font-bold text-lg">
                محصولات و برچسب‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="min-w-full text-[15px]">
                <thead>
                  <tr className="bg-gradient-to-l from-blue-50/60 to-white border-b border-blue-100">
                    <th className="py-2 px-4 text-right font-bold">
                      نام محصول
                    </th>
                    <th className="py-2 px-4 font-bold">برچسب‌ها</th>
                  </tr>
                </thead>
                <tbody>
                  {productList.length === 0 ? (
                    <tr>
                      <td
                        colSpan={2}
                        className="text-center text-gray-400 py-3"
                      >
                        محصولی وجود ندارد!
                      </td>
                    </tr>
                  ) : (
                    productList.map((product) => (
                      <tr key={product.id} className="border-b border-blue-50">
                        <td className="py-2 px-4 w-1/3">{product.name}</td>
                        <td className="py-2 px-4">
                          <div className="flex flex-wrap gap-2">
                            {product.tags.length > 0 ? (
                              product.tags.map((tag) => (
                                <Badge
                                  key={tag.id}
                                  variant="secondary"
                                  className="inline-flex items-center gap-1 text-indigo-700 font-bold px-2 rounded-xl"
                                >
                                  {tag.title}
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="ml-1 p-0 w-6 h-6 hover:bg-red-100"
                                    title="حذف از این محصول"
                                    onClick={() =>
                                      handleUnassign(product.id, tag.id)
                                    }
                                  >
                                    <Unlink
                                      size={13}
                                      className="text-red-600"
                                    />
                                  </Button>
                                </Badge>
                              ))
                            ) : (
                              <span className="text-gray-400 text-xs">
                                بدون برچسب
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
