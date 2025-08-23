"use client";

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

const ProductCreateForm = dynamic(
  () => import("../../../../../components/ProductCreateForm"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[500px] w-full" />,
  }
);

export default function ProductCreatePage() {
  return (
    <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
      <ProductCreateForm />
    </Suspense>
  );
}
