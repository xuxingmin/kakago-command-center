import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Package, Percent, CreditCard, Ticket, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinanceSummary } from "@/hooks/use-finance";

interface KPIItemProps {
  title: string;
  value: string;
  subValue?: string;
  trend?: number;
  icon: React.ElementType;
  highlight?: boolean;
}

function KPIItem({ title, value, subValue, trend, icon: Icon, highlight }: KPIItemProps) {
  return (
    <div
      className={cn(
        "bg-[#121212] border border-[#333333] rounded-lg p-3 transition-all duration-300",
        "hover:border-primary/50 group cursor-default",
        highlight && "border-primary/30 bg-primary/5"
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[#9CA3AF]">{title}</span>
        <Icon className="w-3.5 h-3.5 text-[#9CA3AF]" />
      </div>
      <div className="font-mono text-lg font-extrabold text-white tabular-nums">
        {value}
      </div>
      {(subValue || trend !== undefined) && (
        <div className="flex items-center gap-1 mt-0.5">
          {trend !== undefined && (
            <>
              {trend >= 0 ? (
                <TrendingUp className="w-3 h-3 text-success" />
              ) : (
                <TrendingDown className="w-3 h-3 text-destructive" />
              )}
              <span className={cn("text-xs font-mono tabular-nums", trend >= 0 ? "text-success" : "text-destructive")}>
                {trend >= 0 ? "+" : ""}{trend.toFixed(1)}%
              </span>
            </>
          )}
          {subValue && <span className="text-xs text-[#9CA3AF]">{subValue}</span>}
        </div>
      )}
    </div>
  );
}

function GrossMarginCard({ value, loading }: { value: number; loading: boolean }) {
  const percentage = loading ? 0 : value * 100;
  
  return (
    <div
      className={cn(
        "bg-[#121212] border border-[#333333] rounded-lg p-3 transition-all duration-300",
        "hover:border-primary/50 group cursor-default"
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[#9CA3AF]">毛利率</span>
        <Percent className="w-3.5 h-3.5 text-[#9CA3AF]" />
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-lg font-extrabold text-white tabular-nums">
          {loading ? "--" : `${percentage.toFixed(1)}%`}
        </span>
      </div>
      {/* 进度条 */}
      <div className="h-1.5 bg-[#333333] rounded-full overflow-hidden mt-2">
        <div 
          className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

function CostBreakdownMini() {
  const items = [
    { name: "物料", value: 60, color: "bg-orange-500" },
    { name: "结算", value: 25, color: "bg-blue-500" },
    { name: "券", value: 15, color: "bg-purple-500" },
  ];
  
  return (
    <div
      className={cn(
        "bg-[#121212] border border-[#333333] rounded-lg p-3 transition-all duration-300",
        "hover:border-primary/50 group cursor-default col-span-2"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[#9CA3AF]">成本构成</span>
        <Package className="w-3.5 h-3.5 text-[#9CA3AF]" />
      </div>
      <div className="flex gap-4">
        {items.map((item) => (
          <div key={item.name} className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9CA3AF]">{item.name}</span>
              <span className="font-mono text-xs font-bold text-white tabular-nums">{item.value}%</span>
            </div>
            <div className="h-1.5 bg-[#333333] rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all duration-500", item.color)}
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FinanceKPIRow() {
  const { data, loading } = useFinanceSummary();

  const formatCurrency = (value: number) => {
    if (value >= 10000) {
      return `¥${(value / 10000).toFixed(1)}万`;
    }
    return `¥${value.toLocaleString()}`;
  };

  return (
    <div className="grid grid-cols-7 gap-3">
      {/* 1. 总营收 */}
      <KPIItem
        title="总营收"
        value={loading ? "--" : formatCurrency(data.totalRevenue)}
        trend={12.5}
        icon={DollarSign}
        highlight
      />
      {/* 2. 今日营收 */}
      <KPIItem
        title="今日营收"
        value={loading ? "--" : formatCurrency(data.todayRevenue)}
        trend={8.3}
        icon={Coffee}
      />
      {/* 3. 物料成本 */}
      <KPIItem
        title="物料成本"
        value={loading ? "--" : formatCurrency(data.materialCost)}
        trend={-3.2}
        icon={Package}
      />
      {/* 4. 毛利率 */}
      <GrossMarginCard value={data.grossMargin} loading={loading} />
      {/* 5. 待结算 */}
      <KPIItem
        title="待结算"
        value={loading ? "--" : formatCurrency(data.pendingSettlement)}
        subValue="本周"
        icon={CreditCard}
      />
      {/* 6-7. 成本构成 - 占2列 */}
      <CostBreakdownMini />
    </div>
  );
}
