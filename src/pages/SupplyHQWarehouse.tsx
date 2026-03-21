import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Warehouse, PackagePlus, Truck, FileText, AlertTriangle, Search, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

// ── Stock Overview Tab ──
function StockOverview() {
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const queryClient = useQueryClient();

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["hq-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hq_inventory")
        .select("*, sku_materials(name, unit_usage, unit_purchase, conversion_rate)");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: pendingOutbound = [] } = useQuery({
    queryKey: ["hq-pending-outbound"],
    queryFn: async () => {
      const { data: outbounds, error: obErr } = await supabase
        .from("hq_outbound")
        .select("id")
        .in("status", ["pending", "shipped"]);
      if (obErr) throw obErr;
      if (!outbounds || outbounds.length === 0) return [];
      const { data: items, error: itemErr } = await supabase
        .from("hq_outbound_items")
        .select("material_id, quantity")
        .in("outbound_id", outbounds.map((o: any) => o.id));
      if (itemErr) throw itemErr;
      return items || [];
    },
  });

  const pendingByMaterial: Record<string, number> = {};
  pendingOutbound.forEach((item: any) => {
    pendingByMaterial[item.material_id] = (pendingByMaterial[item.material_id] || 0) + Number(item.quantity);
  });

  const adjustMutation = useMutation({
    mutationFn: async ({ id, materialId, currentQty, newQty, reason }: any) => {
      const { error: logErr } = await supabase.from("hq_inventory_logs").insert({
        material_id: materialId,
        type: "adjustment",
        ref_id: id,
        previous_qty: currentQty,
        new_qty: newQty,
        diff: newQty - currentQty,
        reason,
      });
      if (logErr) throw logErr;
      const { error } = await supabase.from("hq_inventory").update({ current_qty: newQty }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hq-inventory"] });
      setAdjustOpen(false);
      setAdjustQty("");
      setAdjustReason("");
      toast({ title: "库存已调整" });
    },
  });

  const handleAdjust = () => {
    if (!selectedItem || !adjustQty) return;
    adjustMutation.mutate({
      id: selectedItem.id,
      materialId: selectedItem.material_id,
      currentQty: selectedItem.current_qty,
      newQty: Number(adjustQty),
      reason: adjustReason || "手动盘点调整",
    });
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/30 text-muted-foreground text-left">
              <th className="py-3 px-3 font-medium">物料名称</th>
              <th className="py-3 px-3 font-medium">库存单位</th>
              <th className="py-3 px-3 font-medium text-right">当前库存/待配送</th>
              <th className="py-3 px-3 font-medium text-right">加权均价</th>
              <th className="py-3 px-3 font-medium">批次号</th>
              <th className="py-3 px-3 font-medium">生产日期</th>
              <th className="py-3 px-3 font-medium">保质期至</th>
              <th className="py-3 px-3 font-medium text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">加载中...</td></tr>
            ) : inventory.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">暂无库存数据，请先完成采购入库</td></tr>
            ) : (
              inventory.map((item: any) => {
                const isExpiringSoon = item.batch_expiry_date &&
                  new Date(item.batch_expiry_date) < new Date(Date.now() + 7 * 86400000);
                return (
                  <tr key={item.id} className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                    <td className="py-3 px-3 font-medium text-foreground">{item.sku_materials?.name || "-"}</td>
                    <td className="py-3 px-3 text-muted-foreground">{item.sku_materials?.unit_usage || "-"}</td>
                    <td className="py-3 px-3 text-right font-mono text-foreground">{Number(item.current_qty).toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-mono text-foreground">¥{Number(item.weighted_avg_price).toFixed(2)}</td>
                    <td className="py-3 px-3 text-muted-foreground">{item.batch_no || "-"}</td>
                    <td className="py-3 px-3 text-muted-foreground">{item.batch_production_date || "-"}</td>
                    <td className="py-3 px-3">
                      {item.batch_expiry_date ? (
                        <span className={isExpiringSoon ? "text-destructive font-medium" : "text-muted-foreground"}>
                          {item.batch_expiry_date} {isExpiringSoon && "⚠"}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => { setSelectedItem(item); setAdjustQty(String(item.current_qty)); setAdjustOpen(true); }}
                      >
                        盘点调整
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>手动库存调整</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">物料：{selectedItem?.sku_materials?.name} | 当前库存：{selectedItem?.current_qty} {selectedItem?.sku_materials?.unit_usage}</p>
            <div className="space-y-2">
              <Label>实际库存数量</Label>
              <Input type="number" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>调整原因</Label>
              <Input value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="如：盘点损耗、过期报废..." />
            </div>
            <Button onClick={handleAdjust} disabled={adjustMutation.isPending} className="w-full">
              {adjustMutation.isPending ? "提交中..." : "确认调整"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Inbound Tab ──
function InboundManagement() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ materialId: "", supplier: "", qty: "", price: "", batchNo: "", prodDate: "", expiryDate: "" });
  const queryClient = useQueryClient();

  const { data: materials = [] } = useQuery({
    queryKey: ["all-materials"],
    queryFn: async () => {
      const { data } = await supabase.from("sku_materials").select("id, name, unit_purchase, unit_usage, conversion_rate").order("name");
      return data || [];
    },
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["hq-inbound"],
    queryFn: async () => {
      const { data } = await supabase.from("hq_inbound").select("*, sku_materials(name, unit_purchase, unit_usage, conversion_rate)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const inboundMutation = useMutation({
    mutationFn: async () => {
      const mat = materials.find((m: any) => m.id === form.materialId);
      if (!mat) throw new Error("物料不存在");
      const purchaseQty = Number(form.qty);
      const unitPrice = Number(form.price);
      const usageQty = purchaseQty * Number(mat.conversion_rate);

      // Insert inbound record
      const { error: inErr } = await supabase.from("hq_inbound").insert({
        material_id: form.materialId,
        supplier: form.supplier,
        purchase_qty: purchaseQty,
        unit_price: unitPrice,
        batch_no: form.batchNo || null,
        production_date: form.prodDate || null,
        expiry_date: form.expiryDate || null,
      });
      if (inErr) throw inErr;

      // Upsert HQ inventory & recalc weighted avg
      const { data: existing } = await supabase.from("hq_inventory").select("*").eq("material_id", form.materialId).maybeSingle();
      if (existing) {
        const oldQty = Number(existing.current_qty);
        const oldAvg = Number(existing.weighted_avg_price);
        const perUsagePrice = unitPrice / Number(mat.conversion_rate);
        const newQty = oldQty + usageQty;
        const newAvg = newQty > 0 ? ((oldQty * oldAvg) + (usageQty * perUsagePrice)) / newQty : perUsagePrice;
        const { error } = await supabase.from("hq_inventory").update({
          current_qty: newQty,
          weighted_avg_price: newAvg,
          batch_no: form.batchNo || existing.batch_no,
          batch_production_date: form.prodDate || existing.batch_production_date,
          batch_expiry_date: form.expiryDate || existing.batch_expiry_date,
        }).eq("id", existing.id);
        if (error) throw error;
        // Log
        await supabase.from("hq_inventory_logs").insert({
          material_id: form.materialId, type: "inbound", previous_qty: oldQty, new_qty: newQty, diff: usageQty, reason: `采购入库 ${form.supplier}`,
        });
      } else {
        const perUsagePrice = unitPrice / Number(mat.conversion_rate);
        const { error } = await supabase.from("hq_inventory").insert({
          material_id: form.materialId,
          current_qty: usageQty,
          weighted_avg_price: perUsagePrice,
          batch_no: form.batchNo || null,
          batch_production_date: form.prodDate || null,
          batch_expiry_date: form.expiryDate || null,
        });
        if (error) throw error;
        await supabase.from("hq_inventory_logs").insert({
          material_id: form.materialId, type: "inbound", previous_qty: 0, new_qty: usageQty, diff: usageQty, reason: `首次采购入库 ${form.supplier}`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hq-inbound"] });
      queryClient.invalidateQueries({ queryKey: ["hq-inventory"] });
      setOpen(false);
      setForm({ materialId: "", supplier: "", qty: "", price: "", batchNo: "", prodDate: "", expiryDate: "" });
      toast({ title: "入库成功", description: "库存与加权均价已自动更新" });
    },
    onError: (e: any) => toast({ title: "入库失败", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" />新增入库</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader><DialogTitle>采购入库</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>物料</Label>
                <Select value={form.materialId} onValueChange={(v) => setForm({ ...form, materialId: v })}>
                  <SelectTrigger><SelectValue placeholder="选择物料" /></SelectTrigger>
                  <SelectContent>{materials.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.name} ({m.unit_purchase})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>供应商</Label>
                <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="供应商名称" />
              </div>
              <div className="space-y-2">
                <Label>采购数量 (采购单位)</Label>
                <Input type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>单价 (元/采购单位)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>批次号</Label>
                <Input value={form.batchNo} onChange={(e) => setForm({ ...form, batchNo: e.target.value })} placeholder="可选" />
              </div>
              <div className="space-y-2">
                <Label>生产日期</Label>
                <Input type="date" value={form.prodDate} onChange={(e) => setForm({ ...form, prodDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>保质期至</Label>
                <Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
              </div>
            </div>
            <Button onClick={() => inboundMutation.mutate()} disabled={!form.materialId || !form.qty || !form.price || inboundMutation.isPending} className="w-full mt-4">
              {inboundMutation.isPending ? "提交中..." : "确认入库"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>
      <div className="overflow-x-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/30 text-muted-foreground text-left">
              <th className="py-3 px-3 font-medium">时间</th>
              <th className="py-3 px-3 font-medium">供应商</th>
              <th className="py-3 px-3 font-medium">物料</th>
              <th className="py-3 px-3 font-medium text-right">数量</th>
              <th className="py-3 px-3 font-medium text-right">单价</th>
              <th className="py-3 px-3 font-medium text-right">总额</th>
              <th className="py-3 px-3 font-medium">批次</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">加载中...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">暂无入库记录</td></tr>
            ) : (
              records.map((r: any) => (
                <tr key={r.id} className="border-b border-border/10 hover:bg-muted/5">
                  <td className="py-3 px-3 text-muted-foreground text-xs">{new Date(r.created_at).toLocaleString("zh-CN")}</td>
                  <td className="py-3 px-3 text-foreground">{r.supplier}</td>
                  <td className="py-3 px-3 text-foreground">{r.sku_materials?.name}</td>
                  <td className="py-3 px-3 text-right font-mono">{r.purchase_qty} {r.sku_materials?.unit_purchase}</td>
                  <td className="py-3 px-3 text-right font-mono">¥{Number(r.unit_price).toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-mono text-primary">¥{Number(r.total_cost).toFixed(2)}</td>
                  <td className="py-3 px-3 text-muted-foreground text-xs">{r.batch_no || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Outbound Execution Tab ──
function OutboundExecution() {
  const queryClient = useQueryClient();

  const { data: outbounds = [], isLoading } = useQuery({
    queryKey: ["hq-outbound"],
    queryFn: async () => {
      const { data } = await supabase
        .from("hq_outbound")
        .select("*, stores(name), hq_outbound_items(*, sku_materials(name, unit_usage))")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const shipMutation = useMutation({
    mutationFn: async (outbound: any) => {
      const logisticsNo = `WL${Date.now().toString(36).toUpperCase()}`;
      // Deduct HQ inventory for each item
      for (const item of outbound.hq_outbound_items) {
        const { data: inv } = await supabase.from("hq_inventory").select("*").eq("material_id", item.material_id).maybeSingle();
        if (!inv) throw new Error(`物料库存不存在: ${item.sku_materials?.name}`);
        const newQty = Number(inv.current_qty) - Number(item.quantity);
        if (newQty < 0) throw new Error(`库存不足: ${item.sku_materials?.name}`);
        await supabase.from("hq_inventory").update({ current_qty: newQty }).eq("id", inv.id);
        await supabase.from("hq_inventory_logs").insert({
          material_id: item.material_id, type: "outbound", ref_id: outbound.id,
          previous_qty: inv.current_qty, new_qty: newQty, diff: -Number(item.quantity),
          reason: `出库至 ${outbound.stores?.name}`,
        });
      }
      await supabase.from("hq_outbound").update({ status: "shipped", logistics_no: logisticsNo, shipped_at: new Date().toISOString() }).eq("id", outbound.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hq-outbound"] });
      queryClient.invalidateQueries({ queryKey: ["hq-inventory"] });
      toast({ title: "发货成功", description: "HQ库存已扣减，物流单号已生成" });
    },
    onError: (e: any) => toast({ title: "发货失败", description: e.message, variant: "destructive" }),
  });

  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "待发货", variant: "destructive" },
    shipped: { label: "配送中", variant: "default" },
    received: { label: "已签收", variant: "secondary" },
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <p className="text-center text-muted-foreground py-12">加载中...</p>
      ) : outbounds.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">暂无出库单据</p>
      ) : (
        outbounds.map((ob: any) => (
          <Card key={ob.id} className="bg-card border-border/30">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-foreground font-medium">{ob.stores?.name || "未知门店"}</span>
                  <Badge variant={statusMap[ob.status]?.variant || "outline"}>{statusMap[ob.status]?.label || ob.status}</Badge>
                  {ob.logistics_no && <span className="text-xs text-muted-foreground font-mono">物流: {ob.logistics_no}</span>}
                </div>
                <span className="text-xs text-muted-foreground">{new Date(ob.created_at).toLocaleString("zh-CN")}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ob.hq_outbound_items?.map((item: any) => (
                  <span key={item.id} className="text-xs bg-muted/20 px-2 py-1 rounded text-muted-foreground">
                    {item.sku_materials?.name} × {item.quantity} {item.sku_materials?.unit_usage}
                  </span>
                ))}
              </div>
              {ob.status === "pending" && (
                <Button size="sm" variant="default" onClick={() => shipMutation.mutate(ob)} disabled={shipMutation.isPending}>
                  <Truck className="w-4 h-4 mr-1" />确认发货
                </Button>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// ── Direct Supply Ledger Tab ──
function DirectLedger() {
  const { data: records = [], isLoading } = useQuery({
    queryKey: ["hq-direct-supply"],
    queryFn: async () => {
      const { data } = await supabase
        .from("hq_direct_supply")
        .select("*, stores(name), sku_materials(name, unit_purchase)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Compute discrepancies
  const discrepancies = records.filter((r: any) => r.confirmed_qty !== null && Number(r.confirmed_qty) !== Number(r.order_qty));

  return (
    <div className="space-y-4">
      {discrepancies.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span className="text-sm text-destructive font-medium">
              存在 {discrepancies.length} 条指令/确认数量差异，请核实对账
            </span>
          </CardContent>
        </Card>
      )}
      <div className="overflow-x-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/30 text-muted-foreground text-left">
              <th className="py-3 px-3 font-medium">指令日期</th>
              <th className="py-3 px-3 font-medium">供应商</th>
              <th className="py-3 px-3 font-medium">门店</th>
              <th className="py-3 px-3 font-medium">物料</th>
              <th className="py-3 px-3 font-medium text-right">指令数量</th>
              <th className="py-3 px-3 font-medium text-right">确认数量</th>
              <th className="py-3 px-3 font-medium text-center">差异</th>
              <th className="py-3 px-3 font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">加载中...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">暂无直供流水</td></tr>
            ) : (
              records.map((r: any) => {
                const diff = r.confirmed_qty !== null ? Number(r.confirmed_qty) - Number(r.order_qty) : null;
                const hasDiff = diff !== null && diff !== 0;
                return (
                  <tr key={r.id} className="border-b border-border/10 hover:bg-muted/5">
                    <td className="py-3 px-3 text-muted-foreground text-xs">{r.instruction_date}</td>
                    <td className="py-3 px-3 text-foreground">{r.supplier}</td>
                    <td className="py-3 px-3 text-foreground">{r.stores?.name || "-"}</td>
                    <td className="py-3 px-3 text-foreground">{r.sku_materials?.name}</td>
                    <td className="py-3 px-3 text-right font-mono">{r.order_qty} {r.sku_materials?.unit_purchase}</td>
                    <td className="py-3 px-3 text-right font-mono">{r.confirmed_qty ?? "—"}</td>
                    <td className="py-3 px-3 text-center">
                      {hasDiff ? (
                        <span className="text-destructive font-bold">{diff! > 0 ? `+${diff}` : diff}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={r.status === "confirmed" ? "secondary" : r.status === "ordered" ? "outline" : "default"}>
                        {r.status === "ordered" ? "已下达" : r.status === "confirmed" ? "已确认" : r.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function SupplyHQWarehouse() {
  return (
    <div className="h-full space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/supply" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Warehouse className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">总部库存管理</h1>
      </div>

      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList className="bg-muted/20 border border-border/30">
          <TabsTrigger value="stock" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <Warehouse className="w-4 h-4 mr-1.5" />实仓看板
          </TabsTrigger>
          <TabsTrigger value="inbound" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <PackagePlus className="w-4 h-4 mr-1.5" />采购入库
          </TabsTrigger>
          <TabsTrigger value="outbound" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <Truck className="w-4 h-4 mr-1.5" />出库执行
          </TabsTrigger>
          <TabsTrigger value="direct" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <FileText className="w-4 h-4 mr-1.5" />直供流水
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock"><StockOverview /></TabsContent>
        <TabsContent value="inbound"><InboundManagement /></TabsContent>
        <TabsContent value="outbound"><OutboundExecution /></TabsContent>
        <TabsContent value="direct"><DirectLedger /></TabsContent>
      </Tabs>
    </div>
  );
}
