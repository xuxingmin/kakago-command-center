import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Activity, Coffee } from "lucide-react";

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
};

type StoreCapacity = {
  store: Store;
  capacity: number;
  bottleneckMaterial: string | null;
};

export default function SupplyDashboard() {
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

  // Fetch BOM recipes to calculate average usage
  const { data: bomRecipes = [] } = useQuery({
    queryKey: ["bom_recipes_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bom_recipes").select("*");
      if (error) throw error;
      return data as BomRecipe[];
    },
  });

  // Fetch materials for names
  const { data: materials = [] } = useQuery({
    queryKey: ["sku_materials_names"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sku_materials").select("id, name");
      if (error) throw error;
      return data as Material[];
    },
  });

  // Calculate average usage per cup for each material
  const avgUsagePerMaterial = bomRecipes.reduce((acc, recipe) => {
    if (!acc[recipe.material_id]) {
      acc[recipe.material_id] = { total: 0, count: 0 };
    }
    acc[recipe.material_id].total += recipe.usage_quantity;
    acc[recipe.material_id].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const getMaterialName = (id: string) => materials.find((m) => m.id === id)?.name || "未知";

  // Calculate capacity for each store
  const storeCapacities: StoreCapacity[] = stores.map((store) => {
    const storeInventory = inventory.filter((inv) => inv.store_id === store.id);
    
    if (storeInventory.length === 0) {
      return { store, capacity: 0, bottleneckMaterial: null };
    }

    let minCapacity = Infinity;
    let bottleneckMaterialId: string | null = null;

    storeInventory.forEach((inv) => {
      const avgUsage = avgUsagePerMaterial[inv.material_id];
      if (avgUsage && avgUsage.total > 0) {
        const avgPerCup = avgUsage.total / avgUsage.count;
        const capacity = Math.floor(inv.current_quantity / avgPerCup);
        if (capacity < minCapacity) {
          minCapacity = capacity;
          bottleneckMaterialId = inv.material_id;
        }
      }
    });

    return {
      store,
      capacity: minCapacity === Infinity ? 0 : minCapacity,
      bottleneckMaterial: bottleneckMaterialId ? getMaterialName(bottleneckMaterialId) : null,
    };
  });

  // Sort by capacity (lowest first for visibility of problems)
  const sortedCapacities = [...storeCapacities].sort((a, b) => a.capacity - b.capacity);

  const totalCapacity = storeCapacities.reduce((sum, s) => sum + s.capacity, 0);
  const warningStores = storeCapacities.filter((s) => s.capacity < 50).length;

  return (
    <div className="h-full space-y-4">
      {/* Header Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">全城产能监控</h1>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">总产能</p>
            <p className="text-2xl font-bold font-mono text-primary">{totalCapacity.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">预警门店</p>
            <p className={`text-2xl font-bold font-mono ${warningStores > 0 ? "text-destructive" : "text-success"}`}>
              {warningStores}
            </p>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {sortedCapacities.map(({ store, capacity, bottleneckMaterial }) => {
            const isWarning = capacity < 50;
            const isCritical = capacity < 20;

            return (
              <Card
                key={store.id}
                className={`bg-card border-border transition-all duration-200 ${
                  isCritical
                    ? "border-destructive/50 bg-destructive/5"
                    : isWarning
                    ? "border-warning/50 bg-warning/5"
                    : "hover:border-primary/30"
                }`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground flex items-center justify-between">
                    {store.name}
                    {isWarning && (
                      <AlertTriangle className={`w-4 h-4 ${isCritical ? "text-destructive" : "text-warning"}`} />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-center">
                    <p
                      className={`text-4xl font-bold font-mono ${
                        isCritical ? "text-destructive" : isWarning ? "text-warning" : "text-foreground"
                      }`}
                    >
                      {capacity}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">剩余产能 (杯)</p>
                  </div>

                  {isWarning && bottleneckMaterial && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <Badge
                        variant="outline"
                        className={`w-full justify-center text-xs ${
                          isCritical ? "border-destructive/50 text-destructive" : "border-warning/50 text-warning"
                        }`}
                      >
                        短板: {bottleneckMaterial}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
