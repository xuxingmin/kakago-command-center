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
    <div
      className={cn(
        "bg-[#121212] border border-[#333333] rounded-lg p-2.5 transition-all duration-300",
        "hover:border-primary/50 group cursor-default"
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-[#9CA3AF] truncate">{title}</span>
        <Icon className="w-3 h-3 text-[#9CA3AF] flex-shrink-0" />
      </div>
      <div className="font-mono text-lg font-extrabold text-white tabular-nums leading-tight">
        {value}
      </div>
      {(subValue || trend !== undefined) && (
        <div className="flex items-center gap-1 mt-0.5">
          {trend !== undefined && (
            <>
              {trend >= 0 ? (
                <TrendingUp className="w-2.5 h-2.5 text-success" />
              ) : (
                <TrendingDown className="w-2.5 h-2.5 text-destructive" />
              )}
              <span className={cn("text-[10px] font-mono tabular-nums", trend >= 0 ? "text-success" : "text-destructive")}>
                {trend >= 0 ? "+" : ""}{trend}%
              </span>
            </>
          )}
          {subValue && <span className="text-[10px] text-[#9CA3AF] truncate">{subValue}</span>}
        </div>
      )}
    </div>
  );
}

function MerchantCard({ activeCount, totalCount }: { activeCount: number; totalCount: number }) {
  const [displayActive, setDisplayActive] = useState(0);
  const [displayTotal, setDisplayTotal] = useState(0);

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
        "bg-[#121212] border border-[#333333] rounded-lg p-2.5 transition-all duration-300",
        "hover:border-primary/50 group cursor-default"
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-[#9CA3AF]">营业商户</span>
        <Store className="w-3 h-3 text-[#9CA3AF]" />
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="font-mono text-lg font-extrabold text-white tabular-nums">{displayActive}</span>
        <span className="font-mono text-sm text-[#9CA3AF] tabular-nums">/{displayTotal}</span>
      </div>
      <span className="text-[10px] text-[#9CA3AF] mt-0.5">在线/注册</span>
    </div>
  );
}

// SKU 占比 - 从数据库读取10个产品
function SKUCard() {
  const [skuData, setSkuData] = useState<{ name: string; value: number; color: string }[]>([]);

  const colors = [
    "bg-orange-500", "bg-cyan-500", "bg-amber-500", "bg-blue-500", "bg-purple-500",
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
        // 模拟占比分布
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
    <div
      className={cn(
        "bg-[#121212] border border-[#333333] rounded-lg p-2.5 transition-all duration-300",
        "hover:border-primary/50 group cursor-default col-span-3"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-[#9CA3AF]">SKU 占比</span>
        <Package className="w-3 h-3 text-[#9CA3AF]" />
      </div>
      <div className="grid grid-cols-5 gap-x-3 gap-y-1.5">
        {skuData.map((item) => (
          <div key={item.name} className="space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#9CA3AF] truncate">{item.name}</span>
              <span className="font-mono text-[10px] font-bold text-white tabular-nums">{item.value}%</span>
            </div>
            <div className="h-1 bg-[#333333] rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all duration-500", item.color)}
                style={{ width: `${item.value * 4}%` }}
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
        "bg-[#121212] border border-[#333333] rounded-lg p-2.5 transition-all duration-300",
        "hover:border-primary/50 group cursor-default"
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-[#9CA3AF]">今日复购</span>
        <Users className="w-3 h-3 text-[#9CA3AF]" />
      </div>
      <div className="font-mono text-lg font-extrabold text-white tabular-nums leading-tight">
        48.2%
      </div>
      <span className="text-[10px] text-[#9CA3AF]">老用户占比</span>
    </div>
  );
}

export function KPIGrid() {
  const { activeCount, totalCount } = useStores();
  const { todayCount, todayRevenue, revenueTrend, countTrend } = useOrderStats();

  // TODO: 接入真实用户数据
  const totalUsers = 86432;
  const userGrowth = 156;
  const userGrowthTrend = 12.8;

  return (
    <div className="grid grid-cols-8 gap-2">
      <MerchantCard activeCount={activeCount} totalCount={totalCount} />
      <KPICard
        title="今日营收"
        value={`¥${todayRevenue.toLocaleString()}`}
        subValue="较昨日同时段"
        trend={revenueTrend}
        icon={DollarSign}
      />
      <KPICard
        title="今日出杯"
        value={todayCount.toLocaleString()}
        subValue="较昨日同时段"
        trend={countTrend}
        icon={Coffee}
      />
      <RepurchaseCard />
      <KPICard
        title="用户增长"
        value={`+${userGrowth}`}
        subValue={`总用户 ${totalUsers.toLocaleString()}`}
        icon={UserPlus}
      />
      <SKUCard />
    </div>
  );
}
