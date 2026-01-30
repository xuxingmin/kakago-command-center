import { TrendingUp, TrendingDown, Users, UserPlus, Award, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  subValue?: string;
  trend?: number;
  icon: React.ElementType;
}

function KPICard({ title, value, subValue, trend, icon: Icon }: KPICardProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-4 transition-all duration-300",
        "hover:border-primary/50 group cursor-default"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{title}</span>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="font-mono text-2xl font-extrabold text-foreground tabular-nums">
        {value}
      </div>
      {(subValue || trend !== undefined) && (
        <div className="flex items-center gap-2 mt-2">
          {trend !== undefined && (
            <>
              {trend >= 0 ? (
                <TrendingUp className="w-3 h-3 text-success" />
              ) : (
                <TrendingDown className="w-3 h-3 text-destructive" />
              )}
              <span className={cn("text-xs font-mono tabular-nums", trend >= 0 ? "text-success" : "text-destructive")}>
                {trend >= 0 ? "+" : ""}{trend}%
              </span>
            </>
          )}
          {subValue && <span className="text-xs text-muted-foreground">{subValue}</span>}
        </div>
      )}
    </div>
  );
}

export function UserKPICards() {
  return (
    <div className="grid grid-cols-4 gap-4">
      <KPICard
        title="总用户数"
        value="86,432"
        subValue="累计注册"
        icon={Users}
      />
      <KPICard
        title="本周新增"
        value="+1,285"
        trend={18.6}
        icon={UserPlus}
      />
      <KPICard
        title="复购精英"
        value="23.4%"
        subValue="复购>5次"
        icon={Award}
      />
      <KPICard
        title="平均客单价"
        value="¥28.5"
        trend={5.2}
        icon={DollarSign}
      />
    </div>
  );
}
