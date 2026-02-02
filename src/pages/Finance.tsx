import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinanceKPICards } from "@/components/finance/FinanceKPICards";
import { CashflowChart } from "@/components/finance/CashflowChart";
import { RevenueTrendChart } from "@/components/finance/RevenueTrendChart";
import { CostBreakdown } from "@/components/finance/CostBreakdown";
import { ReceivablePayable } from "@/components/finance/ReceivablePayable";
import { SettlementFilters } from "@/components/finance/SettlementFilters";
import { SettlementSummary } from "@/components/finance/SettlementSummary";
import { SettlementTable, Settlement } from "@/components/finance/SettlementTable";
import {
  useFinanceSummary,
  useCashflowData,
  useRevenueTrend,
  useCostBreakdown,
  useReceivablePayable,
  useSettlements,
} from "@/hooks/use-finance";
import { toast } from "sonner";

export default function Finance() {
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Finance dashboard data
  const { data: financeSummary, loading: financeLoading } = useFinanceSummary();
  const cashflowData = useCashflowData();
  const revenueTrend = useRevenueTrend();
  const costBreakdown = useCostBreakdown();
  const receivablePayable = useReceivablePayable();

  // Settlement filters
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
  const [periodStart, setPeriodStart] = useState(lastWeek.start);
  const [periodEnd, setPeriodEnd] = useState(lastWeek.end);
  const [statusFilter, setStatusFilter] = useState("all");
  const [generating, setGenerating] = useState(false);

  const { settlements, summary: settlementSummary, loading: settlementsLoading } = useSettlements(
    periodStart,
    periodEnd,
    statusFilter
  );

  const handleGenerateSettlements = async () => {
    setGenerating(true);
    try {
      // In production, call Edge Function to generate settlements
      toast.success("结算单生成成功");
    } catch (error) {
      toast.error("生成结算单失败");
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = () => {
    toast.info("导出功能开发中...");
  };

  const handleViewDetail = (settlement: Settlement) => {
    toast.info(`查看 ${settlement.store_name} 结算详情`);
  };

  const handleConfirm = (settlement: Settlement) => {
    toast.success(`已确认 ${settlement.store_name} 结算单`);
  };

  const handlePay = (settlement: Settlement) => {
    toast.success(`已支付 ${settlement.store_name} 结算款项`);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="dashboard">财务看板</TabsTrigger>
          <TabsTrigger value="settlement">门店结算</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 mt-6">
          {/* KPI Cards */}
          <FinanceKPICards data={financeSummary} loading={financeLoading} />

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CashflowChart data={cashflowData} />
            <RevenueTrendChart data={revenueTrend} />
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CostBreakdown data={costBreakdown} />
            <ReceivablePayable data={receivablePayable} />
          </div>
        </TabsContent>

        <TabsContent value="settlement" className="space-y-6 mt-6">
          {/* Filters */}
          <SettlementFilters
            periodStart={periodStart}
            periodEnd={periodEnd}
            status={statusFilter}
            onPeriodStartChange={setPeriodStart}
            onPeriodEndChange={setPeriodEnd}
            onStatusChange={setStatusFilter}
            onGenerate={handleGenerateSettlements}
            onExport={handleExport}
            loading={generating}
          />

          {/* Summary */}
          <SettlementSummary data={settlementSummary} />

          {/* Table */}
          <SettlementTable
            settlements={settlements}
            onViewDetail={handleViewDetail}
            onConfirm={handleConfirm}
            onPay={handlePay}
            loading={settlementsLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
