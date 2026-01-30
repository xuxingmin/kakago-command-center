import { useState } from "react";
import { MapPin, Clock, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

// 模拟门店数据（基于合肥主城区坐标）
const storesData = [
  { id: 1, name: "淮河路步行街店", x: 48, y: 42, orders: 156, hours: "07:00-22:00", status: "营业中" },
  { id: 2, name: "万达广场店", x: 62, y: 38, orders: 128, hours: "08:00-22:00", status: "营业中" },
  { id: 3, name: "银泰中心店", x: 55, y: 48, orders: 112, hours: "08:00-23:00", status: "营业中" },
  { id: 4, name: "合肥南站店", x: 58, y: 72, orders: 103, hours: "06:00-23:00", status: "营业中" },
  { id: 5, name: "政务区店", x: 35, y: 55, orders: 95, hours: "07:30-22:00", status: "营业中" },
  { id: 6, name: "天鹅湖万达店", x: 32, y: 62, orders: 89, hours: "09:00-22:00", status: "营业中" },
  { id: 7, name: "滨湖银泰店", x: 45, y: 82, orders: 78, hours: "09:00-21:00", status: "营业中" },
  { id: 8, name: "包河万达店", x: 55, y: 65, orders: 67, hours: "08:00-21:00", status: "营业中" },
  { id: 9, name: "蜀山万象城店", x: 28, y: 45, orders: 58, hours: "09:00-22:00", status: "营业中" },
  { id: 10, name: "中科大店", x: 22, y: 52, orders: 45, hours: "07:00-22:00", status: "营业中" },
  { id: 11, name: "庐阳万达店", x: 42, y: 28, orders: 42, hours: "08:00-21:00", status: "营业中" },
  { id: 12, name: "瑶海万达店", x: 72, y: 35, orders: 34, hours: "08:00-20:00", status: "营业中" },
  { id: 13, name: "新站高铁店", x: 78, y: 22, orders: 28, hours: "06:30-22:00", status: "营业中" },
  { id: 14, name: "经开区店", x: 68, y: 75, orders: 23, hours: "08:00-20:00", status: "闭店" },
  { id: 15, name: "肥西万达店", x: 18, y: 68, orders: 15, hours: "09:00-20:00", status: "闭店" },
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
    <div className="bg-[#121212] border border-[#333333] rounded-lg p-3 h-full flex flex-col">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">门店分布地图</span>
          <span className="text-xs text-[#9CA3AF]">· 合肥主城区</span>
        </div>
        {/* 图例 */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[#9CA3AF]">高负载({highLoadCount})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-[#9CA3AF]">正常({normalCount})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-zinc-500" />
            <span className="text-[#9CA3AF]">低负载({lowLoadCount})</span>
          </div>
        </div>
      </div>

      {/* 地图区域 */}
      <div className="flex-1 relative bg-black rounded-lg border border-[#333333] overflow-hidden">
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
        
        {/* 合肥主城区轮廓 SVG */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* 巢湖区域 (右下角) */}
          <ellipse
            cx="70"
            cy="85"
            rx="25"
            ry="12"
            fill="hsl(220, 60%, 20%)"
            fillOpacity="0.3"
            stroke="hsl(220, 60%, 40%)"
            strokeWidth="0.3"
          />
          <text x="70" y="87" fontSize="3" fill="hsl(220, 60%, 50%)" textAnchor="middle" opacity="0.5">巢湖</text>
          
          {/* 外环 - 合肥市区边界 */}
          <path
            d="M15 30 L40 15 L70 12 L88 25 L92 55 L85 80 L60 92 L30 88 L12 70 L8 45 Z"
            fill="none"
            stroke="hsl(270, 100%, 50%)"
            strokeWidth="0.3"
            opacity="0.3"
          />
          
          {/* 三环区域 */}
          <path
            d="M25 35 L45 25 L68 28 L78 45 L75 65 L58 78 L35 75 L22 58 L20 42 Z"
            fill="hsl(270, 100%, 50%)"
            fillOpacity="0.04"
            stroke="hsl(270, 100%, 50%)"
            strokeWidth="0.4"
            opacity="0.5"
          />
          
          {/* 二环区域 */}
          <path
            d="M32 40 L48 32 L62 35 L68 48 L65 60 L52 68 L38 65 L30 52 Z"
            fill="hsl(270, 100%, 50%)"
            fillOpacity="0.06"
            stroke="hsl(270, 100%, 50%)"
            strokeWidth="0.5"
            opacity="0.6"
          />
          
          {/* 一环核心 - 老城区 */}
          <ellipse
            cx="48"
            cy="48"
            rx="10"
            ry="8"
            fill="hsl(270, 100%, 50%)"
            fillOpacity="0.1"
            stroke="hsl(270, 100%, 50%)"
            strokeWidth="0.6"
            opacity="0.7"
          />
          
          {/* 区域标注 */}
          <text x="48" y="42" fontSize="2.5" fill="#9CA3AF" textAnchor="middle" opacity="0.6">庐阳区</text>
          <text x="68" y="42" fontSize="2.5" fill="#9CA3AF" textAnchor="middle" opacity="0.6">瑶海区</text>
          <text x="28" y="52" fontSize="2.5" fill="#9CA3AF" textAnchor="middle" opacity="0.6">蜀山区</text>
          <text x="55" y="62" fontSize="2.5" fill="#9CA3AF" textAnchor="middle" opacity="0.6">包河区</text>
          <text x="45" y="80" fontSize="2.5" fill="#9CA3AF" textAnchor="middle" opacity="0.6">滨湖新区</text>
        </svg>

        {/* 门店节点 */}
        {storesData.map((store) => (
          <StoreNode key={store.id} store={store} />
        ))}

        {/* 数据更新时间戳 */}
        <div className="absolute bottom-1 right-2 text-[10px] text-[#9CA3AF]/50">
          数据更新: {new Date().toLocaleTimeString('zh-CN')}
        </div>
      </div>
    </div>
  );
}
