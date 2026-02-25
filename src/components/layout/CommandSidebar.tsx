import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Store,
  Megaphone,
  Box,
  Wallet,
  Settings,
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
  { path: "/marketing", label: "营销中心", icon: Megaphone },
  { path: "/supply", label: "供应链", icon: Box },
  { path: "/finance", label: "财务", icon: Wallet },
  { path: "/settings", label: "设置", icon: Settings },
];

export function CommandSidebar() {
  const location = useLocation();

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="fixed left-0 top-0 z-40 h-screen w-14 bg-[#0A0A0A] border-r border-[#1E1E1E] flex flex-col">
        {/* Logo */}
        <div className="h-14 flex items-center justify-center border-b border-[#1E1E1E]">
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
                        ? "bg-primary/15 text-primary"
                        : "text-[#555] hover:bg-[#141414] hover:text-[#999]"
                    )}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-[#0A0A0A] border-[#1E1E1E] text-[#E5E5E5]">
                  <span className="text-xs">{item.label}</span>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </aside>
    </TooltipProvider>
  );
}
