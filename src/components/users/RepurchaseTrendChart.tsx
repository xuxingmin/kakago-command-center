import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Maximize2 } from "lucide-react";

const trendData = [
  { week: "W1", weeklyRate: 42.5, monthlyRate: 38.2 },
  { week: "W2", weeklyRate: 45.1, monthlyRate: 39.8 },
  { week: "W3", weeklyRate: 43.8, monthlyRate: 40.5 },
  { week: "W4", weeklyRate: 48.2, monthlyRate: 41.2 },
  { week: "W5", weeklyRate: 46.9, monthlyRate: 42.8 },
  { week: "W6", weeklyRate: 51.3, monthlyRate: 43.5 },
  { week: "W7", weeklyRate: 49.8, monthlyRate: 44.1 },
  { week: "W8", weeklyRate: 52.6, monthlyRate: 45.8 },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
        <div className="text-xs text-muted-foreground mb-2">{label}</div>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-muted-foreground">
                {entry.dataKey === "weeklyRate" ? "周复购率" : "月复购率"}
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-foreground">
              {entry.value}%
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function RepurchaseTrendChart() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-foreground">复购趋势</h3>
        <button className="p-1.5 rounded hover:bg-secondary transition-colors">
          <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
      
      <div className="flex-1 min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333333" vertical={false} />
            <XAxis 
              dataKey="week" 
              tick={{ fill: "#9CA3AF", fontSize: 10 }}
              axisLine={{ stroke: "#333333" }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: "#9CA3AF", fontSize: 10 }}
              axisLine={{ stroke: "#333333" }}
              tickLine={false}
              domain={[30, 60]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span className="text-xs text-muted-foreground">
                  {value === "weeklyRate" ? "周复购率" : "月复购率"}
                </span>
              )}
            />
            <Line 
              type="monotone" 
              dataKey="weeklyRate" 
              stroke="#7c3aed" 
              strokeWidth={2}
              dot={{ fill: "#7c3aed", strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: "#7c3aed" }}
            />
            <Line 
              type="monotone" 
              dataKey="monthlyRate" 
              stroke="#22c55e" 
              strokeWidth={2}
              dot={{ fill: "#22c55e", strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: "#22c55e" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
