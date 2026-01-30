import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Minus, Plus, Send, Package } from "lucide-react";
import { toast } from "sonner";

type Material = {
  id: string;
  name: string;
  category: "bean" | "milk" | "packaging" | "syrup" | "other";
  unit_purchase: string;
  unit_usage: string;
  conversion_rate: number;
};

type Store = {
  id: string;
  name: string;
};

type CartItem = {
  materialId: string;
  quantity: number;
};

const categoryLabels: Record<string, string> = {
  bean: "咖啡豆",
  milk: "乳制品",
  packaging: "包材",
  syrup: "糖浆",
  other: "其他",
};

const categoryOrder = ["bean", "milk", "packaging", "syrup", "other"];

export default function SupplyRequest() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const queryClient = useQueryClient();

  // Fetch stores
  const { data: stores = [] } = useQuery({
    queryKey: ["stores_for_request"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data as Store[];
    },
  });

  // Fetch core materials (bean, milk, packaging)
  const { data: materials = [] } = useQuery({
    queryKey: ["sku_materials_core"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sku_materials")
        .select("*")
        .in("category", ["bean", "milk", "packaging"])
        .order("category")
        .order("name");
      if (error) throw error;
      return data as Material[];
    },
  });

  // Group materials by category
  const groupedMaterials = categoryOrder
    .map((cat) => ({
      category: cat,
      label: categoryLabels[cat],
      items: materials.filter((m) => m.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  // Cart helpers
  const getQuantity = (materialId: string) => cart.find((c) => c.materialId === materialId)?.quantity || 0;

  const updateQuantity = (materialId: string, delta: number) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.materialId === materialId);
      if (existing) {
        const newQty = Math.max(0, existing.quantity + delta);
        if (newQty === 0) {
          return prev.filter((c) => c.materialId !== materialId);
        }
        return prev.map((c) => (c.materialId === materialId ? { ...c, quantity: newQty } : c));
      } else if (delta > 0) {
        return [...prev, { materialId, quantity: delta }];
      }
      return prev;
    });
  };

  const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStoreId) throw new Error("请选择门店");
      if (cart.length === 0) throw new Error("请先添加物料");

      // Create a new restock batch
      const { data: batch, error: batchError } = await supabase
        .from("restock_batches")
        .insert({
          store_id: selectedStoreId,
          status: "pending",
          notes: "商户主动追加",
        })
        .select("id")
        .single();

      if (batchError) throw batchError;

      // Insert restock items
      const items = cart.map((c) => ({
        batch_id: batch.id,
        material_id: c.materialId,
        quantity: c.quantity,
        source_type: "merchant_add" as const,
      }));

      const { error: itemsError } = await supabase.from("restock_items").insert(items);
      if (itemsError) throw itemsError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restock_batches"] });
      toast.success("追加申请已提交，等待总部合并发货");
      setCart([]);
    },
    onError: (err: any) => {
      toast.error(err.message || "提交失败");
    },
  });

  return (
    <div className="h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">商户要货</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Store Selector */}
          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="h-10 px-3 rounded-md bg-card border border-border text-foreground text-sm focus:border-primary focus:outline-none"
          >
            <option value="">选择门店</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
          {/* Cart Summary */}
          <Badge variant="outline" className="px-3 py-1 border-primary/50">
            <Package className="w-4 h-4 mr-2" />
            <span className="font-mono">{totalItems}</span> 件
          </Badge>
        </div>
      </div>

      {/* Material List */}
      <div className="space-y-4">
        {groupedMaterials.map((group) => (
          <Card key={group.category} className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {group.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-border">
                {group.items.map((material) => {
                  const qty = getQuantity(material.id);
                  return (
                    <div
                      key={material.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{material.name}</p>
                        <p className="text-xs text-muted-foreground">
                          规格: 1{material.unit_purchase} = {material.conversion_rate}
                          {material.unit_usage}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(material.id, -1)}
                          disabled={qty === 0}
                          className="h-9 w-9 border-border hover:border-primary hover:bg-primary/10"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <div className="w-16 text-center">
                          <span className={`text-xl font-bold font-mono ${qty > 0 ? "text-primary" : "text-muted-foreground"}`}>
                            {qty}
                          </span>
                          <p className="text-xs text-muted-foreground">{material.unit_purchase}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(material.id, 1)}
                          className="h-9 w-9 border-border hover:border-primary hover:bg-primary/10"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Submit Button */}
      <div className="sticky bottom-4 pt-4">
        <Button
          onClick={() => submitMutation.mutate()}
          disabled={cart.length === 0 || !selectedStoreId || submitMutation.isPending}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-lg font-semibold"
        >
          <Send className="w-5 h-5 mr-2" />
          {submitMutation.isPending ? "提交中..." : `提交追加 (${totalItems} 件)`}
        </Button>
      </div>
    </div>
  );
}
