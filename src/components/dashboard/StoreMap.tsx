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

const HEFEI_BOUNDS = {
  minLng: 117.10, maxLng: 117.45,
  minLat: 31.72, maxLat: 31.95,
};

function coordToPercent(lng: number, lat: number) {
  const x = ((lng - HEFEI_BOUNDS.minLng) / (HEFEI_BOUNDS.maxLng - HEFEI_BOUNDS.minLng)) * 100;
  const y = ((HEFEI_BOUNDS.maxLat - lat) / (HEFEI_BOUNDS.maxLat - HEFEI_BOUNDS.minLat)) * 100;
  return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
}

function getMockOrders(storeId: string): number {
  const hash = storeId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return Math.floor((hash % 150) + 10);
}

function getNodeColor(orders: number) {
  if (orders > 100) return { bg: "bg-red-500", glow: "shadow-[0_0_10px_rgba(239,68,68,0.6)]", label: "高负载" };
  if (orders >= 30) return { bg: "bg-amber-500", glow: "shadow-[0_0_6px_rgba(245,158,11,0.4)]", label: "正常" };
  return { bg: "bg-[#555]", glow: "", label: "低负载" };
}

function StoreNode({ store, orders }: { store: StoreData; orders: number }) {
  const { bg, glow, label } = getNodeColor(orders);
  const isHighLoad = orders > 100;
  const { x, y } = coordToPercent(Number(store.longitude), Number(store.latitude));
  const statusText = store.status === "active" ? "营业中" : store.status === "renovating" ? "装修中" : "闭店";

  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger asChild>
        <div className="absolute cursor-pointer group" style={{ left: `${x}%`, top: `${y}%` }}>
          <div className={cn("w-2.5 h-2.5 rounded-full transition-transform duration-200", bg, glow, isHighLoad && "animate-pulse", "group-hover:scale-[1.8]")} />
        </div>
      </HoverCardTrigger>
      <HoverCardContent side="top" className="w-48 bg-[#0A0A0A]/95 backdrop-blur border-[#1E1E1E] p-3" sideOffset={8}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Store className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium text-xs text-[#E5E5E5]">{store.name}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#6B7280]">
            <MapPin className="w-3 h-3" />
            <span>{store.address || "暂无地址"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", store.status === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-[#1E1E1E] text-[#6B7280]")}>
              {statusText}
            </span>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", isHighLoad ? "bg-red-500/15 text-red-400" : "bg-[#1E1E1E] text-[#6B7280]")}>
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
        .from("stores").select("*").neq("longitude", 0).neq("latitude", 0);
      if (!error && data) {
        setStores(data);
        const ordersMap = new Map<string, number>();
        data.forEach(store => ordersMap.set(store.id, getMockOrders(store.id)));
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
    <div className="bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg p-3 h-full flex flex-col">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-[#E5E5E5]">门店分布地图</span>
          <span className="text-[10px] text-[#6B7280]">· 合肥主城区 ({stores.length}家)</span>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-[#6B7280]">高负载({highLoadCount})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-[#6B7280]">正常({normalCount})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#555]" />
            <span className="text-[#6B7280]">低负载({lowLoadCount})</span>
          </div>
        </div>
      </div>

      {/* 地图区域 */}
      <div className="flex-1 relative bg-[#050505] rounded border border-[#1A1A1A] overflow-hidden">
        {/* 网格背景 */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(270 100% 50% / 0.4) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(270 100% 50% / 0.4) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />

        {/* 合肥主城区轮廓 */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
          <ellipse cx="70" cy="85" rx="25" ry="12" fill="hsl(220, 50%, 15%)" fillOpacity="0.3" stroke="hsl(220, 50%, 30%)" strokeWidth="0.3" />
          <text x="70" y="87" fontSize="3" fill="hsl(220, 50%, 40%)" textAnchor="middle" opacity="0.4">巢湖</text>
          <path d="M15 30 L40 15 L70 12 L88 25 L92 55 L85 80 L60 92 L30 88 L12 70 L8 45 Z" fill="none" stroke="hsl(270, 80%, 40%)" strokeWidth="0.2" opacity="0.2" />
          <path d="M25 35 L45 25 L68 28 L78 45 L75 65 L58 78 L35 75 L22 58 L20 42 Z" fill="hsl(270, 80%, 40%)" fillOpacity="0.03" stroke="hsl(270, 80%, 40%)" strokeWidth="0.3" opacity="0.35" />
          <path d="M32 40 L48 32 L62 35 L68 48 L65 60 L52 68 L38 65 L30 52 Z" fill="hsl(270, 80%, 40%)" fillOpacity="0.05" stroke="hsl(270, 80%, 40%)" strokeWidth="0.4" opacity="0.45" />
          <ellipse cx="48" cy="48" rx="10" ry="8" fill="hsl(270, 80%, 40%)" fillOpacity="0.08" stroke="hsl(270, 80%, 40%)" strokeWidth="0.5" opacity="0.5" />
          <text x="48" y="42" fontSize="2.5" fill="#555" textAnchor="middle" opacity="0.5">庐阳区</text>
          <text x="68" y="42" fontSize="2.5" fill="#555" textAnchor="middle" opacity="0.5">瑶海区</text>
          <text x="28" y="52" fontSize="2.5" fill="#555" textAnchor="middle" opacity="0.5">蜀山区</text>
          <text x="55" y="62" fontSize="2.5" fill="#555" textAnchor="middle" opacity="0.5">包河区</text>
          <text x="45" y="80" fontSize="2.5" fill="#555" textAnchor="middle" opacity="0.5">滨湖新区</text>
        </svg>

        {stores.map((store) => (
          <StoreNode key={store.id} store={store} orders={getOrders(store.id)} />
        ))}

        <div className="absolute bottom-1 right-2 text-[9px] text-[#444]">
          数据更新: {new Date().toLocaleTimeString('zh-CN')}
        </div>
      </div>
    </div>
  );
}
