import { ArrowDownLeft, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinanceSummary } from "@/hooks/use-finance";

interface FlowItemProps {
  label: string;
  value: number;
  type: "income" | "expense";
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

  const getColor = () => type === "income" ? "text-success" : "text-destructive";
  const getIcon = () => type === "income" 
    ? <ArrowDownLeft className="w-3.5 h-3.5" /> 
    : <ArrowUpRight className="w-3.5 h-3.5" />;
  const getBarColor = () => type === "income" ? "bg-success" : "bg-destructive";

  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-[#222] last:border-0">
      <div className={cn("flex items-center justify-center w-6 h-6 rounded bg-[#1a1a1a]", getColor())}>
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs text-[#9CA3AF] truncate">{label}</span>
          <span className={cn("font-mono text-xs font-bold tabular-nums", getColor())}>
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

  // 计算各项
  const orderRevenue = data.totalRevenue;
  const materialCost = data.materialCost;
  const storeShare = data.pendingSettlement; // 门店分成
  const shippingCost = orderRevenue * 0.03; // 运费约3%
  const apiCost = orderRevenue * 0.01; // API调用费约1%
  const couponCost = data.couponCost;

  const totalExpense = materialCost + storeShare + shippingCost + apiCost + couponCost;
  const grossProfit = orderRevenue - totalExpense;

  const flowItems = [
    { label: "订单应收", value: orderRevenue, type: "income" as const, percentage: 100 },
    { label: "物料成本", value: -materialCost, type: "expense" as const, percentage: (materialCost / orderRevenue) * 100 },
    { label: "门店分成", value: -storeShare, type: "expense" as const, percentage: (storeShare / orderRevenue) * 100 },
    { label: "运费", value: -shippingCost, type: "expense" as const, percentage: (shippingCost / orderRevenue) * 100 },
    { label: "API调用费", value: -apiCost, type: "expense" as const, percentage: (apiCost / orderRevenue) * 100 },
    { label: "投券成本", value: -couponCost, type: "expense" as const, percentage: (couponCost / orderRevenue) * 100 },
  ];

  return (
    <div className="bg-card border border-secondary rounded-lg p-3 h-full flex flex-col">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-primary rounded-full" />
          <span className="text-sm font-medium">资金流向</span>
        </div>
        <span className="text-xs text-muted-foreground">本月累计</span>
      </div>

      {/* 流水列表 */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            加载中...
          </div>
        ) : (
          <div className="space-y-0.5">
            {flowItems.map((item, index) => (
              <FlowItem key={index} {...item} />
            ))}
          </div>
        )}
      </div>

      {/* 总毛利汇总 */}
      <div className="flex-shrink-0 pt-2 mt-2 border-t border-[#333]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              grossProfit >= 0 ? "bg-primary" : "bg-destructive"
            )} />
            <span className="text-xs text-[#9CA3AF]">总毛利</span>
          </div>
          <span className={cn(
            "font-mono text-lg font-extrabold tabular-nums",
            grossProfit >= 0 ? "text-primary" : "text-destructive"
          )}>
            {loading ? "--" : (
              grossProfit >= 10000 
                ? `¥${(grossProfit / 10000).toFixed(2)}万`
                : `¥${grossProfit.toLocaleString()}`
            )}
          </span>
        </div>
        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
          <span>毛利率 <span className="font-mono text-foreground">{loading ? "--" : `${((grossProfit / orderRevenue) * 100).toFixed(1)}%`}</span></span>
        </div>
      </div>
    </div>
  );
}
