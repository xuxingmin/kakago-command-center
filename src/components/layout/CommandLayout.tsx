import { ReactNode } from "react";
import { CommandSidebar } from "./CommandSidebar";

interface CommandLayoutProps {
  children: ReactNode;
}

export function CommandLayout({ children }: CommandLayoutProps) {
  return (
    <div className="min-h-screen h-screen bg-background overflow-hidden">
      <CommandSidebar />
      
      {/* 主内容区域 - 极简侧边栏仅占 56px */}
      <div className="ml-14 h-screen overflow-hidden">
        <main className="h-full p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
