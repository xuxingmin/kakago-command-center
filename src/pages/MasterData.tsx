import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Coffee, 
  Store, 
  Link2, 
  AlertTriangle,
  Download,
  CheckCircle2,
  Database
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

// Import category components
import { MaterialsSection } from "@/components/master-data/MaterialsSection";
import { ProductsSection } from "@/components/master-data/ProductsSection";
import { StoresSection } from "@/components/master-data/StoresSection";
import { BOMSection } from "@/components/master-data/BOMSection";

type CategoryType = "materials" | "products" | "stores" | "bom";

const categories = [
  { id: "materials" as const, label: "原物料类", icon: Package, color: "text-blue-400" },
  { id: "products" as const, label: "产品/SKU类", icon: Coffee, color: "text-amber-400" },
  { id: "stores" as const, label: "资产/门店类", icon: Store, color: "text-green-400" },
  { id: "bom" as const, label: "逻辑/BOM类", icon: Link2, color: "text-purple-400" },
];

export default function MasterData() {
  const [activeCategory, setActiveCategory] = useState<CategoryType>("materials");
  const queryClient = useQueryClient();

  // Fetch all data for integrity checks
  const { data: materials = [] } = useQuery({
    queryKey: ["master_materials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sku_materials").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["master_products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sku_products").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: stores = [] } = useQuery({
    queryKey: ["master_stores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("stores").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: bomRecipes = [] } = useQuery({
    queryKey: ["master_bom"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bom_recipes").select("product_id");
      if (error) throw error;
      return data;
    },
  });

  const { data: storeInventory = [] } = useQuery({
    queryKey: ["master_store_inventory"],
    queryFn: async () => {
      const { data, error } = await supabase.from("store_inventory").select("store_id, material_id");
      if (error) throw error;
      return data;
    },
  });

  // Calculate data integrity metrics
  const productIdsWithBOM = new Set(bomRecipes.map((r) => r.product_id));
  const productsWithoutBOM = products.filter((p) => !productIdsWithBOM.has(p.id));

  // Check stores without full inventory initialization
  const storesWithIncompleteInventory = stores.filter((store) => {
    const storeInvCount = storeInventory.filter((inv) => inv.store_id === store.id).length;
    return storeInvCount < materials.length;
  });

  const integrityScore = Math.round(
    ((products.length - productsWithoutBOM.length) / Math.max(products.length, 1)) * 50 +
    ((stores.length - storesWithIncompleteInventory.length) / Math.max(stores.length, 1)) * 50
  );

  // Export functionality
  const handleExport = (format: "json" | "xlsx") => {
    const exportData = {
      materials,
      products,
      stores,
      bomRecipes,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };

    if (format === "json") {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kakago-master-data-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("JSON 导出成功");
    } else {
      const wb = XLSX.utils.book_new();
      
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(materials), "原物料");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(products), "产品SKU");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stores), "门店资产");
      
      XLSX.writeFile(wb, `kakago-master-data-${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Excel 导出成功");
    }
  };

  return (
    <div className="h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">主数据资产中心</h1>
          <Badge variant="outline" className="border-primary/50 text-primary">
            唯一真实来源
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport("json")}>
            <Download className="w-4 h-4 mr-2" />
            导出 JSON
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("xlsx")}>
            <Download className="w-4 h-4 mr-2" />
            导出 Excel
          </Button>
        </div>
      </div>

      {/* Data Integrity Dashboard */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">数据完整性</p>
                <p className={cn(
                  "text-2xl font-bold",
                  integrityScore >= 80 ? "text-success" : integrityScore >= 50 ? "text-yellow-500" : "text-destructive"
                )}>
                  {integrityScore}%
                </p>
              </div>
              {integrityScore >= 80 ? (
                <CheckCircle2 className="w-8 h-8 text-success" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">原物料</p>
            <p className="text-2xl font-bold text-foreground">{materials.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">产品 SKU</p>
            <p className="text-2xl font-bold text-foreground">{products.length}</p>
            {productsWithoutBOM.length > 0 && (
              <p className="text-xs text-destructive mt-1">
                ⚠️ {productsWithoutBOM.length} 个未配置 BOM
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">门店资产</p>
            <p className="text-2xl font-bold text-foreground">{stores.length}</p>
            {storesWithIncompleteInventory.length > 0 && (
              <p className="text-xs text-destructive mt-1">
                ⚠️ {storesWithIncompleteInventory.length} 个未初始化库存
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">BOM 配方</p>
            <p className="text-2xl font-bold text-foreground">{bomRecipes.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Segmented Control */}
      <div className="flex gap-1 p-1 bg-card rounded-lg border border-border w-fit">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "" : cat.color)} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Category Content */}
      <div className="flex-1">
        {activeCategory === "materials" && (
          <MaterialsSection 
            materials={materials} 
            queryClient={queryClient} 
          />
        )}
        {activeCategory === "products" && (
          <ProductsSection 
            products={products} 
            productsWithoutBOM={productsWithoutBOM}
            queryClient={queryClient} 
          />
        )}
        {activeCategory === "stores" && (
          <StoresSection 
            stores={stores} 
            materials={materials}
            storesWithIncompleteInventory={storesWithIncompleteInventory}
            queryClient={queryClient} 
          />
        )}
        {activeCategory === "bom" && (
          <BOMSection 
            products={products}
            materials={materials}
            queryClient={queryClient} 
          />
        )}
      </div>
    </div>
  );
}
