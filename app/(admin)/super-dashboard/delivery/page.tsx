"use client";
import axios from "axios";
import Cookies from "js-cookie";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Edit2, Plus, Send, Trash2 } from "react-feather";
// shadcn/ui
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

type DeliveryType = "FREE" | "PAYMENT_ON_SITE" | "FIXED_RATE" | "POST_SERVICES";
interface DeliveryRow {
  id: string;
  deliveryType: DeliveryType;
  rate: string;
}
const DELIVERY_TYPE_LABELS: Record<DeliveryType, string> = {
  FREE: "ارسال رایگان",
  PAYMENT_ON_SITE: "پرداخت در محل",
  FIXED_RATE: "نرخ ثابت",
  POST_SERVICES: "سرویس پست",
};

export default function Delivery() {
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  const [form, setForm] = useState<{
    deliveryType: DeliveryType;
    rate: string;
  }>({ deliveryType: "FREE", rate: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const token = Cookies.get("token");
  // API
  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${NEXT_PUBLIC_BASE_URL}/delivery/delivery`);
      setDeliveries(res.data.data);
    } catch {
      setMessage({ text: "خطا در دریافت اطلاعات.", type: "error" });
      setDeliveries([]);
    }
    setLoading(false);
  };
  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line
  }, []);

  const submitForm = async (e: any) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      if (editId) {
        await axios.put(
          `${NEXT_PUBLIC_BASE_URL}/delivery/delivery/${editId}`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessage({ text: "بروزرسانی موفق بود.", type: "success" });
      } else {
        await axios.post(`${NEXT_PUBLIC_BASE_URL}/delivery/delivery`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessage({ text: "اضافه شد.", type: "success" });
      }
      setForm({ deliveryType: "FREE", rate: "" });
      setEditId(null);
      fetchAll();
    } catch {
      setMessage({ text: "خطا در ارسال اطلاعات", type: "error" });
    }
    setLoading(false);
  };
  const handleDelete = async (id: string) => {
    if (!window.confirm("آیا حذف شود؟")) return;
    setLoading(true);
    setMessage(null);
    try {
      await axios.delete(`${NEXT_PUBLIC_BASE_URL}/delivery/delivery/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage({ text: "حذف شد.", type: "success" });
      fetchAll();
    } catch {
      setMessage({ text: "خطا در حذف", type: "error" });
    }
    setLoading(false);
  };

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <div className="md:hidden mb-6 flex items-center justify-center">
        <h2 className="text-xl font-bold text-center">پولاد موتور</h2>
      </div>
      <Card className="max-w-xl mx-auto mt-7 mb-8 shadow-xl border border-blue-100 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl text-blue-700 text-center font-extrabold flex gap-2 items-center justify-center">
            <Send size={23} className="text-indigo-400" />
            مدیریت روش‌های حمل و نقل
          </CardTitle>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert
              className="mb-5"
              variant={message.type === "success" ? "default" : "destructive"}
            >
              <AlertTitle>
                {message.type === "success" ? "موفق" : "خطا"}
              </AlertTitle>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}
          {/* Form */}
          <form
            onSubmit={submitForm}
            className="flex flex-wrap md:flex-nowrap gap-4 items-end border border-blue-100 bg-indigo-50/50 rounded-xl shadow-inner px-4 py-3 mb-7 mt-2"
          >
            <div className="flex flex-col flex-1 min-w-[160px]">
              <label className="mb-1 text-sm font-semibold">نوع ارسال</label>
              <Select
                value={form.deliveryType}
                onValueChange={(val: any) =>
                  setForm((f) => ({
                    ...f,
                    deliveryType: val as DeliveryType,
                  }))
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="نوع ارسال" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DELIVERY_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col flex-1 min-w-[100px]">
              <label className="mb-1 text-sm font-semibold">
                هزینه ارسال (تومان)
              </label>
              <Input
                type="number"
                min={0}
                value={form.rate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, rate: e.target.value }))
                }
                required
                placeholder="هزینه ارسال"
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !form.rate}
              className={`font-bold`}
              variant={editId ? "secondary" : "default"}
            >
              {loading ? (
                <Loader2 className="animate-spin size-5" />
              ) : editId ? (
                <>
                  <Edit2 size={17} className="inline mr-2" /> ویرایش
                </>
              ) : (
                <>
                  <Plus size={17} className="inline mr-2" /> افزودن
                </>
              )}
            </Button>
            {editId && (
              <Button
                type="button"
                variant="outline"
                className="font-bold"
                onClick={() => {
                  setEditId(null);
                  setForm({ deliveryType: "FREE", rate: "" });
                }}
                disabled={loading}
              >
                انصراف
              </Button>
            )}
          </form>
          {/* List */}
          <div className="overflow-x-auto border rounded-2xl bg-white/95 shadow mt-7">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-l from-blue-50/60 to-white border-b border-blue-100">
                  <th className="py-2 px-4 font-bold">نوع ارسال</th>
                  <th className="py-2 px-4 font-bold">هزینه (تومان)</th>
                  <th className="py-2 px-4 font-bold">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={3}>
                        <Skeleton className="h-7 w-full" />
                      </td>
                    </tr>
                  ))
                ) : deliveries.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-gray-400 text-center py-5">
                      موردی ثبت نشده.
                    </td>
                  </tr>
                ) : (
                  deliveries.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b last:border-0 border-blue-50 hover:bg-indigo-50 transition"
                    >
                      <td className="py-2 px-4 font-bold">
                        {DELIVERY_TYPE_LABELS[d.deliveryType]}
                      </td>
                      <td className="py-2 px-4 text-center">
                        {(+d.rate).toLocaleString()}
                      </td>
                      <td className="py-2 px-4 flex gap-1 items-center justify-center">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="hover:bg-yellow-100"
                          title="ویرایش"
                          onClick={() => {
                            setEditId(d.id);
                            setForm({
                              deliveryType: d.deliveryType,
                              rate: d.rate,
                            });
                          }}
                          disabled={loading}
                        >
                          <Edit2 size={17} />
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          title="حذف"
                          className="hover:bg-red-200"
                          onClick={() => handleDelete(d.id)}
                          disabled={loading}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
