import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Plus, Pencil, Store, AlertTriangle, Check, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

type StoreType = {
  id: string;
  name: string;
  address: string | null;
  contact_phone: string | null;
  status: "active" | "inactive" | "renovating";
};

type Material = {
  id: string;
  name: string;
};

interface StoresSectionProps {
  stores: StoreType[];
  materials: Material[];
  storesWithIncompleteInventory: StoreType[];
  queryClient: any;
}

export function StoresSection({ stores, materials, storesWithIncompleteInventory, queryClient }: StoresSectionProps) {
  const [search, setSearch] = useState("");

  const incompleteStoreIds = new Set(storesWithIncompleteInventory.map(s => s.id));

  const filteredStores = stores.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.address || "").toLowerCase().includes(search.toLowerCase())
  );

  // Initialize inventory for a store
  const initMutation = useMutation({
    mutationFn: async (storeId: string) => {
      // Get existing inventory records for this store
      const { data: existingInv } = await supabase
        .from("store_inventory")
        .select("material_id")
        .eq("store_id", storeId);

      const existingMaterialIds = new Set((existingInv || []).map(i => i.material_id));
      
      // Find missing materials
      const missingMaterials = materials.filter(m => !existingMaterialIds.has(m.id));

      if (missingMaterials.length === 0) {
        toast.info("库存已完整初始化");
        return;
      }

      // Insert missing inventory records
      const { error } = await supabase.from("store_inventory").insert(
        missingMaterials.map(m => ({
          store_id: storeId,
          material_id: m.id,
          current_quantity: 0,
          theoretical_quantity: 0,
        }))
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master_store_inventory"] });
      toast.success("库存初始化完成");
    },
    onError: () => {
      toast.error("初始化失败");
    },
  });

  return (
    <Card className="bg-card border-border">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-green-400" />
              门店资产管理
            </CardTitle>
            {storesWithIncompleteInventory.length > 0 && (
              <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {storesWithIncompleteInventory.length} 个未初始化库存
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索门店..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64 bg-background border-border"
              />
            </div>
            <StoreDialog queryClient={queryClient} materials={materials} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>门店名称</TableHead>
              <TableHead>地址</TableHead>
              <TableHead>联系电话</TableHead>
              <TableHead className="text-center">状态</TableHead>
              <TableHead className="text-center">库存状态</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  暂无门店数据
                </TableCell>
              </TableRow>
            ) : (
              filteredStores.map((store) => (
                <TableRow key={store.id} className="border-border">
                  <TableCell className="font-medium">{store.name}</TableCell>
                  <TableCell className="text-muted-foreground">{store.address || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{store.contact_phone || "-"}</TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant={store.status === "active" ? "default" : "secondary"}
                      className={store.status === "active" ? "bg-success text-success-foreground" : ""}
                    >
                      {store.status === "active" ? "营业中" : store.status === "renovating" ? "装修中" : "暂停"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {incompleteStoreIds.has(store.id) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs border-destructive/50 text-destructive hover:bg-destructive/10"
                        onClick={() => initMutation.mutate(store.id)}
                        disabled={initMutation.isPending}
                      >
                        {initMutation.isPending ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Zap className="w-3 h-3 mr-1" />
                        )}
                        初始化库存
                      </Button>
                    ) : (
                      <Badge className="bg-success/20 text-success border-success/30">
                        <Check className="w-3 h-3 mr-1" />
                        已初始化
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <StoreDialog queryClient={queryClient} store={store} materials={materials} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function StoreDialog({ 
  queryClient, 
  store,
  materials
}: { 
  queryClient: any; 
  store?: StoreType;
  materials: Material[];
}) {
  const [open, setOpen] = useState(false);
  const [showInitConfirm, setShowInitConfirm] = useState(false);
  const [name, setName] = useState(store?.name || "");
  const [address, setAddress] = useState(store?.address || "");
  const [contactPhone, setContactPhone] = useState(store?.contact_phone || "");
  const [status, setStatus] = useState<StoreType["status"]>(store?.status || "active");
  const [error, setError] = useState("");
  const [pendingStoreId, setPendingStoreId] = useState<string | null>(null);

  const isEdit = !!store;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) {
        setError("门店名称不能为空");
        throw new Error("验证失败");
      }
      setError("");

      const payload = {
        name: name.trim(),
        address: address.trim() || null,
        contact_phone: contactPhone.trim() || null,
        status,
      };

      if (isEdit) {
        const { error } = await supabase.from("stores").update(payload).eq("id", store.id);
        if (error) throw error;
        return store.id;
      } else {
        const { data, error } = await supabase.from("stores").insert(payload).select().single();
        if (error) throw error;
        return data.id;
      }
    },
    onSuccess: (storeId) => {
      queryClient.invalidateQueries({ queryKey: ["master_stores"] });
      queryClient.invalidateQueries({ queryKey: ["datahub_stores"] });
      
      if (!isEdit && materials.length > 0) {
        setPendingStoreId(storeId);
        setShowInitConfirm(true);
      } else {
        toast.success(isEdit ? "门店已更新" : "门店已添加");
        setOpen(false);
        if (!isEdit) resetForm();
      }
    },
    onError: (err: any) => {
      if (err.message !== "验证失败") {
        toast.error("操作失败");
      }
    },
  });

  const initInventoryMutation = useMutation({
    mutationFn: async (storeId: string) => {
      const { error } = await supabase.from("store_inventory").insert(
        materials.map(m => ({
          store_id: storeId,
          material_id: m.id,
          current_quantity: 0,
          theoretical_quantity: 0,
        }))
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master_store_inventory"] });
      toast.success("门店已添加，库存已初始化");
      setShowInitConfirm(false);
      setOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("库存初始化失败");
    },
  });

  const resetForm = () => {
    setName("");
    setAddress("");
    setContactPhone("");
    setStatus("active");
    setError("");
    setPendingStoreId(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setError(""); }}>
        <DialogTrigger asChild>
          {isEdit ? (
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Pencil className="w-4 h-4" />
            </Button>
          ) : (
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              新增门店
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{isEdit ? "编辑门店" : "新增门店"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>门店名称 *</Label>
              <Input 
                value={name} 
                onChange={(e) => { setName(e.target.value); setError(""); }}
                placeholder="如：滨湖银泰店" 
                className={`bg-background border-border ${error ? 'border-destructive' : ''}`}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <div className="space-y-2">
              <Label>地址</Label>
              <Input 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                placeholder="详细地址" 
                className="bg-background border-border" 
              />
            </div>

            <div className="space-y-2">
              <Label>联系电话</Label>
              <Input 
                value={contactPhone} 
                onChange={(e) => setContactPhone(e.target.value)} 
                placeholder="店长联系方式" 
                className="bg-background border-border" 
              />
            </div>

            <div className="space-y-2">
              <Label>状态</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as StoreType["status"])}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">营业中</SelectItem>
                  <SelectItem value="renovating">装修中</SelectItem>
                  <SelectItem value="inactive">暂停营业</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!isEdit && materials.length > 0 && (
              <div className="bg-primary/10 border border-primary/30 rounded-md p-3">
                <p className="text-sm text-primary">
                  💡 新建门店后，系统将自动为 {materials.length} 种原物料创建初始库存记录
                </p>
              </div>
            )}

            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {mutation.isPending ? "保存中..." : "保存门店"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showInitConfirm} onOpenChange={setShowInitConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>初始化门店库存</AlertDialogTitle>
            <AlertDialogDescription>
              是否立即为新门店创建 {materials.length} 种原物料的库存记录？（初始数量为0）
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowInitConfirm(false);
              setOpen(false);
              resetForm();
              toast.success("门店已添加");
            }}>
              稍后手动初始化
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingStoreId && initInventoryMutation.mutate(pendingStoreId)}
              disabled={initInventoryMutation.isPending}
            >
              {initInventoryMutation.isPending ? "初始化中..." : "立即初始化"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
