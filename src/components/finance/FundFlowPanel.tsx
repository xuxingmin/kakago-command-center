import { ArrowDownLeft, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinanceSummary } from "@/hooks/use-finance";

interface FlowItemProps {
  label: string;
  value: number;
  type: "income" | "expense" | "net";
  percentage?: number;
}

function FlowItem({ label, value, type, percentage }: FlowItemProps) {
  const formatValue = (v: number) => {
    const absValue = Math.abs(v);
    if (absValue >= 10000) {
      return `${v < 0 ? "-" : ""}¥${(absValue / 10000).toFixed(1)}万`;
    }
    return `${v < 0 ? "-" : ""}¥${absValue.toLocaleString()}`;
  };

  const getColor = () => {
    switch (type) {
      case "income": return "text-success";
      case "expense": return "text-destructive";
      case "net": return value >= 0 ? "text-primary" : "text-destructive";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "income": return <ArrowDownLeft className="w-4 h-4" />;
      case "expense": return <ArrowUpRight className="w-4 h-4" />;
      case "net": return <Minus className="w-4 h-4" />;
    }
  };

  const getBarColor = () => {
    switch (type) {
      case "income": return "bg-success";
      case "expense": return "bg-destructive";
      case "net": return value >= 0 ? "bg-primary" : "bg-destructive";
    }
  };

  return (
    <div className="flex items-center gap-3 py-2 border-b border-[#222] last:border-0">
      <div className={cn("flex items-center justify-center w-8 h-8 rounded bg-[#1a1a1a]", getColor())}>
        {getIcon()}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-[#9CA3AF]">{label}</span>
          <span className={cn("font-mono text-sm font-bold tabular-nums", getColor())}>
            {formatValue(value)}
          </span>
        </div>
        {percentage !== undefined && (
          <div className="h-1 bg-[#333333] rounded-full overflow-hidden">
            <div 
              className={cn("h-full rounded-full transition-all duration-700", getBarColor())}
              style={{ width: `${Math.min(Math.abs(percentage), 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function FundFlowPanel() {
  const { data, loading } = useFinanceSummary();

  const totalIncome = data.totalRevenue;
  const totalExpense = data.materialCost + data.pendingSettlement + data.couponCost;
  const netProfit = totalIncome - totalExpense;

  const flowItems = [
    { label: "订单营收", value: data.totalRevenue, type: "income" as const, percentage: 100 },
    { label: "物料成本", value: -data.materialCost, type: "expense" as const, percentage: (data.materialCost / totalIncome) * 100 },
    { label: "门店结算", value: -data.pendingSettlement, type: "expense" as const, percentage: (data.pendingSettlement / totalIncome) * 100 },
    { label: "优惠券成本", value: -data.couponCost, type: "expense" as const, percentage: (data.couponCost / totalIncome) * 100 },
  ];

  return (
    <div className="bg-card border border-secondary rounded-lg p-4 h-full flex flex-col">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-primary rounded-full" />
          <span className="text-sm font-medium">资金流向</span>
        </div>
        <span className="text-xs text-muted-foreground">本月累计</span>
      </div>

      {/* 流水列表 */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            加载中...
          </div>
        ) : (
          <div className="space-y-1">
            {flowItems.map((item, index) => (
              <FlowItem key={index} {...item} />
            ))}
          </div>
        )}
      </div>

      {/* 净利润汇总 */}
      <div className="flex-shrink-0 pt-3 mt-3 border-t border-[#333]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              netProfit >= 0 ? "bg-primary" : "bg-destructive"
            )} />
            <span className="text-sm text-[#9CA3AF]">净利润</span>
          </div>
          <span className={cn(
            "font-mono text-xl font-extrabold tabular-nums",
            netProfit >= 0 ? "text-primary" : "text-destructive"
          )}>
            {loading ? "--" : (
              netProfit >= 10000 
                ? `¥${(netProfit / 10000).toFixed(2)}万`
                : `¥${netProfit.toLocaleString()}`
            )}
          </span>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span>利润率 <span className="font-mono text-foreground">{loading ? "--" : `${((netProfit / totalIncome) * 100).toFixed(1)}%`}</span></span>
          <span>环比 <span className="font-mono text-success">+5.2%</span></span>
        </div>
      </div>
    </div>
  );
}
