import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Warehouse, PackagePlus, Truck, FileText, AlertTriangle, Search, Plus, Printer } from "lucide-react";
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
                    <td className="py-3 px-3 text-right font-mono text-foreground">
                      {Number(item.current_qty).toLocaleString()}
                      {(pendingByMaterial[item.material_id] || 0) > 0 && (
                        <span className="text-amber-400">/{Number(pendingByMaterial[item.material_id]).toLocaleString()}</span>
                      )}
                    </td>
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
  const navigate = useNavigate();

  const { data: materials = [] } = useQuery({
    queryKey: ["all-materials"],
    queryFn: async () => {
      const { data } = await supabase.from("sku_materials").select("id, name, unit_purchase, unit_usage, conversion_rate, min_package_unit, full_capacity, main_category, sub_category").order("name");
      return data || [];
    },
  });

  const selectedMaterial = materials.find((m: any) => m.id === form.materialId);

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
            <div className="space-y-4">
              {/* 物料选择 + 新增物料 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>物料 (从 SKU 主数据选择)</Label>
                  <Button variant="ghost" size="sm" className="text-xs text-primary h-6 px-2" onClick={() => navigate("/supply/sku")}>
                    <Plus className="w-3 h-3 mr-1" />新增物料
                  </Button>
                </div>
                <Select value={form.materialId} onValueChange={(v) => setForm({ ...form, materialId: v })}>
                  <SelectTrigger><SelectValue placeholder="选择物料" /></SelectTrigger>
                  <SelectContent>{materials.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {/* 自动回填的物料主数据（只读） */}
              {selectedMaterial && (
                <div className="rounded-md bg-muted/30 border border-border/30 p-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">采购单位</span><span className="text-foreground font-medium">{selectedMaterial.unit_purchase}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">消耗单位</span><span className="text-foreground font-medium">{selectedMaterial.unit_usage}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">MPU (最小包装)</span><span className="text-foreground font-medium">{selectedMaterial.min_package_unit}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">换算率</span><span className="text-foreground font-medium">1{selectedMaterial.unit_purchase} = {selectedMaterial.conversion_rate}{selectedMaterial.unit_usage}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">满载容量</span><span className="text-foreground font-medium">{selectedMaterial.full_capacity}{selectedMaterial.unit_usage}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">分类</span><span className="text-foreground font-medium">{selectedMaterial.main_category}/{selectedMaterial.sub_category}</span></div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>供应商</Label>
                  <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="供应商名称" />
                </div>
                <div className="space-y-2">
                  <Label>采购数量{selectedMaterial ? ` (${selectedMaterial.unit_purchase})` : ""}</Label>
                  <Input type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>采购单价{selectedMaterial ? ` (¥/${selectedMaterial.unit_purchase})` : ""}</Label>
                  <div className="relative">
                    <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="pr-16" />
                    {selectedMaterial && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">元/{selectedMaterial.unit_purchase}</span>
                    )}
                  </div>
                  {selectedMaterial && form.price && Number(form.price) > 0 && (
                    <p className="text-xs text-muted-foreground">
                      折合消耗单价：¥{(Number(form.price) / Number(selectedMaterial.conversion_rate)).toFixed(4)} / {selectedMaterial.unit_usage}
                    </p>
                  )}
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
              <th className="py-3 px-3 font-medium text-right">采购单价 (¥/采购规格)</th>
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
                  <td className="py-3 px-3 text-right font-mono">¥{Number(r.unit_price).toFixed(2)}/{r.sku_materials?.unit_purchase}</td>
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
  const [printData, setPrintData] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: outbounds = [], isLoading } = useQuery({
    queryKey: ["hq-outbound"],
    queryFn: async () => {
      const { data } = await supabase
        .from("hq_outbound")
        .select("*, stores(id, name), hq_outbound_items(*, sku_materials(name, unit_usage))")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Generate delivery number: store short id + sequential count
  const generateDeliveryNo = async (storeId: string) => {
    const shortId = storeId.substring(0, 6).toUpperCase();
    // Count existing outbounds for this store (excluding current pending)
    const { count } = await supabase
      .from("hq_outbound")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .neq("status", "pending");
    const seq = (count || 0) + 1;
    return `PS${shortId}-${String(seq).padStart(4, "0")}`;
  };

  const shipMutation = useMutation({
    mutationFn: async (outbound: any) => {
      const deliveryNo = await generateDeliveryNo(outbound.store_id || outbound.stores?.id);
      // Do NOT deduct HQ inventory here — only move status to "shipped" (待配送)
      // Pending delivery qty is already tracked via hq_outbound_items with pending/shipped status
      await supabase.from("hq_outbound").update({
        status: "shipped",
        logistics_no: deliveryNo,
        shipped_at: new Date().toISOString(),
      }).eq("id", outbound.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hq-outbound"] });
      queryClient.invalidateQueries({ queryKey: ["hq-pending-outbound"] });
      toast({ title: "已确认发货", description: "配送单号已生成，单据已移至待配送" });
    },
    onError: (e: any) => toast({ title: "发货失败", description: e.message, variant: "destructive" }),
  });

  const handlePrint = (ob: any) => {
    setPrintData(ob);
    setTimeout(() => {
      if (printRef.current) {
        const printWindow = window.open("", "_blank", "width=600,height=800");
        if (printWindow) {
          printWindow.document.write(`
            <html><head><title>配送单 - ${ob.logistics_no}</title>
            <style>
              body { font-family: -apple-system, sans-serif; padding: 40px; color: #1a1a1a; }
              h1 { font-size: 22px; text-align: center; margin-bottom: 4px; }
              .sub { text-align: center; color: #888; font-size: 13px; margin-bottom: 24px; }
              .info { margin-bottom: 20px; }
              .info p { margin: 6px 0; font-size: 14px; }
              .info strong { display: inline-block; width: 80px; }
              table { width: 100%; border-collapse: collapse; margin-top: 12px; }
              th, td { border: 1px solid #ddd; padding: 8px 12px; font-size: 13px; text-align: left; }
              th { background: #f5f5f5; font-weight: 600; }
              td.qty { text-align: right; font-family: monospace; }
              .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 13px; color: #666; }
              .footer div { width: 45%; }
              .footer .line { border-bottom: 1px solid #999; margin-top: 30px; }
              @media print { body { padding: 20px; } }
            </style></head><body>
            <h1>配送单</h1>
            <div class="sub">DELIVERY SLIP</div>
            <div class="info">
              <p><strong>配送单号</strong>${ob.logistics_no}</p>
              <p><strong>配送门店</strong>${ob.stores?.name || "未知门店"}</p>
              <p><strong>发货时间</strong>${ob.shipped_at ? new Date(ob.shipped_at).toLocaleString("zh-CN") : new Date().toLocaleString("zh-CN")}</p>
              <p><strong>创建时间</strong>${new Date(ob.created_at).toLocaleString("zh-CN")}</p>
            </div>
            <table>
              <thead><tr><th>序号</th><th>物料名称</th><th>数量</th><th>单位</th></tr></thead>
              <tbody>
                ${ob.hq_outbound_items?.map((item: any, i: number) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${item.sku_materials?.name || "-"}</td>
                    <td class="qty">${Number(item.quantity).toLocaleString()}</td>
                    <td>${item.sku_materials?.unit_usage || "-"}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
            ${ob.notes ? `<p style="margin-top:16px;font-size:13px;color:#666;">备注：${ob.notes}</p>` : ""}
            <div class="footer">
              <div>发货人签字：<div class="line"></div></div>
              <div>收货人签字：<div class="line"></div></div>
            </div>
            </body></html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
      }
      setPrintData(null);
    }, 100);
  };

  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "待发货", variant: "destructive" },
    shipped: { label: "待配送", variant: "default" },
    received: { label: "已签收", variant: "secondary" },
  };

  const statusGroups = [
    { key: "pending", title: "待发货", icon: "📦" },
    { key: "shipped", title: "待配送", icon: "🚚" },
    { key: "received", title: "已签收", icon: "✅" },
  ];

  const grouped = statusGroups.map((g) => ({
    ...g,
    items: outbounds.filter((ob: any) => ob.status === g.key),
  }));

  return (
    <div className="space-y-6">
      {/* Hidden print target */}
      <div ref={printRef} className="hidden" />

      {isLoading ? (
        <p className="text-center text-muted-foreground py-12">加载中...</p>
      ) : outbounds.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">暂无出库单据</p>
      ) : (
        grouped.map((group) => (
          <div key={group.key} className="space-y-3">
            <div className="flex items-center gap-2 border-b border-border/20 pb-2">
              <span>{group.icon}</span>
              <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
              <Badge variant="outline" className="text-xs">{group.items.length}</Badge>
            </div>
            {group.items.length === 0 ? (
              <p className="text-xs text-muted-foreground pl-6 py-2">暂无{group.title}单据</p>
            ) : (
              group.items.map((ob: any) => (
                <Card key={ob.id} className="bg-card border-border/30">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-foreground font-medium">{ob.stores?.name || "未知门店"}</span>
                        <Badge variant={statusMap[ob.status]?.variant || "outline"}>{statusMap[ob.status]?.label || ob.status}</Badge>
                        {ob.logistics_no && <span className="text-xs text-muted-foreground font-mono">配送单号: {ob.logistics_no}</span>}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-muted-foreground">{new Date(ob.created_at).toLocaleString("zh-CN")}</span>
                        {ob.status === "shipped" && (
                          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handlePrint(ob)}>
                            <Printer className="w-3.5 h-3.5 mr-1" />打印配送单
                          </Button>
                        )}
                      </div>
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

  return (
    <div className="space-y-4">
      <div className="overflow-x-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/30 text-muted-foreground text-left">
              <th className="py-3 px-3 font-medium">指令日期</th>
              <th className="py-3 px-3 font-medium">供应商</th>
              <th className="py-3 px-3 font-medium">门店</th>
              <th className="py-3 px-3 font-medium">物料</th>
              <th className="py-3 px-3 font-medium text-right">指令数量</th>
              
              <th className="py-3 px-3 font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">加载中...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">暂无直供流水</td></tr>
            ) : (
              records.map((r: any) => (
                <tr key={r.id} className="border-b border-border/10 hover:bg-muted/5">
                  <td className="py-3 px-3 text-muted-foreground text-xs">{r.instruction_date}</td>
                  <td className="py-3 px-3 text-foreground">{r.supplier}</td>
                  <td className="py-3 px-3 text-foreground">{r.stores?.name || "-"}</td>
                  <td className="py-3 px-3 text-foreground">{r.sku_materials?.name}</td>
                  <td className="py-3 px-3 text-right font-mono">{r.order_qty} {r.sku_materials?.unit_purchase}</td>
                  
                  <td className="py-3 px-3">
                    <Badge variant={r.status === "confirmed" ? "secondary" : r.status === "ordered" ? "outline" : "default"}>
                      {r.status === "ordered" ? "已下达" : r.status === "confirmed" ? "已确认" : r.status}
                    </Badge>
                  </td>
                </tr>
              ))
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
