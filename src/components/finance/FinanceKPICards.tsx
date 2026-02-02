import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Percent, 
  CreditCard, 
  Ticket 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
}

function KPICard({ title, value, change, icon: Icon, trend }: KPICardProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{title}</p>
              <p className="text-lg font-bold text-foreground">{value}</p>
            </div>
          </div>
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-xs",
              trend === "up" && "text-green-500",
              trend === "down" && "text-red-500",
              trend === "neutral" && "text-muted-foreground"
            )}>
              {trend === "up" && <TrendingUp className="h-3 w-3" />}
              {trend === "down" && <TrendingDown className="h-3 w-3" />}
              <span>{change > 0 ? "+" : ""}{change.toFixed(1)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface FinanceKPICardsProps {
  data: {
    totalRevenue: number;
    todayRevenue: number;
    materialCost: number;
    grossMargin: number;
    pendingSettlement: number;
    couponCost: number;
  };
  loading?: boolean;
}

export function FinanceKPICards({ data, loading }: FinanceKPICardsProps) {
  const formatCurrency = (value: number) => {
    if (value >= 10000) {
      return `¥${(value / 10000).toFixed(2)}万`;
    }
    return `¥${value.toLocaleString()}`;
  };

  const kpis: KPICardProps[] = [
    {
      title: "总营收",
      value: loading ? "--" : formatCurrency(data.totalRevenue),
      icon: DollarSign,
      change: 12.5,
      trend: "up"
    },
    {
      title: "今日营收",
      value: loading ? "--" : formatCurrency(data.todayRevenue),
      icon: ShoppingCart,
      change: 8.3,
      trend: "up"
    },
    {
      title: "物料成本",
      value: loading ? "--" : formatCurrency(data.materialCost),
      icon: Package,
      change: -3.2,
      trend: "down"
    },
    {
      title: "毛利率",
      value: loading ? "--" : `${(data.grossMargin * 100).toFixed(1)}%`,
      icon: Percent,
      change: 2.1,
      trend: "up"
    },
    {
      title: "待结算",
      value: loading ? "--" : formatCurrency(data.pendingSettlement),
      icon: CreditCard,
      trend: "neutral"
    },
    {
      title: "优惠券成本",
      value: loading ? "--" : formatCurrency(data.couponCost),
      icon: Ticket,
      change: 15.2,
      trend: "up"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpis.map((kpi) => (
        <KPICard key={kpi.title} {...kpi} />
      ))}
    </div>
  );
}
