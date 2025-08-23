"use client";

import Cookies from "js-cookie";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get("token");

      if (!token) return router.push("/login");
      try {
        const res = await fetch(`${NEXT_PUBLIC_BASE_URL}/admin/getAdmin`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (res.status !== 200) {
          Cookies.remove("token");
          if (pathname !== "/login") {
            router.push("/login");
          }
        } else {
          if (pathname === "/") {
            if (data.data.role === "super_admin") {
              router.push("/super-dashboard");
            } else {
              router.push("/dashboard");
            }
          }
        }
      } catch (error) {
        console.error("Auth check failed", error);
        Cookies.remove("token");
        if (pathname !== "/login") {
          router.push("/login");
        }
      }
    };

    checkAuth();
  }, [pathname, router]);

  return (
    <div className="flex min-h-screen bg-muted text-right font-sans">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <Button
        size="icon"
        variant="default"
        onClick={() => setMobileOpen(true)}
        className={`md:hidden fixed top-4 right-4 z-50 ${
          mobileOpen ? "hidden" : ""
        }`}
      >
        <Menu />
      </Button>
      <main
        className={`flex-1 transition-all duration-300 p-4 sm:p-6 md:p-8 ${
          collapsed ? "md:mr-20" : "md:mr-64"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
