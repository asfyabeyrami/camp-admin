import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  BarChart2,
  CreditCard,
  FileText,
  Home,
  Package,
  PictureInPicture,
  ShoppingCart,
  Tag,
  Ticket,
  Truck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BiCategory, BiComment } from "react-icons/bi";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (o: boolean) => void;
}

const menuItems = [
  { icon: Home, name: "داشبورد", key: "super-dashboard" },
  { icon: Package, name: "سفارشات", key: "super-dashboard/orders" },
  { icon: ShoppingCart, name: "محصولات", key: "super-dashboard/products" },
  { icon: BiCategory, name: "دسته بندی", key: "super-dashboard/categories" },
  { icon: Tag, name: "برچسب ها", key: "super-dashboard/tags" },
  { icon: PictureInPicture, name: "گالری", key: "super-dashboard/gallery" },
  { icon: Truck, name: "حمل و نقل", key: "super-dashboard/delivery" },
  { icon: BiComment, name: "کامنت ها", key: "super-dashboard/comments" },
  { icon: Users, name: "مشتریان", key: "super-dashboard/users" },
  { icon: CreditCard, name: "پرداخت‌ها", key: "payments" },
  { icon: BarChart2, name: "گزارشات", key: "reports" },
  { icon: FileText, name: "صفحات", key: "pages" },
  { icon: Ticket, name: "تیکت ها", key: "tickets" },
];

const Sidebar = ({ collapsed, mobileOpen, setMobileOpen }: SidebarProps) => {
  const pathname = usePathname();

  const isMenuActive = (key: string) => {
    // آیتم root (dashboard) فقط وقتی دقیقا همون صفحه است فعال شود
    if (key === "super-dashboard") return pathname === "/super-dashboard";
    // بقیه دقیقا با شروع مسیر match شوند:
    return pathname.startsWith(`/${key}`);
  };

  const desktopWidth = collapsed ? "w-20" : "w-64";

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          "bg-background border-l z-50 fixed top-0 right-0 h-screen flex flex-col transition-all duration-300",
          desktopWidth,
          "transform md:translate-x-0",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-6 border-b flex items-center justify-between">
          {!collapsed && (
            <h1 className="text-2xl font-extrabold text-primary select-none">
              camping
            </h1>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full px-0">
            <nav className="py-6">
              <ul className="flex flex-col space-y-1 px-4">
                {menuItems.map(({ icon: Icon, name, key }) => {
                  const isActive = isMenuActive(key);
                  return (
                    <li key={key}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={`/${key}`}
                            className={cn(
                              "group flex items-center gap-4 py-3 px-3 rounded-lg transition-colors duration-200 select-none",
                              isActive
                                ? "bg-primary/20 text-primary font-semibold shadow"
                                : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                            )}
                          >
                            <div
                              className={cn(
                                "flex items-center justify-center rounded-md w-10 h-10",
                                isActive
                                  ? "bg-primary text-primary-foreground shadow-md"
                                  : "text-muted-foreground group-hover:text-primary group-hover:bg-primary/20"
                              )}
                            >
                              <Icon size={20} />
                            </div>
                            {!collapsed && (
                              <span className="truncate text-base">{name}</span>
                            )}
                          </Link>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent side="left" className="text-sm">
                            {name}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </ScrollArea>
        </div>
        <div className="p-6 border-t bg-muted/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold select-none shadow">
              ا
            </div>
            {!collapsed && (
              <div>
                <p className="text-md font-semibold text-primary">ادمین</p>
                <p className="text-sm text-muted-foreground">مدیر سیستم</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
export default Sidebar;
