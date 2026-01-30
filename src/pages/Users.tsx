import { useState } from "react";
import { Send, Megaphone, Users as UsersIcon, UserPlus, Moon, UserX, TrendingUp, TrendingDown, Award, DollarSign } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { CouponDialog } from "@/components/users/CouponDialog";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════
// 数据定义
// ═══════════════════════════════════════════════════════════════
const kpiData = [
  { title: "总用户数", value: "86,432", sub: "累计注册", icon: UsersIcon, color: "#7c3aed" },
  { title: "本周新增", value: "+1,285", trend: 18.6, icon: UserPlus, color: "#22c55e" },
  { title: "复购精英", value: "23.4%", sub: "复购>5次", icon: Award, color: "#f59e0b" },
  { title: "平均客单价", value: "¥28.5", trend: 5.2, icon: DollarSign, color: "#3b82f6" },
];

const segmentData = [
  { id: "new", name: "新用户", value: 2850, color: "#22c55e", icon: UserPlus, rule: "注册<7天", ruleDetail: "", strategy: "" },
  { id: "active", name: "活跃老客", value: 4200, color: "#7c3aed", icon: UsersIcon, rule: "7天内消费", ruleDetail: "", strategy: "" },
  { id: "sleeping", name: "沉睡用户", value: 1680, color: "#f59e0b", icon: Moon, rule: "15-30天未消费", ruleDetail: "", strategy: "" },
  { id: "lost", name: "流失用户", value: 920, color: "#ef4444", icon: UserX, rule: ">30天未消费", ruleDetail: "", strategy: "" },
];

const pieData = segmentData.map(s => ({ name: s.name, value: s.value, color: s.color }));
const pieTotal = pieData.reduce((sum, item) => sum + item.value, 0);

const trendData = [
  { week: "W1", rate: 42.5 }, { week: "W2", rate: 45.1 }, { week: "W3", rate: 43.8 }, { week: "W4", rate: 48.2 },
  { week: "W5", rate: 46.9 }, { week: "W6", rate: 51.3 }, { week: "W7", rate: 49.8 }, { week: "W8", rate: 52.6 },
];

const genderData = [{ name: "女", value: 58, color: "#7c3aed" }, { name: "男", value: 42, color: "#6B7280" }];
const regionData = [{ name: "政务区", value: 28 }, { name: "高新区", value: 24 }, { name: "滨湖区", value: 19 }, { name: "蜀山区", value: 16 }, { name: "包河区", value: 13 }];
const timeData = [{ name: "早 8-11", value: 28 }, { name: "午 11-14", value: 45 }, { name: "晚 14-18", value: 27 }];
const tasteData = [{ name: "美式", value: 35, color: "#22c55e" }, { name: "拿铁", value: 48, color: "#7c3aed" }, { name: "其他", value: 17, color: "#3f3f46" }];

