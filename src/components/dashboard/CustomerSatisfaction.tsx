import { Star, MessageSquare, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

// 模拟评价数据
const recentReviews = [
  { id: 1, user: "张*明", rating: 5, comment: "咖啡口感很好，配送也快，下次还会回购！", time: "10分钟前" },
  { id: 2, user: "李*华", rating: 4, comment: "拿铁不错，但冰块放太多了，希望改进。", time: "25分钟前" },
  { id: 3, user: "王*红", rating: 5, comment: "美式很正宗，包装也很用心，好评！", time: "1小时前" },
];

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            size === "lg" ? "w-5 h-5" : "w-3 h-3",
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}

export function CustomerSatisfaction() {
  const avgRating = 4.9;
  const totalReviews = 1247;
  const positiveRate = 96.8;

  return (
    <div className="bg-card border border-secondary rounded-lg p-4 h-full flex flex-col">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ThumbsUp className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">客户满意度</span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          今日 {totalReviews} 条评价
        </span>
      </div>

      {/* 评分概览 */}
      <div className="flex items-center gap-4 mb-4 pb-3 border-b border-secondary">
        <div className="flex items-center gap-2">
          <span className="numeric text-3xl font-bold text-primary">{avgRating}</span>
          <div className="flex flex-col">
            <StarRating rating={Math.round(avgRating)} size="lg" />
            <span className="text-[10px] text-muted-foreground mt-0.5">平均评分</span>
          </div>
        </div>
        <div className="h-10 w-px bg-secondary" />
        <div className="flex flex-col">
          <span className="numeric text-lg font-semibold text-success">{positiveRate}%</span>
          <span className="text-[10px] text-muted-foreground">好评率</span>
        </div>
      </div>

      {/* 最新评价 */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          最新评价
        </span>
        {recentReviews.map((review) => (
          <div
            key={review.id}
            className="p-2 rounded bg-background/50 border border-secondary/50 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground">{review.user}</span>
                <StarRating rating={review.rating} />
              </div>
              <span className="text-[10px] text-muted-foreground">{review.time}</span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
