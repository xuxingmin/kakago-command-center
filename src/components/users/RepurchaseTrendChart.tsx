import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
      <div className="bg-[#0A0A0A] border border-[#2A2A2E] rounded-lg px-3 py-2 shadow-2xl">
        <div className="text-[10px] text-[#6B7280] mb-2">{label}</div>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-[11px] text-[#9CA3AF]">
                {entry.dataKey === "weeklyRate" ? "周复购" : "月复购"}
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-white">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function RepurchaseTrendChart() {
  return (
    <div className="bg-gradient-to-br from-[#121212] to-[#0A0A0A] border border-[#2A2A2E] rounded-xl p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">复购趋势</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#7c3aed]" />
            <span className="text-[10px] text-[#6B7280]">周复购率</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
            <span className="text-[10px] text-[#6B7280]">月复购率</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F1F23" vertical={false} />
            <XAxis 
              dataKey="week" 
              tick={{ fill: "#6B7280", fontSize: 10 }}
              axisLine={{ stroke: "#2A2A2E" }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: "#6B7280", fontSize: 10 }}
              axisLine={{ stroke: "#2A2A2E" }}
              tickLine={false}
              domain={[35, 55]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="weeklyRate" 
              stroke="#7c3aed" 
              strokeWidth={2}
              dot={{ fill: "#7c3aed", strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: "#7c3aed", stroke: "#7c3aed", strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="monthlyRate" 
              stroke="#22c55e" 
              strokeWidth={2}
              dot={{ fill: "#22c55e", strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: "#22c55e", stroke: "#22c55e", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
