import { ArrowDownLeft, ArrowUpRight, Wallet, Building2, Users, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReceivablePayable } from "@/hooks/use-finance";

export function ARAPPanel() {
  const data = useReceivablePayable();

  const formatCurrency = (value: number) => {
    if (value >= 10000) {
      return `¥${(value / 10000).toFixed(2)}万`;
    }
    return `¥${value.toLocaleString()}`;
  };

  const netAmount = data.receivable - data.payable;

  return (
    <div className="bg-card border border-secondary rounded-lg p-3 h-full">
      <div className="flex h-full gap-4">
        {/* 应收区域 */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownLeft className="w-4 h-4 text-success" />
            <span className="text-xs text-[#9CA3AF]">应收款项</span>
            <span className="ml-auto font-mono text-sm font-bold text-success tabular-nums">
              {formatCurrency(data.receivable)}
            </span>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-2">
            {data.receivableItems.map((item, index) => (
              <div 
                key={index}
                className="bg-[#121212] border border-[#333] rounded px-2 py-1.5 flex items-center gap-2"
              >
                <Users className="w-3 h-3 text-success/60" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-[#9CA3AF] truncate">{item.name}</div>
                  <div className="font-mono text-xs font-bold text-white tabular-nums">
                    {formatCurrency(item.amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 分隔线 + 净额 */}
        <div className="flex flex-col items-center justify-center w-[100px]">
          <div className="h-full w-px bg-[#333]" />
          <div className="py-2 text-center">
            <div className="text-[10px] text-[#9CA3AF] mb-1">净额</div>
            <div className={cn(
              "font-mono text-base font-extrabold tabular-nums",
              netAmount >= 0 ? "text-success" : "text-destructive"
            )}>
              {netAmount >= 0 ? "+" : ""}{formatCurrency(netAmount)}
            </div>
          </div>
          <div className="h-full w-px bg-[#333]" />
        </div>

        {/* 应付区域 */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="w-4 h-4 text-destructive" />
            <span className="text-xs text-[#9CA3AF]">应付款项</span>
            <span className="ml-auto font-mono text-sm font-bold text-destructive tabular-nums">
              {formatCurrency(data.payable)}
            </span>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-2">
            {data.payableItems.map((item, index) => (
              <div 
                key={index}
                className="bg-[#121212] border border-[#333] rounded px-2 py-1.5 flex items-center gap-2"
              >
                {index === 0 ? (
                  <Building2 className="w-3 h-3 text-destructive/60" />
                ) : (
                  <Package className="w-3 h-3 text-destructive/60" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-[#9CA3AF] truncate">{item.name}</div>
                  <div className="font-mono text-xs font-bold text-white tabular-nums">
                    {formatCurrency(item.amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
