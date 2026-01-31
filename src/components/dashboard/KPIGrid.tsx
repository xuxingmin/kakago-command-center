import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Coffee, DollarSign, Users, Store, UserPlus, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStores, useOrderStats } from "@/hooks/use-stores";

// SKU 占比数据 - 6种SKU with distinct colors
const skuData = [
  { name: "热美", value: 18, color: "bg-orange-500" },
  { name: "冰美", value: 17, color: "bg-cyan-500" },
  { name: "热拿", value: 22, color: "bg-amber-500" },
  { name: "冰拿", value: 20, color: "bg-blue-500" },
  { name: "卡布", value: 12, color: "bg-purple-500" },
  { name: "澳白", value: 11, color: "bg-emerald-500" },
];

interface KPICardProps {
  title: string;
  value: string;
  subValue?: string;
  trend?: number;
  icon: React.ElementType;
}

function KPICard({ title, value, subValue, trend, icon: Icon }: KPICardProps) {
  return (
    <div
      className={cn(
        "bg-[#121212] border border-[#333333] rounded-lg p-3 transition-all duration-300",
        "hover:border-primary/50 group cursor-default"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[#9CA3AF]">{title}</span>
        <Icon className="w-3.5 h-3.5 text-[#9CA3AF]" />
      </div>
      <div className="font-mono text-xl font-extrabold text-white tabular-nums">
        {value}
      </div>
      {(subValue || trend !== undefined) && (
        <div className="flex items-center gap-1 mt-1">
          {trend !== undefined && (
            <>
              {trend >= 0 ? (
                <TrendingUp className="w-3 h-3 text-success" />
              ) : (
                <TrendingDown className="w-3 h-3 text-destructive" />
              )}
              <span className={cn("text-xs font-mono tabular-nums", trend >= 0 ? "text-success" : "text-destructive")}>
                {trend >= 0 ? "+" : ""}{trend}%
              </span>
            </>
          )}
          {subValue && <span className="text-xs text-[#9CA3AF]">{subValue}</span>}
        </div>
      )}
    </div>
  );
}

function MerchantCard({ activeCount, totalCount }: { activeCount: number; totalCount: number }) {
  const [displayActive, setDisplayActive] = useState(0);
  const [displayTotal, setDisplayTotal] = useState(0);

  // 滚动动画
  useEffect(() => {
    const duration = 1000;
    const steps = 20;
    const stepTime = duration / steps;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      setDisplayActive(Math.round((activeCount * currentStep) / steps));
      setDisplayTotal(Math.round((totalCount * currentStep) / steps));
      
      if (currentStep >= steps) clearInterval(timer);
    }, stepTime);

    return () => clearInterval(timer);
  }, [activeCount, totalCount]);

  return (
    <div
      className={cn(
        "bg-[#121212] border border-[#333333] rounded-lg p-3 transition-all duration-300",
        "hover:border-primary/50 group cursor-default"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[#9CA3AF]">营业商户</span>
        <Store className="w-3.5 h-3.5 text-[#9CA3AF]" />
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="font-mono text-xl font-extrabold text-white tabular-nums">{displayActive}</span>
        <span className="font-mono text-lg text-[#9CA3AF] tabular-nums">/{displayTotal}</span>
      </div>
      <span className="text-xs text-[#9CA3AF] mt-1">在线/注册</span>
    </div>
  );
}

function SKUCard() {
  return (
    <div
      className={cn(
        "bg-[#121212] border border-[#333333] rounded-lg p-3 transition-all duration-300",
        "hover:border-primary/50 group cursor-default col-span-2"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[#9CA3AF]">SKU 占比</span>
        <Package className="w-3.5 h-3.5 text-[#9CA3AF]" />
      </div>
      <div className="grid grid-cols-3 gap-x-4 gap-y-2">
        {skuData.map((item) => (
          <div key={item.name} className="space-y-1">
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

function RepurchaseCard() {
  return (
    <div
      className={cn(
        "bg-[#121212] border border-[#333333] rounded-lg p-3 transition-all duration-300",
        "hover:border-primary/50 group cursor-default"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[#9CA3AF]">今日复购</span>
        <Users className="w-3.5 h-3.5 text-[#9CA3AF]" />
      </div>
      <div className="font-mono text-xl font-extrabold text-white tabular-nums">
        48.2%
      </div>
      <span className="text-xs text-[#9CA3AF]">老用户占比</span>
    </div>
  );
}

export function KPIGrid() {
  const { activeCount, totalCount } = useStores();
  const { todayCount, todayRevenue } = useOrderStats();

  return (
    <div className="grid grid-cols-7 gap-3">
      {/* 1. 营业商户 - 使用真实数据 */}
      <MerchantCard activeCount={activeCount} totalCount={totalCount} />
      {/* 2. 今日营收 - 使用真实订单数据 */}
      <KPICard
        title="今日营收"
        value={`¥${todayRevenue.toLocaleString()}`}
        trend={todayRevenue > 0 ? 12.5 : 0}
        icon={DollarSign}
      />
      {/* 3. 今日出杯 - 使用真实订单数据 */}
      <KPICard
        title="今日出杯"
        value={todayCount.toLocaleString()}
        subValue="杯"
        trend={todayCount > 0 ? 8.3 : 0}
        icon={Coffee}
      />
      {/* 4. 今日复购 */}
      <RepurchaseCard />
      {/* 5. 用户增长 */}
      <KPICard
        title="用户增长"
        value="+156"
        trend={23.4}
        icon={UserPlus}
      />
      {/* 6. SKU占比 - 占2列 */}
      <SKUCard />
    </div>
  );
}
