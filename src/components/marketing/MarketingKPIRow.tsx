import { Ticket, TrendingUp, CheckCircle, BarChart3 } from "lucide-react";

interface KPIData {
  totalCoupons: number;
  activeCoupons: number;
  totalIssued: number;
  redemptionRate: number;
}

interface MarketingKPIRowProps {
  data: KPIData;
}

const kpiConfig = [
  { key: "totalCoupons" as const, label: "券种总数", icon: Ticket, suffix: "种" },
  { key: "activeCoupons" as const, label: "活跃中", icon: TrendingUp, suffix: "种" },
  { key: "totalIssued" as const, label: "总发放量", icon: BarChart3, suffix: "张" },
  { key: "redemptionRate" as const, label: "核销率", icon: CheckCircle, suffix: "%" },
];

export function MarketingKPIRow({ data }: MarketingKPIRowProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {kpiConfig.map((kpi) => {
        const Icon = kpi.icon;
        const value = data[kpi.key];
        return (
          <div
            key={kpi.key}
            className="hud-metric rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <Icon className="w-3.5 h-3.5" />
              <span>{kpi.label}</span>
            </div>
            <div className="numeric text-2xl font-semibold text-foreground">
              {value}
              <span className="text-xs text-muted-foreground ml-1">{kpi.suffix}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
