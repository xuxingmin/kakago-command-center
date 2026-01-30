import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Ticket, Users2, Percent, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CouponOption {
  id: string;
  name: string;
  suggestion: string;
  icon: React.ElementType;
}

const couponOptions: CouponOption[] = [
  {
    id: "free5",
    name: "5元无门槛回流券",
    suggestion: "建议用于：快速唤醒购买欲望",
    icon: Ticket,
  },
  {
    id: "half",
    name: "第二杯半价券",
    suggestion: "建议用于：带动好友社交回流",
    icon: Users2,
  },
  {
    id: "discount",
    name: "全场8.5折折扣券",
    suggestion: "建议用于：习惯性回购引导",
    icon: Percent,
  }
];

interface SegmentInfo {
  id: string;
  name: string;
  value: number;
  color: string;
  ruleDetail?: string;
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

  const handleSubmit = async () => {
    if (!selectedCoupon || !segment) return;
    
    setIsSubmitting(true);
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("营销指令已下达，优惠券正在派送中...", {
      style: {
        background: "#1A1A1A",
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

  // 根据分层类型获取规则描述
  const getRuleDescription = () => {
    if (!segment) return "";
    const rules: Record<string, string> = {
      "新用户": "注册不足7天且订单数≤1",
      "活跃老客": "累计订单≥3次且7天内有消费",
      "沉睡用户": "15-30天未下单",
      "流失用户": "超过30天未下单",
    };
    return rules[segment.name] || segment.ruleDetail || "";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0A0A0A]/95 backdrop-blur-xl border-[#2A2A2E] sm:max-w-lg p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-[#2A2A2E]">
          <DialogTitle className="text-lg font-semibold text-white">
            针对【<span style={{ color: segment?.color }}>{segment?.name}</span>】执行精准营销
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* 统计信息 */}
          <div className="p-4 rounded-lg bg-[#1A1A1A] border border-[#2A2A2E]">
            <p className="text-sm text-[#9CA3AF]">
              检测到当前共有{" "}
              <span className="font-mono text-xl font-extrabold text-white mx-1">
                {segment?.value.toLocaleString()}
              </span>{" "}
              名<span style={{ color: segment?.color }} className="font-medium">{segment?.name}</span>
              <span className="text-[#6B7280]">（{getRuleDescription()}）</span>
            </p>
          </div>

          {/* 券种选择 */}
          <div>
            <h4 className="text-xs text-[#6B7280] uppercase tracking-wider mb-3">选择营销券种</h4>
            <RadioGroup value={selectedCoupon} onValueChange={setSelectedCoupon} className="space-y-3">
              {couponOptions.map((coupon) => {
                const Icon = coupon.icon;
                const isSelected = selectedCoupon === coupon.id;
                return (
                  <div key={coupon.id}>
                    <RadioGroupItem value={coupon.id} id={coupon.id} className="peer sr-only" />
                    <Label
                      htmlFor={coupon.id}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all",
                        "bg-[#121212] border-2 hover:border-[#444444]",
                        isSelected 
                          ? "border-[#7F00FF] bg-[#7F00FF]/5" 
                          : "border-[#2A2A2E]"
                      )}
                    >
                      <div 
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                          isSelected ? "bg-[#7F00FF]/20" : "bg-[#1F1F23]"
                        )}
                      >
                        <Icon className={cn(
                          "w-5 h-5 transition-colors",
                          isSelected ? "text-[#7F00FF]" : "text-[#6B7280]"
                        )} />
                      </div>
                      <div className="flex-1">
                        <div className={cn(
                          "text-sm font-medium transition-colors",
                          isSelected ? "text-white" : "text-[#9CA3AF]"
                        )}>
                          {coupon.name}
                        </div>
                        <div className="text-xs text-[#6B7280] mt-0.5">{coupon.suggestion}</div>
                      </div>
                      <div 
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                          isSelected 
                            ? "border-[#7F00FF] bg-[#7F00FF]" 
                            : "border-[#444444]"
                        )}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-6 pt-4 border-t border-[#2A2A2E] gap-3">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="flex-1 h-11 bg-transparent border-[#2A2A2E] text-[#9CA3AF] hover:bg-[#1F1F23] hover:text-white"
          >
            取消
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedCoupon || isSubmitting}
            className={cn(
              "flex-1 h-11 font-medium",
              "bg-[#7F00FF] hover:bg-[#6B00DB] text-white",
              "disabled:bg-[#2A2A2E] disabled:text-[#6B7280]"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                发放中...
              </>
            ) : (
              <>立即发放给 {segment?.value.toLocaleString()} 名用户</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
