import { useState, useEffect } from "react";
import { AlertTriangle, Volume2, VolumeX, Clock, Package, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type AlertType = "order" | "supply";

interface Alert {
  id: string;
  type: AlertType;
  title: string;
  detail: string;
  time: string;
  severity: "high" | "medium";
}

export function ExceptionMonitor() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [newAlertFlash, setNewAlertFlash] = useState(false);

  const fetchOrderAlerts = async () => {
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    
    const { data: pendingOrders } = await supabase
      .from("orders")
      .select(`id, order_no, created_at, stores!inner(name)`)
      .eq("status", "pending")
      .lt("created_at", threeMinutesAgo)
      .order("created_at", { ascending: true })
      .limit(5);

    const orderAlerts: Alert[] = (pendingOrders || []).map((order: any) => {
      const waitMinutes = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
      return {
        id: `order-${order.id}`,
        type: "order" as AlertType,
        title: "订单超时未接",
        detail: `${order.stores?.name || "未知门店"} · ${order.order_no} 等待 ${waitMinutes}分钟`,
        time: new Date(order.created_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        severity: waitMinutes > 5 ? "high" : "medium",
      };
    });

    const { data: lowInventory } = await supabase
      .from("store_inventory")
      .select(`id, current_quantity, stores!inner(name), sku_materials!inner(name)`)
      .lt("current_quantity", 20)
      .limit(5);

    const supplyAlerts: Alert[] = (lowInventory || []).map((inv: any) => ({
      id: `supply-${inv.id}`,
      type: "supply" as AlertType,
      title: "原料库存预警",
      detail: `${inv.stores?.name || "未知门店"} · ${inv.sku_materials?.name || "物料"} 仅剩 ${inv.current_quantity}`,
      time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      severity: inv.current_quantity < 10 ? "high" : "medium",
    }));

    setAlerts([...orderAlerts, ...supplyAlerts].sort((a, b) => a.severity === "high" && b.severity !== "high" ? -1 : 1));
  };

  useEffect(() => {
    fetchOrderAlerts();
    const interval = setInterval(fetchOrderAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("alerts-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrderAlerts();
        setNewAlertFlash(true);
        setTimeout(() => setNewAlertFlash(false), 1000);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const highCount = alerts.filter(a => a.severity === "high").length;

  return (
    <div className="bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg p-3 h-full flex flex-col">
      {/* 标题 + 统计 */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <AlertTriangle className={cn("w-3.5 h-3.5", highCount > 0 ? "text-red-500 animate-pulse" : "text-amber-500")} />
          <span className="text-xs font-medium text-[#E5E5E5]">事件预警</span>
          {highCount > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 numeric">{highCount} 紧急</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-[10px] text-[#6B7280]">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />订单: {alerts.filter(a => a.type === "order").length}</span>
            <span className="flex items-center gap-1"><Package className="w-3 h-3" />供应链: {alerts.filter(a => a.type === "supply").length}</span>
          </div>
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setSoundEnabled(!soundEnabled)}>
            {soundEnabled ? <Volume2 className="w-3 h-3 text-primary" /> : <VolumeX className="w-3 h-3 text-[#555]" />}
          </Button>
        </div>
      </div>

      {/* 预警列表 - 横向排列 */}
      <div className={cn("flex-1 overflow-y-auto flex flex-wrap gap-2 content-start", newAlertFlash && "ring-1 ring-red-500/30 rounded")}>
        {alerts.length === 0 ? (
          <div className="flex items-center justify-center w-full h-full text-[#555] text-xs">
            <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-500/60" />
            暂无预警事件
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "px-2.5 py-1.5 rounded text-[11px] flex items-center gap-2 flex-shrink-0",
                alert.severity === "high"
                  ? "bg-red-500/8 border border-red-500/20 text-red-400"
                  : "bg-amber-500/8 border border-amber-500/15 text-amber-400"
              )}
            >
              {alert.type === "order" ? <Clock className="w-3 h-3 flex-shrink-0" /> : <Package className="w-3 h-3 flex-shrink-0" />}
              <span className="text-[#9CA3AF]">{alert.detail}</span>
              <span className="text-[9px] numeric text-[#555]">{alert.time}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
