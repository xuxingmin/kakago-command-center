import { useState, useEffect, useMemo } from "react";
import { MapPin, Store } from "lucide-react";
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
  minLng: 117.10,
  maxLng: 117.45,
  minLat: 31.72,
  maxLat: 31.95,
};

function coordToPercent(lng: number, lat: number): { x: number; y: number } {
  const x = ((lng - HEFEI_BOUNDS.minLng) / (HEFEI_BOUNDS.maxLng - HEFEI_BOUNDS.minLng)) * 100;
  const y = ((HEFEI_BOUNDS.maxLat - lat) / (HEFEI_BOUNDS.maxLat - HEFEI_BOUNDS.minLat)) * 100;
  return {
    x: Math.max(3, Math.min(97, x)),
    y: Math.max(3, Math.min(97, y)),
  };
}

function getMockOrders(storeId: string): number {
  const hash = storeId.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  return Math.floor((hash % 150) + 10);
}

const ORDER_CAP = 160;

type LoadLevel = "low" | "normal" | "high";

function getLoadLevel(orders: number): LoadLevel {
  if (orders > 100) return "high";
  if (orders >= 30) return "normal";
  return "low";
}

function getLoadMeta(level: LoadLevel) {
  switch (level) {
    case "high":
      return { color: "#FF2D2D", label: "高负载" };
    case "normal":
      return { color: "#7F00FF", label: "正常" };
    case "low":
      return { color: "#0D7377", label: "低负载" };
  }
}

interface StoreNodeProps {
  store: StoreData;
  orders: number;
}

