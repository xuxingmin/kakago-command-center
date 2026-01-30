import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, LabelList } from "recharts";
import { MapPin, Clock, Coffee, Users } from "lucide-react";

// 性别数据
const genderData = [
  { name: "女性", value: 58, count: 50131, color: "#7c3aed" },
  { name: "男性", value: 42, count: 36301, color: "#3f3f46" },
];

// 区域分布数据 - Top 5
const regionData = [
  { name: "政务区", value: 28, count: 24201 },
  { name: "高新区", value: 24, count: 20744 },
  { name: "滨湖区", value: 19, count: 16422 },
  { name: "蜀山区", value: 16, count: 13829 },
  { name: "包河区", value: 13, count: 11236 },
];

// 购买时段数据
const timeData = [
  { name: "早安时段", time: "8-11点", value: 28 },
  { name: "午间提神", time: "11-14点", value: 45 },
  { name: "下午茶", time: "14-18点", value: 27 },
];

// 口味偏好数据
const tasteData = {
  americano: { total: 35, male: 60, female: 22 },
  latte: { total: 48, male: 25, female: 75 },
  other: { total: 17 },
};

const tempData = {
  cold: 65,
  hot: 35,
};

// 通用深色 Tooltip
const DarkTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; name: string }> }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0A0A0A] border border-[#333] rounded px-2 py-1 shadow-xl">
        <span className="font-mono text-xs text-white">{payload[0].value}%</span>
      </div>
    );
  }
  return null;
};

