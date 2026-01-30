import { useState, useEffect } from "react";
import { ClipboardList, Search, AlertTriangle, Check } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const DIFF_REASONS = [
  { id: "normal_loss", label: "正常损耗" },
  { id: "spill_damage", label: "意外倾洒/破损" },
  { id: "expired", label: "过期处理" },
  { id: "other", label: "其他原因" },
];

export default function SupplyAdjust() {
  const queryClient = useQueryClient();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [actualQty, setActualQty] = useState<string>("");
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  // Fetch stores
  const { data: stores = [] } = useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch materials
  const { data: materials = [] } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sku_materials")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch current inventory for selected store and material
  const { data: currentInventory } = useQuery({
    queryKey: ["store-inventory", selectedStoreId, selectedMaterialId],
    queryFn: async () => {
      if (!selectedStoreId || !selectedMaterialId) return null;
      const { data, error } = await supabase
        .from("store_inventory")
        .select("*")
        .eq("store_id", selectedStoreId)
        .eq("material_id", selectedMaterialId)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!selectedStoreId && !!selectedMaterialId,
  });

  // Fetch recent calibration logs
  const { data: recentLogs = [] } = useQuery({
    queryKey: ["inventory-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_logs")
        .select(`
          *,
          stores:store_id(name),
          sku_materials:material_id(name, unit_purchase)
        `)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId);
  const systemQty = currentInventory?.current_quantity ?? 0;
  const actualQtyNum = parseFloat(actualQty) || 0;
  const diff = actualQtyNum - systemQty;
  const diffPercentage = systemQty > 0 ? Math.abs(diff / systemQty) * 100 : 0;
  const isLargeDiff = diffPercentage > 20;

  // Calibration mutation
  const calibrateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStoreId || !selectedMaterialId || !selectedReason) {
        throw new Error("请填写所有必填项");
      }

      // Update store_inventory
      if (currentInventory) {
        const { error: updateError } = await supabase
          .from("store_inventory")
          .update({
            current_quantity: actualQtyNum,
            theoretical_quantity: actualQtyNum,
            last_stocktake_at: new Date().toISOString(),
          })
          .eq("id", currentInventory.id);
        if (updateError) throw updateError;
      } else {
        // Create new inventory record if doesn't exist
        const { error: insertError } = await supabase
          .from("store_inventory")
          .insert({
            store_id: selectedStoreId,
            material_id: selectedMaterialId,
            current_quantity: actualQtyNum,
            theoretical_quantity: actualQtyNum,
            last_stocktake_at: new Date().toISOString(),
          });
        if (insertError) throw insertError;
      }

      // Log the calibration
      const { error: logError } = await supabase.from("inventory_logs").insert({
        store_id: selectedStoreId,
        material_id: selectedMaterialId,
        type: "manual_correction",
        previous_qty: systemQty,
        new_qty: actualQtyNum,
        diff: diff,
        reason: DIFF_REASONS.find((r) => r.id === selectedReason)?.label || selectedReason,
      });
      if (logError) throw logError;
    },
    onSuccess: () => {
      toast.success("库存校准成功", {
        description: `${selectedMaterial?.name} 已更新为 ${actualQtyNum} ${selectedMaterial?.unit_purchase}`,
      });
      queryClient.invalidateQueries({ queryKey: ["store-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-logs"] });
      resetForm();
      setIsDrawerOpen(false);
    },
    onError: (error) => {
      toast.error("校准失败", { description: error.message });
    },
  });

  const resetForm = () => {
    setSelectedMaterialId("");
    setActualQty("");
    setSelectedReason("");
  };

  const handleSubmit = () => {
    if (isLargeDiff && !pendingSubmit) {
      setShowConfirmDialog(true);
      return;
    }
    calibrateMutation.mutate();
    setPendingSubmit(false);
  };

  const handleConfirmLargeDiff = () => {
    setPendingSubmit(true);
    setShowConfirmDialog(false);
    calibrateMutation.mutate();
  };

  const isFormValid =
    selectedStoreId && selectedMaterialId && actualQty && selectedReason;

  return (
    <div className="h-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">库存修正与盘点</h1>
        </div>
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerTrigger asChild>
            <Button>
              <ClipboardList className="w-4 h-4 mr-2" />
              开始盘点
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader className="text-left">
              <DrawerTitle className="text-xl">库存数据校准</DrawerTitle>
              <DrawerDescription className="flex items-center gap-2 text-muted-foreground">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                数据修正将计入年度损耗记录，请如实填写
              </DrawerDescription>
            </DrawerHeader>

            <div className="px-4 pb-4 space-y-6">
              {/* Step 1: Select Store */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">第一步：选择门店</Label>
                <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择门店..." />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Step 2: Select Material */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">第二步：选择物料</Label>
                <Select
                  value={selectedMaterialId}
                  onValueChange={setSelectedMaterialId}
                  disabled={!selectedStoreId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="搜索并选择需要修正的原料..." />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.name} ({material.unit_purchase})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Step 3: Data Comparison */}
              {selectedMaterialId && (
                <div className="space-y-4">
                  <Label className="text-muted-foreground">第三步：数据对比</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {/* System Inventory - Read Only */}
                    <div className="p-4 rounded-lg bg-muted/30 border border-border">
                      <p className="text-sm text-muted-foreground mb-1">系统当前库存</p>
                      <p className="text-3xl font-bold text-muted-foreground">
                        {systemQty}
                        <span className="text-lg ml-1">{selectedMaterial?.unit_purchase}</span>
                      </p>
                    </div>

                    {/* Actual Count - Input */}
                    <div className="p-4 rounded-lg bg-primary/5 border-2 border-primary/30">
                      <p className="text-sm text-muted-foreground mb-1">实物盘点数量</p>
                      <div className="flex items-baseline gap-2">
                        <Input
                          type="number"
                          value={actualQty}
                          onChange={(e) => setActualQty(e.target.value)}
                          className="text-2xl font-bold h-12 bg-transparent border-none p-0 focus-visible:ring-0"
                          placeholder="0"
                        />
                        <span className="text-lg text-muted-foreground">
                          {selectedMaterial?.unit_purchase}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Diff Display */}
                  {actualQty && (
                    <div
                      className={`p-3 rounded-lg text-center ${
                        diff < 0
                          ? "bg-destructive/10 text-destructive"
                          : diff > 0
                          ? "bg-green-500/10 text-green-500"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <span className="font-medium">
                        差异: {diff > 0 ? "+" : ""}
                        {diff} {selectedMaterial?.unit_purchase}
                        {isLargeDiff && (
                          <span className="ml-2 text-yellow-500">
                            (⚠️ 超过20%)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Reason Selection */}
              {actualQty && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">第四步：差异原因（必选）</Label>
                  <div className="flex flex-wrap gap-2">
                    {DIFF_REASONS.map((reason) => (
                      <Button
                        key={reason.id}
                        variant={selectedReason === reason.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedReason(reason.id)}
                        className="rounded-full"
                      >
                        {selectedReason === reason.id && (
                          <Check className="w-3 h-3 mr-1" />
                        )}
                        {reason.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DrawerFooter>
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid || calibrateMutation.isPending}
                className="w-full"
              >
                {calibrateMutation.isPending ? "处理中..." : "确认校准"}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">
                  取消
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Large Diff Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              差异较大，是否确认？
            </AlertDialogTitle>
            <AlertDialogDescription>
              您输入的实物数量与系统库存差异超过 20%（{diffPercentage.toFixed(1)}%）。
              请确认数据无误后再提交。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>返回修改</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLargeDiff}>
              确认提交
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Recent Calibration Logs */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">近期校准记录</CardTitle>
          <CardDescription>最近10条库存修正记录</CardDescription>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">暂无校准记录</p>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">
                      {log.sku_materials?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {log.stores?.name} · {log.reason}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-mono font-medium ${
                        log.diff < 0 ? "text-destructive" : "text-green-500"
                      }`}
                    >
                      {log.diff > 0 ? "+" : ""}
                      {log.diff} {log.sku_materials?.unit_purchase}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleDateString("zh-CN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
