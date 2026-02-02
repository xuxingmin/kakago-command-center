import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Calendar } from "lucide-react";
import { useRevenueTrend } from "@/hooks/use-finance";

export function RevenueMiniChart() {
  const data = useRevenueTrend();

  const formatValue = (value: number) => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(1)}万`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="bg-card border border-secondary rounded-lg p-4 h-full flex flex-col">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-success rounded-full" />
          <span className="text-sm font-medium">营收趋势</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>近7日</span>
        </div>
      </div>

      {/* 图表 */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 76%, 45%)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(142, 76%, 45%)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              tick={{ fill: "#9CA3AF", fontSize: 10 }}
              axisLine={{ stroke: "#333" }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: "#9CA3AF", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatValue}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#121212",
                border: "1px solid #333",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#9CA3AF" }}
              formatter={(value: number, name: string) => [
                `¥${formatValue(value)}`,
                name === "revenue" ? "营收" : "成本"
              ]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(142, 76%, 45%)"
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
            <Area
              type="monotone"
              dataKey="cost"
              stroke="hsl(0, 72%, 51%)"
              strokeWidth={2}
              fill="url(#costGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 图例 */}
      <div className="flex items-center justify-center gap-6 pt-2 flex-shrink-0 border-t border-[#222] mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-xs text-muted-foreground">营收</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-destructive" />
          <span className="text-xs text-muted-foreground">成本</span>
        </div>
      </div>
    </div>
  );
}
