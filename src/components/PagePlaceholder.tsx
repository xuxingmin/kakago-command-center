import { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";

interface PagePlaceholderProps {
  title: string;
  icon: LucideIcon;
}

export function PagePlaceholder({ title, icon: Icon }: PagePlaceholderProps) {
  return (
    <div className="h-full flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="text-center space-y-6">
        {/* 图标 */}
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse-glow" />
          <div className="relative w-20 h-20 rounded-2xl bg-card border border-border flex items-center justify-center">
            <Icon className="w-10 h-10 text-primary" />
          </div>
        </div>

        {/* 标题 */}
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>

        {/* 建设中卡片 */}
        <div className="inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-card border border-border">
          <Construction className="w-5 h-5 text-warning" />
          <span className="text-muted-foreground">功能模块建设中</span>
        </div>

        {/* 装饰线条 */}
        <div className="flex items-center justify-center gap-2 pt-4">
          <div className="w-12 h-px bg-gradient-to-r from-transparent to-border" />
          <div className="w-2 h-2 rounded-full bg-primary/50" />
          <div className="w-12 h-px bg-gradient-to-l from-transparent to-border" />
        </div>
      </div>
    </div>
  );
}
