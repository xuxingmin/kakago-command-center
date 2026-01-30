import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Warehouse, Building2 } from "lucide-react";

type MaterialSummary = {
  category: string;
  name: string;
  total_qty: number;
  unit: string;
};

type StoreSummary = {
  store_name: string;
  materials: MaterialSummary[];
};

const CATEGORY_LABELS: Record<string, string> = {
  bean: "豆",
  milk: "奶",
  packaging: "杯",
  syrup: "糖浆",
  other: "其他",
};

const CATEGORY_ORDER = ["bean", "milk", "packaging", "syrup", "other"];

export function InventorySummaryCards() {
  // Fetch total inventory grouped by material
  const { data: totalInventory = [] } = useQuery({
    queryKey: ["inventory_total_summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_inventory")
        .select(`
          current_quantity,
          sku_materials!inner (
            id,
            name,
            category,
            unit_usage
          )
        `);
      if (error) throw error;

      // Aggregate by material
      const materialMap = new Map<string, MaterialSummary>();
      data?.forEach((inv: any) => {
        const mat = inv.sku_materials;
        const key = mat.id;
        if (materialMap.has(key)) {
          materialMap.get(key)!.total_qty += Number(inv.current_quantity);
        } else {
          materialMap.set(key, {
            category: mat.category,
            name: mat.name,
            total_qty: Number(inv.current_quantity),
            unit: mat.unit_usage,
          });
        }
      });

      return Array.from(materialMap.values()).sort((a, b) => {
        const orderA = CATEGORY_ORDER.indexOf(a.category);
        const orderB = CATEGORY_ORDER.indexOf(b.category);
        return orderA - orderB;
      });
    },
  });

  // Fetch inventory by store
  const { data: storeInventory = [] } = useQuery({
    queryKey: ["inventory_store_summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_inventory")
        .select(`
          current_quantity,
          stores!inner (
            id,
            name
          ),
          sku_materials!inner (
            id,
            name,
            category,
            unit_usage
          )
        `);
      if (error) throw error;

      // Group by store
      const storeMap = new Map<string, StoreSummary>();
      data?.forEach((inv: any) => {
        const store = inv.stores;
        const mat = inv.sku_materials;

        if (!storeMap.has(store.id)) {
          storeMap.set(store.id, {
            store_name: store.name,
            materials: [],
          });
        }

        const existing = storeMap.get(store.id)!.materials.find(
          (m) => m.name === mat.name
        );
        if (existing) {
          existing.total_qty += Number(inv.current_quantity);
        } else {
          storeMap.get(store.id)!.materials.push({
            category: mat.category,
            name: mat.name,
            total_qty: Number(inv.current_quantity),
            unit: mat.unit_usage,
          });
        }
      });

      return Array.from(storeMap.values());
    },
  });

  // Group total inventory by category for display
  const groupedTotal = CATEGORY_ORDER.reduce((acc, cat) => {
    const items = totalInventory.filter((m) => m.category === cat);
    if (items.length > 0) {
      acc.push({ category: cat, items });
    }
    return acc;
  }, [] as { category: string; items: MaterialSummary[] }[]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      {/* 总库存卡片 */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Warehouse className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">总库存</span>
        </div>

        {totalInventory.length === 0 ? (
          <p className="text-xs text-muted-foreground">暂无库存数据</p>
        ) : (
          <div className="space-y-2">
            {groupedTotal.map(({ category, items }) => (
              <div key={category} className="flex flex-wrap gap-x-4 gap-y-1">
                <span className="text-xs text-muted-foreground w-8">
                  {CATEGORY_LABELS[category]}
                </span>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {items.map((m) => (
                    <span key={m.name} className="text-xs text-foreground">
                      <span className="text-muted-foreground">{m.name}</span>
                      <span className="ml-1 font-mono font-medium">
                        {m.total_qty.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground ml-0.5">
                        {m.unit}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 城市分库卡片 */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-sm font-medium text-foreground">城市分库</span>
        </div>

        {storeInventory.length === 0 ? (
          <p className="text-xs text-muted-foreground">暂无分库数据</p>
        ) : (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {storeInventory.slice(0, 5).map((store) => (
              <div key={store.store_name} className="flex items-start gap-2">
                <span className="text-xs text-muted-foreground min-w-16 truncate">
                  {store.store_name}
                </span>
                <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                  {store.materials
                    .sort(
                      (a, b) =>
                        CATEGORY_ORDER.indexOf(a.category) -
                        CATEGORY_ORDER.indexOf(b.category)
                    )
                    .slice(0, 4)
                    .map((m) => (
                      <span
                        key={m.name}
                        className="text-xs text-muted-foreground"
                      >
                        {m.name.slice(0, 3)}
                        <span className="font-mono text-foreground ml-0.5">
                          {m.total_qty}
                        </span>
                      </span>
                    ))}
                </div>
              </div>
            ))}
            {storeInventory.length > 5 && (
              <p className="text-xs text-muted-foreground">
                +{storeInventory.length - 5} 门店...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
