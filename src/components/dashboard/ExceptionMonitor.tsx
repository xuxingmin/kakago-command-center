import { useState, useEffect } from "react";
import { AlertTriangle, Volume2, VolumeX, Clock, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useStores, getRandomStoreName } from "@/hooks/use-stores";

type AlertType = "order" | "supply";

interface Alert {
  id: string;
  type: AlertType;
  title: string;
  detail: string;
  time: string;
  severity: "high" | "medium";
}

const alertTemplates = {
  order: [
    { title: "订单超时未接", detail: (store: string) => `${store} · 订单等待超过 3 分钟` },
    { title: "配送超时预警", detail: (store: string) => `${store} · 配送已超时 8 分钟` },
    { title: "异常取消申请", detail: (store: string) => `${store} · 用户申请退款 ¥28.00` },
  ],
  supply: [
    { title: "原料产能预警", detail: (store: string) => `${store} · 咖啡豆存量仅支撑 18 杯` },
    { title: "杯具库存不足", detail: (store: string) => `${store} · 16oz杯剩余 15 个` },
    { title: "牛奶库存预警", detail: (store: string) => `${store} · 鲜奶仅剩 2 盒` },
  ],
};

export function ExceptionMonitor() {
  const { activeStores } = useStores();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [newAlertFlash, setNewAlertFlash] = useState(false);

  // 初始化预警数据（使用真实门店）
  useEffect(() => {
    if (activeStores.length > 0 && alerts.length === 0) {
      const initialAlerts: Alert[] = [
        {
          id: "1",
          type: "order",
          title: "订单超时未接",
          detail: `${getRandomStoreName(activeStores)} · 订单 KK20241205 已等待 4分12秒`,
          time: "14:32:18",
          severity: "high",
        },
        {
          id: "2",
          type: "supply",
          title: "原料产能预警",
          detail: `${getRandomStoreName(activeStores)} · 咖啡豆存量仅支撑 18 杯`,
          time: "14:28:05",
          severity: "high",
        },
        {
          id: "3",
          type: "order",
          title: "配送超时预警",
          detail: `${getRandomStoreName(activeStores)} · 配送已超时 8分钟`,
          time: "14:25:33",
          severity: "medium",
        },
        {
          id: "4",
          type: "supply",
          title: "杯具库存不足",
          detail: `${getRandomStoreName(activeStores)} · 16oz杯剩余 15 个`,
          time: "14:20:41",
          severity: "medium",
        },
        {
          id: "5",
          type: "order",
          title: "异常取消申请",
          detail: `${getRandomStoreName(activeStores)} · 用户申请退款 ¥28.00`,
          time: "14:18:22",
          severity: "medium",
        },
      ];
      setAlerts(initialAlerts);
    }
  }, [activeStores, alerts.length]);

  // 模拟新报警（使用真实门店）
  useEffect(() => {
    if (activeStores.length === 0) return;

    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const type: AlertType = Math.random() > 0.5 ? "order" : "supply";
        const templates = alertTemplates[type];
        const template = templates[Math.floor(Math.random() * templates.length)];
        const storeName = getRandomStoreName(activeStores);

        const newAlert: Alert = {
          id: Date.now().toString(),
          type,
          title: template.title,
          detail: template.detail(storeName),
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          severity: Math.random() > 0.5 ? "high" : "medium",
        };
        
        setAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
        setNewAlertFlash(true);
        setTimeout(() => setNewAlertFlash(false), 1000);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [activeStores]);

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
        {alerts.map((alert, index) => (
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
        ))}
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
