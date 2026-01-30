import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, LabelList } from "recharts";

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

const timeData = [
  { name: "早安", time: "8-11", value: 28 },
  { name: "午间", time: "11-14", value: 45 },
  { name: "下午茶", time: "14-18", value: 27 },
];

const tasteData = { americano: 35, latte: 48, maleA: 60, femaleL: 75 };
const tempData = { cold: 65, hot: 35 };

// ═══════════════════════════════════════════════════════════════
// 卡片 A: 性别比例 (col-span-2)
// ═══════════════════════════════════════════════════════════════
function GenderCard() {
  return (
    <div className="col-span-2 bg-[#121212] border border-white/10 rounded-xl p-3 h-full flex flex-col">
      <h4 className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-2">性别比例</h4>
      <div className="flex-1 flex items-center min-h-0">
        <div className="w-3/5 h-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                innerRadius="50%"
                outerRadius="85%"
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
            <span className="font-mono text-base font-black text-white tabular-nums">86.4K</span>
          </div>
        </div>
        <div className="w-2/5 space-y-3">
          {genderData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-[#9CA3AF]">{item.name}</span>
              <span className="font-mono text-lg font-black text-white tabular-nums ml-auto">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 卡片 B: 区域分布 (col-span-3)
// ═══════════════════════════════════════════════════════════════
function RegionCard() {
  const colors = ["#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"];
  
  return (
    <div className="col-span-3 bg-[#121212] border border-white/10 rounded-xl p-3 h-full flex flex-col">
      <h4 className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-2">区域分布</h4>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={regionData} layout="vertical" margin={{ top: 0, right: 35, left: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#9CA3AF", fontSize: 10 }} 
              width={45}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
              {regionData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index]} />
              ))}
              <LabelList 
                dataKey="value" 
                position="right" 
                formatter={(v: number) => `${v}%`}
                style={{ fill: "#fff", fontSize: 10, fontFamily: "monospace", fontWeight: 700 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 卡片 C: 购买时段 (col-span-3)
// ═══════════════════════════════════════════════════════════════
function TimeSlotCard() {
  return (
    <div className="col-span-3 bg-[#121212] border border-white/10 rounded-xl p-3 h-full flex flex-col">
      <h4 className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-2">购买时段</h4>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timeData} margin={{ top: 25, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 10 }}
            />
            <YAxis hide domain={[0, 55]} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#7c3aed" 
              strokeWidth={2}
              fill="url(#areaGrad)"
            >
              <LabelList 
                dataKey="value"
                position="top"
                formatter={(v: number) => `${v}%`}
                style={{ fill: "#fff", fontSize: 11, fontFamily: "monospace", fontWeight: 800 }}
              />
            </Area>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 卡片 D: 口味全景 (col-span-4)
// ═══════════════════════════════════════════════════════════════
function TasteCard() {
  return (
    <div className="col-span-4 bg-[#121212] border border-white/10 rounded-xl p-3 h-full flex flex-col">
      <h4 className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-2">口味全景</h4>
      
      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        {/* 左栏: 美式 vs 拿铁 */}
        <div className="flex flex-col justify-center space-y-4">
          {/* 美式 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white font-medium">美式</span>
              <span className="font-mono text-xl font-black text-white tabular-nums">{tasteData.americano}%</span>
            </div>
            <div className="h-2.5 bg-[#1F1F23] rounded-full overflow-hidden">
              <div className="h-full bg-[#22c55e] rounded-full" style={{ width: `${tasteData.americano}%` }} />
            </div>
            <div className="flex gap-3 text-[10px]">
              <span className="text-[#3b82f6]">♂ {tasteData.maleA}%</span>
              <span className="text-[#ec4899]">♀ {100 - tasteData.maleA}%</span>
            </div>
          </div>
          
          {/* 拿铁 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white font-medium">拿铁</span>
              <span className="font-mono text-xl font-black text-white tabular-nums">{tasteData.latte}%</span>
            </div>
            <div className="h-2.5 bg-[#1F1F23] rounded-full overflow-hidden">
              <div className="h-full bg-[#7c3aed] rounded-full" style={{ width: `${tasteData.latte}%` }} />
            </div>
            <div className="flex gap-3 text-[10px]">
              <span className="text-[#3b82f6]">♂ {100 - tasteData.femaleL}%</span>
              <span className="text-[#ec4899]">♀ {tasteData.femaleL}%</span>
            </div>
          </div>
          
          <div className="text-[10px] text-[#4B5563]">其他 17%</div>
        </div>
        
        {/* 右栏: 冷 vs 热 */}
        <div className="flex flex-col justify-center space-y-3">
          <span className="text-[10px] text-[#6B7280] uppercase tracking-wider">冷热偏好</span>
          
          {/* 冷饮 */}
          <div className="bg-[#0ea5e9]/10 border border-[#0ea5e9]/30 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🧊</span>
              <span className="text-sm text-[#0ea5e9] font-medium">冷饮</span>
            </div>
            <span className="font-mono text-2xl font-black text-[#0ea5e9] tabular-nums">{tempData.cold}%</span>
          </div>
          
          {/* 热饮 */}
          <div className="bg-[#f97316]/10 border border-[#f97316]/30 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">☕</span>
              <span className="text-sm text-[#f97316] font-medium">热饮</span>
            </div>
            <span className="font-mono text-2xl font-black text-[#f97316] tabular-nums">{tempData.hot}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 主导出: 12列网格容器
// ═══════════════════════════════════════════════════════════════
export function UserCharacteristics() {
  return (
    <div className="grid grid-cols-12 gap-4 h-[280px]">
      <GenderCard />
      <RegionCard />
      <TimeSlotCard />
      <TasteCard />
    </div>
  );
}
