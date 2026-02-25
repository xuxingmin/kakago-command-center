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

  // 获取订单预警（待接单超过3分钟）
  const fetchOrderAlerts = async () => {
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    
    const { data: pendingOrders } = await supabase
      .from("orders")
      .select(`
        id,
        order_no,
        created_at,
        stores!inner(name)
      `)
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
        detail: `${order.stores?.name || "未知门店"} · 订单 ${order.order_no} 已等待 ${waitMinutes}分钟`,
        time: new Date(order.created_at).toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        severity: waitMinutes > 5 ? "high" : "medium",
      };
    });

    // 获取库存预警
    const { data: lowInventory } = await supabase
      .from("store_inventory")
      .select(`
        id,
        current_quantity,
        stores!inner(name),
        sku_materials!inner(name)
      `)
      .lt("current_quantity", 20)
      .limit(5);

    const supplyAlerts: Alert[] = (lowInventory || []).map((inv: any) => ({
      id: `supply-${inv.id}`,
      type: "supply" as AlertType,
      title: "原料库存预警",
      detail: `${inv.stores?.name || "未知门店"} · ${inv.sku_materials?.name || "物料"} 仅剩 ${inv.current_quantity}`,
      time: new Date().toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      severity: inv.current_quantity < 10 ? "high" : "medium",
    }));

    const allAlerts = [...orderAlerts, ...supplyAlerts].sort((a, b) => 
      a.severity === "high" && b.severity !== "high" ? -1 : 1
    );

    setAlerts(allAlerts);
  };

  // 初始化加载
  useEffect(() => {
    fetchOrderAlerts();
    
    // 定时刷新预警
    const interval = setInterval(fetchOrderAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Realtime订阅订单变化
  useEffect(() => {
    const channel = supabase
      .channel("alerts-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchOrderAlerts();
          setNewAlertFlash(true);
          setTimeout(() => setNewAlertFlash(false), 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const highSeverityCount = alerts.filter(a => a.severity === "high").length;

  return (
    <div className="bg-card border border-secondary rounded-lg p-3 h-full flex flex-col">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <AlertTriangle className={cn(
            "w-4 h-4",
            highSeverityCount > 0 ? "text-destructive animate-pulse" : "text-warning"
          )} />
          <span className="text-sm font-medium">事件预警</span>
          {highSeverityCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive numeric">
              {highSeverityCount} 紧急
            </span>
          )}
        </div>
        
        {/* 音效开关 */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setSoundEnabled(!soundEnabled)}
        >
          {soundEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-primary" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </Button>
      </div>

      {/* 预警列表 */}
      <div className={cn(
        "flex-1 overflow-y-auto space-y-1.5 scrollbar-thin",
        newAlertFlash && "ring-1 ring-destructive/50 rounded"
      )}>
        {alerts.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            <CheckCircle className="w-4 h-4 mr-2 text-success" />
            暂无预警事件
          </div>
        ) : (
          alerts.map((alert, index) => (
            <div
              key={alert.id}
              className={cn(
                "relative px-2.5 py-2 rounded text-xs transition-all duration-300 overflow-hidden",
                alert.severity === "high" 
                  ? "bg-gradient-to-r from-destructive/20 to-destructive/5 border border-destructive/30" 
                  : "bg-gradient-to-r from-warning/10 to-transparent border border-warning/20",
                index === 0 && "animate-fade-in"
              )}
            >
              {/* 高危呼吸光效 */}
              {alert.severity === "high" && (
                <div className="absolute inset-0 bg-destructive/10 animate-pulse pointer-events-none" />
              )}
              
              <div className="relative flex items-start gap-2">
                {/* 图标 */}
                <div className={cn(
                  "mt-0.5 flex-shrink-0",
                  alert.severity === "high" ? "text-destructive" : "text-warning"
                )}>
                  {alert.type === "order" ? (
                    <Clock className="w-3.5 h-3.5" />
                  ) : (
                    <Package className="w-3.5 h-3.5" />
                  )}
                </div>
                
                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                      "font-medium",
                      alert.severity === "high" ? "text-destructive" : "text-warning"
                    )}>
                      {alert.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground numeric flex-shrink-0">
                      {alert.time}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-0.5 truncate">
                    {alert.detail}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 底部统计 */}
      <div className="flex-shrink-0 pt-2 border-t border-border mt-2">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              订单异常: {alerts.filter(a => a.type === "order").length}
            </span>
            <span className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              供应链: {alerts.filter(a => a.type === "supply").length}
            </span>
          </div>
          <span className={cn(
            "px-1.5 py-0.5 rounded",
            soundEnabled ? "bg-primary/20 text-primary" : "bg-muted"
          )}>
            {soundEnabled ? "音效开启" : "静音中"}
          </span>
        </div>
      </div>
    </div>
  );
}
