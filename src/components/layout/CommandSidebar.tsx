import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Store,
  Box,
  Wallet,
  Settings,
  Database,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const menuItems = [
  { path: "/dashboard", label: "作战室", icon: LayoutDashboard },
  { path: "/users", label: "用户中心", icon: Users },
  { path: "/merchants", label: "商家中心", icon: Store },
  { path: "/supply", label: "供应链", icon: Box },
  { path: "/finance", label: "财务", icon: Wallet },
  { path: "/data-hub", label: "数据中心", icon: Database },
  { path: "/admin/master-data", label: "主数据", icon: Crown },
  { path: "/settings", label: "设置", icon: Settings },
];

export function CommandSidebar() {
  const location = useLocation();

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="fixed left-0 top-0 z-40 h-screen w-14 bg-sidebar border-r border-sidebar-border flex flex-col">
        {/* Logo */}
        <div className="h-14 flex items-center justify-center border-b border-sidebar-border">
          <span className="text-lg font-bold text-primary">K</span>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 py-3 px-2 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.path}
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-card border-border">
                  <span>{item.label}</span>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </aside>
    </TooltipProvider>
  );
}
