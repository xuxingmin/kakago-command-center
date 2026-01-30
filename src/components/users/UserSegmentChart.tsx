import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Maximize2 } from "lucide-react";

const segmentData = [
  { name: "新用户", value: 2850, color: "#22c55e" },
  { name: "活跃老客", value: 4200, color: "#7c3aed" },
  { name: "沉睡用户", value: 1680, color: "#f59e0b" },
  { name: "流失用户", value: 920, color: "#ef4444" },
];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
        <div className="flex items-center gap-2">
          <div 
            className="w-2.5 h-2.5 rounded-full" 
            style={{ backgroundColor: data.payload.color }}
          />
          <span className="text-xs text-muted-foreground">{data.name}</span>
        </div>
        <div className="font-mono text-sm font-bold text-foreground mt-1">
          {data.value.toLocaleString()} 人
        </div>
      </div>
    );
  }
  return null;
};

export function UserSegmentChart() {
  const total = segmentData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-card border border-border rounded-lg p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-foreground">用户分层</h3>
        <button className="p-1.5 rounded hover:bg-secondary transition-colors">
          <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
      
      <div className="flex-1 flex items-center">
        <div className="w-1/2 h-full min-h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={segmentData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {segmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="w-1/2 space-y-3 pl-4">
          {segmentData.map((item) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-mono text-xs font-bold text-foreground tabular-nums">
                  {percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
