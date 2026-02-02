import { ArrowUpRight, Package, Store, Truck, Cpu, Ticket } from "lucide-react";
import { useFinanceSummary } from "@/hooks/use-finance";
import { cn } from "@/lib/utils";

interface PayableItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  percentage: number;
}

function PayableItem({ icon, label, value, percentage }: PayableItemProps) {
  const formatValue = (v: number) => {
    if (v >= 10000) {
      return `¥${(v / 10000).toFixed(1)}万`;
    }
    return `¥${v.toLocaleString()}`;
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-[#1a1a1a] rounded-lg">
      <div className="w-7 h-7 rounded bg-destructive/10 flex items-center justify-center text-destructive">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground truncate">{label}</span>
          <span className="font-mono text-xs font-bold text-destructive tabular-nums">
            {formatValue(value)}
          </span>
        </div>
        <div className="h-1 bg-[#333] rounded-full mt-1 overflow-hidden">
          <div 
            className="h-full bg-destructive/60 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function PayablesPanel() {
  const { data, loading } = useFinanceSummary();

  const orderRevenue = data.totalRevenue;
  const materialCost = data.materialCost;
  const storeShare = data.pendingSettlement;
  const shippingCost = orderRevenue * 0.03;
  const apiCost = orderRevenue * 0.01;
  const couponCost = data.couponCost;

  const totalPayable = materialCost + storeShare + shippingCost + apiCost + couponCost;

  const payables = [
    { icon: <Package className="w-3.5 h-3.5" />, label: "物料", value: materialCost, percentage: (materialCost / totalPayable) * 100 },
    { icon: <Store className="w-3.5 h-3.5" />, label: "门店分成", value: storeShare, percentage: (storeShare / totalPayable) * 100 },
    { icon: <Truck className="w-3.5 h-3.5" />, label: "运费", value: shippingCost, percentage: (shippingCost / totalPayable) * 100 },
    { icon: <Cpu className="w-3.5 h-3.5" />, label: "API调用费", value: apiCost, percentage: (apiCost / totalPayable) * 100 },
    { icon: <Ticket className="w-3.5 h-3.5" />, label: "投券费", value: couponCost, percentage: (couponCost / totalPayable) * 100 },
  ];

  const formatValue = (v: number) => {
    if (v >= 10000) {
      return `¥${(v / 10000).toFixed(2)}万`;
    }
    return `¥${v.toLocaleString()}`;
  };

  return (
    <div className="bg-card border border-secondary rounded-lg p-3 h-full flex flex-col">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-destructive rounded-full" />
          <span className="text-sm font-medium">应付款项</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ArrowUpRight className="w-3.5 h-3.5 text-destructive" />
          <span className="font-mono text-sm font-bold text-destructive tabular-nums">
            {loading ? "--" : formatValue(totalPayable)}
          </span>
        </div>
      </div>

      {/* 应付款项列表 */}
      <div className="flex-1 grid grid-cols-5 gap-2">
        {loading ? (
          <div className="col-span-5 flex items-center justify-center text-muted-foreground text-sm">
            加载中...
          </div>
        ) : (
          payables.map((item, index) => (
            <PayableItem key={index} {...item} />
          ))
        )}
      </div>
    </div>
  );
}