// ═══════════════════════════════════════════════════════════════
// 第一层: KPI 卡片
// ═══════════════════════════════════════════════════════════════
function KPIRow() {
  return (
    <div className="grid grid-cols-4 gap-6 h-28">
      {kpiData.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.title} className="bg-[#121212] border border-[#333] rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1">{item.title}</p>
              <p className="font-mono text-2xl font-black text-white tabular-nums">{item.value}</p>
              {item.trend !== undefined && (
                <div className={cn("flex items-center gap-1 mt-1 text-xs font-mono", item.trend >= 0 ? "text-[#22c55e]" : "text-[#ef4444]")}>
                  {item.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {item.trend >= 0 ? "+" : ""}{item.trend}%
                </div>
              )}
              {item.sub && <p className="text-[10px] text-[#6B7280] mt-1">{item.sub}</p>}
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
              <Icon className="w-5 h-5" style={{ color: item.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 第二层: 人群分层 + 图表
// ═══════════════════════════════════════════════════════════════
function ActionZone() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<typeof segmentData[0] | null>(null);
  const total = segmentData.reduce((s, i) => s + i.value, 0);

  return (
    <div className="grid grid-cols-12 gap-6 h-72">
      {/* 左侧：2x2 人群卡片 */}
      <div className="col-span-4 grid grid-cols-2 gap-3">
        {segmentData.map((seg) => {
          const Icon = seg.icon;
          const pct = ((seg.value / total) * 100).toFixed(1);
          return (
            <div key={seg.id} className="bg-[#121212] border border-[#333] rounded-xl p-3 flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${seg.color}18` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: seg.color }} />
                </div>
                <span className="text-xs font-semibold text-white">{seg.name}</span>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="font-mono text-xl font-black text-white tabular-nums">{seg.value.toLocaleString()}</span>
                <span className="text-[10px] text-[#6B7280]">人</span>
                <span className="font-mono text-[10px] ml-auto px-1 py-0.5 rounded" style={{ color: seg.color, backgroundColor: `${seg.color}15` }}>{pct}%</span>
              </div>
              <Button
                size="sm"
                onClick={() => { setSelectedSegment(seg); setDialogOpen(true); }}
                className="w-full h-6 text-[10px] gap-1 mt-auto bg-[#7F00FF] hover:bg-[#6B00DB] text-white"
              >
                <Send className="w-2.5 h-2.5" /> 一键投券
              </Button>
            </div>
          );
        })}
      </div>

      {/* 右侧：饼图 + 折线图 */}
      <div className="col-span-8 grid grid-cols-2 gap-6">
        {/* 饼图 */}
        <div className="bg-[#121212] border border-[#333] rounded-xl p-4 flex flex-col">
          <h3 className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-2">用户构成</h3>
          <div className="flex-1 flex items-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius="40%" outerRadius="70%" dataKey="value" stroke="none">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2 pl-2">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[#9CA3AF]">{item.name}</span>
                  </div>
                  <span className="font-mono text-white tabular-nums">{((item.value / pieTotal) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 折线图 */}
        <div className="bg-[#121212] border border-[#333] rounded-xl p-4 flex flex-col">
          <h3 className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-2">复购趋势</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F1F23" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} domain={[40, 55]} />
                <Line type="monotone" dataKey="rate" stroke="#7c3aed" strokeWidth={2} dot={{ fill: "#7c3aed", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <CouponDialog open={dialogOpen} onOpenChange={setDialogOpen} segment={selectedSegment} onCouponSent={() => {}} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 第三层: 用户特征 (简化版 - 纯进度条和列表)
// ═══════════════════════════════════════════════════════════════
function InsightsRow() {
  return (
    <div className="grid grid-cols-4 gap-6 h-48">
      {/* 性别 */}
      <div className="bg-[#121212] border border-[#333] rounded-xl p-4 flex flex-col">
        <h4 className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-3">性别比例</h4>
        <div className="flex-1 flex flex-col justify-center space-y-3">
          {genderData.map((item) => (
            <div key={item.name} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[#9CA3AF]">{item.name}</span>
                <span className="font-mono font-bold tabular-nums" style={{ color: item.color }}>{item.value}%</span>
              </div>
              <div className="h-2 bg-[#1F1F23] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 区域 */}
      <div className="bg-[#121212] border border-[#333] rounded-xl p-4 flex flex-col">
        <h4 className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-3">区域 TOP5</h4>
        <div className="flex-1 flex flex-col justify-center space-y-2">
          {regionData.map((item, i) => (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[#6B7280] w-4">{i + 1}</span>
                <span className="text-[#9CA3AF]">{item.name}</span>
              </div>
              <span className="font-mono font-bold text-white tabular-nums">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* 时段 */}
      <div className="bg-[#121212] border border-[#333] rounded-xl p-4 flex flex-col">
        <h4 className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-3">购买时段</h4>
        <div className="flex-1 flex items-end justify-between gap-2 pb-2">
          {timeData.map((item) => (
            <div key={item.name} className="flex-1 flex flex-col items-center">
              <span className="font-mono text-sm font-bold text-white tabular-nums mb-1">{item.value}%</span>
              <div className="w-full bg-[#1F1F23] rounded-t" style={{ height: `${item.value * 2}px`, backgroundColor: item.value === 45 ? "#7c3aed" : "#3f3f46" }} />
              <span className="text-[9px] text-[#6B7280] mt-1 whitespace-nowrap">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 口味 */}
      <div className="bg-[#121212] border border-[#333] rounded-xl p-4 flex flex-col">
        <h4 className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-3">口味偏好</h4>
        <div className="flex-1 flex flex-col justify-center space-y-2">
          {tasteData.map((item) => (
            <div key={item.name} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[#9CA3AF]">{item.name}</span>
                <span className="font-mono font-bold tabular-nums" style={{ color: item.color }}>{item.value}%</span>
              </div>
              <div className="h-1.5 bg-[#1F1F23] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 主页面
// ═══════════════════════════════════════════════════════════════
export default function Users() {
  return (
    <div className="h-full flex flex-col gap-6 p-4 overflow-auto bg-black">
      <KPIRow />
      <ActionZone />
      <InsightsRow />
    </div>
  );
}
