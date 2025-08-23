"use client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CategoryObj, Product, TagObj } from "@/types/type";
import axios from "axios";
import Cookies from "js-cookie";
import { ChevronLeft, ChevronRight, Edit, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default function ProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<CategoryObj[]>([]);
  const [tags, setTags] = React.useState<TagObj[]>([]);
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [tagFilter, setTagFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState(""); // نام/توضیح
  const [code, setCode] = React.useState(""); // کد محصول
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [totalProducts, setTotalProducts] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  React.useEffect(() => {
    async function loadFilters() {
      try {
        const [cat, tag] = await Promise.all([
          axios.get<{ data: CategoryObj[] }>(
            `${NEXT_PUBLIC_BASE_URL}/category`
          ),
          axios.get<{ data: TagObj[] }>(`${NEXT_PUBLIC_BASE_URL}/tag`),
        ]);
        setCategories(cat.data.data || []);
        setTags(tag.data.data || []);
      } catch {}
    }
    loadFilters();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        skip: page * rowsPerPage,
        take: rowsPerPage,
        order: "desc",
        sortBy: "createdAt",
      };
      if (search.trim()) params.search = search.trim();
      if (code.trim()) params.code = code.trim();
      if (categoryFilter !== "all") params.categoryId = categoryFilter;
      if (tagFilter !== "all") params.tagId = tagFilter;
      const res = await axios.get<{ data: Product[]; total: number }>(
        `${NEXT_PUBLIC_BASE_URL}/product/sort`,
        { params }
      );
      setProducts(res.data.data || []);
      setTotalProducts(res.data.total || 0);
    } catch {
      setError("خطا در دریافت محصولات");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, search, code, categoryFilter, tagFilter]);

  // حذف محصول برای id
  async function handleConfirmDelete(id: string) {
    setDeletingId(id);
    setMessage(null);
    try {
      const token = Cookies.get("token") || localStorage.getItem("token");
      if (!token) {
        setMessage({
          text: "شما وارد نشده‌اید یا توکن ندارید.",
          type: "error",
        });
        setDeletingId(null);
        return;
      }
      await axios.delete(`${NEXT_PUBLIC_BASE_URL}/product/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setMessage({ text: "محصول با موفقیت حذف شد.", type: "success" });
    } catch {
      setMessage({ text: "خطا در حذف محصول.", type: "error" });
    }
    setDeletingId(null);
  }

  const lastPage = Math.max(0, Math.ceil(totalProducts / rowsPerPage) - 1);

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <div className="md:hidden mb-6 flex items-center justify-center">
        <h2 className="text-xl font-bold text-center">پولاد موتور</h2>
      </div>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex flex-col md:flex-row items-center justify-between gap-3">
            <span className="text-lg md:text-xl font-semibold">
              مدیریت محصولات
            </span>
            <Button
              asChild
              variant="default"
              size="sm"
              className="whitespace-nowrap"
            >
              <Link href="/super-dashboard/products/create">
                <Plus size={18} className="inline ml-2" /> ثبت محصول جدید
              </Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* فیلترها */}
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-3 md:space-y-0 flex-wrap gap-2">
            <Label htmlFor="category-filter" className="mb-1">
              دسته‌بندی
            </Label>
            <Select
              value={categoryFilter}
              onValueChange={(v: any) => setCategoryFilter(v || "all")}
            >
              <SelectTrigger className="flex-1 min-w-[120px]">
                <SelectValue placeholder="دسته‌بندی" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label htmlFor="tag-filter" className="mb-1">
              تگ
            </Label>
            <Select
              value={tagFilter}
              onValueChange={(v: any) => setTagFilter(v || "all")}
            >
              <SelectTrigger className="flex-1 min-w-[120px]">
                <SelectValue placeholder="تگ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                {tags.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="نام یا توضیح محصول..."
              className="flex-1 min-w-[140px]"
              value={search}
              onChange={(e) => {
                setPage(0);
                setSearch(e.target.value);
              }}
              type="search"
              autoComplete="off"
            />
            <Input
              placeholder="کد محصول..."
              className="flex-1 min-w-[120px]"
              value={code}
              onChange={(e) => {
                setPage(0);
                setCode(e.target.value);
              }}
              type="search"
              autoComplete="off"
            />
          </div>
        </CardContent>
      </Card>

      {message && (
        <Alert
          variant={message.type === "success" ? "default" : "destructive"}
          className="mb-6"
        >
          <AlertTitle>{message.type === "success" ? "موفق" : "خطا"}</AlertTitle>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* موبایل: کارت‌ها */}
      <div className="md:hidden space-y-4">
        {loading ? (
          Array.from({ length: rowsPerPage }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/3"></div>
            </Card>
          ))
        ) : products.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            هیچ محصولی پیدا نشد.
          </div>
        ) : (
          products.map((product) => (
            <Card key={product.id} className="p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <Badge
                  variant={product.isAvailable ? "default" : "destructive"}
                >
                  {product.isAvailable ? "موجود" : "ناموجود"}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground mb-1">
                کد: {product.code}
              </div>
              <div className="mb-1">
                <span className="font-semibold">قیمت: </span>
                {product.price?.toLocaleString()} تومان
              </div>
              <div className="mb-1">
                <span className="font-semibold">موجودی: </span>
                {product.count}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  aria-label="ویرایش محصول"
                >
                  <Link
                    href={`/super-dashboard/products/create?id=${product.id}`}
                  >
                    <Edit size={18} />
                  </Link>
                </Button>
                {/* دکمه حذف (درون Dialog برای هر کارت) */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      aria-label="حذف محصول"
                      disabled={deletingId === product.id}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>حذف محصول</DialogTitle>
                      <DialogDescription>
                        آیا مطمئن هستید این محصول حذف شود؟ این عملیات قابل
                        بازگشت نیست.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="secondary"
                        type="button"
                        disabled={deletingId === product.id}
                        onClick={() => {
                          // shadcn خودش می‌بنده
                        }}
                      >
                        انصراف
                      </Button>
                      <Button
                        variant="destructive"
                        type="button"
                        disabled={deletingId === product.id}
                        onClick={() => handleConfirmDelete(product.id)}
                      >
                        {deletingId === product.id
                          ? "در حال حذف..."
                          : "تایید حذف"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* دسکتاپ و تبلت: جدول */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-2 md:p-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>خطا</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div
              className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700"
              dir="rtl"
            >
              <Table className="min-w-[600px]" dir="rtl">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">نام محصول</TableHead>
                    <TableHead className="text-right">کد</TableHead>
                    <TableHead className="text-right">قیمت</TableHead>
                    <TableHead className="text-right">موجودی</TableHead>
                    <TableHead className="text-right">وضعیت</TableHead>
                    <TableHead className="text-right">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: rowsPerPage }).map((_, i) => (
                      <TableRow key={i} className="animate-pulse">
                        {[...Array(6)].map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-6 w-full rounded-md" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : products.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground py-8"
                      >
                        هیچ محصولی پیدا نشد.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="text-right">
                          {product.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {product.code}
                        </TableCell>
                        <TableCell className="text-right">
                          {product.price?.toLocaleString()} تومان
                        </TableCell>
                        <TableCell className="text-right">
                          {product.count}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              product.isAvailable ? "default" : "destructive"
                            }
                          >
                            {product.isAvailable ? "موجود" : "ناموجود"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right flex gap-1">
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            aria-label="ویرایش محصول"
                          >
                            <Link
                              href={`/super-dashboard/products/create?id=${product.id}`}
                            >
                              <Edit size={18} />
                            </Link>
                          </Button>
                          {/* دکمه حذف (درون Dialog برای هر ردیف) */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="icon"
                                aria-label="حذف محصول"
                                disabled={deletingId === product.id}
                              >
                                <Trash2 size={18} />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>حذف محصول</DialogTitle>
                                <DialogDescription>
                                  آیا مطمئن هستید این محصول حذف شود؟ این عملیات
                                  قابل بازگشت نیست.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button
                                  variant="secondary"
                                  type="button"
                                  disabled={deletingId === product.id}
                                >
                                  انصراف
                                </Button>
                                <Button
                                  variant="destructive"
                                  type="button"
                                  disabled={deletingId === product.id}
                                  onClick={() =>
                                    handleConfirmDelete(product.id)
                                  }
                                >
                                  {deletingId === product.id
                                    ? "در حال حذف..."
                                    : "تایید حذف"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {/* صفحه بندی */}
            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="text-muted-foreground text-sm">
                {`نمایش ${
                  totalProducts === 0 ? 0 : page * rowsPerPage + 1
                } تا ${Math.min(
                  (page + 1) * rowsPerPage,
                  totalProducts
                )} از ${totalProducts} محصول`}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || loading || !!deletingId}
                >
                  <ChevronLeft size={20} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  disabled={page >= lastPage || loading || !!deletingId}
                >
                  <ChevronRight size={20} />
                </Button>
                <Select
                  value={String(rowsPerPage)}
                  onValueChange={(val: any) => {
                    setRowsPerPage(Number(val));
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="w-[80px]" />
                  <SelectContent>
                    {[5, 10, 15, 20].map((num) => (
                      <SelectItem key={num} value={String(num)}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
