"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ROLE_LABELS = {
  super_admin: "سوپر ادمین",
  admin: "ادمین",
} as const;
type Role = keyof typeof ROLE_LABELS;
type Admin = {
  id: string;
  username: string;
  email: string;
  role: Role;
};

const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const AdminManager = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    role: "admin" as Role,
  });
  const [editPasswordFor, setEditPasswordFor] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const token = Cookies.get("token");

  const fetchAdmins = async () => {
    try {
      const res = await axios.get(`${NEXT_PUBLIC_BASE_URL}/auth/admin-list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdmins(res.data.data);
    } catch {
      setMsg({ type: "error", text: "خطا در واکشی ادمین‌ها" });
    }
  };

  useEffect(() => {
    fetchAdmins();
    // eslint-disable-next-line
  }, []);

  const handleForm = (e: any) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!form.role) {
      setMsg({ type: "error", text: "لطفا نقش کاربری را انتخاب کنید" });
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      await axios.post(`${NEXT_PUBLIC_BASE_URL}/auth/createAdmin`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMsg({ type: "success", text: "ادمین با موفقیت افزوده شد." });
      setForm({ username: "", password: "", email: "", role: "admin" });
      fetchAdmins();
    } catch {
      setMsg({ type: "error", text: "خطا در افزودن ادمین." });
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف شود؟")) return;
    setLoading(true);
    setMsg(null);
    try {
      await axios.delete(`${NEXT_PUBLIC_BASE_URL}/auth/admin-remove/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMsg({ type: "success", text: "حذف شد." });
      fetchAdmins();
    } catch {
      setMsg({ type: "error", text: "خطا در حذف" });
    }
    setLoading(false);
  };

  const handleChangePassword = async (id: string) => {
    if (!newPassword) return;
    setLoading(true);
    setMsg(null);
    try {
      await axios.put(
        `${NEXT_PUBLIC_BASE_URL}/auth/update-password/${id}`,
        { password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg({ type: "success", text: "رمز عبور تغییر کرد" });
      setEditPasswordFor(null);
      setNewPassword("");
    } catch {
      setMsg({ type: "error", text: "خطا در تغییر رمز" });
    }
    setLoading(false);
    fetchAdmins();
  };

  return (
    <div>
      <div className="md:hidden mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-center w-full">پولاد موتور </h2>
        <div className="w-10" />
      </div>

      <Card className="max-w-3xl mx-auto mt-6">
        <CardHeader>
          <CardTitle className="text-center text-blue-700">
            مدیریت ادمین‌ها
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {msg && (
            <Alert variant={msg.type === "success" ? "default" : "destructive"}>
              <AlertDescription>{msg.text}</AlertDescription>
            </Alert>
          )}

          <form
            onSubmit={handleSubmit}
            className="grid gap-2 bg-blue-50/40 p-4 rounded-xl"
          >
            <div className="flex gap-2">
              <Input
                name="username"
                placeholder="نام کاربری"
                required
                value={form.username}
                onChange={handleForm}
              />
              <Input
                name="email"
                placeholder="ایمیل"
                required
                value={form.email}
                onChange={handleForm}
              />
            </div>
            <div className="flex gap-2">
              <Input
                name="password"
                placeholder="رمزعبور"
                type="password"
                required
                value={form.password}
                onChange={handleForm}
              />
              <Select
                value={form.role}
                onValueChange={(value: string) =>
                  setForm({ ...form, role: value as Role })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="نقش کاربر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">
                    {ROLE_LABELS.super_admin}
                  </SelectItem>
                  <SelectItem value="admin">{ROLE_LABELS.admin}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={loading} className="w-fit">
              {loading ? "در حال ارسال..." : "افزودن ادمین"}
            </Button>
          </form>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نام کاربری</TableHead>
                  <TableHead>ایمیل</TableHead>
                  <TableHead>نقش</TableHead>
                  <TableHead>تغییر رمز</TableHead>
                  <TableHead>حذف</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-gray-400 py-4"
                    >
                      ادمینی وجود ندارد
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.username}</TableCell>
                      <TableCell>{a.email}</TableCell>
                      <TableCell>{ROLE_LABELS[a.role]}</TableCell>
                      <TableCell>
                        {editPasswordFor === a.id ? (
                          <div className="flex gap-1">
                            <Input
                              type="password"
                              className="text-xs"
                              placeholder="رمز جدید..."
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <Button
                              type="button"
                              onClick={() => handleChangePassword(a.id)}
                              disabled={loading}
                              variant="default"
                            >
                              ثبت
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => setEditPasswordFor(null)}
                            >
                              انصراف
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditPasswordFor(a.id);
                              setNewPassword("");
                            }}
                          >
                            تغییر
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          onClick={() => handleDelete(a.id)}
                          disabled={loading}
                        >
                          حذف
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminManager;
