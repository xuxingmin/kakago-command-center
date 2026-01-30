import { useEffect, useState, useRef } from "react";
import { Activity, Coffee, Truck, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// 模拟订单数据生成
const stores = ["朝阳大悦城店", "国贸CBD店", "三里屯店", "望京SOHO店", "中关村店", "西单大悦城店", "王府井店"];
const statuses = [
  { label: "制作中", icon: Coffee, color: "text-yellow-400" },
  { label: "配送中", icon: Truck, color: "text-primary animate-pulse" },
  { label: "已送达", icon: CheckCircle, color: "text-success" },
];

function generateOrderId() {
  return `KK${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
}

function generateOrder() {
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  return {
    id: generateOrderId(),
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    store: stores[Math.floor(Math.random() * stores.length)],
    status,
  };
}

// 初始订单列表
const initialOrders = Array.from({ length: 15 }, () => ({
  ...generateOrder(),
  time: new Date(Date.now() - Math.random() * 300000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
}));

export function OrderStream() {
  const [orders, setOrders] = useState(initialOrders);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  // 自动添加新订单
  useEffect(() => {
    const interval = setInterval(() => {
      setOrders(prev => {
        const newOrders = [generateOrder(), ...prev.slice(0, 29)];
        return newOrders;
      });
    }, 2500 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, []);

  // 自动滚动效果
  useEffect(() => {
    if (isAutoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [orders, isAutoScroll]);

  return (
    <div className="bg-card border border-border rounded-lg p-3 h-full flex flex-col">
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

      {/* 订单列表 - 黑客帝国风格 */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-1 scrollbar-thin"
        onMouseEnter={() => setIsAutoScroll(false)}
        onMouseLeave={() => setIsAutoScroll(true)}
      >
        {orders.map((order, index) => {
          const StatusIcon = order.status.icon;
          return (
            <div
              key={`${order.id}-${index}`}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-all duration-300",
                "bg-background/50 hover:bg-primary/10 border border-transparent hover:border-primary/30",
                index === 0 && "animate-fade-in bg-primary/5 border-primary/20"
              )}
            >
              {/* 时间 */}
              <span className="numeric text-muted-foreground w-16 flex-shrink-0">
                {order.time}
              </span>
              
              {/* 订单号 */}
              <span className="numeric text-primary/80 w-24 flex-shrink-0 truncate">
                {order.id}
              </span>
              
              {/* 门店 */}
              <span className="text-foreground/70 flex-1 truncate">
                {order.store}
              </span>
              
              {/* 状态 */}
              <div className={cn("flex items-center gap-1 flex-shrink-0", order.status.color)}>
                <StatusIcon className="w-3 h-3" />
                <span className="text-[10px]">{order.status.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部状态 */}
      <div className="flex-shrink-0 pt-2 border-t border-border mt-2">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>悬停暂停滚动</span>
          <span className="numeric">更新: {new Date().toLocaleTimeString('zh-CN')}</span>
        </div>
      </div>
    </div>
  );
}
