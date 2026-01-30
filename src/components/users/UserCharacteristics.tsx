import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { MapPin, Clock, Coffee, Users } from "lucide-react";

// 性别数据
const genderData = [
  { name: "女性", value: 58, color: "#ec4899" },
  { name: "男性", value: 42, color: "#3b82f6" },
];

// 区域分布数据
const regionData = [
  { name: "华东", value: 35, color: "#7c3aed" },
  { name: "华南", value: 28, color: "#22c55e" },
  { name: "华北", value: 18, color: "#f59e0b" },
  { name: "华中", value: 12, color: "#3b82f6" },
  { name: "其他", value: 7, color: "#6b7280" },
];

// 购买时段数据
const timeData = [
  { name: "8-11点", label: "早间", value: 32, color: "#f59e0b" },
  { name: "11-14点", label: "午间", value: 45, color: "#22c55e" },
  { name: "14-18点", label: "下午", value: 23, color: "#7c3aed" },
];

// 口味偏好数据
const flavorData = {
  total: [
    { name: "拿铁", value: 38 },
    { name: "美式", value: 25 },
    { name: "澳白", value: 18 },
    { name: "卡布", value: 12 },
    { name: "其他", value: 7 },
  ],
  male: [
    { name: "拿铁", value: 32 },
    { name: "美式", value: 35 },
    { name: "澳白", value: 15 },
    { name: "卡布", value: 10 },
    { name: "其他", value: 8 },
  ],
  female: [
    { name: "拿铁", value: 42 },
    { name: "美式", value: 18 },
    { name: "澳白", value: 20 },
    { name: "卡布", value: 14 },
    { name: "其他", value: 6 },
  ],
  temperature: [
    { name: "热饮", value: 62, color: "#ef4444" },
    { name: "冷饮", value: 38, color: "#3b82f6" },
  ],
};

const flavorColors = ["#7c3aed", "#22c55e", "#f59e0b", "#3b82f6", "#6b7280"];

// 通用 Tooltip
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; name: string; payload: { color?: string } }> }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0A0A0A] border border-[#2A2A2E] rounded-lg px-3 py-2 shadow-2xl">
        <span className="text-xs text-[#9CA3AF]">{payload[0].name}: </span>
        <span className="font-mono text-sm font-bold text-white">{payload[0].value}%</span>
      </div>
    );
  }
  return null;
};

// 性别比例组件
function GenderRatio() {
  return (
    <div className="bg-[#121212] border border-[#2A2A2E] rounded-xl p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <Users className="w-4 h-4 text-[#6B7280]" />
        <h4 className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">男女比例</h4>
      </div>
      <div className="flex-1 flex items-center min-h-0">
        <div className="w-1/2 h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={genderData} cx="50%" cy="50%" innerRadius="50%" outerRadius="80%" dataKey="value" stroke="none">
                {genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-1/2 space-y-3 pl-2">
          {genderData.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-[#9CA3AF]">{item.name}</span>
              </div>
              <span className="font-mono text-lg font-bold text-white tabular-nums">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 区域分布组件
function RegionDistribution() {
  return (
    <div className="bg-[#121212] border border-[#2A2A2E] rounded-xl p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <MapPin className="w-4 h-4 text-[#6B7280]" />
        <h4 className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">区域分布</h4>
        <span className="text-[10px] text-[#4B5563]">(按收货地址)</span>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={regionData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <XAxis type="number" hide domain={[0, 40]} />
            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 11 }} width={35} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
              {regionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// 购买时段组件
function PurchaseTime() {
  return (
    <div className="bg-[#121212] border border-[#2A2A2E] rounded-xl p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <Clock className="w-4 h-4 text-[#6B7280]" />
        <h4 className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">购买时段</h4>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-3 min-h-0">
        {timeData.map((item) => (
          <div key={item.name} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#9CA3AF]">{item.label}</span>
                <span className="text-[10px] text-[#4B5563]">{item.name}</span>
              </div>
              <span className="font-mono text-sm font-bold text-white tabular-nums">{item.value}%</span>
            </div>
            <div className="h-2 bg-[#1F1F23] rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${item.value}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 口味偏好组件
function FlavorPreference() {
  return (
    <div className="bg-[#121212] border border-[#2A2A2E] rounded-xl p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <Coffee className="w-4 h-4 text-[#6B7280]" />
        <h4 className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">口味偏好</h4>
      </div>
      <div className="flex-1 grid grid-cols-3 gap-3 min-h-0">
        {/* 总占比 */}
        <div className="space-y-2">
          <span className="text-[10px] text-[#6B7280] font-medium">总占比</span>
          <div className="space-y-1.5">
            {flavorData.total.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: flavorColors[idx] }} />
                  <span className="text-[10px] text-[#9CA3AF]">{item.name}</span>
                </div>
                <span className="font-mono text-[10px] font-bold text-white tabular-nums">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* 男性偏好 */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#3b82f6]" />
            <span className="text-[10px] text-[#6B7280] font-medium">男性偏好</span>
          </div>
          <div className="space-y-1.5">
            {flavorData.male.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="text-[10px] text-[#9CA3AF]">{item.name}</span>
                <span className="font-mono text-[10px] font-bold text-white tabular-nums">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* 女性偏好 */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#ec4899]" />
            <span className="text-[10px] text-[#6B7280] font-medium">女性偏好</span>
          </div>
          <div className="space-y-1.5">
            {flavorData.female.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="text-[10px] text-[#9CA3AF]">{item.name}</span>
                <span className="font-mono text-[10px] font-bold text-white tabular-nums">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 冷热偏好 */}
      <div className="mt-3 pt-3 border-t border-[#2A2A2E] flex-shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#6B7280]">冷热偏好</span>
          <div className="flex items-center gap-4">
            {flavorData.temperature.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] text-[#9CA3AF]">{item.name}</span>
                <span className="font-mono text-xs font-bold text-white tabular-nums">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function UserCharacteristics() {
  return (
    <div className="grid grid-cols-4 gap-4 h-full">
      <GenderRatio />
      <RegionDistribution />
      <PurchaseTime />
      <FlavorPreference />
    </div>
  );
}
