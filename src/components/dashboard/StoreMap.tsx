import { useState } from "react";
import { MapPin, Clock, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

// 模拟门店数据（基于北京区域坐标）
const storesData = [
  { id: 1, name: "朝阳大悦城店", x: 72, y: 35, orders: 128, hours: "07:00-22:00", status: "营业中" },
  { id: 2, name: "国贸CBD店", x: 68, y: 48, orders: 95, hours: "06:30-23:00", status: "营业中" },
  { id: 3, name: "三里屯店", x: 65, y: 42, orders: 112, hours: "08:00-24:00", status: "营业中" },
  { id: 4, name: "望京SOHO店", x: 78, y: 28, orders: 67, hours: "07:00-21:00", status: "营业中" },
  { id: 5, name: "中关村店", x: 38, y: 32, orders: 45, hours: "07:30-22:00", status: "营业中" },
  { id: 6, name: "西单大悦城店", x: 48, y: 52, orders: 89, hours: "09:00-22:00", status: "营业中" },
  { id: 7, name: "王府井店", x: 55, y: 48, orders: 156, hours: "08:00-22:00", status: "营业中" },
  { id: 8, name: "亦庄店", x: 75, y: 78, orders: 23, hours: "08:00-20:00", status: "营业中" },
  { id: 9, name: "通州万达店", x: 88, y: 55, orders: 34, hours: "09:00-21:00", status: "营业中" },
  { id: 10, name: "大兴机场店", x: 45, y: 88, orders: 78, hours: "05:00-24:00", status: "营业中" },
  { id: 11, name: "回龙观店", x: 45, y: 15, orders: 28, hours: "07:00-21:00", status: "闭店" },
  { id: 12, name: "昌平店", x: 52, y: 8, orders: 15, hours: "08:00-20:00", status: "闭店" },
  { id: 13, name: "顺义店", x: 82, y: 18, orders: 42, hours: "07:00-21:00", status: "营业中" },
  { id: 14, name: "海淀黄庄店", x: 35, y: 40, orders: 58, hours: "07:00-22:00", status: "营业中" },
  { id: 15, name: "五道口店", x: 42, y: 28, orders: 103, hours: "07:00-23:00", status: "营业中" },
];

function getNodeColor(orders: number): { bg: string; glow: string; label: string } {
  if (orders > 100) {
    return { 
      bg: "bg-red-500", 
      glow: "shadow-[0_0_12px_rgba(239,68,68,0.8)]",
      label: "高负载"
    };
  } else if (orders >= 30) {
    return { 
      bg: "bg-yellow-500", 
      glow: "shadow-[0_0_8px_rgba(234,179,8,0.5)]",
      label: "正常"
    };
  }
  return { 
    bg: "bg-zinc-500", 
    glow: "",
    label: "低负载"
  };
}

interface StoreNodeProps {
  store: typeof storesData[0];
}

function StoreNode({ store }: StoreNodeProps) {
  const { bg, glow, label } = getNodeColor(store.orders);
  const isHighLoad = store.orders > 100;

  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger asChild>
        <div
          className="absolute cursor-pointer group"
          style={{ left: `${store.x}%`, top: `${store.y}%` }}
        >
          {/* 节点主体 */}
          <div
            className={cn(
              "w-3 h-3 rounded-full transition-transform duration-200",
              bg,
              glow,
              isHighLoad && "animate-pulse",
              "group-hover:scale-150"
            )}
          />
          {/* 订单数标签 */}
          <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] numeric text-muted-foreground whitespace-nowrap">
            {store.orders}
          </span>
        </div>
      </HoverCardTrigger>
      <HoverCardContent 
        side="top" 
        className="w-48 bg-card/95 backdrop-blur border-border p-3"
        sideOffset={8}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">{store.name}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{store.hours}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              store.status === "营业中" 
                ? "bg-success/20 text-success" 
                : "bg-muted text-muted-foreground"
            )}>
              {store.status}
            </span>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              isHighLoad ? "bg-red-500/20 text-red-400" : "bg-muted text-muted-foreground"
            )}>
              {label} · {store.orders}单
            </span>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export function StoreMap() {
  const highLoadCount = storesData.filter(s => s.orders > 100).length;
  const normalCount = storesData.filter(s => s.orders >= 30 && s.orders <= 100).length;
  const lowLoadCount = storesData.filter(s => s.orders < 30).length;

  return (
    <div className="bg-card border border-border rounded-lg p-4 h-[500px] flex flex-col">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">门店分布地图</span>
          <span className="text-xs text-muted-foreground">· 北京区域</span>
        </div>
        {/* 图例 */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-muted-foreground">高负载 ({highLoadCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">正常 ({normalCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-zinc-500" />
            <span className="text-muted-foreground">低负载 ({lowLoadCount})</span>
          </div>
        </div>
      </div>

      {/* 地图区域 */}
      <div className="flex-1 relative bg-background rounded-lg border border-primary/20 overflow-hidden">
        {/* 网格背景 */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(270 100% 50% / 0.3) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(270 100% 50% / 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* 简化的北京轮廓 SVG */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* 外环区域轮廓 */}
          <path
            d="M30 5 L55 3 L80 8 L92 25 L95 50 L90 75 L70 92 L45 95 L20 85 L8 60 L10 35 L20 15 Z"
            fill="none"
            stroke="hsl(270, 100%, 50%)"
            strokeWidth="0.3"
            opacity="0.4"
          />
          {/* 五环区域 */}
          <path
            d="M40 25 L60 23 L75 30 L80 50 L75 70 L55 78 L35 75 L28 55 L30 35 Z"
            fill="hsl(270, 100%, 50%)"
            fillOpacity="0.05"
            stroke="hsl(270, 100%, 50%)"
            strokeWidth="0.5"
            opacity="0.6"
          />
          {/* 三环区域 */}
          <path
            d="M45 35 L58 33 L68 40 L70 52 L65 62 L52 66 L42 62 L38 50 L40 40 Z"
            fill="hsl(270, 100%, 50%)"
            fillOpacity="0.08"
            stroke="hsl(270, 100%, 50%)"
            strokeWidth="0.6"
            opacity="0.7"
          />
          {/* 二环核心 */}
          <ellipse
            cx="52"
            cy="48"
            rx="8"
            ry="7"
            fill="hsl(270, 100%, 50%)"
            fillOpacity="0.12"
            stroke="hsl(270, 100%, 50%)"
            strokeWidth="0.8"
          />
        </svg>

        {/* 门店节点 */}
        {storesData.map((store) => (
          <StoreNode key={store.id} store={store} />
        ))}

        {/* 数据更新时间戳 */}
        <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground/50">
          数据更新: {new Date().toLocaleTimeString('zh-CN')}
        </div>
      </div>
    </div>
  );
}
