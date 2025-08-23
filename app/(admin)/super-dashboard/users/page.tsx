"use client";
import axios from "axios";
import Cookies from "js-cookie";
import React, { useEffect, useState } from "react";
// shadcn/ui
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { X } from "lucide-react";
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

interface Address {
  id: string;
  title: string;
  address: string;
  postalCode: string;
  city: string;
  province: string;
}
interface User {
  id: string;
  name: string | null;
  lastName: string | null;
  email: string | null;
  mobile: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
  address: Address[];
}
interface Meta {
  total: number;
  page: number;
  last_page: number;
}

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, last_page: 1 });
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const token = Cookies.get("token");

  // helper
  function formatMobile(mobile?: string) {
    if (!mobile) return "-";
    let m = mobile;
    if (m.startsWith("09") && m.length === 11) m = "+98" + m.slice(1);
    if (m.startsWith("+98") && m.length > 3)
      return m.slice(0, 3) + " " + m.slice(3);
    return m;
  }
  const formatDate = (dateString: string) =>
    !dateString ? "-" : new Date(dateString).toLocaleDateString("fa-IR");
  const getUserFullName = (user: User) =>
    user.name && user.lastName
      ? `${user.name} ${user.lastName}`
      : user.name
      ? user.name
      : user.lastName
      ? user.lastName
      : "نامشخص";

  // دریافت لیست کاربران
  const fetchUsers = async (page: number = 1, searchQuery: string = "") => {
    if (!token) {
      setMessage({ text: "توکن ورود موجود نیست", type: "error" });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.get(
        `${NEXT_PUBLIC_BASE_URL}/user/list?page=${page}&limit=10&search=${searchQuery}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data && res.data.data.data && Array.isArray(res.data.data.data)) {
        setUsers(res.data.data.data);
      } else {
        setUsers([]);
        setMessage({ text: "فرمت داده دریافتی نامعتبر است", type: "error" });
      }
      if (res.data.meta) {
        setMeta({
          total: res.data.meta.total || 0,
          page: res.data.meta.page || 1,
          last_page: res.data.meta.last_page || 1,
        });
      }
    } catch (err) {
      setMessage({ text: "خطا در دریافت لیست کاربران", type: "error" });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };
  // دریافت جزئیات کاربر و نمایش
  const fetchUserDetails = async (userId: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${NEXT_PUBLIC_BASE_URL}/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedUser(res.data.data);
      setShowDetailsModal(true);
    } catch {
      setMessage({ text: "خطا در دریافت اطلاعات کاربر", type: "error" });
    }
    setLoading(false);
  };
  const deleteUser = async (userId: string) => {
    if (!token) return;
    setLoading(true);
    try {
      await axios.delete(`${NEXT_PUBLIC_BASE_URL}/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage({ text: "کاربر با موفقیت حذف شد", type: "success" });
      fetchUsers(meta.page, search);
      setDeleteConfirm(false);
      setUserToDelete(null);
    } catch {
      setMessage({ text: "خطا در حذف کاربر", type: "error" });
    }
    setLoading(false);
  };
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1, search);
  };

  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
    setDeleteConfirm(true);
  };

  // Pagination logic (نمایش شماره صفحات همانند MUI)
  let pageBtns: number[] = [];
  if (meta.last_page <= 5) {
    pageBtns = Array.from({ length: meta.last_page }, (_, i) => i + 1);
  } else if (meta.page <= 3) {
    pageBtns = [1, 2, 3, 4, 5];
  } else if (meta.page >= meta.last_page - 2) {
    pageBtns = [
      meta.last_page - 4,
      meta.last_page - 3,
      meta.last_page - 2,
      meta.last_page - 1,
      meta.last_page,
    ];
  } else {
    pageBtns = [
      meta.page - 2,
      meta.page - 1,
      meta.page,
      meta.page + 1,
      meta.page + 2,
    ];
  }

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <div className="md:hidden mb-6 flex items-center justify-center">
        <h2 className="text-xl font-bold text-center">پولاد موتور</h2>
      </div>

      <Card className="max-w-5xl mx-auto mb-8 shadow-xl border rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl text-blue-800 text-center font-bold">
            مدیریت کاربران
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* پیام موفقیت یا خطا */}
          {message && (
            <Alert
              className="mb-4"
              variant={message.type === "success" ? "default" : "destructive"}
            >
              <AlertTitle>
                {message.type === "success" ? "موفق" : "خطا"}
              </AlertTitle>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* جستجو */}
          <form onSubmit={handleSearch} className="flex items-end gap-3 mb-8">
            <div className="flex flex-col flex-1">
              <Label htmlFor="user-search-input">جستجو کاربران</Label>
              <Input
                id="user-search-input"
                type="search"
                placeholder="نام، ایمیل یا موبایل..."
                className="font-sans"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" className="h-10 min-w-[92px]">
              جستجو
            </Button>
          </form>

          {/* جدول کاربران */}
          {loading ? (
            <div className="text-center py-10">
              <Skeleton className="h-7 w-2/3 mx-auto mb-4" />
              <Skeleton className="h-5 w-full mb-2" />
              <Skeleton className="h-5 w-full mb-2" />
              <Skeleton className="h-5 w-full mb-2" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              کاربری یافت نشد.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl shadow border border-blue-100">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نام</TableHead>
                    <TableHead>ایمیل</TableHead>
                    <TableHead>شماره موبایل</TableHead>
                    <TableHead>نقش</TableHead>
                    <TableHead>تاریخ ایجاد</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow
                      key={user.id}
                      className="hover:bg-slate-100 transition"
                    >
                      <TableCell>{getUserFullName(user)}</TableCell>
                      <TableCell>{user.email || "نامشخص"}</TableCell>
                      <TableCell className="ltr text-left">
                        {formatMobile(user.mobile)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="px-2">
                          {user.role || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            className="text-blue-700"
                            size="sm"
                            onClick={() => fetchUserDetails(user.id)}
                          >
                            جزئیات
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(user.id)}
                          >
                            حذف
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* صفحه‌بندی */}
          {meta.total > 0 && users.length > 0 && (
            <div className="flex justify-center items-center mt-6 gap-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (meta.page > 1) fetchUsers(meta.page - 1, search);
                      }}
                      aria-disabled={meta.page === 1}
                      size={undefined}
                    />
                  </PaginationItem>
                  {pageBtns.map((pageNum) => (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        isActive={meta.page === pageNum}
                        onClick={(e) => {
                          e.preventDefault();
                          if (meta.page !== pageNum)
                            fetchUsers(pageNum, search);
                        }}
                        size={undefined}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (meta.page < meta.last_page)
                          fetchUsers(meta.page + 1, search);
                      }}
                      aria-disabled={meta.page === meta.last_page}
                      size={undefined}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              <span className="text-xs text-muted-foreground">
                {`کل: ${meta.total} کاربر`}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ------------------ User Details Dialog --------------------- */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="flex flex-row items-center justify-between mb-2">
            <DialogTitle className="flex-1 font-bold text-lg">
              جزئیات کاربر
            </DialogTitle>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="text-gray-600"
              onClick={() => setShowDetailsModal(false)}
            >
              <X size={22} />
            </Button>
          </DialogHeader>
          {selectedUser ? (
            <div>
              <div className="mb-2 border-b pb-2">
                <h3 className="font-bold text-base mb-1">اطلاعات اصلی</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[15px]">
                  <div>
                    <span className="text-gray-400">نام کامل: </span>
                    {getUserFullName(selectedUser)}
                  </div>
                  <div>
                    <span className="text-gray-400">ایمیل: </span>
                    {selectedUser.email || "نامشخص"}
                  </div>
                  <div>
                    <span className="text-gray-400">شماره موبایل: </span>
                    {formatMobile(selectedUser.mobile)}
                  </div>
                  <div>
                    <span className="text-gray-400">نقش: </span>
                    {selectedUser.role || "-"}
                  </div>
                  <div>
                    <span className="text-gray-400">تاریخ ایجاد: </span>
                    {formatDate(selectedUser.createdAt)}
                  </div>
                  <div>
                    <span className="text-gray-400">آخرین بروزرسانی: </span>
                    {formatDate(selectedUser.updatedAt)}
                  </div>
                </div>
              </div>
              <h3 className="font-bold text-base mb-1 mt-4">آدرس‌ها</h3>
              {selectedUser.address && selectedUser.address.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {selectedUser.address.map((addr) => (
                    <Card className="p-3 bg-slate-50 border" key={addr.id}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <span className="text-gray-400">عنوان آدرس: </span>
                          {addr.title ?? "-"}
                        </div>
                        <div>
                          <span className="text-gray-400">کد پستی: </span>
                          {addr.postalCode}
                        </div>
                        <div>
                          <span className="text-gray-400">استان: </span>
                          {addr.province}
                        </div>
                        <div>
                          <span className="text-gray-400">شهر: </span>
                          {addr.city}
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-gray-400">آدرس کامل: </span>
                          {addr.address}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">هیچ آدرسی ثبت نشده است.</div>
              )}
            </div>
          ) : (
            <Skeleton className="h-24 w-full my-5" />
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDetailsModal(false)}
            >
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------ Delete Confirm Dialog ------------------- */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-bold text-lg">حذف کاربر</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive" className="mb-2">
            <AlertTitle>آیا از حذف این کاربر مطمئن هستید؟</AlertTitle>
            <AlertDescription>این عمل قابل بازگشت نیست.</AlertDescription>
          </Alert>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirm(false)}
            >
              انصراف
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => userToDelete && deleteUser(userToDelete)}
              autoFocus
            >
              حذف کاربر
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
