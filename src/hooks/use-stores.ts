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

// 订单统计 hook
interface OrderStats {
  todayCount: number;
  todayRevenue: number;
  loading: boolean;
}

export function useOrderStats(): OrderStats {
  const [stats, setStats] = useState<OrderStats>({
    todayCount: 0,
    todayRevenue: 0,
    loading: true,
  });

  useEffect(() => {
    async function fetchStats() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("orders")
        .select("total_amount")
        .gte("created_at", today.toISOString())
        .neq("status", "cancelled");

      if (!error && data) {
        setStats({
          todayCount: data.length,
          todayRevenue: data.reduce((sum, order) => sum + Number(order.total_amount), 0),
          loading: false,
        });
      } else {
        setStats(prev => ({ ...prev, loading: false }));
      }
    }

    fetchStats();

    // 订阅实时更新
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

  return stats;
}
