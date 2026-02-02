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
    
    // 各项成本占比（基于营收）
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
      // 总成本
      总成本: freight + material + coupon + storeShare,
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

// 格式化金额
const formatAmount = (value: number) => {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toString();
};

// 自定义柱状图标签 - 显示金额和百分比
const renderBarLabel = (props: any, dataKey: string, data: any[]) => {
  const { x, y, width, height, index } = props;
  if (height < 25) return null;
  
  const item = data[index];
  const value = item[dataKey];
  const percentKey = `${dataKey}占比`;
  const percent = item[percentKey];
  
  return (
    <g>
      <text
        x={x + width / 2}
        y={y + height / 2 - 6}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={9}
        fontWeight={500}
      >
        {formatAmount(value)}
      </text>
      <text
        x={x + width / 2}
        y={y + height / 2 + 6}
        fill="rgba(255,255,255,0.7)"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={8}
      >
        {percent}%
      </text>
    </g>
  );
};

// 自定义营业额标签
const renderRevenueLabel = (props: any) => {
  const { x, y, value } = props;
  return (
    <text
      x={x}
      y={y - 10}
      fill="#60a5fa"
      textAnchor="middle"
      fontSize={10}
      fontWeight={600}
    >
      {value?.toLocaleString()}
    </text>
  );
};

export function OperationTrendChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>("day");
  const data = useMemo(() => generateTrendData(timeRange), [timeRange]);

  const formatYAxis = (value: number) => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(0)}万`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toString();
  };

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: "day", label: "日" },
    { value: "week", label: "周" },
    { value: "month", label: "月" },
  ];

  // 计算Y轴最大值（基于营业额）
  const maxRevenue = Math.max(...data.map(d => d.营业额));
  const yAxisMax = Math.ceil(maxRevenue / 10000) * 10000 + 10000;

  return (
    <div className="bg-card border border-secondary rounded-lg p-3 h-full flex flex-col">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-success rounded-full" />
          <span className="text-sm font-medium">经营趋势</span>
          <span className="text-xs text-muted-foreground ml-2">（营收 vs 成本对比）</span>
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
          <ComposedChart data={data} margin={{ top: 30, right: 10, left: 5, bottom: 5 }}>
            <XAxis 
              dataKey="date" 
              tick={{ fill: "#9CA3AF", fontSize: 10 }}
              axisLine={{ stroke: "#333" }}
              tickLine={false}
            />
            <YAxis 
              domain={[0, yAxisMax]}
              tick={{ fill: "#9CA3AF", fontSize: 10 }}
              axisLine={{ stroke: "#333" }}
              tickLine={false}
              tickFormatter={formatYAxis}
              label={{ 
                value: '金额', 
                angle: -90, 
                position: 'insideLeft',
                fill: '#6b7280',
                fontSize: 10,
                offset: 10
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#121212",
                border: "1px solid #333",
                borderRadius: "8px",
                fontSize: "11px",
              }}
              labelStyle={{ color: "#9CA3AF", marginBottom: 4 }}
              formatter={(value: number, name: string) => {
                const item = data.find(d => d[name as keyof typeof d] === value);
                if (name === "营业额") {
                  return [`¥${value.toLocaleString()}`, "📈 " + name];
                }
                const percentKey = `${name}占比`;
                const percent = item?.[percentKey as keyof typeof item] || '';
                return [`¥${value.toLocaleString()} (${percent}%)`, name];
              }}
              itemSorter={(item) => {
                const order = ["营业额", "门店分成", "物料成本", "投券", "运费"];
                return order.indexOf(item.name as string);
              }}
            />
            
            {/* 堆叠柱状图 - 成本项 */}
            {STACK_KEYS.map((key) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="cost"
                fill={COLORS[key]}
                barSize={45}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[key]} />
                ))}
                <LabelList
                  dataKey={key}
                  content={(props) => renderBarLabel(props, key, data)}
                />
              </Bar>
            ))}
            
            {/* 营业额折线 */}
            <Line
              type="monotone"
              dataKey="营业额"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ fill: "#3b82f6", strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: "#3b82f6" }}
            >
              <LabelList
                dataKey="营业额"
                content={renderRevenueLabel}
              />
            </Line>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 图例和说明 */}
      <div className="flex items-center justify-between pt-2 flex-shrink-0 border-t border-[#222] mt-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-[#3b82f6]" />
            <span className="text-xs text-muted-foreground">营业额</span>
          </div>
          {Object.entries(COLORS).map(([key, color]) => (
            <div key={key} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-xs text-muted-foreground">{key}</span>
            </div>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="text-success">柱形 &lt; 折线</span>
          <span className="mx-1">=</span>
          <span>盈利</span>
        </div>
      </div>
    </div>
  );
}
