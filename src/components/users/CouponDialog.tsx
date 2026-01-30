import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Ticket, Gift, Zap, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CouponOption {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const couponOptions: CouponOption[] = [
  {
    id: "experience",
    name: "9.9元体验券",
    description: "新用户专享，任意饮品立减",
    icon: Ticket,
    color: "#22c55e"
  },
  {
    id: "discount",
    name: "满15减5元券",
    description: "满15元可用，限时3天有效",
    icon: Gift,
    color: "#f59e0b"
  },
  {
    id: "points",
    name: "双倍积分卡",
    description: "消费获得双倍KAKA豆，7天有效",
    icon: Zap,
    color: "#7c3aed"
  }
];

interface CouponDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segment: { name: string; value: number; color: string } | null;
}

export function CouponDialog({ open, onOpenChange, segment }: CouponDialogProps) {
  const [selectedCoupon, setSelectedCoupon] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedCoupon || !segment) return;
    
    setIsSubmitting(true);
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const coupon = couponOptions.find(c => c.id === selectedCoupon);
    toast.success(`已成功向 ${segment.value.toLocaleString()} 位${segment.name}投放「${coupon?.name}」`, {
      description: "预计10分钟内完成推送",
      icon: <CheckCircle className="w-4 h-4 text-success" />
    });
    
    setIsSubmitting(false);
    setSelectedCoupon("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#121212] border-[#2A2A2E] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            一键投放营销券
          </DialogTitle>
          <DialogDescription className="text-[#9CA3AF]">
            向 
            <span 
              className="font-bold mx-1"
              style={{ color: segment?.color }}
            >
              {segment?.name}
            </span>
            ({segment?.value.toLocaleString()} 人) 投放优惠券
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
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
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                      "bg-[#0A0A0A] border-[#2A2A2E] hover:border-[#444444]",
                      isSelected && "border-primary bg-primary/5"
                    )}
                  >
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${coupon.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: coupon.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{coupon.name}</div>
                      <div className="text-xs text-[#6B7280]">{coupon.description}</div>
                    </div>
                    <div 
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                        isSelected ? "border-primary bg-primary" : "border-[#444444]"
                      )}
                    >
                      {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="bg-transparent border-[#2A2A2E] text-[#9CA3AF] hover:bg-[#1F1F23] hover:text-white"
          >
            取消
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedCoupon || isSubmitting}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {isSubmitting ? "投放中..." : "确认投放"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
