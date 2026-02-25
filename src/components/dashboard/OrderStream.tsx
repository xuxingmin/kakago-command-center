import { useEffect, useState, useRef } from "react";
import { Activity, Coffee, Truck, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface OrderWithStore {
  id: string;
  order_no: string;
  status: string;
  created_at: string;
  store_name: string;
}

const statusConfig: Record<string, { label: string; icon: typeof Coffee; color: string }> = {
  pending: { label: "待接单", icon: Clock, color: "text-orange-400" },
  making: { label: "制作中", icon: Coffee, color: "text-yellow-400" },
  delivering: { label: "配送中", icon: Truck, color: "text-primary animate-pulse" },
  completed: { label: "已完成", icon: CheckCircle, color: "text-success" },
  cancelled: { label: "已取消", icon: Clock, color: "text-muted-foreground" },
};

export function OrderStream() {
  const [orders, setOrders] = useState<OrderWithStore[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  // 获取订单列表
  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_no,
        status,
        created_at,
        stores!inner(name)
      `)
      .order("created_at", { ascending: false })
      .limit(30);

    if (!error && data) {
      const formatted = data.map((order: any) => ({
        id: order.id,
        order_no: order.order_no,
        status: order.status,
        created_at: order.created_at,
        store_name: order.stores?.name || "未知门店",
      }));
      setOrders(formatted);
    }
  };

  // 初始化加载
  useEffect(() => {
    fetchOrders();
  }, []);

  // Realtime 订阅
  useEffect(() => {
    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        async (payload) => {
          console.log("Order change:", payload);
          // 重新获取最新数据
          await fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 自动滚动效果
  useEffect(() => {
    if (isAutoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [orders, isAutoScroll]);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="bg-card border border-secondary rounded-lg p-3 h-full flex flex-col">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">实时订单流</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground numeric">
            {orders.length} 条
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
        </div>
      </div>

      {/* 订单列表 */}
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
          orders.map((order, index) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            return (
              <div
                key={order.id}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-all duration-300",
                  "bg-background/50 hover:bg-primary/10 border border-transparent hover:border-primary/30",
                  index === 0 && "animate-fade-in bg-primary/5 border-primary/20"
                )}
              >
                {/* 时间 */}
                <span className="numeric text-muted-foreground w-16 flex-shrink-0">
                  {formatTime(order.created_at)}
                </span>

                {/* 订单号 */}
                <span className="numeric text-primary/80 w-28 flex-shrink-0 truncate">
                  {order.order_no}
                </span>

                {/* 门店 */}
                <span className="text-foreground/70 flex-1 truncate">
                  {order.store_name}
                </span>

                {/* 状态 */}
                <div className={cn("flex items-center gap-1 flex-shrink-0", status.color)}>
                  <StatusIcon className="w-3 h-3" />
                  <span className="text-[10px]">{status.label}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 底部状态 */}
      <div className="flex-shrink-0 pt-2 border-t border-border mt-2">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>实时同步中 · 悬停暂停滚动</span>
          <span className="numeric">更新: {new Date().toLocaleTimeString("zh-CN")}</span>
        </div>
      </div>
    </div>
  );
}