function StoreNode({ store, orders }: StoreNodeProps) {
  const isActive = store.status === "active";
  const { x, y } = coordToPercent(Number(store.longitude), Number(store.latitude));

  if (!isActive) {
    // Non-operating: tiny grey square, very faint
    return (
      <HoverCard openDelay={0} closeDelay={100}>
        <HoverCardTrigger asChild>
          <div
            className="absolute cursor-pointer"
            style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)" }}
          >
            <div
              className="rounded-[1px]"
              style={{
                width: 4,
                height: 4,
                backgroundColor: "#555",
                opacity: 0.25,
              }}
            />
          </div>
        </HoverCardTrigger>
        <HoverCardContent
          side="top"
          sideOffset={6}
          className="w-44 border-none p-2.5"
          style={{ backgroundColor: "rgba(20,20,25,0.85)", backdropFilter: "blur(8px)" }}
        >
          <p className="text-xs text-muted-foreground truncate">{store.name}</p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">非营业</p>
        </HoverCardContent>
      </HoverCard>
    );
  }

  const level = getLoadLevel(orders);
  const { color, label } = getLoadMeta(level);

  // Dot diameter: original was ~12px, shrink 60% → ~5px
  const dotSize = 5;

  return (
    <HoverCard openDelay={0} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div
          className="absolute cursor-pointer group"
          style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)" }}
        >
          <div
            className="rounded-full relative"
            style={{
              width: dotSize,
              height: dotSize,
              backgroundColor: color,
              boxShadow: `0 0 3px ${color}60`,
              transition: "transform 0.15s",
            }}
          >
            {/* High load: blinking red center dot */}
            {level === "high" && (
              <span
                className="absolute rounded-full animate-ping"
                style={{
                  width: 2,
                  height: 2,
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%,-50%)",
                  backgroundColor: "#FF2D2D",
                  animationDuration: "1.2s",
                }}
              />
            )}
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        sideOffset={6}
        className="w-52 border-none p-3"
        style={{ backgroundColor: "rgba(15,15,20,0.88)", backdropFilter: "blur(10px)" }}
      >
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-white truncate">{store.name}</p>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span>{label}</span>
            <span className="text-muted-foreground/50">·</span>
            <span className="font-mono tabular-nums">
              订单 {orders}/{ORDER_CAP}
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
        const ordersMap = new Map<string, number>();
        data.forEach((store) => {
          ordersMap.set(store.id, getMockOrders(store.id));
        });
        setStoreOrders(ordersMap);
      }
    }
    fetchStores();
  }, []);

  const getOrders = (storeId: string) => storeOrders.get(storeId) || 0;

  const activeStores = useMemo(() => stores.filter((s) => s.status === "active"), [stores]);
  const inactiveCount = stores.length - activeStores.length;

  const highLoadCount = activeStores.filter((s) => getLoadLevel(getOrders(s.id)) === "high").length;
  const normalCount = activeStores.filter((s) => getLoadLevel(getOrders(s.id)) === "normal").length;
  const lowLoadCount = activeStores.filter((s) => getLoadLevel(getOrders(s.id)) === "low").length;

  return (
    <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-3 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">门店分布地图</span>
          <span className="text-xs text-[#666]">
            · 合肥主城区 ({activeStores.length}/{stores.length})
          </span>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#FF2D2D" }} />
            <span className="text-[#666]">高负载({highLoadCount})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#7F00FF" }} />
            <span className="text-[#666]">正常({normalCount})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#0D7377" }} />
            <span className="text-[#666]">低负载({lowLoadCount})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-[1px]" style={{ backgroundColor: "#555", opacity: 0.3 }} />
            <span className="text-[#666]">非营业({inactiveCount})</span>
          </div>
        </div>
      </div>

      {/* Map */}
      <div
        className="flex-1 relative rounded-lg overflow-hidden"
        style={{ backgroundColor: "#060608" }}
      >
        {/* Subtle grid – very dim */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(127,0,255,0.04) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(127,0,255,0.04) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />

        {/* Hefei SVG overlay – dimmed */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <ellipse cx="70" cy="85" rx="25" ry="12" fill="hsl(220,40%,12%)" fillOpacity="0.25" stroke="hsl(220,40%,25%)" strokeWidth="0.2" />
          <text x="70" y="87" fontSize="3" fill="hsl(220,40%,30%)" textAnchor="middle" opacity="0.35">巢湖</text>

          <path d="M15 30 L40 15 L70 12 L88 25 L92 55 L85 80 L60 92 L30 88 L12 70 L8 45 Z" fill="none" stroke="hsl(270,60%,30%)" strokeWidth="0.2" opacity="0.2" />
          <path d="M25 35 L45 25 L68 28 L78 45 L75 65 L58 78 L35 75 L22 58 L20 42 Z" fill="hsl(270,60%,20%)" fillOpacity="0.02" stroke="hsl(270,60%,30%)" strokeWidth="0.25" opacity="0.3" />
          <path d="M32 40 L48 32 L62 35 L68 48 L65 60 L52 68 L38 65 L30 52 Z" fill="hsl(270,60%,20%)" fillOpacity="0.03" stroke="hsl(270,60%,30%)" strokeWidth="0.3" opacity="0.35" />
          <ellipse cx="48" cy="48" rx="10" ry="8" fill="hsl(270,60%,20%)" fillOpacity="0.04" stroke="hsl(270,60%,30%)" strokeWidth="0.35" opacity="0.4" />

          <text x="48" y="42" fontSize="2.5" fill="#444" textAnchor="middle" opacity="0.4">庐阳区</text>
          <text x="68" y="42" fontSize="2.5" fill="#444" textAnchor="middle" opacity="0.4">瑶海区</text>
          <text x="28" y="52" fontSize="2.5" fill="#444" textAnchor="middle" opacity="0.4">蜀山区</text>
          <text x="55" y="62" fontSize="2.5" fill="#444" textAnchor="middle" opacity="0.4">包河区</text>
          <text x="45" y="80" fontSize="2.5" fill="#444" textAnchor="middle" opacity="0.4">滨湖新区</text>
        </svg>

        {/* Store nodes */}
        {stores.map((store) => (
          <StoreNode key={store.id} store={store} orders={getOrders(store.id)} />
        ))}

        <div className="absolute bottom-1 right-2 text-[9px] text-[#444]">
          数据更新: {new Date().toLocaleTimeString("zh-CN")}
        </div>
      </div>
    </div>
  );
}
