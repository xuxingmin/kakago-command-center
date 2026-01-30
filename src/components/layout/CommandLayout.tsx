import { ReactNode } from "react";
import { CommandSidebar } from "./CommandSidebar";
import { HUDHeader } from "./HUDHeader";

interface CommandLayoutProps {
  children: ReactNode;
}

export function CommandLayout({ children }: CommandLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <CommandSidebar />
      
      {/* 主内容区域 - 需要给侧边栏留出空间 */}
      <div className="ml-56 transition-all duration-300 peer-collapsed:ml-16">
        <HUDHeader />
        <main className="p-6 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
