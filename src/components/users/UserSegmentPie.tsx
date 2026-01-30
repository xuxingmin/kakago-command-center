import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Users, UserPlus, Moon, UserX } from "lucide-react";

interface SegmentData {
  name: string;
  value: number;
  color: string;
  icon: React.ElementType;
}

const segmentData: SegmentData[] = [
  { name: "新用户", value: 2850, color: "#22c55e", icon: UserPlus },
  { name: "活跃老客", value: 4200, color: "#7c3aed", icon: Users },
  { name: "沉睡用户", value: 1680, color: "#f59e0b", icon: Moon },
  { name: "流失用户", value: 920, color: "#ef4444", icon: UserX },
];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: SegmentData }> }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-[#0A0A0A] border border-[#2A2A2E] rounded-lg px-3 py-2 shadow-2xl z-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.payload.color }} />
          <span className="text-xs text-[#9CA3AF]">{data.payload.name}</span>
        </div>
        <div className="font-mono text-sm font-bold text-white mt-1">
          {data.value.toLocaleString()} 人
        </div>
      </div>
    );
  }
  return null;
};

export function UserSegmentPie() {
  const total = segmentData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-gradient-to-br from-[#121212] to-[#0A0A0A] border border-[#2A2A2E] rounded-xl p-4 h-full flex flex-col overflow-hidden">
      <h3 className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-2 flex-shrink-0">用户构成</h3>
      
      <div className="flex-1 flex items-center min-h-0">
        {/* 饼图 */}
        <div className="w-2/5 h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={segmentData}
                cx="50%"
                cy="50%"
                innerRadius="45%"
                outerRadius="75%"
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
        
        {/* 图例 */}
        <div className="w-3/5 space-y-2 pl-4">
          {segmentData.map((item) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-[#9CA3AF]">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#6B7280] tabular-nums">
                    {item.value.toLocaleString()}
                  </span>
                  <span className="font-mono text-xs font-bold text-white tabular-nums w-12 text-right">
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部总计 */}
      <div className="mt-2 pt-2 border-t border-[#2A2A2E] flex items-center justify-between flex-shrink-0">
        <span className="text-xs text-[#6B7280]">总用户数</span>
        <span className="font-mono text-sm font-bold text-white tabular-nums">
          {total.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
