import { useState } from "react";
import { Send, Megaphone } from "lucide-react";
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

interface SegmentCardProps {
  segment: SegmentData;
  total: number;
}

export function SegmentCard({ segment, total }: SegmentCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isMarketing, setIsMarketing] = useState(false);
  
  const Icon = segment.icon;
  const percentage = ((segment.value / total) * 100).toFixed(1);

  const handleCouponSent = () => {
    setIsMarketing(true);
  };

  return (
    <>
      <div 
        className={cn(
          "relative flex flex-col p-3 rounded-xl h-full",
          "bg-[#121212] border border-[#2A2A2E] hover:border-[#3A3A3E]",
          "transition-all duration-200 overflow-hidden"
        )}
      >
        {isMarketing && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#7F00FF]/20 border border-[#7F00FF]/50">
            <Megaphone className="w-2.5 h-2.5 text-[#7F00FF] animate-pulse" />
            <span className="text-[8px] text-[#7F00FF] font-semibold">营销中</span>
          </div>
        )}
        
        {/* 顶部：图标+名称+百分比 - 横向排列 */}
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${segment.color}18` }}
          >
            <Icon className="w-4 h-4" style={{ color: segment.color }} />
          </div>
          <span className="text-sm font-semibold text-white whitespace-nowrap">{segment.name}</span>
          <span 
            className="font-mono text-xs font-bold tabular-nums px-1.5 py-0.5 rounded ml-auto flex-shrink-0"
            style={{ color: segment.color, backgroundColor: `${segment.color}15` }}
          >
            {percentage}%
          </span>
        </div>

        {/* 中间：数值 */}
        <div className="flex-1 flex items-center">
          <div className="font-mono text-2xl font-black text-white tabular-nums">
            {segment.value.toLocaleString()}
            <span className="text-sm text-[#6B7280] font-normal ml-1">人</span>
          </div>
        </div>

        {/* 底部：按钮 */}
        <Button
          size="sm"
          onClick={() => setDialogOpen(true)}
          className={cn(
            "w-full h-7 text-xs gap-1 font-semibold mt-2",
            "bg-[#7F00FF] hover:bg-[#6B00DB] text-white",
            "shadow-lg shadow-[#7F00FF]/20",
            "transition-all duration-200"
          )}
        >
          <Send className="w-3 h-3" />
          一键投券
        </Button>
      </div>

      <CouponDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        segment={segment}
        onCouponSent={handleCouponSent}
      />
    </>
  );
}
