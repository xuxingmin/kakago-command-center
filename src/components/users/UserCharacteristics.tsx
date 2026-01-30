import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";

// ═══════════════════════════════════════════════════════════════
// 数据定义
// ═══════════════════════════════════════════════════════════════
const genderData = [
  { name: "女", value: 58, color: "#7c3aed" },
  { name: "男", value: 42, color: "#6B7280" },
];

const regionData = [
  { name: "政务区", value: 28, color: "#7c3aed" },
  { name: "高新区", value: 24, color: "#8b5cf6" },
  { name: "滨湖区", value: 19, color: "#a78bfa" },
  { name: "蜀山区", value: 16, color: "#c4b5fd" },
  { name: "包河区", value: 13, color: "#ddd6fe" },
];

const timeRadarData = [
  { time: "8-10", value: 15, fullMark: 30 },
  { time: "10-12", value: 22, fullMark: 30 },
  { time: "12-14", value: 28, fullMark: 30 },
  { time: "14-16", value: 18, fullMark: 30 },
  { time: "16-18", value: 17, fullMark: 30 },
];

const tasteData = { americano: 35, latte: 48, maleA: 60, femaleL: 75 };
const tempData = { cold: 65, hot: 35 };

// ═══════════════════════════════════════════════════════════════
// 卡片 A: 性别比例
// ═══════════════════════════════════════════════════════════════
export function GenderCard() {
  return (
    <div className="bg-[#121212] border border-white/10 rounded-xl p-3 h-full flex flex-col overflow-hidden">
      <h4 className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wider mb-2">性别比例</h4>
      <div className="flex-1 flex flex-col justify-center space-y-3">
        {genderData.map((item) => (
          <div key={item.name} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9CA3AF]">{item.name}</span>
              <span className="font-mono text-lg font-black tabular-nums" style={{ color: item.color }}>{item.value}%</span>
            </div>
            <div className="h-1.5 bg-[#1F1F23] rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 卡片 B: 区域分布
// ═══════════════════════════════════════════════════════════════
export function RegionCard() {
  return (
    <div className="bg-[#121212] border border-white/10 rounded-xl p-3 h-full flex flex-col overflow-hidden">
      <h4 className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wider mb-2">区域分布</h4>
      <div className="flex-1 flex flex-col justify-center space-y-1.5">
        {regionData.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <span className="text-[10px] text-[#9CA3AF] w-12 truncate">{item.name}</span>
            <div className="flex-1 h-1.5 bg-[#1F1F23] rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${item.value * 3}%`, backgroundColor: item.color }} />
            </div>
            <span className="font-mono text-[10px] font-bold text-white tabular-nums w-7 text-right">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 卡片 C: 购买时段 - 雷达图
// ═══════════════════════════════════════════════════════════════
export function TimeSlotCard() {
  return (
    <div className="bg-[#121212] border border-white/10 rounded-xl p-3 h-full flex flex-col overflow-hidden">
      <h4 className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wider mb-1">购买时段</h4>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={timeRadarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <PolarGrid stroke="#2A2A2E" />
            <PolarAngleAxis 
              dataKey="time" 
              tick={{ fill: "#9CA3AF", fontSize: 9 }}
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
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 卡片 D: 口味全景 - 紧凑布局
// ═══════════════════════════════════════════════════════════════
export function TasteCard() {
  return (
    <div className="bg-[#121212] border border-white/10 rounded-xl p-3 h-full flex flex-col overflow-hidden">
      <h4 className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wider mb-2">口味全景</h4>
      
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        {/* 左栏: SKU偏好 */}
        <div className="flex-1 flex flex-col justify-center space-y-3 min-w-0">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-white">美式</span>
              <span className="font-mono text-base font-bold text-white tabular-nums">{tasteData.americano}%</span>
            </div>
            <div className="h-2 bg-[#1F1F23] rounded-full overflow-hidden">
              <div className="h-full bg-[#22c55e] rounded-full" style={{ width: `${tasteData.americano}%` }} />
            </div>
            <div className="flex gap-3 text-[10px]">
              <span className="text-[#3b82f6]">♂{tasteData.maleA}%</span>
              <span className="text-[#ec4899]">♀{100 - tasteData.maleA}%</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-white">拿铁</span>
              <span className="font-mono text-base font-bold text-white tabular-nums">{tasteData.latte}%</span>
            </div>
            <div className="h-2 bg-[#1F1F23] rounded-full overflow-hidden">
              <div className="h-full bg-[#7c3aed] rounded-full" style={{ width: `${tasteData.latte}%` }} />
            </div>
            <div className="flex gap-3 text-[10px]">
              <span className="text-[#3b82f6]">♂{100 - tasteData.femaleL}%</span>
              <span className="text-[#ec4899]">♀{tasteData.femaleL}%</span>
            </div>
          </div>
        </div>
        
        {/* 右栏: 冷热偏好 - 紧凑版 */}
        <div className="w-24 flex flex-col justify-center space-y-2 flex-shrink-0">
          <span className="text-[9px] text-[#6B7280] uppercase">冷/热</span>
          
          <div className="bg-[#0ea5e9]/15 border border-[#0ea5e9]/30 rounded-lg p-2 flex items-center justify-between">
            <span className="text-sm">🧊</span>
            <span className="font-mono text-lg font-black text-[#0ea5e9] tabular-nums">{tempData.cold}%</span>
          </div>
          
          <div className="bg-[#f97316]/15 border border-[#f97316]/30 rounded-lg p-2 flex items-center justify-between">
            <span className="text-sm">☕</span>
            <span className="font-mono text-lg font-black text-[#f97316] tabular-nums">{tempData.hot}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
