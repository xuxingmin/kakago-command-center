import { useState, useEffect } from "react";
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  customer_name: string | null;
  created_at: string;
  store_id: string;
}

interface RatingBucket {
  rating: number;
  count: number;
}

export function ReviewStatsPanel() {
  const [buckets, setBuckets] = useState<RatingBucket[]>([]);
  const [total, setTotal] = useState(0);
  const [avg, setAvg] = useState(0);
  const [positiveRate, setPositiveRate] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("reviews").select("rating");
      if (!data || data.length === 0) {
        setBuckets([]);
        setTotal(0);
        setAvg(0);
        setPositiveRate(0);
        return;
      }
      setTotal(data.length);
      const sum = data.reduce((s, r) => s + r.rating, 0);
      setAvg(Math.round((sum / data.length) * 10) / 10);
      const pos = data.filter((r) => r.rating >= 4).length;
      setPositiveRate(Math.round((pos / data.length) * 100));

      const map: Record<number, number> = {};
      data.forEach((r) => { map[r.rating] = (map[r.rating] || 0) + 1; });
      const b: RatingBucket[] = [5, 4, 3, 2, 1].map((r) => ({ rating: r, count: map[r] || 0 }));
      setBuckets(b);
    };
    fetch();

    const channel = supabase
      .channel("reviews-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (total === 0) {
    return (
      <div className="bg-[#121212] border border-[#333] rounded-xl p-4 flex flex-col items-center justify-center h-full">
        <Inbox className="w-8 h-8 text-[#6B7280] mb-2" />
        <span className="text-xs text-[#6B7280]">暂无评价数据</span>
      </div>
    );
  }

  return (
    <div className="bg-[#121212] border border-[#333] rounded-xl p-4 flex flex-col h-full">
      <h3 className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <ThumbsUp className="w-3 h-3" /> 用户评价统计
      </h3>

      {/* Summary row */}
      <div className="flex items-center gap-4 mb-3 pb-3 border-b border-[#333]">
        <div className="text-center">
          <p className="font-mono text-3xl font-black text-white tabular-nums">{avg}</p>
          <div className="flex items-center justify-center gap-0.5 mt-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={cn("w-3 h-3", s <= Math.round(avg) ? "fill-yellow-400 text-yellow-400" : "text-[#333]")} />
            ))}
          </div>
          <p className="text-[9px] text-[#6B7280] mt-0.5">平均评分</p>
        </div>
        <div className="h-10 w-px bg-[#333]" />
        <div className="text-center">
          <p className="font-mono text-xl font-bold text-white tabular-nums">{positiveRate}%</p>
          <p className="text-[9px] text-[#6B7280]">好评率</p>
        </div>
        <div className="h-10 w-px bg-[#333]" />
        <div className="text-center">
          <p className="font-mono text-xl font-bold text-white tabular-nums">{total.toLocaleString()}</p>
          <p className="text-[9px] text-[#6B7280]">总评价</p>
        </div>
      </div>

      {/* Rating distribution */}
      <div className="flex-1 space-y-1.5">
        {buckets.map((b) => {
          const pct = total > 0 ? (b.count / total) * 100 : 0;
          return (
            <div key={b.rating} className="flex items-center gap-2 text-xs">
              <span className="font-mono text-[#9CA3AF] w-8 text-right">{b.rating}星</span>
              <div className="flex-1 h-2 bg-[#1F1F23] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: b.rating >= 4 ? "#22c55e" : b.rating === 3 ? "#f59e0b" : "#ef4444",
                  }}
                />
              </div>
              <span className="font-mono text-[#6B7280] w-10 text-right tabular-nums">{pct.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function NegativeReviewList() {
  const [reviews, setReviews] = useState<(ReviewRow & { store_name?: string })[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, comment, customer_name, created_at, store_id")
        .lte("rating", 2)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!data || data.length === 0) { setReviews([]); return; }

      // fetch store names
      const storeIds = [...new Set(data.map((r) => r.store_id))];
      const { data: stores } = await supabase.from("stores").select("id, name").in("id", storeIds);
      const storeMap: Record<string, string> = {};
      stores?.forEach((s) => { storeMap[s.id] = s.name; });

      setReviews(data.map((r) => ({ ...r, store_name: storeMap[r.store_id] || "未知门店" })));
    };
    fetch();

    const channel = supabase
      .channel("reviews-negative")
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="bg-[#121212] border border-[#333] rounded-xl p-4 flex flex-col h-full">
      <h3 className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <ThumbsDown className="w-3 h-3 text-[#ef4444]" /> 差评列表
        {reviews.length > 0 && (
          <span className="ml-auto font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#ef4444]/10 text-[#ef4444]">
            {reviews.length}
          </span>
        )}
      </h3>

      {reviews.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Inbox className="w-8 h-8 text-[#6B7280] mb-2" />
          <span className="text-xs text-[#6B7280]">暂无差评</span>
        </div>
      ) : (
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {reviews.map((r) => (
            <div key={r.id} className="p-2.5 rounded-lg bg-[#0a0a0a] border border-[#222] hover:border-[#ef4444]/30 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white font-medium">{r.customer_name || "匿名"}</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={cn("w-2.5 h-2.5", s <= r.rating ? "fill-[#ef4444] text-[#ef4444]" : "text-[#333]")} />
                    ))}
                  </div>
                </div>
                <span className="text-[9px] text-[#6B7280] font-mono">
                  {new Date(r.created_at).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" })}
                </span>
              </div>
              <p className="text-xs text-[#9CA3AF] line-clamp-2 mb-1">{r.comment || "无评论内容"}</p>
              <span className="text-[9px] text-[#6B7280]">📍 {r.store_name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
