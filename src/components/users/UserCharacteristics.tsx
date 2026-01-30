import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, Radar, LabelList } from "recharts";

// ═══════════════════════════════════════════════════════════════
// 数据定义
// ═══════════════════════════════════════════════════════════════
const genderData = [
  { name: "女", value: 58, color: "#7c3aed" },
  { name: "男", value: 42, color: "#3f3f46" },
];

const regionData = [
  { name: "政务区", value: 28 },
  { name: "高新区", value: 24 },
  { name: "滨湖区", value: 19 },
  { name: "蜀山区", value: 16 },
  { name: "包河区", value: 13 },
];

const timeRadarData = [
  { time: "早安 8-11", value: 28, fullMark: 50 },
  { time: "午间 11-14", value: 45, fullMark: 50 },
  { time: "下午茶 14-18", value: 27, fullMark: 50 },
];

const tasteData = { americano: 35, latte: 48, maleA: 60, femaleL: 75 };
const tempData = { cold: 65, hot: 35 };

// ═══════════════════════════════════════════════════════════════
// 卡片 A: 性别比例 (20%)
// ═══════════════════════════════════════════════════════════════
export function GenderCard() {
  return (
    <div className="bg-[#121212] border border-white/10 rounded-xl p-4 h-full flex flex-col">
      <h4 className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-3">性别比例</h4>
      <div className="flex-1 flex items-center min-h-0">
        <div className="w-1/2 h-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                innerRadius="45%"
                outerRadius="80%"
                dataKey="value"
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                {genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-lg font-black text-white tabular-nums">86.4K</span>
          </div>
        </div>
        <div className="w-1/2 space-y-4 pl-2">
          {genderData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-[#9CA3AF]">{item.name}</span>
              <span className="font-mono text-xl font-black text-white tabular-nums ml-auto">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 卡片 B: 区域分布 (30%)
// ═══════════════════════════════════════════════════════════════
export function RegionCard() {
  const colors = ["#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"];
  
  return (
    <div className="bg-[#121212] border border-white/10 rounded-xl p-4 h-full flex flex-col">
      <h4 className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-3">区域分布</h4>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={regionData} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#9CA3AF", fontSize: 11 }} 
              width={55}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
              {regionData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index]} />
              ))}
              <LabelList 
                dataKey="value" 
                position="right" 
                formatter={(v: number) => `${v}%`}
                style={{ fill: "#fff", fontSize: 11, fontFamily: "monospace", fontWeight: 700 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 卡片 C: 购买时段 - 雷达图 (30%)
// ═══════════════════════════════════════════════════════════════
export function TimeSlotCard() {
  return (
    <div className="bg-[#121212] border border-white/10 rounded-xl p-4 h-full flex flex-col">
      <h4 className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-2">购买时段</h4>
      <div className="flex-1 min-h-0 flex items-center">
        <div className="w-3/5 h-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={timeRadarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="#2A2A2E" />
              <PolarAngleAxis 
                dataKey="time" 
                tick={{ fill: "#9CA3AF", fontSize: 10 }}
                tickLine={false}
              />
              <Radar
                dataKey="value"
                stroke="#7c3aed"
                fill="#7c3aed"
                fillOpacity={0.4}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="w-2/5 space-y-3">
          {timeRadarData.map((item) => (
            <div key={item.time} className="flex flex-col">
              <span className="text-[10px] text-[#6B7280]">{item.time}</span>
              <span className="font-mono text-lg font-black text-white tabular-nums">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 卡片 D: 口味全景 (20%)
// ═══════════════════════════════════════════════════════════════
export function TasteCard() {
  return (
    <div className="bg-[#121212] border border-white/10 rounded-xl p-4 h-full flex flex-col">
      <h4 className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-3">口味全景</h4>
      
      <div className="flex-1 flex flex-col justify-between min-h-0">
        {/* SKU 偏好 */}
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white">美式</span>
              <span className="font-mono text-sm font-bold text-white tabular-nums">{tasteData.americano}%</span>
            </div>
            <div className="h-2 bg-[#1F1F23] rounded-full overflow-hidden">
              <div className="h-full bg-[#22c55e] rounded-full" style={{ width: `${tasteData.americano}%` }} />
            </div>
            <div className="flex gap-2 text-[9px]">
              <span className="text-[#3b82f6]">♂{tasteData.maleA}%</span>
              <span className="text-[#ec4899]">♀{100 - tasteData.maleA}%</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white">拿铁</span>
              <span className="font-mono text-sm font-bold text-white tabular-nums">{tasteData.latte}%</span>
            </div>
            <div className="h-2 bg-[#1F1F23] rounded-full overflow-hidden">
              <div className="h-full bg-[#7c3aed] rounded-full" style={{ width: `${tasteData.latte}%` }} />
            </div>
            <div className="flex gap-2 text-[9px]">
              <span className="text-[#3b82f6]">♂{100 - tasteData.femaleL}%</span>
              <span className="text-[#ec4899]">♀{tasteData.femaleL}%</span>
            </div>
          </div>
        </div>
        
        {/* 冷热偏好 */}
        <div className="space-y-2 mt-3">
          <span className="text-[9px] text-[#6B7280] uppercase">冷热偏好</span>
          <div className="flex gap-2">
            <div className="flex-1 bg-[#0ea5e9]/15 border border-[#0ea5e9]/30 rounded-lg py-2 px-2 text-center">
              <span className="text-sm">🧊</span>
              <span className="font-mono text-sm font-black text-[#0ea5e9] ml-1">{tempData.cold}%</span>
            </div>
            <div className="flex-1 bg-[#f97316]/15 border border-[#f97316]/30 rounded-lg py-2 px-2 text-center">
              <span className="text-sm">☕</span>
              <span className="font-mono text-sm font-black text-[#f97316] ml-1">{tempData.hot}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
