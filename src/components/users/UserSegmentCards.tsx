import { useState } from "react";
import { Send, Users, UserPlus, Moon, UserX, Megaphone } from "lucide-react";
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
    rule: "订单≥3 且 7天内消费",
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

export function UserSegmentCards() {
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
      <div className="grid grid-cols-4 gap-3 h-full">
        {segmentData.map((item) => {
          const Icon = item.icon;
          const percentage = ((item.value / total) * 100).toFixed(1);
          const isMarketing = marketingSegments.has(item.id);
          
          return (
            <div 
              key={item.id} 
              className={cn(
                "relative flex flex-col justify-between p-4 rounded-xl",
                "bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D]",
                "border border-[#2A2A2E] hover:border-[#3A3A3E]",
                "transition-all duration-300 group"
              )}
            >
              {/* 营销中标记 */}
              {isMarketing && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-[#7F00FF]/20 border border-[#7F00FF]/40">
                  <Megaphone className="w-3 h-3 text-[#7F00FF] animate-pulse" />
                  <span className="text-[10px] text-[#7F00FF] font-medium">营销中</span>
                </div>
              )}
              
              {/* 顶部：图标和标签 */}
              <div className="flex items-start justify-between mb-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ 
                    backgroundColor: `${item.color}15`,
                    boxShadow: `0 0 20px ${item.color}20`
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <span 
                  className="font-mono text-sm font-bold tabular-nums px-2 py-0.5 rounded-md"
                  style={{ 
                    color: item.color,
                    backgroundColor: `${item.color}10`
                  }}
                >
                  {percentage}%
                </span>
              </div>

              {/* 中间：数值 */}
              <div className="mb-3">
                <div className="font-mono text-2xl font-black text-white tabular-nums tracking-tight">
                  {item.value.toLocaleString()}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-medium text-white">{item.name}</span>
                </div>
                <span className="text-[11px] text-[#6B7280] mt-1 block">{item.rule}</span>
              </div>

              {/* 底部：投券按钮 */}
              <Button
                size="sm"
                onClick={(e) => handleCouponClick(e, item)}
                className={cn(
                  "w-full h-9 text-xs gap-2 font-semibold",
                  "bg-[#7F00FF] hover:bg-[#6B00DB] text-white",
                  "shadow-lg shadow-[#7F00FF]/25 hover:shadow-[#7F00FF]/40",
                  "transition-all duration-300"
                )}
              >
                <Send className="w-3.5 h-3.5" />
                一键投券
              </Button>

              {/* 装饰性渐变边框 */}
              <div 
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, ${item.color}10 0%, transparent 50%)`,
                }}
              />
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
