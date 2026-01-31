import { useState, useEffect } from "react";
import { Star, MessageSquare, ThumbsUp, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  time: string;
}

interface DBReview {
  id: string;
  customer_name: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

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
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [positiveRate, setPositiveRate] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from("reviews")
        .select("*")
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        const reviews: Review[] = (data as DBReview[]).map((r) => ({
          id: r.id,
          user: r.customer_name || "匿名",
          rating: r.rating,
          comment: r.comment || "",
          time: new Date(r.created_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
        }));
        
        setRecentReviews(reviews.slice(0, 5));
        setTotalReviews(data.length);
        
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAvgRating(Math.round(avg * 10) / 10);
        
        const positive = data.filter((r) => r.rating >= 4).length;
        setPositiveRate(Math.round((positive / data.length) * 100));
      } else {
        setRecentReviews([]);
        setTotalReviews(0);
        setAvgRating(0);
        setPositiveRate(0);
      }
    };

    fetchReviews();

    const channel = supabase
      .channel("reviews-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => {
        fetchReviews();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

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
          <span className="numeric text-3xl font-bold text-muted-foreground">{avgRating > 0 ? avgRating : "-"}</span>
          <div className="flex flex-col">
            <StarRating rating={Math.round(avgRating)} size="lg" />
            <span className="text-[10px] text-muted-foreground mt-0.5">平均评分</span>
          </div>
        </div>
        <div className="h-10 w-px bg-secondary" />
        <div className="flex flex-col">
          <span className="numeric text-lg font-semibold text-muted-foreground">{positiveRate > 0 ? `${positiveRate}%` : "-"}</span>
          <span className="text-[10px] text-muted-foreground">好评率</span>
        </div>
      </div>

      {/* 最新评价 */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          最新评价
        </span>
        {recentReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-4">
            <Inbox className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-xs">暂无评价数据</span>
            <span className="text-[10px] opacity-60">等待接入评价系统</span>
          </div>
        ) : (
          recentReviews.map((review) => (
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
          ))
        )}
      </div>
    </div>
  );
}
