import { TrendingUp, TrendingDown, Coffee, DollarSign, Users, Store, UserPlus, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { PieChart as RechartsP, Pie, Cell, ResponsiveContainer } from "recharts";

// SKU 占比数据
const skuData = [
  { name: "美式", value: 35, color: "hsl(270, 100%, 50%)" },
  { name: "拿铁", value: 28, color: "hsl(270, 70%, 60%)" },
  { name: "卡布", value: 15, color: "hsl(270, 50%, 40%)" },
  { name: "其他", value: 22, color: "hsl(240, 3%, 30%)" },
];

interface KPICardProps {
  title: string;
  value: string;
  subValue?: string;
  trend?: number;
  icon: React.ElementType;
  highlight?: boolean;
}

function KPICard({ title, value, subValue, trend, icon: Icon, highlight }: KPICardProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-3 transition-all duration-300",
        "hover:border-primary/50 hover:shadow-[0_0_20px_hsl(270,100%,50%,0.15)] hover:scale-[1.02]",
        "group cursor-default"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{title}</span>
        <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div className={cn("numeric text-xl font-semibold", highlight && "text-primary")}>
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
              <span className={cn("text-xs numeric", trend >= 0 ? "text-success" : "text-destructive")}>
                {trend >= 0 ? "+" : ""}{trend}%
              </span>
            </>
          )}
          {subValue && <span className="text-xs text-muted-foreground">{subValue}</span>}
        </div>
      )}
    </div>
  );
}

function SKUDonut() {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-3 transition-all duration-300",
        "hover:border-primary/50 hover:shadow-[0_0_20px_hsl(270,100%,50%,0.15)] hover:scale-[1.02]",
        "group cursor-default"
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">SKU 占比</span>
        <PieChart className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-12 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsP>
              <Pie
                data={skuData}
                cx="50%"
                cy="50%"
                innerRadius={14}
                outerRadius={22}
                dataKey="value"
                strokeWidth={0}
              >
                {skuData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </RechartsP>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-0.5">
          {skuData.slice(0, 2).map((item) => (
            <div key={item.name} className="flex items-center gap-1.5 text-xs">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-muted-foreground">{item.name}</span>
              <span className="numeric text-foreground ml-auto">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RetentionCard() {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-3 transition-all duration-300",
        "hover:border-primary/50 hover:shadow-[0_0_20px_hsl(270,100%,50%,0.15)] hover:scale-[1.02]",
        "group cursor-default"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">留存/复购</span>
        <Users className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">商家留存</span>
          <span className="numeric text-sm text-primary">92.4%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">用户复购</span>
          <span className="numeric text-sm text-foreground">48.2%</span>
        </div>
      </div>
    </div>
  );
}

export function KPIGrid() {
  // 模拟数据计算
  const totalRevenue = 128450;
  const merchantShare = totalRevenue * 0.5;
  const deliveryFee = 2.1 * 12405; // 2.1元 × 出杯量
  const grossProfit = totalRevenue - merchantShare - deliveryFee;

  return (
    <div className="grid grid-cols-7 gap-3">
      <KPICard
        title="总收入"
        value={`¥${totalRevenue.toLocaleString()}`}
        trend={12.5}
        icon={DollarSign}
        highlight
      />
      <KPICard
        title="出杯量"
        value="12,405"
        subValue="杯"
        trend={8.3}
        icon={Coffee}
      />
      <SKUDonut />
      <KPICard
        title="总毛利"
        value={`¥${Math.round(grossProfit).toLocaleString()}`}
        subValue="扣除分成+运费"
        icon={TrendingUp}
        highlight
      />
      <KPICard
        title="商家数"
        value="42"
        subValue="家在线"
        icon={Store}
      />
      <RetentionCard />
      <KPICard
        title="用户增长"
        value="+156"
        trend={23.4}
        icon={UserPlus}
      />
    </div>
  );
}
