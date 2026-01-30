import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Store,
  Box,
  Wallet,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { path: "/dashboard", label: "作战室", icon: LayoutDashboard },
  { path: "/users", label: "用户中心", icon: Users },
  { path: "/merchants", label: "商家中心", icon: Store },
  { path: "/supply", label: "供应链", icon: Box },
  { path: "/finance", label: "财务", icon: Wallet },
  { path: "/settings", label: "设置", icon: Settings },
];

export function CommandSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo 区域 */}
      <div className="h-16 flex items-center justify-center border-b border-sidebar-border px-4">
        {collapsed ? (
          <span className="text-xl font-bold text-primary">K</span>
        ) : (
          <span className="text-xl font-bold tracking-wider">
            <span className="text-primary">KAKA</span>
            <span className="text-foreground">GO</span>
          </span>
        )}
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group",
                isActive
                  ? "sidebar-item-active"
                  : "text-sidebar-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 flex-shrink-0 transition-colors",
                  isActive ? "text-primary" : "group-hover:text-primary"
                )}
              />
              {!collapsed && (
                <span className="text-sm font-medium truncate animate-slide-in">
                  {item.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* 折叠按钮 */}
      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs">收起</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
