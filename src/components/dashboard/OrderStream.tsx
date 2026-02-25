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
  pending: { label: "待接单", icon: Clock, color: "text-amber-400" },
  making: { label: "制作中", icon: Coffee, color: "text-yellow-400" },
  delivering: { label: "配送中", icon: Truck, color: "text-primary" },
  completed: { label: "已完成", icon: CheckCircle, color: "text-emerald-400" },
  cancelled: { label: "已取消", icon: Clock, color: "text-muted-foreground" },
};

export function OrderStream() {
  const [orders, setOrders] = useState<OrderWithStore[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(`id, order_no, status, created_at, stores!inner(name)`)
      .order("created_at", { ascending: false })
      .limit(30);

    if (!error && data) {
      setOrders(data.map((order: any) => ({
        id: order.id,
        order_no: order.order_no,
        status: order.status,
        created_at: order.created_at,
        store_name: order.stores?.name || "未知门店",
      })));
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (isAutoScroll && scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [orders, isAutoScroll]);

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg p-3 h-full flex flex-col">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-[#E5E5E5]">实时订单流</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#6B7280] numeric">{orders.length} 条</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>

      {/* 订单列表 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-0.5"
        onMouseEnter={() => setIsAutoScroll(false)}
        onMouseLeave={() => setIsAutoScroll(true)}
      >
        {orders.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#6B7280] text-xs">
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
                  "flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-all duration-200",
                  "hover:bg-[#141414]",
                  index === 0 && "bg-primary/5 border border-primary/10"
                )}
              >
                <span className="numeric text-[#6B7280] w-14 flex-shrink-0 text-[11px]">
                  {formatTime(order.created_at)}
                </span>
                <span className="numeric text-primary/70 w-24 flex-shrink-0 truncate text-[11px]">
                  {order.order_no}
                </span>
                <span className="text-[#9CA3AF] flex-1 truncate text-[11px]">
                  {order.store_name}
                </span>
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
      <div className="flex-shrink-0 pt-2 border-t border-[#1E1E1E] mt-1">
        <div className="flex justify-between text-[10px] text-[#6B7280]">
          <span>实时同步中 · 悬停暂停</span>
          <span className="numeric">更新: {new Date().toLocaleTimeString("zh-CN")}</span>
        </div>
      </div>
    </div>
  );
}
