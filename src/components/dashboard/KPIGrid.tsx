import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Coffee, DollarSign, Users, Store, UserPlus, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStores, useOrderStats } from "@/hooks/use-stores";
import { supabase } from "@/integrations/supabase/client";

interface KPICardProps {
  title: string;
  value: string;
  subValue?: string;
  trend?: number;
  icon: React.ElementType;
}

function KPICard({ title, value, subValue, trend, icon: Icon }: KPICardProps) {
  return (
    <div className="bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg p-2.5 hover:border-[#333] transition-colors duration-200">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-[#6B7280] truncate">{title}</span>
        <Icon className="w-3 h-3 text-[#555] flex-shrink-0" />
      </div>
      <div className="font-mono text-lg font-extrabold text-[#E5E5E5] tabular-nums leading-tight">
        {value}
      </div>
      {(subValue || trend !== undefined) && (
        <div className="flex items-center gap-1 mt-0.5">
          {trend !== undefined && (
            <>
              {trend >= 0 ? (
                <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-2.5 h-2.5 text-red-500" />
              )}
              <span className={cn("text-[10px] font-mono tabular-nums", trend >= 0 ? "text-emerald-500" : "text-red-500")}>
                {trend >= 0 ? "+" : ""}{trend}%
              </span>
            </>
          )}
          {subValue && <span className="text-[10px] text-[#555] truncate">{subValue}</span>}
        </div>
      )}
    </div>
  );
}

function MerchantCard({ activeCount, totalCount }: { activeCount: number; totalCount: number }) {
  const [displayActive, setDisplayActive] = useState(0);
  const [displayTotal, setDisplayTotal] = useState(0);

  useEffect(() => {
    const steps = 20;
    const stepTime = 50;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setDisplayActive(Math.round((activeCount * step) / steps));
      setDisplayTotal(Math.round((totalCount * step) / steps));
      if (step >= steps) clearInterval(timer);
    }, stepTime);
    return () => clearInterval(timer);
  }, [activeCount, totalCount]);

  return (
    <div className="bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg p-2.5 hover:border-[#333] transition-colors duration-200">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-[#6B7280]">营业商户</span>
        <Store className="w-3 h-3 text-[#555]" />
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="font-mono text-lg font-extrabold text-[#E5E5E5] tabular-nums">{displayActive}</span>
        <span className="font-mono text-sm text-[#555] tabular-nums">/{displayTotal}</span>
      </div>
      <span className="text-[10px] text-[#555]">在线/注册</span>
    </div>
  );
}

function SKUCard() {
  const [skuData, setSkuData] = useState<{ name: string; value: number; color: string }[]>([]);

  const colors = [
    "bg-orange-500", "bg-cyan-500", "bg-amber-500", "bg-blue-500", "bg-violet-500",
    "bg-emerald-500", "bg-rose-500", "bg-indigo-500", "bg-teal-500", "bg-pink-500",
  ];

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase
        .from("sku_products")
        .select("name")
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(10);

      if (data && data.length > 0) {
        const baseValues = [14, 13, 12, 11, 10, 9, 8, 8, 8, 7];
        setSkuData(data.map((p, i) => ({
          name: p.name.length > 4 ? p.name.slice(0, 4) : p.name,
          value: baseValues[i] || 7,
          color: colors[i] || "bg-gray-500",
        })));
      }
    }
    fetchProducts();
  }, []);

  return (
    <div className="bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg p-2.5 hover:border-[#333] transition-colors duration-200 col-span-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-[#6B7280]">SKU 占比</span>
        <Package className="w-3 h-3 text-[#555]" />
      </div>
      <div className="grid grid-cols-5 gap-x-3 gap-y-1">
        {skuData.map((item) => (
          <div key={item.name} className="space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-[#6B7280] truncate">{item.name}</span>
              <span className="font-mono text-[9px] font-bold text-[#E5E5E5] tabular-nums">{item.value}%</span>
            </div>
            <div className="h-1 bg-[#1E1E1E] rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.value * 4}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RepurchaseCard() {
  return (
    <div className="bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg p-2.5 hover:border-[#333] transition-colors duration-200">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-[#6B7280]">今日复购</span>
        <Users className="w-3 h-3 text-[#555]" />
      </div>
      <div className="font-mono text-lg font-extrabold text-[#E5E5E5] tabular-nums leading-tight">48.2%</div>
      <span className="text-[10px] text-[#555]">老用户占比</span>
    </div>
  );
}

export function KPIGrid() {
  const { activeCount, totalCount } = useStores();
  const { todayCount, todayRevenue, revenueTrend, countTrend } = useOrderStats();

  const totalUsers = 86432;
  const userGrowth = 156;

  return (
    <div className="grid grid-cols-8 gap-2">
      <MerchantCard activeCount={activeCount} totalCount={totalCount} />
      <KPICard title="今日营收" value={`¥${todayRevenue.toLocaleString()}`} subValue="较昨日同时段" trend={revenueTrend} icon={DollarSign} />
      <KPICard title="今日出杯" value={todayCount.toLocaleString()} subValue="较昨日同时段" trend={countTrend} icon={Coffee} />
      <RepurchaseCard />
      <KPICard title="用户增长" value={`+${userGrowth}`} subValue={`总用户 ${totalUsers.toLocaleString()}`} icon={UserPlus} />
      <SKUCard />
    </div>
  );
}
