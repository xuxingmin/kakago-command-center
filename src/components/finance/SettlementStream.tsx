import { useState, useRef } from "react";
import { Building2, CheckCircle, Clock, Wallet, FileText, Download, Filter, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettlements } from "@/hooks/use-finance";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "待结算", color: "text-orange-400", bg: "bg-orange-400/10" },
  confirmed: { label: "已确认", color: "text-blue-400", bg: "bg-blue-400/10" },
  paid: { label: "已支付", color: "text-primary", bg: "bg-primary/10" },
  completed: { label: "已完成", color: "text-success", bg: "bg-success/10" },
};

export function SettlementStream() {
  const getLastWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() - dayOfWeek);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6);
    
    return {
      start: startDate.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
    };
  };

  const lastWeek = getLastWeekDates();
  const [periodStart] = useState(lastWeek.start);
  const [periodEnd] = useState(lastWeek.end);
  const [statusFilter, setStatusFilter] = useState("all");

  const { settlements, summary, loading } = useSettlements(periodStart, periodEnd, statusFilter);
  const scrollRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (value: number) => {
    if (value >= 10000) {
      return `¥${(value / 10000).toFixed(2)}万`;
    }
    return `¥${value.toLocaleString()}`;
  };

  const handleExport = () => {
    toast.info("导出功能开发中...");
  };

  return (
    <div className="bg-card border border-secondary rounded-lg p-3 h-full flex flex-col">
      {/* 标题栏 + 筛选 */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">门店结算</span>
          </div>
          
          {/* 周期显示 */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#121212] rounded border border-[#333] text-xs">
            <CalendarDays className="w-3 h-3 text-muted-foreground" />
            <span className="font-mono text-muted-foreground">{periodStart}</span>
            <span className="text-muted-foreground">~</span>
            <span className="font-mono text-muted-foreground">{periodEnd}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 状态筛选 */}
          <div className="flex items-center gap-1">
            {["all", "pending", "confirmed", "paid"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-2 py-1 text-xs rounded transition-all",
                  statusFilter === status
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-muted-foreground hover:bg-secondary"
                )}
              >
                {status === "all" ? "全部" : statusConfig[status]?.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-7 text-xs gap-1"
          >
            <Download className="w-3 h-3" />
            导出
          </Button>
        </div>
      </div>

      {/* 汇总统计 */}
      <div className="flex items-center gap-6 mb-3 py-2 px-3 bg-[#121212] rounded border border-[#333] flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">门店</span>
          <span className="font-mono text-sm font-bold text-white tabular-nums">{summary.totalStores}家</span>
        </div>
        <div className="w-px h-4 bg-[#333]" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">订单总额</span>
          <span className="font-mono text-sm font-bold text-success tabular-nums">{formatCurrency(summary.orderTotal)}</span>
        </div>
        <div className="w-px h-4 bg-[#333]" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">券成本</span>
          <span className="font-mono text-sm font-bold text-orange-400 tabular-nums">{formatCurrency(summary.couponCost)}</span>
        </div>
        <div className="w-px h-4 bg-[#333]" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">平台费</span>
          <span className="font-mono text-sm font-bold text-blue-400 tabular-nums">{formatCurrency(summary.platformFee)}</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">应结总额</span>
          <span className="font-mono text-sm font-extrabold text-primary tabular-nums">{formatCurrency(summary.settlementAmount)}</span>
        </div>
      </div>

      {/* 表头 */}
      <div className="grid grid-cols-8 gap-2 px-2 py-1.5 text-xs text-muted-foreground border-b border-[#333] flex-shrink-0">
        <span>门店</span>
        <span className="text-right">订单数</span>
        <span className="text-right">订单总额</span>
        <span className="text-right">券核销</span>
        <span className="text-right">券成本</span>
        <span className="text-right">平台费</span>
        <span className="text-right">应结金额</span>
        <span className="text-center">状态</span>
      </div>

      {/* 结算列表 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            加载中...
          </div>
        ) : settlements.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            暂无结算数据
          </div>
        ) : (
          settlements.map((settlement, index) => {
            const status = statusConfig[settlement.status] || statusConfig.pending;
            return (
              <div
                key={settlement.id}
                className={cn(
                  "grid grid-cols-8 gap-2 px-2 py-2 text-sm transition-all duration-200",
                  "border-b border-[#222] last:border-0",
                  "hover:bg-primary/5 cursor-pointer",
                  index === 0 && "bg-primary/5"
                )}
              >
                <span className="truncate text-foreground">{settlement.store_name}</span>
                <span className="text-right font-mono tabular-nums text-muted-foreground">
                  {settlement.order_count}
                </span>
                <span className="text-right font-mono tabular-nums text-success">
                  {formatCurrency(settlement.order_total)}
                </span>
                <span className="text-right font-mono tabular-nums text-muted-foreground">
                  {settlement.coupon_count}张
                </span>
                <span className="text-right font-mono tabular-nums text-orange-400">
                  -{formatCurrency(settlement.coupon_cost)}
                </span>
                <span className="text-right font-mono tabular-nums text-blue-400">
                  -{formatCurrency(settlement.platform_fee)}
                </span>
                <span className="text-right font-mono tabular-nums font-bold text-primary">
                  {formatCurrency(settlement.settlement_amount)}
                </span>
                <div className="flex justify-center">
                  <span className={cn("px-2 py-0.5 rounded text-xs", status.bg, status.color)}>
                    {status.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 底部状态 */}
      <div className="flex-shrink-0 pt-2 border-t border-[#333] mt-2">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>结算周期: 每7天 · 平台费率: 5% · 券成本分摊: 50%</span>
          <span className="font-mono">共 {settlements.length} 条记录</span>
        </div>
      </div>
    </div>
  );
}
