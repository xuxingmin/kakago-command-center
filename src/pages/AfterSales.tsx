import { NavLink, Outlet, useLocation, Navigate } from "react-router-dom";
import { LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/aftersales/review", label: "售后与客诉审核" },
  { path: "/aftersales/appeal", label: "商家客诉申诉处理" },
];

export default function AfterSales() {
  const { pathname } = useLocation();
  if (pathname === "/aftersales" || pathname === "/aftersales/") {
    return <Navigate to="/aftersales/review" replace />;
  }

  return (
    <div className="h-full space-y-6">
      <div className="flex items-center gap-3">
        <LifeBuoy className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">售后与客诉</h1>
      </div>

      <div className="flex items-center gap-2 border-b border-[#222]">
        {tabs.map((t) => {
          const active = pathname.startsWith(t.path);
          return (
            <NavLink
              key={t.path}
              to={t.path}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </NavLink>
          );
        })}
      </div>

      <Outlet />
    </div>
  );
}
