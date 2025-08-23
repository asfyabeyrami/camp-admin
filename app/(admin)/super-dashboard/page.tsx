"use client";

import Cookies from "js-cookie";
import {
  CalendarDays,
  CircleDollarSign,
  FileText,
  ThumbsUp,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const COLORS = ["#16a34a", "#2563eb", "#f59e0b", "#d946ef"];

const SuperAdminDashboardPage = () => {
  const [dashboard, setDashboard] = useState<any>(null);
  const token = Cookies.get("token");
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(
          `${NEXT_PUBLIC_BASE_URL}/admin/dashboard/superadmin`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!resp.ok) throw new Error();
        const data = await resp.json();
        setDashboard(data);
      } catch {
        setDashboard(false);
      }
    })();
  }, [token]);

  if (dashboard === null)
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="w-24 h-24 rounded-full" />
        <div className="mr-4">
          <h4 className="text-2xl font-semibold">در حال بارگذاری...</h4>
        </div>
      </div>
    );

  if (dashboard === false || !dashboard.success)
    return (
      <div className="h-screen flex items-center justify-center">
        <h5 className="text-xl font-semibold text-red-500">
          خطا در دریافت اطلاعات!
        </h5>
      </div>
    );

  const data = dashboard.data || {};

  const stats = [
    {
      title: "فروش امروز",
      value: data.todaySales?.toLocaleString() ?? 0,
      unit: "تومان",
      icon: <CircleDollarSign className="h-6 w-6 text-yellow-600" />,
    },
    {
      title: "سفارشات جدید",
      value: data.todayOrders ?? 0,
      unit: "سفارش",
      icon: <CalendarDays className="h-6 w-6 text-pink-600" />,
    },
    {
      title: "مشتریان جدید",
      value: data.todayUsers ?? 0,
      unit: "نفر",
      icon: <FileText className="h-6 w-6 text-green-600" />,
    },
    {
      title: "محصولات موجود",
      value: data.availableProducts ?? 0,
      unit: "عدد",
      icon: <ThumbsUp className="h-6 w-6 text-blue-600" />,
    },
  ];

  const chartData = [
    { name: "سفارشات", value: data.todayOrders ?? 0 },
    { name: "مشتریان", value: data.todayUsers ?? 0 },
    { name: "محصولات", value: data.availableProducts ?? 0 },
    { name: "فروش", value: data.todaySales ?? 0 },
  ];

  return (
    <div>
      <div className="md:hidden mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-center w-full">پولاد موتور </h2>
        <div className="w-10" />
      </div>

      <div className="max-w-7xl mx-auto space-y-10">
        {/* کارت‌های آماری */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((card, i) => (
            <Card key={i} className="cursor-default hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <p className="text-2xl font-bold" dir="ltr">
                    {card.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{card.unit}</p>
                </div>
                {card.icon}
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {card.title}
              </CardContent>
            </Card>
          ))}

          <Card
            onClick={() => router.push("/super-dashboard/admins")}
            className="cursor-pointer hover:bg-purple-100 border border-purple-500 bg-purple-50"
          >
            <CardHeader className="flex items-center justify-between pb-2">
              <h3 className="text-lg font-semibold text-purple-700">
                ادمین‌ها
              </h3>
              <Users className="h-6 w-6 text-purple-700" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-purple-600">
                مدیریت کاربران ادمین سیستم
              </p>
            </CardContent>
          </Card>
        </div>

        {/* نمودارها */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="h-[300px]">
            <CardHeader>
              <CardTitle className="text-lg">آمار کلی</CardTitle>
            </CardHeader>
            <CardContent className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="h-[300px]">
            <CardHeader>
              <CardTitle className="text-lg">سهم آماری</CardTitle>
            </CardHeader>
            <CardContent className="h-[220px] flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboardPage;
