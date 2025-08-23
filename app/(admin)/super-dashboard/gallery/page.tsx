"use client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";
import Cookies from "js-cookie";
import {
  ImagePlus,
  Loader2,
  PictureInPicture,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

interface MediaItem {
  id: string;
  url: string;
  type: string;
}
interface ProductMini {
  id: string;
  name: string;
}
const API_LIST = `${NEXT_PUBLIC_BASE_URL}/media/mediaList`;
const API_VIEW = `${NEXT_PUBLIC_BASE_URL}/media/`;
const API_DELETE = `${NEXT_PUBLIC_BASE_URL}/media/`;
const API_UPLOAD = `${NEXT_PUBLIC_BASE_URL}/media/upload`;
const API_ASSIGN = `${NEXT_PUBLIC_BASE_URL}/media/assign`;
const API_PRODUCTS = `${NEXT_PUBLIC_BASE_URL}/product/sort`;

export default function Gallery() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // assign state
  const [assignMediaId, setAssignMediaId] = useState<string | null>(null);
  const [assignDialog, setAssignDialog] = useState(false);
  const [assignForm, setAssignForm] = useState({
    productId: "none",
    alt: "",
    description: "",
  });
  const [products, setProducts] = useState<ProductMini[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // --- fetch images
  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_LIST);
      setItems(res.data.data || []);
    } catch {
      setErrorMsg("دریافت تصاویر با خطا مواجه شد.");
    } finally {
      setLoading(false);
    }
  };
  // --- fetch products (for assign dialog)
  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await axios.get(API_PRODUCTS, {
        params: { take: 100, skip: 0, sortBy: "name", order: "asc" },
      });
      setProducts(
        (res.data.data || []).map((p: any) => ({ id: p.id, name: p.name }))
      );
    } catch {
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };
  useEffect(() => {
    fetchImages();
    // eslint-disable-next-line
  }, []);
  // حذف عکس
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setLoading(true);
      const token = Cookies.get("token");
      await axios.delete(API_DELETE + deleteId, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setSuccessMsg("عکس با موفقیت حذف شد.");
      setDeleteId(null);
      fetchImages();
    } catch {
      setErrorMsg("عملیات حذف با خطا روبرو شد.");
    } finally {
      setLoading(false);
    }
  };
  // آپلود عکس جدید
  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const token = Cookies.get("token");
      await axios.post(API_UPLOAD, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setSuccessMsg("بارگذاری انجام شد.");
      setSelectedFile(null);
      fetchImages();
    } catch {
      setErrorMsg("آپلود با خطا مواجه شد.");
    } finally {
      setUploading(false);
    }
  };
  // ثبت عکس برای محصول (assign)
  const handleAssignOpen = (mediaId: string) => {
    setAssignMediaId(mediaId);
    setAssignDialog(true);
    setAssignForm({ productId: "none", alt: "", description: "" }); // مقدار none اینجا به کار رفته
    if (!products.length) fetchProducts();
  };
  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignMediaId || assignForm.productId === "none") {
      setErrorMsg("همه فیلدها را تکمیل کنید.");
      return;
    }
    try {
      const token = Cookies.get("token");
      await axios.post(
        API_ASSIGN,
        {
          productId: assignForm.productId,
          mediaId: assignMediaId,
          alt: assignForm.alt || "تصویر محصول",
          description: assignForm.description || "بدون توضیح",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setSuccessMsg("به محصول اختصاص داده شد.");
      setAssignDialog(false);
      setAssignMediaId(null);
    } catch {
      setErrorMsg("ثبت تصویر برای محصول با خطا روبرو شد.");
    }
  };
  const fixUrl = (u: string) => (u.startsWith("http") ? u : `${API_VIEW}${u}`);
  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <div className="md:hidden mb-6 flex items-center justify-center">
        <h2 className="text-xl font-bold text-center">پولاد موتور</h2>
      </div>
      <Card className="max-w-5xl mx-auto mb-8 shadow-xl border border-blue-100 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl text-blue-800 text-center font-bold flex items-center gap-2">
            <PictureInPicture className="text-indigo-400" size={25} />
            گالری تصاویر
          </CardTitle>
        </CardHeader>
        <CardContent>
          {errorMsg && (
            <Alert variant="destructive" className="mb-2">
              <AlertTitle>خطا</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}
          {successMsg && (
            <Alert className="mb-2">
              <AlertTitle>موفق!</AlertTitle>
              <AlertDescription>{successMsg}</AlertDescription>
            </Alert>
          )}
          {/* افزودن عکس */}
          <div className="mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                className="font-bold"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="mr-2" size={16} />
                افزودن عکس جدید
              </Button>
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                ref={fileInputRef}
                onChange={(e) =>
                  setSelectedFile(e.target.files ? e.target.files[0] : null)
                }
              />
              {selectedFile && (
                <>
                  <span className="text-sm mr-2">{selectedFile.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500"
                    onClick={() => setSelectedFile(null)}
                    title="حذف انتخاب"
                  >
                    <X size={18} />
                  </Button>
                  <Button
                    variant="secondary"
                    className="ml-2"
                    size="sm"
                    disabled={uploading}
                    onClick={handleUpload}
                  >
                    {uploading && (
                      <Loader2 className="animate-spin mx-1" size={16} />
                    )}
                    ارسال
                  </Button>
                </>
              )}
            </div>
          </div>
          {/* لیست تصاویر */}
          {loading ? (
            <div className="flex flex-wrap gap-4 justify-start py-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="w-40 h-[110px] rounded-xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              <b>هیچ تصویری ثبت نشده است.</b>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 justify-start py-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="relative bg-white rounded-2xl border shadow w-40 min-w-[130px] max-w-[180px] h-[145px] flex flex-col items-center select-none"
                >
                  <img
                    src={fixUrl(item.url)}
                    alt={item.id}
                    className="w-full h-[110px] object-cover rounded-t-xl border-b"
                    loading="lazy"
                  />
                  <div className="flex items-center justify-between w-full px-2 py-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="absolute top-2 right-2 shadow bg-white/80"
                      onClick={() => setDeleteId(item.id)}
                      title="حذف عکس"
                    >
                      <Trash2 className="text-red-500" size={16} />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      title="ثبت در محصول"
                      onClick={() => handleAssignOpen(item.id)}
                      className="absolute top-2 left-2 shadow bg-white/80"
                    >
                      <ImagePlus className="text-blue-500" size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* --- حذف عکس Dialog --- */}
          <Dialog
            open={!!deleteId}
            onOpenChange={(o: any) => !o && setDeleteId(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>حذف عکس</DialogTitle>
              </DialogHeader>
              <Alert variant="destructive" className="mb-2">
                <AlertTitle>هشدار</AlertTitle>
                <AlertDescription>
                  آیا مطمئن هستید این عکس حذف شود؟
                </AlertDescription>
              </Alert>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteId(null)}
                  disabled={loading}
                >
                  انصراف
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="destructive"
                  disabled={loading}
                >
                  حذف عکس
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* --- ثبت عکس برای محصول Dialog --- */}
          <Dialog
            open={assignDialog}
            onOpenChange={(o: any) => !o && setAssignDialog(false)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>اختصاص عکس به محصول</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAssign} className="space-y-3">
                <div>
                  <label className="block text-sm font-bold mb-1">
                    محصول مربوطه *
                  </label>
                  <Select
                    value={assignForm.productId}
                    onValueChange={(val: any) =>
                      setAssignForm((f) => ({ ...f, productId: val }))
                    }
                    disabled={productsLoading}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب محصول..." />
                    </SelectTrigger>
                    <SelectContent>
                      {productsLoading && (
                        <SelectItem value="-loading" disabled>
                          در حال دریافت...
                        </SelectItem>
                      )}
                      <SelectItem value="none" disabled>
                        انتخاب...
                      </SelectItem>
                      {products.map((p) => (
                        <SelectItem value={p.id} key={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">
                    Alt عکس
                  </label>
                  <Input
                    value={assignForm.alt}
                    onChange={(e) =>
                      setAssignForm((f) => ({
                        ...f,
                        alt: e.target.value,
                      }))
                    }
                    required
                    placeholder="متن alt"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">
                    توضیحات
                  </label>
                  <Input
                    value={assignForm.description}
                    onChange={(e) =>
                      setAssignForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    required
                    placeholder="متن توضیح مختصر"
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAssignDialog(false)}
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      productsLoading || assignForm.productId === "none"
                    }
                  >
                    ثبت عکس در محصول
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
