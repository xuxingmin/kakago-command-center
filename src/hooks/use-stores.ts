import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export type StoreData = Tables<"stores">;

interface StoresState {
  stores: StoreData[];
  loading: boolean;
  activeStores: StoreData[];
  totalCount: number;
  activeCount: number;
}

export function useStores(): StoresState {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStores() {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setStores(data);
      }
      setLoading(false);
    }
    fetchStores();
  }, []);

  const activeStores = stores.filter(s => s.status === "active");

  return {
    stores,
    loading,
    activeStores,
    totalCount: stores.length,
    activeCount: activeStores.length,
  };
}

// 获取随机门店名称（用于模拟数据）
export function getRandomStoreName(stores: StoreData[]): string {
  if (stores.length === 0) return "门店";
  return stores[Math.floor(Math.random() * stores.length)].name;
}

// 订单统计 hook (含昨日同时段对比)
interface OrderStats {
  todayCount: number;
  todayRevenue: number;
  yesterdayCount: number;
  yesterdayRevenue: number;
  loading: boolean;
}

function calcTrend(today: number, yesterday: number): number {
  if (yesterday === 0) return today > 0 ? 100 : 0;
  return Math.round(((today - yesterday) / yesterday) * 1000) / 10;
}

export function useOrderStats(): OrderStats & { revenueTrend: number; countTrend: number } {
  const [stats, setStats] = useState<OrderStats>({
    todayCount: 0,
    todayRevenue: 0,
    yesterdayCount: 0,
    yesterdayRevenue: 0,
    loading: true,
  });

  useEffect(() => {
    async function fetchStats() {
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      // 昨日同时段: 昨日0点 ~ 昨日此刻
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const yesterdaySameTime = new Date(now);
      yesterdaySameTime.setDate(yesterdaySameTime.getDate() - 1);

      const [todayRes, yesterdayRes] = await Promise.all([
        supabase
          .from("orders")
          .select("total_amount")
          .gte("created_at", todayStart.toISOString())
          .lte("created_at", now.toISOString())
          .neq("status", "cancelled"),
        supabase
          .from("orders")
          .select("total_amount")
          .gte("created_at", yesterdayStart.toISOString())
          .lte("created_at", yesterdaySameTime.toISOString())
          .neq("status", "cancelled"),
      ]);

      const todayData = todayRes.data || [];
      const yesterdayData = yesterdayRes.data || [];

      setStats({
        todayCount: todayData.length,
        todayRevenue: todayData.reduce((sum, o) => sum + Number(o.total_amount), 0),
        yesterdayCount: yesterdayData.length,
        yesterdayRevenue: yesterdayData.reduce((sum, o) => sum + Number(o.total_amount), 0),
        loading: false,
      });
    }

    fetchStats();

    const channel = supabase
      .channel("orders-stats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    ...stats,
    revenueTrend: calcTrend(stats.todayRevenue, stats.yesterdayRevenue),
    countTrend: calcTrend(stats.todayCount, stats.yesterdayCount),
  };
}
