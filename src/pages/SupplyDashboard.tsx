import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Coffee, Zap, Eye, AlertTriangle, TrendingUp } from "lucide-react";

type Store = {
  id: string;
  name: string;
  status: string;
};

type Inventory = {
  store_id: string;
  material_id: string;
  current_quantity: number;
};

type BomRecipe = {
  material_id: string;
  usage_quantity: number;
};

type Material = {
  id: string;
  name: string;
  category: string;
};

type StoreDoS = {
  store: Store;
  daysOfSupply: number;
  bottleneckMaterial: string | null;
  bottleneckMaterialId: string | null;
  status: "meltdown" | "warning" | "safe";
};

// Traffic light thresholds
const MELTDOWN_THRESHOLD = 2.0;
const WARNING_THRESHOLD = 4.0;

// Simulated daily average usage per material (in real app, calculate from sales data)
const SIMULATED_DAILY_USAGE: Record<string, number> = {};

export default function SupplyDashboard() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<"all" | "meltdown" | "warning" | "safe">("all");

  // Fetch stores
  const { data: stores = [] } = useQuery({
    queryKey: ["stores_active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data as Store[];
    },
  });

  // Fetch all inventory
  const { data: inventory = [] } = useQuery({
    queryKey: ["store_inventory_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("store_inventory").select("*");
      if (error) throw error;
      return data as Inventory[];
    },
  });

  // Fetch BOM recipes to estimate daily usage
  const { data: bomRecipes = [] } = useQuery({
    queryKey: ["bom_recipes_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bom_recipes").select("*");
      if (error) throw error;
      return data as BomRecipe[];
    },
  });

  // Fetch materials for names (only core categories: bean, milk, packaging)
  const { data: materials = [] } = useQuery({
    queryKey: ["sku_materials_core"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sku_materials")
        .select("id, name, category")
        .in("category", ["bean", "milk", "packaging"]);
      if (error) throw error;
      return data as Material[];
    },
  });

  const coreMatIds = new Set(materials.map((m) => m.id));
  const getMaterialName = (id: string) => materials.find((m) => m.id === id)?.name || "未知";

  // Calculate average usage per material from BOM (cups/day simulation)
  // In production, this would come from actual sales data
  const avgDailyUsagePerMaterial = bomRecipes.reduce((acc, recipe) => {
    if (!acc[recipe.material_id]) {
      acc[recipe.material_id] = { total: 0, count: 0 };
    }
    acc[recipe.material_id].total += recipe.usage_quantity;
    acc[recipe.material_id].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  // Estimate daily usage: avg_usage_per_cup * estimated_cups_per_day (e.g., 100 cups)
  const ESTIMATED_DAILY_CUPS = 100;

  // Calculate DoS for each store
  const storeDoSList: StoreDoS[] = stores.map((store) => {
    const storeInventory = inventory.filter(
      (inv) => inv.store_id === store.id && coreMatIds.has(inv.material_id)
    );

    if (storeInventory.length === 0) {
      return {
        store,
        daysOfSupply: 0,
        bottleneckMaterial: null,
        bottleneckMaterialId: null,
        status: "meltdown" as const,
      };
    }

    let minDoS = Infinity;
    let bottleneckMaterialId: string | null = null;

    storeInventory.forEach((inv) => {
      const avgUsage = avgDailyUsagePerMaterial[inv.material_id];
      if (avgUsage && avgUsage.total > 0) {
        // Daily usage = (avg per cup) * (estimated daily cups)
        const avgPerCup = avgUsage.total / avgUsage.count;
        const dailyUsage = avgPerCup * ESTIMATED_DAILY_CUPS;
        const dos = dailyUsage > 0 ? inv.current_quantity / dailyUsage : Infinity;
        
        if (dos < minDoS) {
          minDoS = dos;
          bottleneckMaterialId = inv.material_id;
        }
      }
    });

    const finalDoS = minDoS === Infinity ? 0 : minDoS;
    let status: "meltdown" | "warning" | "safe" = "safe";
    if (finalDoS < MELTDOWN_THRESHOLD) status = "meltdown";
    else if (finalDoS < WARNING_THRESHOLD) status = "warning";

    return {
      store,
      daysOfSupply: finalDoS,
      bottleneckMaterial: bottleneckMaterialId ? getMaterialName(bottleneckMaterialId) : null,
      bottleneckMaterialId,
      status,
    };
  });

  // Sort: Red -> Yellow -> Green, then by DoS ascending within each group
  const statusOrder = { meltdown: 0, warning: 1, safe: 2 };
  const sortedStores = [...storeDoSList].sort((a, b) => {
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return a.daysOfSupply - b.daysOfSupply;
  });

  // Filter by status
  const filteredStores = statusFilter === "all" 
    ? sortedStores 
    : sortedStores.filter((s) => s.status === statusFilter);

  // Stats
  const meltdownCount = storeDoSList.filter((s) => s.status === "meltdown").length;
  const warningCount = storeDoSList.filter((s) => s.status === "warning").length;
  const safeCount = storeDoSList.filter((s) => s.status === "safe").length;
  const avgDoS = storeDoSList.length > 0
    ? storeDoSList.reduce((sum, s) => sum + s.daysOfSupply, 0) / storeDoSList.length
    : 0;

  const handleEmergencyPush = (storeId: string) => {
    navigate(`/supply/push?store=${storeId}&urgent=true`);
  };

  const handleViewPush = () => {
    navigate("/supply/push");
  };

  return (
    <div className="h-full space-y-4">
      {/* Header Stats Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">全城产能监控</h1>
        </div>

        {/* Clickable Filter Stats */}
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "meltdown" ? "destructive" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter(statusFilter === "meltdown" ? "all" : "meltdown")}
            className="gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-red-500" />
            熔断门店: {meltdownCount} 家
          </Button>
          <Button
            variant={statusFilter === "warning" ? "default" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter(statusFilter === "warning" ? "all" : "warning")}
            className={`gap-2 ${statusFilter === "warning" ? "bg-yellow-600 hover:bg-yellow-700" : ""}`}
          >
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            备货门店: {warningCount} 家
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">全网平均周转:</span>
            <span className="font-mono font-bold text-foreground">{avgDoS.toFixed(1)} 天</span>
          </div>
        </div>
      </div>

      {/* Store Grid */}
      {stores.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Coffee className="w-12 h-12 mb-4 opacity-50" />
            <p>暂无门店数据</p>
            <p className="text-sm">请先在门店管理中添加门店</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredStores.map(({ store, daysOfSupply, bottleneckMaterial, status }) => (
            <Card
              key={store.id}
              className={`relative overflow-hidden transition-all duration-300 ${
                status === "meltdown"
                  ? "bg-red-950/80 border-red-500/50 animate-pulse"
                  : status === "warning"
                  ? "bg-yellow-950/60 border-yellow-500/30"
                  : "bg-emerald-950/30 border-emerald-500/20"
              }`}
            >
              {/* Status indicator glow */}
              {status === "meltdown" && (
                <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 to-transparent pointer-events-none" />
              )}

              <CardContent className="p-4 space-y-3">
                {/* Store Name Header */}
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground truncate">{store.name}</h3>
                  {status === "meltdown" && (
                    <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
                  )}
                </div>

                {/* Core DoS Number */}
                <div className="text-center py-2">
                  <span
                    className={`text-5xl font-bold font-mono ${
                      status === "meltdown"
                        ? "text-red-400"
                        : status === "warning"
                        ? "text-yellow-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {daysOfSupply.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">天</span>
                </div>

                {/* Bottleneck Badge */}
                {(status === "meltdown" || status === "warning") && bottleneckMaterial && (
                  <Badge
                    variant="outline"
                    className={`w-full justify-center text-xs ${
                      status === "meltdown"
                        ? "border-red-500/50 text-red-300 bg-red-500/10"
                        : "border-yellow-500/50 text-yellow-300 bg-yellow-500/10"
                    }`}
                  >
                    ⚠️ 缺: {bottleneckMaterial}
                  </Badge>
                )}

                {/* Action Buttons */}
                {status === "meltdown" && (
                  <Button
                    size="sm"
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => handleEmergencyPush(store.id)}
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    紧急调拨
                  </Button>
                )}
                {status === "warning" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-yellow-500/50 text-yellow-300 hover:bg-yellow-500/10"
                    onClick={handleViewPush}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    查看补货
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span>熔断区 (&lt;2天)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>备货区 (2-4天)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>安全区 (≥4天)</span>
        </div>
      </div>
    </div>
  );
}
