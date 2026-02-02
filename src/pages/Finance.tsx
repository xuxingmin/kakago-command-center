import { useState } from "react";
import { Wallet, ArrowDownLeft, ArrowUpRight, TrendingUp, FileText, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FinanceKPIRow } from "@/components/finance/FinanceKPIRow";
import { FundFlowPanel } from "@/components/finance/FundFlowPanel";
import { RevenueMiniChart } from "@/components/finance/RevenueMiniChart";
import { SettlementStream } from "@/components/finance/SettlementStream";
import { ARAPPanel } from "@/components/finance/ARAPPanel";

type TabType = "overview" | "settlement";

export default function Finance() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  return (
    <div className="h-full flex flex-col gap-2">
      {/* 顶部 Tab 切换 */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-all",
            activeTab === "overview"
              ? "bg-primary/20 text-primary border border-primary/30"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          <Wallet className="w-4 h-4" />
          <span>财务总览</span>
        </button>
        <button
          onClick={() => setActiveTab("settlement")}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-all",
            activeTab === "settlement"
              ? "bg-primary/20 text-primary border border-primary/30"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          <Building2 className="w-4 h-4" />
          <span>门店结算</span>
        </button>
        
        {/* 右侧状态指示 */}
        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ArrowDownLeft className="w-3 h-3 text-success" />
            <span>进项</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowUpRight className="w-3 h-3 text-destructive" />
            <span>出项</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
        </div>
      </div>

      {/* KPI 指标行 */}
      <div className="flex-shrink-0">
        <FinanceKPIRow />
      </div>

      {activeTab === "overview" ? (
        <>
          {/* 中间行: 资金流 + 趋势图 */}
          <div className="flex gap-2 flex-1 min-h-0">
            <div className="w-[60%] h-full">
              <FundFlowPanel />
            </div>
            <div className="w-[40%] h-full">
              <RevenueMiniChart />
            </div>
          </div>

          {/* 底部行: 应收应付 */}
          <div className="h-[140px] flex-shrink-0">
            <ARAPPanel />
          </div>
        </>
      ) : (
        /* 门店结算视图 */
        <div className="flex-1 min-h-0">
          <SettlementStream />
        </div>
      )}
    </div>
  );
}