// ═══════════════════════════════════════════════════════════════
// 卡片 A: 性别与画像
// ═══════════════════════════════════════════════════════════════
function GenderCard() {
  const total = genderData.reduce((sum, d) => sum + d.count, 0);
  
  return (
    <div className="bg-[#121212] border border-[#333] rounded-xl p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-[#6B7280]" />
        <h4 className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">性别画像</h4>
      </div>
      
      <div className="flex-1 flex items-center">
        {/* 环形图 */}
        <div className="w-1/2 h-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                innerRadius="55%"
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
          {/* 中心总人数 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-lg font-black text-white tabular-nums">{(total / 1000).toFixed(1)}K</span>
            <span className="text-[9px] text-[#6B7280]">总用户</span>
          </div>
        </div>
        
        {/* 右侧数据 */}
        <div className="w-1/2 flex flex-col justify-center gap-4 pl-2">
          {genderData.map((item) => (
            <div key={item.name} className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-[#9CA3AF]">{item.name}</span>
              </div>
              <div className="flex items-baseline gap-2 pl-5">
                <span className="font-mono text-2xl font-black text-white tabular-nums">{item.value}%</span>
                <span className="font-mono text-xs text-[#6B7280] tabular-nums">{item.count.toLocaleString()}人</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 卡片 B: 区域热力分布
// ═══════════════════════════════════════════════════════════════
function RegionCard() {
  // 渐变紫色
  const getBarColor = (index: number) => {
    const colors = ["#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"];
    return colors[index] || colors[4];
  };

  return (
    <div className="bg-[#121212] border border-[#333] rounded-xl p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-4 h-4 text-[#6B7280]" />
        <h4 className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">区域分布</h4>
        <span className="text-[9px] text-[#4B5563] ml-auto">收货地址 TOP5</span>
      </div>
      
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={regionData} layout="vertical" margin={{ top: 0, right: 50, left: 0, bottom: 0 }}>
            <XAxis type="number" hide domain={[0, 35]} />
            <YAxis 
              type="category" 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#9CA3AF", fontSize: 11 }} 
              width={50}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
              {regionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(index)} />
              ))}
              <LabelList 
                dataKey="count" 
                position="right" 
                formatter={(v: number) => v.toLocaleString()}
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
// 卡片 C: 购买时段偏好
// ═══════════════════════════════════════════════════════════════
function TimeSlotCard() {
  return (
    <div className="bg-[#121212] border border-[#333] rounded-xl p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-[#6B7280]" />
        <h4 className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">购买时段</h4>
      </div>
      
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timeData} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
            <defs>
              <linearGradient id="timeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 10 }}
            />
            <YAxis hide domain={[0, 55]} />
            <Tooltip content={<DarkTooltip />} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#7c3aed" 
              strokeWidth={2}
              fill="url(#timeGradient)"
            />
            {/* 峰值标注 */}
            <LabelList 
              dataKey="value"
              position="top"
              formatter={(v: number) => v === 45 ? `🔥 ${v}%` : `${v}%`}
              style={{ 
                fill: "#fff", 
                fontSize: 12, 
                fontFamily: "monospace", 
                fontWeight: 800 
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* 底部时段标签 */}
      <div className="flex justify-between mt-2 px-2">
        {timeData.map((item, idx) => (
          <div key={item.name} className={`text-center ${idx === 1 ? 'text-[#7c3aed]' : 'text-[#6B7280]'}`}>
            <span className="text-[10px] font-medium">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 卡片 D: 口味与冷热偏好
// ═══════════════════════════════════════════════════════════════
function TasteCard() {
  return (
    <div className="bg-[#121212] border border-[#333] rounded-xl p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Coffee className="w-4 h-4 text-[#6B7280]" />
        <h4 className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">口味偏好</h4>
      </div>
      
      {/* 上层：SKU偏好 */}
      <div className="flex-1 space-y-3">
        {/* 美式 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white font-medium">美式</span>
            <span className="font-mono text-lg font-black text-white tabular-nums">{tasteData.americano.total}%</span>
          </div>
          <div className="h-3 bg-[#1F1F23] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#22c55e] to-[#4ade80] rounded-full" style={{ width: `${tasteData.americano.total}%` }} />
          </div>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="text-[#3b82f6]">♂ 男性 {tasteData.americano.male}%</span>
            <span className="text-[#ec4899]">♀ 女性 {tasteData.americano.female}%</span>
          </div>
        </div>
        
        {/* 拿铁 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white font-medium">拿铁</span>
            <span className="font-mono text-lg font-black text-white tabular-nums">{tasteData.latte.total}%</span>
          </div>
          <div className="h-3 bg-[#1F1F23] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] rounded-full" style={{ width: `${tasteData.latte.total}%` }} />
          </div>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="text-[#3b82f6]">♂ 男性 {tasteData.latte.male}%</span>
            <span className="text-[#ec4899]">♀ 女性 {tasteData.latte.female}%</span>
          </div>
        </div>
        
        {/* 其他 */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#6B7280]">其他 (澳白/卡布/特调)</span>
          <span className="font-mono text-sm font-bold text-[#9CA3AF] tabular-nums">{tasteData.other.total}%</span>
        </div>
      </div>
      
      {/* 下层：冷热偏好 */}
      <div className="mt-3 pt-3 border-t border-[#333]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-[#6B7280] uppercase tracking-wider">冷热偏好</span>
        </div>
        <div className="flex gap-3">
          {/* 冷饮 */}
          <div className="flex-1 bg-gradient-to-r from-[#0ea5e9]/20 to-[#0ea5e9]/5 border border-[#0ea5e9]/30 rounded-full px-3 py-1.5 flex items-center justify-between">
            <span className="text-xs text-[#0ea5e9]">🧊 冷饮</span>
            <span className="font-mono text-sm font-black text-[#0ea5e9] tabular-nums">{tempData.cold}%</span>
          </div>
          {/* 热饮 */}
          <div className="flex-1 bg-gradient-to-r from-[#f97316]/20 to-[#f97316]/5 border border-[#f97316]/30 rounded-full px-3 py-1.5 flex items-center justify-between">
            <span className="text-xs text-[#f97316]">☕ 热饮</span>
            <span className="font-mono text-sm font-black text-[#f97316] tabular-nums">{tempData.hot}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 主导出组件
// ═══════════════════════════════════════════════════════════════
export function UserCharacteristics() {
  return (
    <div className="grid grid-cols-4 gap-4 h-full">
      <GenderCard />
      <RegionCard />
      <TimeSlotCard />
      <TasteCard />
    </div>
  );
}
