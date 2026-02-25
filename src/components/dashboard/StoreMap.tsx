import { useState, useEffect } from "react";
import { MapPin, Clock, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type StoreData = Tables<"stores">;

// 合肥主城区边界（用于坐标转换）
const HEFEI_BOUNDS = {
  minLng: 117.10,
  maxLng: 117.45,
  minLat: 31.72,
  maxLat: 31.95,
};

// 将经纬度转换为地图百分比位置
function coordToPercent(lng: number, lat: number): { x: number; y: number } {
  const x = ((lng - HEFEI_BOUNDS.minLng) / (HEFEI_BOUNDS.maxLng - HEFEI_BOUNDS.minLng)) * 100;
  // Y轴需要反转（纬度越大，Y越小）
  const y = ((HEFEI_BOUNDS.maxLat - lat) / (HEFEI_BOUNDS.maxLat - HEFEI_BOUNDS.minLat)) * 100;
  return { 
    x: Math.max(5, Math.min(95, x)), 
    y: Math.max(5, Math.min(95, y)) 
  };
}

// 模拟订单数（后续可接入真实数据）
function getMockOrders(storeId: string): number {
  const hash = storeId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return Math.floor((hash % 150) + 10);
}

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
  store: StoreData;
  orders: number;
}

function StoreNode({ store, orders }: StoreNodeProps) {
  const { bg, glow, label } = getNodeColor(orders);
  const isHighLoad = orders > 100;
  const { x, y } = coordToPercent(Number(store.longitude), Number(store.latitude));
  const statusText = store.status === "active" ? "营业中" : store.status === "renovating" ? "装修中" : "闭店";

  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger asChild>
        <div
          className="absolute cursor-pointer group"
          style={{ left: `${x}%`, top: `${y}%` }}
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
            {orders}
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
            <MapPin className="w-3 h-3" />
            <span>{store.address || "暂无地址"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              store.status === "active" 
                ? "bg-success/20 text-success" 
                : "bg-muted text-muted-foreground"
            )}>
              {statusText}
            </span>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              isHighLoad ? "bg-red-500/20 text-red-400" : "bg-muted text-muted-foreground"
            )}>
              {label} · {orders}单
            </span>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export function StoreMap() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [storeOrders, setStoreOrders] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    async function fetchStores() {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .neq("longitude", 0)
        .neq("latitude", 0);

      if (!error && data) {
        setStores(data);
        // 为每个门店生成模拟订单数
        const ordersMap = new Map<string, number>();
        data.forEach(store => {
          ordersMap.set(store.id, getMockOrders(store.id));
        });
        setStoreOrders(ordersMap);
      }
    }
    fetchStores();
  }, []);

  const getOrders = (storeId: string) => storeOrders.get(storeId) || 0;
  const highLoadCount = stores.filter(s => getOrders(s.id) > 100).length;
  const normalCount = stores.filter(s => { const o = getOrders(s.id); return o >= 30 && o <= 100; }).length;
  const lowLoadCount = stores.filter(s => getOrders(s.id) < 30).length;

  return (
    <div className="bg-[#121212] border border-[#333333] rounded-lg p-3 h-full flex flex-col">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">门店分布地图</span>
          <span className="text-xs text-[#9CA3AF]">· 合肥主城区 ({stores.length}家)</span>
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
        {stores.map((store) => (
          <StoreNode key={store.id} store={store} orders={getOrders(store.id)} />
        ))}

        {/* 数据更新时间戳 */}
        <div className="absolute bottom-1 right-2 text-[10px] text-[#9CA3AF]/50">
          数据更新: {new Date().toLocaleTimeString('zh-CN')}
        </div>
      </div>
    </div>
  );
}
