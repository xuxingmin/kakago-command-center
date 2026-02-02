import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type TimeRange = "day" | "week" | "month";

// 生成趋势数据
function generateTrendData(range: TimeRange) {
  const data = [];
  const today = new Date();
  
  const points = range === "day" ? 7 : range === "week" ? 8 : 6;
  
  for (let i = points - 1; i >= 0; i--) {
    const date = new Date(today);
    
    let dateStr: string;
    if (range === "day") {
      date.setDate(date.getDate() - i);
      dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    } else if (range === "week") {
      date.setDate(date.getDate() - i * 7);
      dateStr = `W${Math.ceil(date.getDate() / 7)}`;
    } else {
      date.setMonth(date.getMonth() - i);
      dateStr = `${date.getMonth() + 1}月`;
    }
    
    const baseRevenue = range === "day" ? 12000 : range === "week" ? 85000 : 350000;
    const variance = range === "day" ? 5000 : range === "week" ? 20000 : 80000;
    
    const revenue = Math.floor(baseRevenue + Math.random() * variance);
    const storeShare = Math.floor(revenue * (0.35 + Math.random() * 0.1));
    const materialCost = Math.floor(revenue * (0.25 + Math.random() * 0.08));
    const shippingCost = Math.floor(revenue * 0.03);
    const apiCost = Math.floor(revenue * 0.01);
    const couponCost = Math.floor(revenue * (0.02 + Math.random() * 0.02));
    
    data.push({
      date: dateStr,
      实收: revenue,
      门店分成: storeShare,
      物料成本: materialCost,
      运费: shippingCost,
      API调用: apiCost,
      投券成本: couponCost,
    });
  }
  
  return data;
}

const COLORS = {
  实收: "hsl(142, 76%, 45%)",
  门店分成: "hsl(45, 93%, 47%)",
  物料成本: "hsl(0, 72%, 51%)",
  运费: "hsl(200, 80%, 55%)",
  API调用: "hsl(280, 70%, 60%)",
  投券成本: "hsl(320, 70%, 55%)",
};

export function OperationTrendChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>("day");
  const data = useMemo(() => generateTrendData(timeRange), [timeRange]);

  const formatValue = (value: number) => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(1)}万`;
    }
    return value.toLocaleString();
  };

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: "day", label: "日" },
    { value: "week", label: "周" },
    { value: "month", label: "月" },
  ];

  return (
    <div className="bg-card border border-secondary rounded-lg p-3 h-full flex flex-col">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-success rounded-full" />
          <span className="text-sm font-medium">经营趋势</span>
        </div>
        <div className="flex items-center gap-1 bg-[#1a1a1a] rounded p-0.5">
          {timeRangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              className={cn(
                "px-2 py-0.5 text-xs rounded transition-all",
                timeRange === option.value
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 图表 */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <defs>
              {Object.entries(COLORS).map(([key, color]) => (
                <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              ))}
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
                fontSize: "11px",
              }}
              labelStyle={{ color: "#9CA3AF" }}
              formatter={(value: number, name: string) => [
                `¥${formatValue(value)}`,
                name
              ]}
            />
            <Area
              type="monotone"
              dataKey="实收"
              stroke={COLORS.实收}
              strokeWidth={2}
              fill={`url(#gradient-实收)`}
            />
            <Area
              type="monotone"
              dataKey="门店分成"
              stroke={COLORS.门店分成}
              strokeWidth={1.5}
              fill={`url(#gradient-门店分成)`}
            />
            <Area
              type="monotone"
              dataKey="物料成本"
              stroke={COLORS.物料成本}
              strokeWidth={1.5}
              fill={`url(#gradient-物料成本)`}
            />
            <Area
              type="monotone"
              dataKey="运费"
              stroke={COLORS.运费}
              strokeWidth={1}
              fill={`url(#gradient-运费)`}
            />
            <Area
              type="monotone"
              dataKey="API调用"
              stroke={COLORS.API调用}
              strokeWidth={1}
              fill={`url(#gradient-API调用)`}
            />
            <Area
              type="monotone"
              dataKey="投券成本"
              stroke={COLORS.投券成本}
              strokeWidth={1}
              fill={`url(#gradient-投券成本)`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 图例 */}
      <div className="flex items-center justify-center gap-4 pt-2 flex-shrink-0 border-t border-[#222] mt-2 flex-wrap">
        {Object.entries(COLORS).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-muted-foreground">{key}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
