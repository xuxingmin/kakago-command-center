import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Maximize2, Send, Users, UserPlus, Moon, UserX, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CouponDialog } from "./CouponDialog";
import { cn } from "@/lib/utils";

interface SegmentData {
  id: string;
  name: string;
  value: number;
  color: string;
  icon: React.ElementType;
  rule: string;
  ruleDetail: string;
}

const segmentData: SegmentData[] = [
  { 
    id: "new",
    name: "新用户", 
    value: 2850, 
    color: "#22c55e",
    icon: UserPlus,
    rule: "注册<7天 且 订单≤1",
    ruleDetail: "注册不足7天且订单数≤1"
  },
  { 
    id: "active",
    name: "活跃老客", 
    value: 4200, 
    color: "#7c3aed",
    icon: Users,
    rule: "累计订单≥3 且 7天内有消费",
    ruleDetail: "累计订单≥3次且7天内有消费"
  },
  { 
    id: "sleeping",
    name: "沉睡用户", 
    value: 1680, 
    color: "#f59e0b",
    icon: Moon,
    rule: "15-30天未消费",
    ruleDetail: "15-30天未下单"
  },
  { 
    id: "lost",
    name: "流失用户", 
    value: 920, 
    color: "#ef4444",
    icon: UserX,
    rule: ">30天未消费",
    ruleDetail: "超过30天未下单"
  },
];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: SegmentData }> }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-[#121212] border border-[#2A2A2E] rounded-lg px-3 py-2 shadow-xl backdrop-blur-md">
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
  const [marketingSegments, setMarketingSegments] = useState<Set<string>>(new Set());
  
  const total = segmentData.reduce((sum, item) => sum + item.value, 0);

  const handleCouponClick = (e: React.MouseEvent, segment: SegmentData) => {
    e.stopPropagation();
    setSelectedSegment(segment);
    setDialogOpen(true);
  };

  const handleCouponSent = (segmentId: string) => {
    setMarketingSegments(prev => new Set([...prev, segmentId]));
  };

  return (
    <>
      <div className="bg-[#121212] border border-[#2A2A2E] rounded-lg p-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">人群筛分</h3>
          <button className="p-1.5 rounded hover:bg-[#1F1F23] transition-colors">
            <Maximize2 className="w-3.5 h-3.5 text-[#9CA3AF]" />
          </button>
        </div>
        
        <div className="flex-1 flex items-center gap-4">
          {/* 饼图 */}
          <div className="w-2/5 h-full min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
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
          
          {/* 分层详情卡片 - 可点击 */}
          <div className="w-3/5 space-y-2">
            {segmentData.map((item) => {
              const Icon = item.icon;
              const percentage = ((item.value / total) * 100).toFixed(1);
              const isMarketing = marketingSegments.has(item.id);
              
              return (
                <div 
                  key={item.name} 
                  className={cn(
                    "relative p-3 rounded-lg bg-[#1A1A1A] border-[0.5px] border-[#2A2A2E]",
                    "hover:border-[#444444] transition-all cursor-pointer group"
                  )}
                >
                  {/* 营销中标记 */}
                  {isMarketing && (
                    <div className="absolute -top-1 -right-1 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/20 border border-primary/40">
                      <Megaphone className="w-2.5 h-2.5 text-primary animate-pulse" />
                      <span className="text-[9px] text-primary font-medium">营销中</span>
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between">
                    {/* 左侧信息 */}
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${item.color}15` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: item.color }} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{item.name}</span>
                          <span 
                            className="font-mono text-xs font-bold tabular-nums"
                            style={{ color: item.color }}
                          >
                            {percentage}%
                          </span>
                        </div>
                        <div className="font-mono text-lg font-extrabold text-white tabular-nums mt-0.5">
                          {item.value.toLocaleString()}
                          <span className="text-xs text-[#6B7280] font-normal ml-1">人</span>
                        </div>
                        <span className="text-[10px] text-[#6B7280]">{item.rule}</span>
                      </div>
                    </div>
                    
                    {/* 右下角按钮 */}
                    <Button
                      size="sm"
                      onClick={(e) => handleCouponClick(e, item)}
                      className={cn(
                        "h-8 px-3 text-xs gap-1.5 font-medium",
                        "bg-[#7F00FF] hover:bg-[#6B00DB] text-white",
                        "shadow-lg shadow-primary/20"
                      )}
                    >
                      <Send className="w-3.5 h-3.5" />
                      一键投券
                    </Button>
                  </div>
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
        onCouponSent={handleCouponSent}
      />
    </>
  );
}
