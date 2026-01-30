import { TrendingUp, TrendingDown, Users, UserPlus, Award, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  subValue?: string;
  trend?: number;
  icon: React.ElementType;
  accentColor?: string;
}

function KPICard({ title, value, subValue, trend, icon: Icon, accentColor = "#7F00FF" }: KPICardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-[#121212] to-[#0A0A0A]",
        "border border-[#2A2A2E] rounded-xl p-4",
        "hover:border-[#3A3A3E] transition-all duration-300 group"
      )}
    >
      {/* 背景装饰 */}
      <div 
        className="absolute top-0 right-0 w-20 h-20 opacity-5 blur-2xl"
        style={{ backgroundColor: accentColor }}
      />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-[#6B7280] uppercase tracking-wider font-medium">{title}</span>
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${accentColor}15` }}
          >
            <Icon className="w-4 h-4" style={{ color: accentColor }} />
          </div>
        </div>
        
        <div className="font-mono text-2xl font-black text-white tabular-nums tracking-tight">
          {value}
        </div>
        
        {(subValue || trend !== undefined) && (
          <div className="flex items-center gap-2 mt-2">
            {trend !== undefined && (
              <div className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded",
                trend >= 0 ? "bg-[#22c55e]/10" : "bg-[#ef4444]/10"
              )}>
                {trend >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-[#22c55e]" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-[#ef4444]" />
                )}
                <span className={cn(
                  "text-[11px] font-mono font-bold tabular-nums",
                  trend >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"
                )}>
                  {trend >= 0 ? "+" : ""}{trend}%
                </span>
              </div>
            )}
            {subValue && <span className="text-[11px] text-[#6B7280]">{subValue}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export function UserKPICards() {
  return (
    <div className="grid grid-cols-4 gap-3">
      <KPICard
        title="总用户数"
        value="86,432"
        subValue="累计注册"
        icon={Users}
        accentColor="#7c3aed"
      />
      <KPICard
        title="本周新增"
        value="+1,285"
        trend={18.6}
        icon={UserPlus}
        accentColor="#22c55e"
      />
      <KPICard
        title="复购精英"
        value="23.4%"
        subValue="复购>5次"
        icon={Award}
        accentColor="#f59e0b"
      />
      <KPICard
        title="平均客单价"
        value="¥28.5"
        trend={5.2}
        icon={DollarSign}
        accentColor="#3b82f6"
      />
    </div>
  );
}
