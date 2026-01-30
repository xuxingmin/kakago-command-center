import { useLocation } from "react-router-dom";
import { Store, Coffee, TrendingUp, Users } from "lucide-react";

const pageTitle: Record<string, string> = {
  "/dashboard": "作战室模块",
  "/users": "用户中心模块",
  "/merchants": "商家中心模块",
  "/supply": "供应链模块",
  "/finance": "财务模块",
  "/settings": "设置模块",
};

const metrics = [
  {
    label: "门店规模",
    value: "42",
    unit: "家",
    icon: Store,
    trend: "+3",
  },
  {
    label: "累计销量",
    value: "12,405",
    unit: "杯",
    icon: Coffee,
    trend: "+128",
  },
  {
    label: "平均毛利率",
    value: "32.4",
    unit: "%",
    icon: TrendingUp,
    trend: "+2.1%",
  },
  {
    label: "30日留存",
    value: "48.2",
    unit: "%",
    icon: Users,
    trend: "+5.3%",
  },
];

export function HUDHeader() {
  const location = useLocation();
  const title = pageTitle[location.pathname] || "KAKAGO 总部";

  return (
    <header className="h-16 bg-hud border-b border-hud-border flex items-center justify-between px-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>

      {/* KPI 指标 */}
      <div className="flex items-center gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="hud-metric flex items-center gap-3 px-4 py-2 rounded-lg bg-card/50 border border-border/50"
            >
              <Icon className="w-4 h-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {metric.label}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="numeric text-lg font-semibold text-foreground">
                    {metric.value}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {metric.unit}
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-success font-mono">
                {metric.trend}
              </span>
            </div>
          );
        })}
      </div>
    </header>
  );
}
