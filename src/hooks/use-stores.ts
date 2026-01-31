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
