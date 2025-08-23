"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Sidebar from "../../../../components/sidebar";
// shadcn/ui:
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Badge } from "@/components/ui/badge";
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

interface CommentType {
  id: string;
  comment: string;
  isPublish: boolean;
}

const CommentPage: React.FC = () => {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [showPublished, setShowPublished] = useState(false);
  const token = Cookies.get("token");

  const fetchComments = async () => {
    if (!token) {
      setMessage({ text: "توکن ورود موجود نیست", type: "error" });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.get(
        `${NEXT_PUBLIC_BASE_URL}/comment/getcomment?isPublish=${showPublished}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments(res.data.data || []);
    } catch {
      setMessage({ text: "خطا در دریافت کامنت‌ها", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line
  }, [showPublished]);

  const handleApprove = async (id: string) => {
    if (!token) {
      setMessage({ text: "توکن ورود موجود نیست", type: "error" });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await axios.put(
        `${NEXT_PUBLIC_BASE_URL}/comment/publish/${id}`,
        { isPublish: true },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setMessage({ text: "کامنت با موفقیت تایید شد", type: "success" });
      await fetchComments();
    } catch {
      setMessage({ text: "خطا در تایید کامنت", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) {
      setMessage({ text: "توکن ورود موجود نیست", type: "error" });
      return;
    }
    if (
      !window.confirm("آیا مطمئن هستید که می‌خواهید این کامنت را حذف کنید؟")
    ) {
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await axios.delete(`${NEXT_PUBLIC_BASE_URL}/comment/comment/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage({ text: "کامنت با موفقیت حذف شد", type: "success" });
      await fetchComments();
    } catch {
      setMessage({ text: "خطا در حذف کامنت", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <div className="md:hidden mb-6 flex items-center justify-center">
        <h2 className="text-xl font-bold text-center">پولاد موتور</h2>
      </div>

      <Card className="max-w-3xl mx-auto mb-8 shadow-xl border border-blue-100 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl text-blue-900 text-center font-bold mb-2">
            مدیریت کامنت‌ها
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-6">
            <Toggle
              pressed={showPublished}
              onPressedChange={() => setShowPublished((v) => !v)}
              className="px-6 py-2 rounded-2xl text-blue-700 bg-muted font-semibold text-base data-[state=on]:bg-blue-100 data-[state=on]:text-blue-900 border transition"
              aria-pressed={showPublished}
            >
              {showPublished
                ? "نمایش کامنت‌های تایید نشده"
                : "نمایش کامنت‌های تایید شده"}
            </Toggle>
          </div>
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
          {loading && (
            <div className="flex flex-col items-center py-6">
              <Loader2 className="animate-spin mb-2" size={28} />
              <span className="text-muted-foreground text-sm">
                در حال بارگذاری...
              </span>
            </div>
          )}
          {!loading && comments.length === 0 && (
            <p className="text-center text-gray-500 text-lg my-8">
              {showPublished
                ? "کامنت تایید شده‌ای وجود ندارد."
                : "کامنت تایید نشده‌ای وجود ندارد."}
            </p>
          )}
          <ul className="space-y-4">
            {comments.map((comment) => (
              <li
                key={comment.id}
                className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm"
              >
                <div className="flex-1">
                  <p className="text-gray-800 text-base leading-relaxed mb-2">
                    {comment.comment}
                  </p>
                  <Badge variant={comment.isPublish ? "default" : "secondary"}>
                    {comment.isPublish ? "تایید شده" : "در انتظار تایید"}
                  </Badge>
                </div>
                <div className="flex flex-row flex-wrap gap-2 items-center mt-4 md:mt-0 md:ml-3">
                  {!comment.isPublish && (
                    <Button
                      onClick={() => handleApprove(comment.id)}
                      variant="default"
                      size="sm"
                      disabled={loading}
                    >
                      تایید
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDelete(comment.id)}
                    variant="destructive"
                    size="sm"
                    disabled={loading}
                  >
                    حذف
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommentPage;
