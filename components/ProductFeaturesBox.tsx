"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Trash2, Edit2, X, Loader2, Plus } from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type FeatureValue = {
  name: string;
  rate: string;
  Length: string;
  Width: string;
  Height: string;
  stock_quantity: string;
};
type Feature = {
  id: string;
  feature: string;
  FeatureValue: FeatureValue[];
};
export default function ProductFeaturesBox({
  productId,
}: {
  productId: string;
}) {
  // STATES
  const [features, setFeatures] = React.useState<Feature[]>([]);
  const [featuresLoading, setFeaturesLoading] = React.useState(false);
  const [featuresEditId, setFeaturesEditId] = React.useState<string | null>(
    null
  );
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [featureForm, setFeatureForm] = React.useState<{
    feature: string;
    values: FeatureValue[];
  }>({
    feature: "",
    values: [
      {
        name: "",
        rate: "",
        Length: "",
        Width: "",
        Height: "",
        stock_quantity: "",
      },
    ],
  });
  // LOAD FEATURES
  React.useEffect(() => {
    if (!productId) return;
    setFeaturesLoading(true);
    // --- به API خودت بزن! (نمونه محلی صرفا)
    fetch("/feature?productId=" + productId)
      .then((r) => r.json())
      .then((data) => setFeatures(data.features || []))
      .catch(() => setFeatures([]))
      .finally(() => setFeaturesLoading(false));
  }, [productId]);
  // HANDLE INPUTs
  const handleFeatureInput = (
    field: keyof FeatureValue,
    val: string,
    idx: number
  ) => {
    setFeatureForm((prev) => ({
      ...prev,
      values: prev.values.map((v, i) =>
        i === idx ? { ...v, [field]: val } : v
      ),
    }));
  };
  // اضافه ردیف جدید مقدار
  const handleFeatureRowAdd = () => {
    setFeatureForm((prev) => ({
      ...prev,
      values: [
        ...prev.values,
        {
          name: "",
          rate: "",
          Length: "",
          Width: "",
          Height: "",
          stock_quantity: "",
        },
      ],
    }));
  };
  // حذف مقدار
  const handleFeatureRowRemove = (idx: number) => {
    setFeatureForm((prev) => ({
      ...prev,
      values: prev.values.filter((_, i) => i !== idx),
    }));
  };
  // شروع ویرایش یک ویژگی
  const handleFeatureEditBegin = (f: Feature) => {
    setFeaturesEditId(f.id);
    setFeatureForm({
      feature: f.feature,
      values: f.FeatureValue.map((v) => ({
        name: v.name,
        rate: v.rate,
        Length: v.Length,
        Width: v.Width,
        Height: v.Height,
        stock_quantity: v.stock_quantity,
      })),
    });
  };
  // حذف ویژگی
  const handleFeatureDelete = (f: Feature) => {
    if (!window.confirm("آیا از حذف این ویژگی اطمینان دارید؟")) return;
    setFeaturesLoading(true);
    fetch(`/feature/${f.id}`, { method: "DELETE" })
      .then(() => {
        setFeatures((cur) => cur.filter((x) => x.id !== f.id));
      })
      .catch(() => setErrorMsg("حذف ویژگی شکست خورد!"))
      .finally(() => setFeaturesLoading(false));
  };
  // افزودن یا ویرایش ویژگی
  const handleFeatureSubmit = async () => {
    setFeaturesLoading(true);
    setErrorMsg(null);
    try {
      let newFeature: Feature = {
        id: featuresEditId || Math.random().toString(36).slice(2),
        feature: featureForm.feature,
        FeatureValue: featureForm.values,
      };
      if (featuresEditId) {
        await fetch(`/feature/${featuresEditId}`, {
          method: "PUT",
          body: JSON.stringify(newFeature),
        });
        setFeatures((old) =>
          old.map((f) => (f.id === featuresEditId ? newFeature : f))
        );
      } else {
        await fetch("/feature", {
          method: "POST",
          body: JSON.stringify(newFeature),
        });
        setFeatures((old) => [...old, newFeature]);
      }
      setFeaturesEditId(null);
      setFeatureForm({
        feature: "",
        values: [
          {
            name: "",
            rate: "",
            Length: "",
            Width: "",
            Height: "",
            stock_quantity: "",
          },
        ],
      });
    } catch {
      setErrorMsg("ثبت ویژگی شکست خورد!");
    }
    setFeaturesLoading(false);
  };
  return (
    <Card className="border-gray-100 border rounded-2xl">
      <CardHeader>
        <CardTitle className="font-bold text-base flex gap-2 items-center">
          ویژگی‌های محصول
        </CardTitle>
      </CardHeader>
      <CardContent>
        {errorMsg && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>{errorMsg}</AlertTitle>
          </Alert>
        )}
        {featuresLoading ? (
          <div className="flex justify-center py-5">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : features.length === 0 ? (
          <div className="text-center text-zinc-500 py-6 text-sm">
            ویژگی‌ای ثبت نشده است.
          </div>
        ) : (
          <div className="overflow-x-auto my-4 rounded-xl border border-blue-200 bg-white/80">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-100/40">
                  <TableHead>ویژگی</TableHead>
                  <TableHead>نام مقدار</TableHead>
                  <TableHead>rate</TableHead>
                  <TableHead>طول</TableHead>
                  <TableHead>عرض</TableHead>
                  <TableHead>ارتفاع</TableHead>
                  <TableHead>موجودی</TableHead>
                  <TableHead>عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {features.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-bold text-sky-900">
                      {f.feature}
                    </TableCell>
                    <TableCell>
                      {(f.FeatureValue || []).map((v) => v.name).join("، ") ||
                        "-"}
                    </TableCell>
                    <TableCell>
                      {(f.FeatureValue || []).map((v) => v.rate).join("، ") ||
                        "-"}
                    </TableCell>
                    <TableCell>
                      {(f.FeatureValue || []).map((v) => v.Length).join("، ") ||
                        "-"}
                    </TableCell>
                    <TableCell>
                      {(f.FeatureValue || []).map((v) => v.Width).join("، ") ||
                        "-"}
                    </TableCell>
                    <TableCell>
                      {(f.FeatureValue || []).map((v) => v.Height).join("، ") ||
                        "-"}
                    </TableCell>
                    <TableCell>
                      {(f.FeatureValue || [])
                        .map((v) => v.stock_quantity)
                        .join("، ") || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="border-primary hover:bg-blue-50"
                          onClick={() => handleFeatureEditBegin(f)}
                          type="button"
                        >
                          <Edit2 size={16} className="text-primary" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="border-destructive hover:bg-red-50"
                          onClick={() => handleFeatureDelete(f)}
                          type="button"
                        >
                          <Trash2 size={16} className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {/* ----- FORM افزودن/ویرایش  ----- */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleFeatureSubmit();
          }}
          className={cn(
            "border-gray-200 border rounded-2xl mt-7 py-5 px-4 transition",
            featuresEditId ? "border-gray-400 border-2" : ""
          )}
        >
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <Label htmlFor="feature-input" className="w-24 shrink-0 font-bold">
              نام ویژگی:
            </Label>
            <Input
              id="feature-input"
              className="w-40 rounded-lg"
              value={featureForm.feature}
              onChange={(e) =>
                setFeatureForm({ ...featureForm, feature: e.target.value })
              }
              placeholder="مثلاً وزن"
              required
              autoComplete="off"
            />
            <span className="text-xs text-muted-foreground pr-2 font-medium">
              مقادیر:
            </span>
          </div>
          <div className="space-y-2 mb-4">
            {featureForm.values.map((v, idx) => (
              <div
                key={idx}
                className="flex flex-wrap gap-2 items-center p-2 border-gray-200 border rounded-2xl"
              >
                <Input
                  className="w-24 rounded-md"
                  placeholder="نام مقدار"
                  value={v.name}
                  onChange={(e) =>
                    handleFeatureInput("name", e.target.value, idx)
                  }
                  required
                />
                <Input
                  className="w-16 rounded-md"
                  placeholder="rate"
                  value={v.rate}
                  type="number"
                  onChange={(e) =>
                    handleFeatureInput("rate", e.target.value, idx)
                  }
                />
                <Input
                  className="w-16 rounded-md"
                  placeholder="طول"
                  value={v.Length}
                  type="number"
                  onChange={(e) =>
                    handleFeatureInput("Length", e.target.value, idx)
                  }
                />
                <Input
                  className="w-16 rounded-md"
                  placeholder="عرض"
                  value={v.Width}
                  type="number"
                  onChange={(e) =>
                    handleFeatureInput("Width", e.target.value, idx)
                  }
                />
                <Input
                  className="w-16 rounded-md"
                  placeholder="ارتفاع"
                  value={v.Height}
                  type="number"
                  onChange={(e) =>
                    handleFeatureInput("Height", e.target.value, idx)
                  }
                />
                <Input
                  className="w-16 rounded-md"
                  placeholder="تعداد"
                  value={v.stock_quantity}
                  type="number"
                  onChange={(e) =>
                    handleFeatureInput("stock_quantity", e.target.value, idx)
                  }
                />
                {featureForm.values.length > 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="hover:bg-red-50"
                    type="button"
                    onClick={() => handleFeatureRowRemove(idx)}
                  >
                    <X size={16} className="text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-md font-bold flex gap-1 text-blue-700"
              onClick={handleFeatureRowAdd}
            >
              <Plus size={14} /> افزودن مقدار دیگر
            </Button>
            <div className="flex-1" />
            {featuresEditId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-md"
                onClick={() => {
                  setFeaturesEditId(null);
                  setFeatureForm({
                    feature: "",
                    values: [
                      {
                        name: "",
                        rate: "",
                        Length: "",
                        Width: "",
                        Height: "",
                        stock_quantity: "",
                      },
                    ],
                  });
                }}
              >
                انصراف
              </Button>
            )}
            <Button
              type="submit"
              variant="default"
              size="sm"
              className="rounded-md px-4 bg-blue-700 text-white"
              disabled={featuresLoading}
            >
              {featuresEditId ? "ذخیره تغییرات" : "افزودن ویژگی"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
