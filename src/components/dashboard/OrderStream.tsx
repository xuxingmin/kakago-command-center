import { useEffect, useState, useRef } from "react";
import { Activity, Coffee, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface OrderWithStore {
  id: string;
  status: string;
  created_at: string;
  total_amount: number;
  items: any;
  store_name: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "待接单", color: "text-yellow-400" },
  making: { label: "制作中", color: "text-emerald-400" },
};

export function OrderStream() {
  const [orders, setOrders] = useState<OrderWithStore[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(`id, status, created_at, total_amount, items, stores!inner(name)`)
      .in("status", ["pending", "making"])
      .order("created_at", { ascending: false })
      .limit(30);

    if (!error && data) {
      setOrders(data.map((order: any) => ({
        id: order.id,
        status: order.status,
        created_at: order.created_at,
        total_amount: order.total_amount,
        items: order.items,
        store_name: order.stores?.name || "未知门店",
      })));
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, () => fetchOrders())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        const updated = payload.new as any;
        if (updated.status === "making") {
          setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, status: "making" } : o));
        } else {
          setOrders(prev => prev.filter(o => o.id !== updated.id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (isAutoScroll && scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [orders, isAutoScroll]);

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const getItemsSummary = (items: any) => {
    if (!items || !Array.isArray(items)) return "—";
    const grouped = new Map<string, number>();
    items.forEach((i: any) => {
      const name = i.name || i.product_name || "商品";
      grouped.set(name, (grouped.get(name) || 0) + (i.quantity || 1));
    });
    return Array.from(grouped.entries()).map(([name, qty]) => `${name}×${qty}`).join(" ");
  };

  return (
    <div className="bg-card border border-secondary rounded-lg p-3 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">实时订单流</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground numeric">{orders.length} 条</span>
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-1 scrollbar-thin"
        onMouseEnter={() => setIsAutoScroll(false)}
        onMouseLeave={() => setIsAutoScroll(true)}
      >
        {orders.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            暂无订单数据，等待新订单...
          </div>
        ) : (
          orders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            return (
              <div
                key={order.id}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-all duration-500 border",
                  status.bg
                )}
              >
                <span className="numeric text-muted-foreground w-16 flex-shrink-0">
                  {formatTime(order.created_at)}
                </span>
                <span className="text-foreground/80 flex-1 truncate">
                  {getItemsSummary(order.items)}
                </span>
                <span className="numeric text-foreground font-medium w-14 text-right flex-shrink-0">
                  ¥{order.total_amount.toFixed(0)}
                </span>
                <span className="text-foreground/60 w-20 truncate text-right flex-shrink-0">
                  {order.store_name}
                </span>
                <div className={cn("flex items-center gap-1 flex-shrink-0 w-16 justify-end", status.color)}>
                  {order.status === "pending" ? <Clock className="w-3 h-3" /> : <Coffee className="w-3 h-3" />}
                  <span className="text-[10px]">{status.label}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex-shrink-0 pt-2 border-t border-border mt-2">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>实时同步中 · 悬停暂停滚动</span>
          <span className="numeric">更新: {new Date().toLocaleTimeString("zh-CN")}</span>
        </div>
      </div>
    </div>
  );
}