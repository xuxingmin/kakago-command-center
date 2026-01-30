import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Truck, Download, Rocket, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { addDays, format } from "date-fns";

interface StoreRestockData {
  storeId: string;
  storeName: string;
  address: string;
  phone: string;
  materials: {
    materialId: string;
    materialName: string;
    unitPurchase: string;
    currentStock: number;
    suggestedRestock: number;
    merchantAdd: number;
    finalShipment: number;
  }[];
}

export default function SupplyPush() {
  const queryClient = useQueryClient();
  const [editedShipments, setEditedShipments] = useState<Record<string, Record<string, number>>>({});

  // Fetch stores
  const { data: stores = [] } = useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("status", "active");
      if (error) throw error;
      return data;
    },
  });

  // Fetch materials
  const { data: materials = [] } = useQuery({
    queryKey: ["sku_materials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sku_materials").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Fetch store inventory
  const { data: inventory = [] } = useQuery({
    queryKey: ["store_inventory"],
    queryFn: async () => {
      const { data, error } = await supabase.from("store_inventory").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Fetch pending merchant requests (from restock_batches with status pending)
  const { data: pendingBatches = [] } = useQuery({
    queryKey: ["pending_restock_batches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restock_batches")
        .select("*, restock_items(*)")
        .eq("status", "pending");
      if (error) throw error;
      return data;
    },
  });

  // Calculate restock data for each store
  const restockData = useMemo<StoreRestockData[]>(() => {
    return stores.map((store) => {
      const storeInventory = inventory.filter((inv) => inv.store_id === store.id);
      const storePendingBatch = pendingBatches.find((b) => b.store_id === store.id);
      const merchantItems = storePendingBatch?.restock_items || [];

      const materialsData = materials.map((material) => {
        const inv = storeInventory.find((i) => i.material_id === material.id);
        const currentStock = inv?.current_quantity || 0;

        // Simulated daily consumption (in real app, calculate from sales data)
        const avgDailyConsumption = 50; // Placeholder
        const suggestedRestock = Math.max(0, avgDailyConsumption * 7 - currentStock);

        // Merchant add from pending requests
        const merchantItem = merchantItems.find(
          (item: any) => item.material_id === material.id && item.source_type === "merchant_add"
        );
        const merchantAdd = merchantItem?.quantity || 0;

        // Check if there's an edited value
        const editedValue = editedShipments[store.id]?.[material.id];
        const finalShipment = editedValue ?? suggestedRestock + merchantAdd;

        return {
          materialId: material.id,
          materialName: material.name,
          unitPurchase: material.unit_purchase,
          currentStock,
          suggestedRestock,
          merchantAdd,
          finalShipment,
        };
      });

      return {
        storeId: store.id,
        storeName: store.name,
        address: store.address || "",
        phone: store.contact_phone || "",
        materials: materialsData,
      };
    });
  }, [stores, materials, inventory, pendingBatches, editedShipments]);

  // Handle final shipment edit
  const handleShipmentEdit = (storeId: string, materialId: string, value: number) => {
    setEditedShipments((prev) => ({
      ...prev,
      [storeId]: {
        ...prev[storeId],
        [materialId]: value,
      },
    }));
  };

  // Export Excel
  const handleExportExcel = () => {
    const worksheetData: any[] = [];

    restockData.forEach((store) => {
      store.materials.forEach((mat) => {
        if (mat.finalShipment > 0) {
          worksheetData.push({
            门店名称: store.storeName,
            门店地址: store.address,
            联系电话: store.phone,
            物料名称: mat.materialName,
            当前库存: mat.currentStock,
            建议补货: mat.suggestedRestock,
            商户追加: mat.merchantAdd,
            最终发货量: mat.finalShipment,
            单位: mat.unitPurchase,
          });
        }
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "配送清单");

    const fileName = `配送清单_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    toast.success("Excel 已导出");
  };

  // Activate delivery mutation
  const activateDeliveryMutation = useMutation({
    mutationFn: async () => {
      const deliveryDate = addDays(new Date(), 6);

      for (const store of restockData) {
        const itemsToShip = store.materials.filter((m) => m.finalShipment > 0);
        if (itemsToShip.length === 0) continue;

        // Create batch
        const { data: batch, error: batchError } = await supabase
          .from("restock_batches")
          .insert({
            store_id: store.storeId,
            status: "shipped",
            delivery_date: format(deliveryDate, "yyyy-MM-dd"),
            notes: "智能推配系统生成",
          })
          .select()
          .single();

        if (batchError) throw batchError;

        // Create items
        const restockItems = itemsToShip.map((mat) => ({
          batch_id: batch.id,
          material_id: mat.materialId,
          quantity: mat.finalShipment,
          source_type: "system_calc" as const,
        }));

        const { error: itemsError } = await supabase
          .from("restock_items")
          .insert(restockItems);

        if (itemsError) throw itemsError;

        // Update old pending batches to cancelled
        const oldPendingBatch = pendingBatches.find((b) => b.store_id === store.storeId);
        if (oldPendingBatch) {
          await supabase
            .from("restock_batches")
            .update({ status: "cancelled" })
            .eq("id", oldPendingBatch.id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending_restock_batches"] });
      queryClient.invalidateQueries({ queryKey: ["restock_batches"] });
      toast.success("配送已激活，预计 6 天后到达");
      setEditedShipments({});
    },
    onError: (error) => {
      toast.error("激活配送失败: " + error.message);
    },
  });

  const totalItems = restockData.reduce(
    (sum, store) => sum + store.materials.filter((m) => m.finalShipment > 0).length,
    0
  );

  return (
    <div className="h-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Truck className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">智能推配中心</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExportExcel} className="gap-2">
            <Download className="w-4 h-4" />
            导出 Excel
          </Button>
          <Button
            onClick={() => activateDeliveryMutation.mutate()}
            disabled={activateDeliveryMutation.isPending || totalItems === 0}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Rocket className="w-4 h-4" />
            激活配送
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-[#1A1A1A] border-[#333333]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">待配送门店</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-mono font-bold text-foreground">
              {restockData.filter((s) => s.materials.some((m) => m.finalShipment > 0)).length}
            </span>
          </CardContent>
        </Card>
        <Card className="bg-[#1A1A1A] border-[#333333]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">物料项数</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-mono font-bold text-foreground">{totalItems}</span>
          </CardContent>
        </Card>
        <Card className="bg-[#1A1A1A] border-[#333333]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">预计到达</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-mono font-bold text-primary">
              {format(addDays(new Date(), 6), "MM/dd")}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Store tables */}
      <div className="space-y-6">
        {restockData.map((store) => (
          <Card key={store.storeId} className="bg-[#121212] border-[#333333]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">{store.storeName}</CardTitle>
                </div>
                <span className="text-sm text-muted-foreground">{store.address}</span>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-[#333333] hover:bg-transparent">
                    <TableHead className="text-muted-foreground">物料名称</TableHead>
                    <TableHead className="text-muted-foreground text-right">当前库存</TableHead>
                    <TableHead className="text-muted-foreground text-right">建议补货</TableHead>
                    <TableHead className="text-muted-foreground text-right">主动追加</TableHead>
                    <TableHead className="text-muted-foreground text-right">最终发货量</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {store.materials.map((mat) => (
                    <TableRow key={mat.materialId} className="border-[#333333]">
                      <TableCell className="font-medium">{mat.materialName}</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {mat.currentStock}
                      </TableCell>
                      <TableCell className="text-right font-mono">{mat.suggestedRestock}</TableCell>
                      <TableCell className="text-right">
                        {mat.merchantAdd > 0 ? (
                          <Badge
                            variant="secondary"
                            className="bg-[#7F00FF]/20 text-[#7F00FF] font-mono"
                          >
                            +{mat.merchantAdd}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground font-mono">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={0}
                          value={mat.finalShipment}
                          onChange={(e) =>
                            handleShipmentEdit(
                              store.storeId,
                              mat.materialId,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-24 ml-auto text-right font-mono bg-[#0A0A0A] border-[#333333]"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}

        {restockData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Package className="w-12 h-12 mb-4 opacity-50" />
            <p>暂无活跃门店数据</p>
          </div>
        )}
      </div>
    </div>
  );
}
