import { Vault } from "lucide-react";
import { useFinanceSummary } from "@/hooks/use-finance";
import { cn } from "@/lib/utils";

export function FundPoolPanel() {
  const { data, loading } = useFinanceSummary();

  // 沉淀资金 = 总营收 - 已支付给门店的 - 已支付物料等
  // 这里用简化计算：总营收的一部分作为沉淀
  const fundPool = data.totalRevenue * 0.15; // 约15%作为沉淀资金

  const formatValue = (value: number) => {
    if (value >= 10000) {
      return `¥${(value / 10000).toFixed(2)}万`;
    }
    return `¥${value.toLocaleString()}`;
  };

  return (
    <div className="bg-card border border-secondary rounded-lg p-3 h-full flex flex-col">
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-2 flex-shrink-0">
        <div className="w-1 h-4 bg-primary rounded-full" />
        <span className="text-xs font-medium">账户沉淀</span>
      </div>

      {/* 主数值 */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
          <Vault className="w-5 h-5 text-primary" />
        </div>
        <span className={cn(
          "font-mono text-xl font-extrabold tabular-nums text-primary"
        )}>
          {loading ? "--" : formatValue(fundPool)}
        </span>
        <span className="text-xs text-muted-foreground mt-1">当前沉淀资金</span>
      </div>

      {/* 底部提示 */}
      <div className="flex-shrink-0 pt-2 border-t border-[#222]">
        <div className="text-xs text-muted-foreground text-center">
          占营收 <span className="text-foreground font-mono">15%</span>
        </div>
      </div>
    </div>
  );
}
