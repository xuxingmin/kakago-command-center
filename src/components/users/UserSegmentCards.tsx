import { useState } from "react";
import { Send, Users, UserPlus, Moon, UserX, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CouponDialog } from "./CouponDialog";
import { cn } from "@/lib/utils";

export interface SegmentData {
  id: string;
  name: string;
  value: number;
  color: string;
  icon: React.ElementType;
  rule: string;
  ruleDetail: string;
  strategy: string;
}

export const segmentData: SegmentData[] = [
  { 
    id: "new",
    name: "新用户", 
    value: 2850, 
    color: "#22c55e",
    icon: UserPlus,
    rule: "注册<7天 且 订单≤1",
    ruleDetail: "注册不足7天且订单数≤1",
    strategy: "首单转化/二次留存"
  },
  { 
    id: "active",
    name: "活跃老客", 
    value: 4200, 
    color: "#7c3aed",
    icon: Users,
    rule: "订单≥3 且 7天内消费",
    ruleDetail: "累计订单≥3次且7天内有消费",
    strategy: "保持记忆/新品转化"
  },
  { 
    id: "sleeping",
    name: "沉睡用户", 
    value: 1680, 
    color: "#f59e0b",
    icon: Moon,
    rule: "15-30天未消费",
    ruleDetail: "15-30天未下单",
    strategy: "精准激活"
  },
  { 
    id: "lost",
    name: "流失用户", 
    value: 920, 
    color: "#ef4444",
    icon: UserX,
    rule: ">30天未消费",
    ruleDetail: "超过30天未下单",
    strategy: "深度召回"
  },
];

export function UserSegmentCards() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<SegmentData | null>(null);
  const [marketingSegments, setMarketingSegments] = useState<Set<string>>(new Set());
  
  const total = segmentData.reduce((sum, item) => sum + item.value, 0);

  const handleCouponClick = (segment: SegmentData) => {
    setSelectedSegment(segment);
    setDialogOpen(true);
  };

  const handleCouponSent = (segmentId: string) => {
    setMarketingSegments(prev => new Set([...prev, segmentId]));
  };

  return (
    <>
      <div className="grid grid-cols-4 gap-3 h-full">
        {segmentData.map((item) => {
          const Icon = item.icon;
          const percentage = ((item.value / total) * 100).toFixed(1);
          const isMarketing = marketingSegments.has(item.id);
          
          return (
            <div 
              key={item.id} 
              className={cn(
                "relative flex items-center justify-between px-4 py-3 rounded-xl",
                "bg-[#121212] border border-[#2A2A2E] hover:border-[#3A3A3E]",
                "transition-all duration-200"
              )}
            >
              {/* 营销中标记 */}
              {isMarketing && (
                <div className="absolute -top-1.5 -right-1.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#7F00FF]/20 border border-[#7F00FF]/50 z-10">
                  <Megaphone className="w-3 h-3 text-[#7F00FF] animate-pulse" />
                  <span className="text-[9px] text-[#7F00FF] font-semibold">营销中</span>
                </div>
              )}
              
              {/* 左侧：图标 + 信息 */}
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${item.color}18` }}
                >
                  <Icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{item.name}</span>
                    <span 
                      className="font-mono text-xs font-bold tabular-nums px-1.5 py-0.5 rounded"
                      style={{ color: item.color, backgroundColor: `${item.color}15` }}
                    >
                      {percentage}%
                    </span>
                  </div>
                  <div className="font-mono text-lg font-black text-white tabular-nums leading-tight">
                    {item.value.toLocaleString()}
                    <span className="text-xs text-[#6B7280] font-normal ml-1">人</span>
                  </div>
                </div>
              </div>

              {/* 右侧：投券按钮 */}
              <Button
                size="sm"
                onClick={() => handleCouponClick(item)}
                className={cn(
                  "h-9 px-4 text-xs gap-2 font-semibold flex-shrink-0",
                  "bg-[#7F00FF] hover:bg-[#6B00DB] text-white",
                  "shadow-lg shadow-[#7F00FF]/20 hover:shadow-[#7F00FF]/30",
                  "transition-all duration-200"
                )}
              >
                <Send className="w-3.5 h-3.5" />
                一键投券
              </Button>
            </div>
          );
        })}
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
