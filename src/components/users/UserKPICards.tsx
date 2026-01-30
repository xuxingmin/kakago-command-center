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
        "relative overflow-hidden h-full",
        "bg-[#121212] border border-[#2A2A2E] rounded-xl px-4 py-3",
        "hover:border-[#3A3A3E] transition-all duration-200"
      )}
    >
      <div className="flex items-center justify-between h-full">
        <div className="flex flex-col justify-center">
          <span className="text-[10px] text-[#6B7280] uppercase tracking-wider font-medium mb-1">{title}</span>
          <div className="font-mono text-xl font-black text-white tabular-nums leading-none">
            {value}
          </div>
          {(subValue || trend !== undefined) && (
            <div className="flex items-center gap-2 mt-1">
              {trend !== undefined && (
                <div className={cn(
                  "flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-mono font-bold tabular-nums",
                  trend >= 0 ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#ef4444]/10 text-[#ef4444]"
                )}>
                  {trend >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {trend >= 0 ? "+" : ""}{trend}%
                </div>
              )}
              {subValue && <span className="text-[10px] text-[#6B7280]">{subValue}</span>}
            </div>
          )}
        </div>
        <div 
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <Icon className="w-4 h-4" style={{ color: accentColor }} />
        </div>
      </div>
    </div>
  );
}

export function UserKPICards() {
  return (
    <div className="grid grid-cols-4 gap-3 h-full">
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
