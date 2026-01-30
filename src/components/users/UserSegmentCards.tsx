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
      {/* 2x2 网格布局 */}
      <div className="grid grid-cols-2 grid-rows-2 gap-3 h-full">
        {segmentData.map((item) => {
          const Icon = item.icon;
          const percentage = ((item.value / total) * 100).toFixed(1);
          const isMarketing = marketingSegments.has(item.id);
          
          return (
            <div 
              key={item.id} 
              className={cn(
                "relative flex flex-col justify-between p-3 rounded-xl",
                "bg-[#121212] border border-[#2A2A2E] hover:border-[#3A3A3E]",
                "transition-all duration-200 overflow-hidden"
              )}
            >
              {/* 营销中标记 - 右上角小标签 */}
              {isMarketing && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#7F00FF]/20 border border-[#7F00FF]/50">
                  <Megaphone className="w-2.5 h-2.5 text-[#7F00FF] animate-pulse" />
                  <span className="text-[8px] text-[#7F00FF] font-semibold">营销中</span>
                </div>
              )}
              
              {/* 上部：图标 + 信息 */}
              <div className="flex items-start gap-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${item.color}18` }}
                >
                  <Icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white truncate">{item.name}</span>
                    <span 
                      className="font-mono text-[10px] font-bold tabular-nums px-1 py-0.5 rounded flex-shrink-0"
                      style={{ color: item.color, backgroundColor: `${item.color}15` }}
                    >
                      {percentage}%
                    </span>
                  </div>
                  <div className="font-mono text-base font-black text-white tabular-nums leading-tight">
                    {item.value.toLocaleString()}
                    <span className="text-[10px] text-[#6B7280] font-normal ml-0.5">人</span>
                  </div>
                </div>
              </div>

              {/* 下部：投券按钮 */}
              <Button
                size="sm"
                onClick={() => handleCouponClick(item)}
                className={cn(
                  "w-full h-7 text-[10px] gap-1.5 font-semibold mt-2",
                  "bg-[#7F00FF] hover:bg-[#6B00DB] text-white",
                  "shadow-lg shadow-[#7F00FF]/20 hover:shadow-[#7F00FF]/30",
                  "transition-all duration-200"
                )}
              >
                <Send className="w-3 h-3" />
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
