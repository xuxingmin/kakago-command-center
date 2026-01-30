import { TrendingUp, TrendingDown, Coffee, DollarSign, Users, Store, UserPlus, Package } from "lucide-react";
import { cn } from "@/lib/utils";

// SKU 占比数据 - 6种SKU
const skuData = [
  { name: "热美", value: 18 },
  { name: "冰美", value: 17 },
  { name: "热拿", value: 22 },
  { name: "冰拿", value: 20 },
  { name: "卡布", value: 12 },
  { name: "澳白", value: 11 },
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
      <div className="grid grid-cols-3 gap-x-4 gap-y-1">
        {skuData.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <span className="text-xs text-[#9CA3AF]">{item.name}</span>
            <span className="font-mono text-sm font-bold text-white tabular-nums">{item.value}%</span>
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
  const todayRevenue = 128450;

  return (
    <div className="grid grid-cols-7 gap-3">
      {/* 1. 营业商户 */}
      <KPICard
        title="营业商户"
        value="42"
        subValue="家在线"
        icon={Store}
      />
      {/* 2. 今日营收 */}
      <KPICard
        title="今日营收"
        value={`¥${todayRevenue.toLocaleString()}`}
        trend={12.5}
        icon={DollarSign}
      />
      {/* 3. 今日出杯 */}
      <KPICard
        title="今日出杯"
        value="12,405"
        subValue="杯"
        trend={8.3}
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
