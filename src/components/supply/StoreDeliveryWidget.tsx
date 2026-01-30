import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Truck, Package, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { differenceInDays, parseISO } from "date-fns";

interface StoreDeliveryWidgetProps {
  storeId: string;
}

export function StoreDeliveryWidget({ storeId }: StoreDeliveryWidgetProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch shipped batch for this store
  const { data: shippedBatch } = useQuery({
    queryKey: ["shipped_batch", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restock_batches")
        .select("*, restock_items(*)")
        .eq("store_id", storeId)
        .eq("status", "shipped")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!storeId,
  });

  // Fetch materials for display
  const { data: materials = [] } = useQuery({
    queryKey: ["sku_materials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sku_materials").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Confirm delivery mutation
  const confirmDeliveryMutation = useMutation({
    mutationFn: async () => {
      if (!shippedBatch) throw new Error("No batch to confirm");

      // Update inventory for each item
      for (const item of shippedBatch.restock_items) {
        // First check if inventory record exists
        const { data: existingInv } = await supabase
          .from("store_inventory")
          .select("*")
          .eq("store_id", storeId)
          .eq("material_id", item.material_id)
          .maybeSingle();

        if (existingInv) {
          // Update existing
          await supabase
            .from("store_inventory")
            .update({
              current_quantity: existingInv.current_quantity + item.quantity,
              theoretical_quantity: existingInv.theoretical_quantity + item.quantity,
            })
            .eq("id", existingInv.id);
        } else {
          // Insert new
          await supabase.from("store_inventory").insert({
            store_id: storeId,
            material_id: item.material_id,
            current_quantity: item.quantity,
            theoretical_quantity: item.quantity,
          });
        }
      }

      // Update batch status to received
      const { error } = await supabase
        .from("restock_batches")
        .update({ status: "received" })
        .eq("id", shippedBatch.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipped_batch", storeId] });
      queryClient.invalidateQueries({ queryKey: ["store_inventory"] });
      setIsDialogOpen(false);
      toast.success("货物已签收入库！");
    },
    onError: (error) => {
      toast.error("签收失败: " + error.message);
    },
  });

  // Calculate days until arrival
  const daysUntilArrival = shippedBatch?.delivery_date
    ? differenceInDays(parseISO(shippedBatch.delivery_date), new Date())
    : 0;

  const isDeliveryActive = !!shippedBatch;

  // Get item details with material names
  const itemsWithDetails = shippedBatch?.restock_items?.map((item: any) => {
    const material = materials.find((m) => m.id === item.material_id);
    return {
      ...item,
      materialName: material?.name || "未知物料",
      unitPurchase: material?.unit_purchase || "",
    };
  }) || [];

  return (
    <>
      {/* Widget */}
      <div
        onClick={() => isDeliveryActive && setIsDialogOpen(true)}
        className={`
          w-full py-4 px-6 rounded-lg transition-all duration-300
          ${isDeliveryActive 
            ? "bg-[#7F00FF] cursor-pointer hover:bg-[#7F00FF]/90" 
            : "bg-[#1A1A1A]"
          }
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDeliveryActive ? (
              <Truck className="w-5 h-5 text-white animate-pulse" />
            ) : (
              <Package className="w-5 h-5 text-muted-foreground" />
            )}
            <span className={`font-medium ${isDeliveryActive ? "text-white" : "text-muted-foreground"}`}>
              {isDeliveryActive 
                ? `智能补货 · ${daysUntilArrival > 0 ? `${daysUntilArrival}天后达` : "今日到达"}` 
                : "KAKAGO 供应链运行中"
              }
            </span>
          </div>
          {isDeliveryActive && (
            <span className="text-sm text-white/80">点击签收 →</span>
          )}
        </div>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#121212] border-[#333333] max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <CheckCircle2 className="w-5 h-5 text-[#7F00FF]" />
              签收清单
            </DialogTitle>
            <DialogDescription>
              请核对以下物品，确认无误后点击入库
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow className="border-[#333333] hover:bg-transparent">
                  <TableHead className="text-muted-foreground">物料名称</TableHead>
                  <TableHead className="text-muted-foreground text-right">数量</TableHead>
                  <TableHead className="text-muted-foreground text-right">单位</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsWithDetails.map((item: any) => (
                  <TableRow key={item.id} className="border-[#333333]">
                    <TableCell className="font-medium">{item.materialName}</TableCell>
                    <TableCell className="text-right font-mono text-primary">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {item.unitPurchase}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6">
            <Button
              onClick={() => confirmDeliveryMutation.mutate()}
              disabled={confirmDeliveryMutation.isPending}
              className="w-full bg-[#7F00FF] hover:bg-[#7F00FF]/90 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {confirmDeliveryMutation.isPending ? "处理中..." : "确认无误，一键入库"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
