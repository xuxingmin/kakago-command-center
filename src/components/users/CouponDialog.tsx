import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Gift, Sparkles, Heart, Zap, Loader2, Coffee, Percent, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CouponOption {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
}

// 根据用户分层定义不同的券种
const couponsBySegment: Record<string, CouponOption[]> = {
  new: [
    { id: "buy1get1", name: "买一赠一券", description: "首单专享，锁定口味偏好", icon: Gift },
    { id: "big_discount", name: "满30减15元券", description: "大额满减，促进二次留存", icon: Percent },
    { id: "welcome", name: "新人9.9元尝鲜券", description: "低门槛体验，快速转化", icon: Star },
  ],
  active: [
    { id: "new_product", name: "新品尝鲜券", description: "限时新品5折，保持新鲜感", icon: Sparkles },
    { id: "double_points", name: "KAKA豆双倍积分", description: "消费即享双倍积分，增强互动", icon: Zap },
    { id: "member_day", name: "会员专属日8折", description: "专属优惠，提升尊贵感", icon: Coffee },
  ],
  sleeping: [
    { id: "miss_you", name: "「我想你了」5折券", description: "专属唤醒券，限时3天有效", icon: Heart },
    { id: "comeback_5", name: "回归5元无门槛券", description: "零门槛使用，快速激活", icon: Gift },
    { id: "free_upgrade", name: "免费升杯券", description: "中杯价格享大杯，唤醒消费记忆", icon: Sparkles },
  ],
  lost: [
    { id: "heavy_return", name: "重磅回流礼包", description: "连续3天9.9元单杯券", icon: Gift },
    { id: "super_discount", name: "超级折扣3折券", description: "限时3折，强力召回", icon: Percent },
    { id: "free_drink", name: "免费饮品券", description: "直接赠饮一杯，诚意召回", icon: Coffee },
  ],
};

const strategyBySegment: Record<string, { title: string; description: string }> = {
  new: { title: "首单转化策略", description: "通过连续两单锁定口味偏好，建立消费习惯" },
  active: { title: "保持互动策略", description: "无需大额降价，重在新品体验和积分互动" },
  sleeping: { title: "精准激活策略", description: "这是投券的重点，发送专属券唤醒购买记忆" },
  lost: { title: "深度召回策略", description: "通过高强度补贴强行拉回，重建消费关系" },
};

interface SegmentInfo {
  id: string;
  name: string;
  value: number;
  color: string;
  ruleDetail?: string;
  strategy?: string;
}

interface CouponDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segment: SegmentInfo | null;
  onCouponSent?: (segmentId: string) => void;
}

export function CouponDialog({ open, onOpenChange, segment, onCouponSent }: CouponDialogProps) {
  const [selectedCoupon, setSelectedCoupon] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const couponOptions = segment ? couponsBySegment[segment.id] || [] : [];
  const strategy = segment ? strategyBySegment[segment.id] : null;

  const handleSubmit = async () => {
    if (!selectedCoupon || !segment) return;
    
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const coupon = couponOptions.find(c => c.id === selectedCoupon);
    toast.success(`营销指令已下达！`, {
      description: `正在向 ${segment.value.toLocaleString()} 名${segment.name}派送「${coupon?.name}」`,
      style: {
        background: "#0A0A0A",
        border: "1px solid #7F00FF",
        color: "#FFFFFF",
      },
      duration: 4000,
    });
    
    onCouponSent?.(segment.id);
    setIsSubmitting(false);
    setSelectedCoupon("");
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedCoupon("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0A0A0A]/95 backdrop-blur-xl border-[#2A2A2E] sm:max-w-md p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b border-[#2A2A2E]">
          <DialogTitle className="text-base font-semibold text-white">
            针对【<span style={{ color: segment?.color }}>{segment?.name}</span>】精准营销
          </DialogTitle>
          {strategy && (
            <p className="text-xs text-[#6B7280] mt-1">{strategy.title} · {strategy.description}</p>
          )}
        </DialogHeader>

        <div className="p-5 space-y-4">
          {/* 统计信息 */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#1A1A1A] border border-[#2A2A2E]">
            <span className="text-xs text-[#9CA3AF]">目标用户</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-black text-white tabular-nums">
                {segment?.value.toLocaleString()}
              </span>
              <span className="text-xs text-[#6B7280]">人</span>
            </div>
          </div>

          {/* 券种选择 */}
          <div>
            <h4 className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-2">选择营销券种</h4>
            <RadioGroup value={selectedCoupon} onValueChange={setSelectedCoupon} className="space-y-2">
              {couponOptions.map((coupon) => {
                const Icon = coupon.icon;
                const isSelected = selectedCoupon === coupon.id;
                return (
                  <div key={coupon.id}>
                    <RadioGroupItem value={coupon.id} id={coupon.id} className="peer sr-only" />
                    <Label
                      htmlFor={coupon.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                        "bg-[#121212] border hover:border-[#444444]",
                        isSelected ? "border-[#7F00FF] bg-[#7F00FF]/5" : "border-[#2A2A2E]"
                      )}
                    >
                      <div 
                        className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                          isSelected ? "bg-[#7F00FF]/20" : "bg-[#1F1F23]"
                        )}
                      >
                        <Icon className={cn(
                          "w-4 h-4 transition-colors",
                          isSelected ? "text-[#7F00FF]" : "text-[#6B7280]"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn(
                          "text-sm font-medium transition-colors",
                          isSelected ? "text-white" : "text-[#9CA3AF]"
                        )}>
                          {coupon.name}
                        </div>
                        <div className="text-[11px] text-[#6B7280] truncate">{coupon.description}</div>
                      </div>
                      <div 
                        className={cn(
                          "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
                          isSelected ? "border-[#7F00FF] bg-[#7F00FF]" : "border-[#444444]"
                        )}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-5 pt-3 border-t border-[#2A2A2E] gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="flex-1 h-10 bg-transparent border-[#2A2A2E] text-[#9CA3AF] hover:bg-[#1F1F23] hover:text-white text-xs"
          >
            取消
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedCoupon || isSubmitting}
            className={cn(
              "flex-1 h-10 text-xs font-medium",
              "bg-[#7F00FF] hover:bg-[#6B00DB] text-white",
              "disabled:bg-[#2A2A2E] disabled:text-[#6B7280]"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                发放中...
              </>
            ) : (
              <>立即发放</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
