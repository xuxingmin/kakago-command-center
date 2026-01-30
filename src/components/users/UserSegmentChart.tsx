import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Maximize2, Ticket, Users, UserPlus, Moon, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CouponDialog } from "./CouponDialog";

interface SegmentData {
  name: string;
  value: number;
  color: string;
  icon: React.ElementType;
  rule: string;
}

const segmentData: SegmentData[] = [
  { 
    name: "新用户", 
    value: 2850, 
    color: "#22c55e",
    icon: UserPlus,
    rule: "注册<7天 且 订单≤1"
  },
  { 
    name: "活跃老客", 
    value: 4200, 
    color: "#7c3aed",
    icon: Users,
    rule: "累计订单≥3 且 7天内有消费"
  },
  { 
    name: "沉睡用户", 
    value: 1680, 
    color: "#f59e0b",
    icon: Moon,
    rule: "15-30天未消费"
  },
  { 
    name: "流失用户", 
    value: 920, 
    color: "#ef4444",
    icon: UserX,
    rule: ">30天未消费"
  },
];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: SegmentData }> }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-[#121212] border border-[#2A2A2E] rounded-lg px-3 py-2 shadow-xl">
        <div className="flex items-center gap-2">
          <div 
            className="w-2.5 h-2.5 rounded-full" 
            style={{ backgroundColor: data.payload.color }}
          />
          <span className="text-xs text-[#9CA3AF]">{data.name}</span>
        </div>
        <div className="font-mono text-sm font-bold text-white mt-1">
          {data.value.toLocaleString()} 人
        </div>
        <div className="text-[10px] text-[#6B7280] mt-1 border-t border-[#2A2A2E] pt-1">
          {data.payload.rule}
        </div>
      </div>
    );
  }
  return null;
};

export function UserSegmentChart() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<SegmentData | null>(null);
  
  const total = segmentData.reduce((sum, item) => sum + item.value, 0);

  const handleCouponClick = (segment: SegmentData) => {
    setSelectedSegment(segment);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="bg-[#121212] border border-[#2A2A2E] rounded-lg p-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">用户分层</h3>
          <button className="p-1.5 rounded hover:bg-[#1F1F23] transition-colors">
            <Maximize2 className="w-3.5 h-3.5 text-[#9CA3AF]" />
          </button>
        </div>
        
        <div className="flex-1 flex items-center gap-4">
          {/* 饼图 */}
          <div className="w-2/5 h-full min-h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
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
          
          {/* 分层详情卡片 */}
          <div className="w-3/5 space-y-2">
            {segmentData.map((item) => {
              const Icon = item.icon;
              const percentage = ((item.value / total) * 100).toFixed(1);
              return (
                <div 
                  key={item.name} 
                  className="flex items-center justify-between p-2 rounded-lg bg-[#0A0A0A] border border-[#2A2A2E] hover:border-[#333333] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-7 h-7 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: `${item.color}20` }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-white">{item.name}</span>
                        <span className="font-mono text-xs font-bold text-white tabular-nums">
                          {percentage}%
                        </span>
                      </div>
                      <span className="text-[10px] text-[#6B7280]">{item.rule}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleCouponClick(item)}
                    className="h-7 px-2.5 bg-primary hover:bg-primary/90 text-white text-[10px] gap-1"
                  >
                    <Ticket className="w-3 h-3" />
                    投券
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <CouponDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        segment={selectedSegment}
      />
    </>
  );
}
