import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Save, Trash2, Coffee, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Product = {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  image_url: string | null;
};

type Material = {
  id: string;
  name: string;
  unit_usage: string;
  category: string;
};

type BomRecipe = {
  id: string;
  product_id: string;
  material_id: string;
  usage_quantity: number;
  material?: Material;
};

export default function SupplyBOM() {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [newRecipes, setNewRecipes] = useState<{ materialId: string; quantity: number }[]>([]);
  const queryClient = useQueryClient();

  // Fetch active products only
  const { data: products = [] } = useQuery({
    queryKey: ["sku_products_active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sku_products")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
  });

  // Fetch all materials for dropdown
  const { data: materials = [] } = useQuery({
    queryKey: ["sku_materials_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sku_materials")
        .select("id, name, unit_usage, category")
        .order("name");
      if (error) throw error;
      return data as Material[];
    },
  });

  // Fetch recipes for selected product
  const { data: recipes = [], isLoading: recipesLoading } = useQuery({
    queryKey: ["bom_recipes", selectedProductId],
    queryFn: async () => {
      if (!selectedProductId) return [];
      const { data, error } = await supabase
        .from("bom_recipes")
        .select("*")
        .eq("product_id", selectedProductId);
      if (error) throw error;
      return data as BomRecipe[];
    },
    enabled: !!selectedProductId,
  });

  // Auto-select first product
  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  // Clear new recipes when product changes
  useEffect(() => {
    setNewRecipes([]);
  }, [selectedProductId]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Get material info by id
  const getMaterial = (materialId: string) => materials.find((m) => m.id === materialId);

  // Get materials not yet in the recipe
  const availableMaterials = materials.filter(
    (m) =>
      !recipes.some((r) => r.material_id === m.id) &&
      !newRecipes.some((nr) => nr.materialId === m.id)
  );

  // Add new recipe row
  const handleAddRecipeRow = () => {
    if (availableMaterials.length === 0) {
      toast.error("所有原料已添加");
      return;
    }
    setNewRecipes([...newRecipes, { materialId: "", quantity: 0 }]);
  };

  // Update new recipe row
  const updateNewRecipe = (index: number, field: "materialId" | "quantity", value: string | number) => {
    const updated = [...newRecipes];
    if (field === "materialId") {
      updated[index].materialId = value as string;
    } else {
      updated[index].quantity = value as number;
    }
    setNewRecipes(updated);
  };

  // Remove new recipe row
  const removeNewRecipe = (index: number) => {
    setNewRecipes(newRecipes.filter((_, i) => i !== index));
  };

  // Delete existing recipe mutation
  const deleteMutation = useMutation({
    mutationFn: async (recipeId: string) => {
      const { error } = await supabase.from("bom_recipes").delete().eq("id", recipeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bom_recipes", selectedProductId] });
      queryClient.invalidateQueries({ queryKey: ["bom_recipes_status"] });
      toast.success("已删除原料");
    },
    onError: () => {
      toast.error("删除失败");
    },
  });

  // Update existing recipe mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { error } = await supabase
        .from("bom_recipes")
        .update({ usage_quantity: quantity })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bom_recipes", selectedProductId] });
      toast.success("已更新消耗量");
    },
    onError: () => {
      toast.error("更新失败");
    },
  });

  // Save new recipes mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const validRecipes = newRecipes.filter((r) => r.materialId && r.quantity > 0);
      if (validRecipes.length === 0) {
        throw new Error("请选择原料并输入消耗量");
      }

      const inserts = validRecipes.map((r) => ({
        product_id: selectedProductId!,
        material_id: r.materialId,
        usage_quantity: r.quantity,
      }));

      const { error } = await supabase.from("bom_recipes").insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bom_recipes", selectedProductId] });
      queryClient.invalidateQueries({ queryKey: ["bom_recipes_status"] });
      setNewRecipes([]);
      toast.success("配方已保存");
    },
    onError: (err: any) => {
      toast.error(err.message || "保存失败");
    },
  });

  return (
    <div className="h-full flex gap-4">
      {/* Left: Product List */}
      <Card className="w-64 shrink-0 bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-foreground flex items-center gap-2">
            <Coffee className="w-4 h-4 text-primary" />
            上架产品
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-220px)]">
            <div className="px-2 pb-2 space-y-1">
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground px-3 py-4 text-center">
                  暂无上架产品
                </p>
              ) : (
                products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProductId(product.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-md transition-all duration-200",
                      "text-sm font-medium",
                      selectedProductId === product.id
                        ? "bg-primary/20 text-primary border border-primary/50"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
                    )}
                  >
                    {product.name}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Right: Recipe Details */}
      <Card className="flex-1 bg-[#1A1A1A] border-border">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-xl text-foreground flex items-center gap-3">
            {selectedProduct ? (
              <>
                <Package className="w-5 h-5 text-primary" />
                {selectedProduct.name}
                <span className="text-xs text-muted-foreground font-mono">
                  ¥{selectedProduct.price.toFixed(2)}
                </span>
              </>
            ) : (
              "请选择产品"
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {!selectedProduct ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              从左侧选择一个产品以配置配方
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                原料消耗配方
              </h3>

              {/* Table Header */}
              <div className="grid grid-cols-[1fr_120px_80px_48px] gap-3 px-3 py-2 bg-secondary/30 rounded-md">
                <span className="text-xs text-muted-foreground font-medium">原料名称</span>
                <span className="text-xs text-muted-foreground font-medium text-center">消耗量</span>
                <span className="text-xs text-muted-foreground font-medium text-center">单位</span>
                <span className="text-xs text-muted-foreground font-medium"></span>
              </div>

              {/* Existing Recipes */}
              <ScrollArea className="h-[calc(100vh-480px)]">
                <div className="space-y-2">
                  {recipesLoading ? (
                    <p className="text-sm text-muted-foreground text-center py-4">加载中...</p>
                  ) : recipes.length === 0 && newRecipes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      该产品尚未配置配方
                    </p>
                  ) : (
                    <>
                      {/* Existing recipes */}
                      {recipes.map((recipe) => {
                        const material = getMaterial(recipe.material_id);
                        return (
                          <div
                            key={recipe.id}
                            className="grid grid-cols-[1fr_120px_80px_48px] gap-3 items-center px-3 py-2 bg-secondary/10 rounded-md border border-border hover:border-primary/30 transition-colors"
                          >
                            <span className="text-sm font-medium text-foreground">
                              {material?.name || "未知原料"}
                            </span>
                            <Input
                              type="number"
                              defaultValue={recipe.usage_quantity}
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                if (val !== recipe.usage_quantity) {
                                  updateMutation.mutate({ id: recipe.id, quantity: val });
                                }
                              }}
                              className="h-8 bg-background border-border text-sm font-mono text-center"
                            />
                            <span className="text-sm text-primary font-mono text-center">
                              {material?.unit_usage || "-"}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMutation.mutate(recipe.id)}
                              disabled={deleteMutation.isPending}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}

                      {/* New recipe rows */}
                      {newRecipes.map((nr, index) => {
                        const selectedMaterial = getMaterial(nr.materialId);
                        return (
                          <div
                            key={`new-${index}`}
                            className="grid grid-cols-[1fr_120px_80px_48px] gap-3 items-center px-3 py-2 bg-primary/5 rounded-md border border-primary/30"
                          >
                            <Select
                              value={nr.materialId}
                              onValueChange={(v) => updateNewRecipe(index, "materialId", v)}
                            >
                              <SelectTrigger className="h-8 bg-background border-border text-sm">
                                <SelectValue placeholder="选择原料" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableMaterials
                                  .filter((m) => m.id === nr.materialId || !newRecipes.some((r, i) => i !== index && r.materialId === m.id))
                                  .map((m) => (
                                    <SelectItem key={m.id} value={m.id}>
                                      {m.name}
                                    </SelectItem>
                                  ))}
                                {materials
                                  .filter((m) => m.id === nr.materialId && !availableMaterials.some((am) => am.id === m.id))
                                  .map((m) => (
                                    <SelectItem key={m.id} value={m.id}>
                                      {m.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              value={nr.quantity || ""}
                              onChange={(e) => updateNewRecipe(index, "quantity", parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              className="h-8 bg-background border-border text-sm font-mono text-center"
                            />
                            <span className="text-sm text-primary font-mono text-center">
                              {selectedMaterial?.unit_usage || "-"}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeNewRecipe(index)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </ScrollArea>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={handleAddRecipeRow}
                  disabled={availableMaterials.length === 0}
                  className="border-border hover:border-primary hover:bg-primary/10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  添加原料
                </Button>
                {newRecipes.length > 0 && (
                  <Button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saveMutation.isPending ? "保存中..." : "保存配方"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
