import { useState, useMemo } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
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
      dateStr = `${date.getMonth() + 1}.${date.getDate()}`;
    } else if (range === "week") {
      date.setDate(date.getDate() - i * 7);
      dateStr = `W${Math.ceil(date.getDate() / 7)}`;
    } else {
      date.setMonth(date.getMonth() - i);
      dateStr = `${date.getMonth() + 1}月`;
    }
    
    const baseRevenue = range === "day" ? 55000 : range === "week" ? 350000 : 1400000;
    const variance = range === "day" ? 12000 : range === "week" ? 80000 : 300000;
    
    const revenue = Math.floor(baseRevenue + Math.random() * variance);
    
    // 各项成本占比
    const freightRate = 0.02 + Math.random() * 0.015;
    const materialRate = 0.14 + Math.random() * 0.06;
    const couponRate = 0.015 + Math.random() * 0.02;
    const storeShareRate = 0.45 + Math.random() * 0.1;
    
    const freight = Math.floor(revenue * freightRate);
    const material = Math.floor(revenue * materialRate);
    const coupon = Math.floor(revenue * couponRate);
    const storeShare = Math.floor(revenue * storeShareRate);
    
    data.push({
      date: dateStr,
      营业额: revenue,
      运费: freight,
      运费占比: (freightRate * 100).toFixed(1),
      物料成本: material,
      物料成本占比: (materialRate * 100).toFixed(0),
      投券: coupon,
      投券占比: (couponRate * 100).toFixed(1),
      门店分成: storeShare,
      门店分成占比: (storeShareRate * 100).toFixed(0),
    });
  }
  
  return data;
}

const COLORS = {
  运费: "#c4d84a",
  物料成本: "#6ab04c",
  投券: "#eb4d4b",
  门店分成: "#16a085",
};

const STACK_KEYS = ["运费", "物料成本", "投券", "门店分成"] as const;

// 自定义柱状图标签
const renderBarLabel = (props: any, dataKey: string, data: any[]) => {
  const { x, y, width, height, index } = props;
  if (height < 20) return null;
  
  const item = data[index];
  const percentKey = `${dataKey}占比`;
  const percent = item[percentKey];
  
  return (
    <text
      x={x + width / 2}
      y={y + height / 2}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={10}
      fontWeight={500}
    >
      {percent}%
    </text>
  );
};

// 自定义营业额标签
const renderRevenueLabel = (props: any) => {
  const { x, y, value } = props;
  return (
    <text
      x={x}
      y={y - 8}
      fill="#9CA3AF"
      textAnchor="middle"
      fontSize={10}
    >
      {value?.toLocaleString()}
    </text>
  );
};

export function OperationTrendChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>("day");
  const data = useMemo(() => generateTrendData(timeRange), [timeRange]);

  const formatValue = (value: number) => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(0)}k`;
    }
    return value.toLocaleString();
  };

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: "day", label: "日" },
    { value: "week", label: "周" },
    { value: "month", label: "月" },
  ];

  // 计算堆叠总高度用于折线
  const dataWithTotal = data.map(item => ({
    ...item,
    total: item.运费 + item.物料成本 + item.投券 + item.门店分成,
  }));

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
          <ComposedChart data={dataWithTotal} margin={{ top: 25, right: 10, left: -10, bottom: 5 }}>
            <XAxis 
              dataKey="date" 
              tick={{ fill: "#9CA3AF", fontSize: 10 }}
              axisLine={{ stroke: "#333" }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: "#9CA3AF", fontSize: 10 }}
              axisLine={{ stroke: "#333" }}
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
              formatter={(value: number, name: string) => {
                const item = dataWithTotal.find(d => 
                  d.运费 === value || d.物料成本 === value || 
                  d.投券 === value || d.门店分成 === value ||
                  d.营业额 === value
                );
                if (name === "营业额") {
                  return [`¥${value.toLocaleString()}`, name];
                }
                const percentKey = `${name}占比`;
                const percent = item?.[percentKey as keyof typeof item] || '';
                return [`¥${value.toLocaleString()} (${percent}%)`, name];
              }}
            />
            
            {/* 堆叠柱状图 */}
            {STACK_KEYS.map((key) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="stack"
                fill={COLORS[key]}
                barSize={40}
              >
                {dataWithTotal.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[key]} />
                ))}
                <LabelList
                  dataKey={key}
                  content={(props) => renderBarLabel(props, key, dataWithTotal)}
                />
              </Bar>
            ))}
            
            {/* 营业额折线 */}
            <Line
              type="monotone"
              dataKey="营业额"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ fill: "#2563eb", strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: "#2563eb" }}
            >
              <LabelList
                dataKey="营业额"
                content={renderRevenueLabel}
              />
            </Line>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 图例 */}
      <div className="flex items-center justify-center gap-4 pt-2 flex-shrink-0 border-t border-[#222] mt-2">
        <div className="flex items-center gap-1">
          <div className="w-4 h-0.5 bg-[#2563eb]" />
          <span className="text-xs text-muted-foreground">营业额</span>
        </div>
        {Object.entries(COLORS).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-xs text-muted-foreground">{key}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
