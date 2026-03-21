import { useState, useMemo, useEffect, useCallback } from "react";
import { ArrowLeft, Store, BarChart3, Settings2, Truck, ShoppingCart, ClipboardCheck, ChevronRight, AlertTriangle, CheckCircle, Download, Search, ChevronDown, ChevronUp, Package, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

// ── Types ──
type MaterialKey = "coffee_bean" | "fresh_milk" | "paper_cup" | "straw" | "syrup";
interface MaterialDef {
  name: string; unit: string; fullCapacity: number; mpu: number; mpuUnit: string;
  restockPct: number; shutdownPct: number; dailyAvg: number; industryLossRate: number;
}
interface StoreInventory { qty: number; theoretical: number; }
interface StoreDef { id: string; name: string; region: string; inventory: Record<MaterialKey, StoreInventory>; }
type MerchantRequestStatus = "pending" | "pending_shipment" | "in_transit" | "completed" | "rejected";
interface MerchantRequestItem { materialKey: MaterialKey; requestQty: number; approvedQty: number; }
interface MerchantRequest {
  id: string; storeId: string; storeName: string; items: MerchantRequestItem[];
  reason: string; createdAt: string; status: MerchantRequestStatus; logisticsNo?: string;
}

// ── Mock Materials with MPU & Full Capacity ──
const MATERIALS: Record<MaterialKey, MaterialDef> = {
  coffee_bean: { name: "咖啡豆", unit: "g", fullCapacity: 15000, mpu: 500, mpuUnit: "袋(500g/袋)", restockPct: 25, shutdownPct: 10, dailyAvg: 800, industryLossRate: 0.02 },
  fresh_milk: { name: "鲜奶", unit: "ml", fullCapacity: 30000, mpu: 5000, mpuUnit: "箱(5000ml/箱)", restockPct: 25, shutdownPct: 10, dailyAvg: 2000, industryLossRate: 0.02 },
  paper_cup: { name: "定制纸杯", unit: "个", fullCapacity: 2000, mpu: 500, mpuUnit: "箱(500个/箱)", restockPct: 25, shutdownPct: 10, dailyAvg: 120, industryLossRate: 0.02 },
  straw: { name: "吸管", unit: "包", fullCapacity: 200, mpu: 50, mpuUnit: "箱(50包/箱)", restockPct: 25, shutdownPct: 10, dailyAvg: 8, industryLossRate: 0.02 },
  syrup: { name: "糖浆", unit: "瓶", fullCapacity: 50, mpu: 6, mpuUnit: "箱(6瓶/箱)", restockPct: 25, shutdownPct: 10, dailyAvg: 3, industryLossRate: 0.02 },
};
const materialKeys = Object.keys(MATERIALS) as MaterialKey[];

// ── Mock Stores ──
const initStores = (): StoreDef[] => [
  { id: "S001", name: "天鹅湖万达店", region: "政务区", inventory: { coffee_bean: { qty: 1200, theoretical: 1300 }, fresh_milk: { qty: 12000, theoretical: 12000 }, paper_cup: { qty: 800, theoretical: 800 }, straw: { qty: 80, theoretical: 80 }, syrup: { qty: 20, theoretical: 20 } } },
  { id: "S002", name: "1912 街区店", region: "包河区", inventory: { coffee_bean: { qty: 6000, theoretical: 6000 }, fresh_milk: { qty: 5000, theoretical: 5200 }, paper_cup: { qty: 900, theoretical: 900 }, straw: { qty: 60, theoretical: 60 }, syrup: { qty: 15, theoretical: 15 } } },
  { id: "S003", name: "步行街旗舰店", region: "庐阳区", inventory: { coffee_bean: { qty: 8000, theoretical: 8000 }, fresh_milk: { qty: 18000, theoretical: 18000 }, paper_cup: { qty: 150, theoretical: 160 }, straw: { qty: 90, theoretical: 90 }, syrup: { qty: 25, theoretical: 25 } } },
  { id: "S004", name: "银泰中心店", region: "蜀山区", inventory: { coffee_bean: { qty: 10000, theoretical: 10000 }, fresh_milk: { qty: 20000, theoretical: 20000 }, paper_cup: { qty: 1200, theoretical: 1200 }, straw: { qty: 100, theoretical: 100 }, syrup: { qty: 30, theoretical: 30 } } },
  { id: "S005", name: "大蜀山森林店", region: "蜀山区", inventory: { coffee_bean: { qty: 12000, theoretical: 12000 }, fresh_milk: { qty: 22000, theoretical: 22000 }, paper_cup: { qty: 1500, theoretical: 1500 }, straw: { qty: 120, theoretical: 120 }, syrup: { qty: 35, theoretical: 35 } } },
  { id: "S006", name: "合肥南站店", region: "包河区", inventory: { coffee_bean: { qty: 2000, theoretical: 2100 }, fresh_milk: { qty: 15000, theoretical: 15000 }, paper_cup: { qty: 700, theoretical: 700 }, straw: { qty: 50, theoretical: 50 }, syrup: { qty: 18, theoretical: 18 } } },
  { id: "S007", name: "滨湖新区店", region: "滨湖区", inventory: { coffee_bean: { qty: 11000, theoretical: 11000 }, fresh_milk: { qty: 25000, theoretical: 25000 }, paper_cup: { qty: 1600, theoretical: 1600 }, straw: { qty: 150, theoretical: 150 }, syrup: { qty: 40, theoretical: 40 } } },
  { id: "S008", name: "政务区华润店", region: "政务区", inventory: { coffee_bean: { qty: 7000, theoretical: 7000 }, fresh_milk: { qty: 14000, theoretical: 14000 }, paper_cup: { qty: 600, theoretical: 600 }, straw: { qty: 70, theoretical: 70 }, syrup: { qty: 1, theoretical: 2 } } },
  { id: "S009", name: "中科大校园店", region: "蜀山区", inventory: { coffee_bean: { qty: 9000, theoretical: 9000 }, fresh_milk: { qty: 24000, theoretical: 24000 }, paper_cup: { qty: 1100, theoretical: 1100 }, straw: { qty: 110, theoretical: 110 }, syrup: { qty: 28, theoretical: 28 } } },
  { id: "S010", name: "瑶海家天下店", region: "瑶海区", inventory: { coffee_bean: { qty: 4000, theoretical: 4200 }, fresh_milk: { qty: 7000, theoretical: 7200 }, paper_cup: { qty: 450, theoretical: 450 }, straw: { qty: 40, theoretical: 40 }, syrup: { qty: 12, theoretical: 12 } } },
  { id: "S011", name: "高新万达店", region: "高新区", inventory: { coffee_bean: { qty: 8500, theoretical: 8500 }, fresh_milk: { qty: 19000, theoretical: 19000 }, paper_cup: { qty: 1000, theoretical: 1000 }, straw: { qty: 95, theoretical: 95 }, syrup: { qty: 22, theoretical: 22 } } },
  { id: "S012", name: "经开芙蓉路店", region: "经开区", inventory: { coffee_bean: { qty: 5500, theoretical: 5500 }, fresh_milk: { qty: 11000, theoretical: 11000 }, paper_cup: { qty: 550, theoretical: 550 }, straw: { qty: 55, theoretical: 55 }, syrup: { qty: 14, theoretical: 14 } } },
];

// ── Mock Merchant Requests (10 multi-material orders) ──
const initRequests = (): MerchantRequest[] => [
  { id: "MR001", storeId: "S001", storeName: "天鹅湖万达店", items: [{ materialKey: "coffee_bean", requestQty: 5000, approvedQty: 5000 }, { materialKey: "paper_cup", requestQty: 1000, approvedQty: 1000 }, { materialKey: "straw", requestQty: 50, approvedQty: 50 }], reason: "节假日活动预备", createdAt: "2026-03-15 14:30", status: "pending" },
  { id: "MR002", storeId: "S003", storeName: "步行街旗舰店", items: [{ materialKey: "paper_cup", requestQty: 1500, approvedQty: 1500 }, { materialKey: "fresh_milk", requestQty: 10000, approvedQty: 10000 }], reason: "日常消耗快", createdAt: "2026-03-16 09:00", status: "pending_shipment", logisticsNo: "YH-S003-002" },
  { id: "MR003", storeId: "S006", storeName: "合肥南站店", items: [{ materialKey: "fresh_milk", requestQty: 15000, approvedQty: 10000 }, { materialKey: "coffee_bean", requestQty: 3000, approvedQty: 3000 }, { materialKey: "syrup", requestQty: 12, approvedQty: 12 }], reason: "周末客流增加", createdAt: "2026-03-17 10:00", status: "pending_shipment", logisticsNo: "YH-S006-001" },
  { id: "MR004", storeId: "S002", storeName: "1912 街区店", items: [{ materialKey: "fresh_milk", requestQty: 20000, approvedQty: 15000 }, { materialKey: "straw", requestQty: 100, approvedQty: 100 }], reason: "促销活动备货", createdAt: "2026-03-17 14:00", status: "in_transit", logisticsNo: "YH-S002-003" },
  { id: "MR005", storeId: "S008", storeName: "政务区华润店", items: [{ materialKey: "syrup", requestQty: 24, approvedQty: 24 }, { materialKey: "coffee_bean", requestQty: 4000, approvedQty: 4000 }, { materialKey: "paper_cup", requestQty: 500, approvedQty: 500 }], reason: "糖浆紧急补充", createdAt: "2026-03-18 08:30", status: "completed", logisticsNo: "YH-S008-002" },
  { id: "MR006", storeId: "S010", storeName: "瑶海家天下店", items: [{ materialKey: "coffee_bean", requestQty: 8000, approvedQty: 8000 }, { materialKey: "fresh_milk", requestQty: 15000, approvedQty: 15000 }], reason: "库存预警补货", createdAt: "2026-03-18 11:00", status: "pending" },
  { id: "MR007", storeId: "S004", storeName: "银泰中心店", items: [{ materialKey: "paper_cup", requestQty: 500, approvedQty: 500 }, { materialKey: "straw", requestQty: 50, approvedQty: 50 }, { materialKey: "syrup", requestQty: 6, approvedQty: 6 }], reason: "常规补货", createdAt: "2026-03-19 09:30", status: "rejected" },
  { id: "MR008", storeId: "S005", storeName: "大蜀山森林店", items: [{ materialKey: "coffee_bean", requestQty: 3000, approvedQty: 3000 }, { materialKey: "fresh_milk", requestQty: 5000, approvedQty: 5000 }, { materialKey: "paper_cup", requestQty: 500, approvedQty: 500 }, { materialKey: "straw", requestQty: 50, approvedQty: 50 }], reason: "景区周末高峰", createdAt: "2026-03-19 14:00", status: "pending_shipment", logisticsNo: "YH-S005-004" },
  { id: "MR009", storeId: "S011", storeName: "高新万达店", items: [{ materialKey: "fresh_milk", requestQty: 10000, approvedQty: 10000 }, { materialKey: "syrup", requestQty: 18, approvedQty: 18 }], reason: "新品上线备料", createdAt: "2026-03-20 10:00", status: "completed", logisticsNo: "YH-S011-001" },
  { id: "MR010", storeId: "S012", storeName: "经开芙蓉路店", items: [{ materialKey: "coffee_bean", requestQty: 6000, approvedQty: 6000 }, { materialKey: "paper_cup", requestQty: 1000, approvedQty: 1000 }, { materialKey: "fresh_milk", requestQty: 10000, approvedQty: 10000 }], reason: "社区活动储备", createdAt: "2026-03-21 08:00", status: "pending" },
];

// ── Helpers ──
function getBottleneck(store: StoreDef, materials: Record<MaterialKey, MaterialDef>) {
  let worst: { key: MaterialKey; pct: number } | null = null;
  for (const k of materialKeys) {
    const pct = (store.inventory[k].qty / materials[k].fullCapacity) * 100;
    if (!worst || pct < worst.pct) worst = { key: k, pct };
  }
  return worst!;
}

function getStoreStatus(pct: number, materials: Record<MaterialKey, MaterialDef>, key: MaterialKey): "green" | "yellow" | "red" {
  const m = materials[key];
  if (pct <= m.shutdownPct) return "red";
  if (pct <= m.restockPct) return "yellow";
  return "green";
}

function getCountdown(store: StoreDef, materials: Record<MaterialKey, MaterialDef>) {
  let minDays = Infinity;
  for (const k of materialKeys) {
    const days = store.inventory[k].qty / materials[k].dailyAvg;
    if (days < minDays) minDays = days;
  }
  return Math.max(0, Math.floor(minDays));
}

function ceilToMPU(qty: number, mpu: number) {
  return Math.ceil(qty / mpu) * mpu;
}

const statusLabel = { green: "正常", yellow: "预警", red: "熔断" } as const;
const statusColor = { green: "text-green-400", yellow: "text-yellow-400", red: "text-red-400" } as const;
const statusBg = { green: "bg-green-500/20 text-green-400 border-green-500/30", yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", red: "bg-red-500/20 text-red-400 border-red-500/30" } as const;

const reqStatusMap: Record<MerchantRequestStatus, { label: string; cls: string }> = {
  pending: { label: "待审批", cls: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  pending_shipment: { label: "待发货", cls: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  in_transit: { label: "待配送", cls: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  completed: { label: "已完成", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  rejected: { label: "已拒绝", cls: "bg-red-500/20 text-red-400 border-red-500/30" },
};

// ── Dashboard Tab ──
function DashboardTab({ stores, materials }: { stores: StoreDef[]; materials: Record<MaterialKey, MaterialDef> }) {
  const [selectedStore, setSelectedStore] = useState<StoreDef | null>(null);
  const summary = { green: 0, yellow: 0, red: 0 };
  stores.forEach(s => {
    const bn = getBottleneck(s, materials);
    const st = getStoreStatus(bn.pct, materials, bn.key);
    summary[st]++;
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {(["green", "yellow", "red"] as const).map(k => (
          <Card key={k} className="bg-[#121212] border-[#333]">
            <CardContent className="py-4 text-center">
              <div className={`text-3xl font-mono font-bold ${statusColor[k]}`}>{summary[k]}</div>
              <div className="text-xs text-muted-foreground mt-1">{statusLabel[k]}门店</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-[#121212] border-[#333]">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#333] text-muted-foreground text-xs">
                <th className="text-left p-3">门店</th>
                <th className="text-left p-3">瓶颈物料</th>
                <th className="text-right p-3">当前值</th>
                <th className="text-right p-3">关店倒计时</th>
                <th className="text-center p-3">状态</th>
                <th className="text-center p-3"></th>
              </tr>
            </thead>
            <tbody>
              {stores.map(store => {
                const bn = getBottleneck(store, materials);
                const st = getStoreStatus(bn.pct, materials, bn.key);
                const countdown = getCountdown(store, materials);
                return (
                  <tr key={store.id} className="border-b border-[#222] hover:bg-[#1a1a1a] cursor-pointer" onClick={() => setSelectedStore(store)}>
                    <td className="p-3 font-medium text-foreground">{store.id} | {store.name}</td>
                    <td className="p-3"><span className={statusColor[st]}>{materials[bn.key].name}</span></td>
                    <td className="p-3 text-right font-mono text-foreground">
                      {store.inventory[bn.key].qty.toLocaleString()} {materials[bn.key].unit}
                      <span className="text-muted-foreground ml-1">({bn.pct.toFixed(1)}%)</span>
                    </td>
                    <td className={`p-3 text-right font-mono font-bold ${countdown <= 2 ? "text-red-400" : countdown <= 5 ? "text-yellow-400" : "text-green-400"}`}>{countdown} 天</td>
                    <td className="p-3 text-center"><Badge variant="outline" className={statusBg[st]}>{statusLabel[st]}</Badge></td>
                    <td className="p-3 text-center"><ChevronRight className="w-4 h-4 text-muted-foreground" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Sheet open={!!selectedStore} onOpenChange={() => setSelectedStore(null)}>
        <SheetContent className="bg-[#0a0a0a] border-[#333] w-[420px] sm:max-w-[420px]">
          {selectedStore && (
            <>
              <SheetHeader><SheetTitle className="text-foreground">{selectedStore.name} — 库存快照</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-4">
                {materialKeys.map(k => {
                  const inv = selectedStore.inventory[k];
                  const m = materials[k];
                  const pct = (inv.qty / m.fullCapacity) * 100;
                  const st = getStoreStatus(pct, materials, k);
                  return (
                    <div key={k} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{m.name}</span>
                        <span className={`font-mono font-bold ${statusColor[st]}`}>{inv.qty.toLocaleString()} {m.unit}</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>熔断线 {m.shutdownPct}%</span>
                        <span>备货线 {m.restockPct}%</span>
                        <span>满载 {m.fullCapacity.toLocaleString()}{m.unit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ── Strategy Tab (with store selector) ──
function StrategyTab({ stores, materials, setMaterials }: { stores: StoreDef[]; materials: Record<MaterialKey, MaterialDef>; setMaterials: (m: Record<MaterialKey, MaterialDef>) => void }) {
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialKey>("coffee_bean");
  const [restockVal, setRestockVal] = useState("");
  const [shutdownVal, setShutdownVal] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStoreIds, setSelectedStoreIds] = useState<Set<string>>(new Set(stores.map(s => s.id)));

  const filteredStores = stores.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStore = (id: string) => {
    const next = new Set(selectedStoreIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedStoreIds(next);
  };
  const selectAll = () => setSelectedStoreIds(new Set(stores.map(s => s.id)));
  const selectNone = () => setSelectedStoreIds(new Set());

  const handleApply = () => {
    if (selectedStoreIds.size === 0) { toast({ title: "请至少选择一家门店" }); return; }
    const r = restockVal ? Number(restockVal) : undefined;
    const s = shutdownVal ? Number(shutdownVal) : undefined;
    if (r !== undefined && (r < 0 || r > 100)) { toast({ title: "备货阈值须 0-100" }); return; }
    if (s !== undefined && (s < 0 || s > 100)) { toast({ title: "熔断阈值须 0-100" }); return; }
    if (r !== undefined && s !== undefined && s >= r) { toast({ title: "熔断线须低于备货线" }); return; }
    const updated = { ...materials };
    const m = { ...updated[selectedMaterial] };
    if (r !== undefined) m.restockPct = r;
    if (s !== undefined) m.shutdownPct = s;
    updated[selectedMaterial] = m;
    setMaterials(updated);
    toast({ title: `已将「${m.name}」阈值应用至 ${selectedStoreIds.size} 家门店`, description: `备货${m.restockPct}% / 熔断${m.shutdownPct}%` });
    setRestockVal("");
    setShutdownVal("");
  };

  return (
    <div className="space-y-6">
      <Card className="bg-[#121212] border-[#333]">
        <CardHeader><CardTitle className="text-base text-foreground">当前阈值总览</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#333] text-muted-foreground text-xs">
                <th className="text-left p-2">物料</th>
                <th className="text-right p-2">备货线</th>
                <th className="text-right p-2">熔断线</th>
                <th className="text-right p-2">满载容量</th>
                <th className="text-right p-2">最小包装 (MPU)</th>
              </tr>
            </thead>
            <tbody>
              {materialKeys.map(k => (
                <tr key={k} className="border-b border-[#222]">
                  <td className="p-2 text-foreground">{materials[k].name}</td>
                  <td className="p-2 text-right font-mono text-yellow-400">{materials[k].restockPct}%</td>
                  <td className="p-2 text-right font-mono text-red-400">{materials[k].shutdownPct}%</td>
                  <td className="p-2 text-right font-mono text-muted-foreground">{materials[k].fullCapacity.toLocaleString()} {materials[k].unit}</td>
                  <td className="p-2 text-right font-mono text-muted-foreground">{materials[k].mpu} {materials[k].unit}/{materials[k].mpuUnit.split('(')[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {/* Store Selector */}
        <Card className="bg-[#121212] border-[#333]">
          <CardHeader>
            <CardTitle className="text-base text-foreground flex items-center justify-between">
              <span>门店选择器</span>
              <span className="text-xs font-normal text-muted-foreground">已选 {selectedStoreIds.size}/{stores.length}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input placeholder="搜索门店名称或编号..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 bg-[#0a0a0a] border-[#333]" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-xs border-[#333]" onClick={selectAll}>全选</Button>
              <Button size="sm" variant="outline" className="text-xs border-[#333]" onClick={selectNone}>清空</Button>
            </div>
            <div className="max-h-[280px] overflow-y-auto space-y-1">
              {filteredStores.map(s => (
                <label key={s.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#1a1a1a] cursor-pointer text-sm">
                  <Checkbox checked={selectedStoreIds.has(s.id)} onCheckedChange={() => toggleStore(s.id)} />
                  <span className="text-foreground">{s.id}</span>
                  <span className="text-muted-foreground">|</span>
                  <span className="text-foreground">{s.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{s.region}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Threshold Config */}
        <Card className="bg-[#121212] border-[#333]">
          <CardHeader><CardTitle className="text-base text-foreground">批量修改阈值</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">目标物料</Label>
              <Select value={selectedMaterial} onValueChange={v => setSelectedMaterial(v as MaterialKey)}>
                <SelectTrigger className="bg-[#0a0a0a] border-[#333]"><SelectValue /></SelectTrigger>
                <SelectContent>{materialKeys.map(k => <SelectItem key={k} value={k}>{materials[k].name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">备货阈值 (%)</Label>
                <Input type="number" value={restockVal} onChange={e => setRestockVal(e.target.value)} placeholder={`当前 ${materials[selectedMaterial].restockPct}%`} className="bg-[#0a0a0a] border-[#333]" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">熔断阈值 (%)</Label>
                <Input type="number" value={shutdownVal} onChange={e => setShutdownVal(e.target.value)} placeholder={`当前 ${materials[selectedMaterial].shutdownPct}%`} className="bg-[#0a0a0a] border-[#333]" />
              </div>
            </div>
            <div className="p-3 rounded bg-[#0a0a0a] border border-[#333] text-xs text-muted-foreground space-y-1">
              <div>满载容量: <span className="text-foreground font-mono">{materials[selectedMaterial].fullCapacity.toLocaleString()} {materials[selectedMaterial].unit}</span></div>
              <div>MPU: <span className="text-foreground font-mono">{materials[selectedMaterial].mpuUnit}</span></div>
              <div>备货线数值: <span className="text-yellow-400 font-mono">{Math.round(materials[selectedMaterial].fullCapacity * (restockVal ? Number(restockVal) : materials[selectedMaterial].restockPct) / 100).toLocaleString()} {materials[selectedMaterial].unit}</span></div>
              <div>熔断线数值: <span className="text-red-400 font-mono">{Math.round(materials[selectedMaterial].fullCapacity * (shutdownVal ? Number(shutdownVal) : materials[selectedMaterial].shutdownPct) / 100).toLocaleString()} {materials[selectedMaterial].unit}</span></div>
            </div>
            <Button onClick={handleApply} className="w-full">一键应用到 {selectedStoreIds.size} 家门店</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Smart Replenish Tab (whole-order mode) ──
interface ReplenishOrder {
  storeId: string; storeName: string; triggerMaterial: MaterialKey;
  items: { materialKey: MaterialKey; currentQty: number; fullCapacity: number; suggestQty: number; editQty: number }[];
}

function SmartReplenishTab({ stores, materials }: { stores: StoreDef[]; materials: Record<MaterialKey, MaterialDef> }) {
  const [autoMode, setAutoMode] = useState(false);
  const [expandedStore, setExpandedStore] = useState<string | null>(null);
  const [selectedStores, setSelectedStores] = useState<Set<string>>(new Set());
  const [editOverrides, setEditOverrides] = useState<Record<string, Record<MaterialKey, number>>>({});

  // Generate store-level replenish orders: triggered when ANY material < restock line
  const orders = useMemo<ReplenishOrder[]>(() => {
    return stores.filter(store => {
      return materialKeys.some(k => {
        const pct = (store.inventory[k].qty / materials[k].fullCapacity) * 100;
        return pct <= materials[k].restockPct;
      });
    }).map(store => {
      // Find trigger material (worst one)
      const bn = getBottleneck(store, materials);
      // Build full order: for ALL materials, calc (fullCapacity - currentQty) ceiled to MPU
      const items = materialKeys.map(k => {
        const m = materials[k];
        const currentQty = store.inventory[k].qty;
        const gap = m.fullCapacity - currentQty;
        const suggestQty = gap > 0 ? ceilToMPU(gap, m.mpu) : 0;
        return { materialKey: k, currentQty, fullCapacity: m.fullCapacity, suggestQty, editQty: suggestQty };
      });
      return { storeId: store.id, storeName: store.name, triggerMaterial: bn.key, items };
    });
  }, [stores, materials]);

  const toggleExpand = (id: string) => setExpandedStore(expandedStore === id ? null : id);
  const toggleSelect = (id: string) => {
    const s = new Set(selectedStores);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedStores(s);
  };
  const toggleAll = () => {
    if (selectedStores.size === orders.length) setSelectedStores(new Set());
    else setSelectedStores(new Set(orders.map(o => o.storeId)));
  };

  const updateItemQty = (storeId: string, mk: MaterialKey, val: number) => {
    setEditOverrides(prev => {
      const existing = prev[storeId] || {} as Record<MaterialKey, number>;
      return { ...prev, [storeId]: { ...existing, [mk]: val } as Record<MaterialKey, number> };
    });
  };

  const getEditQty = (storeId: string, mk: MaterialKey, defaultQty: number) => {
    return editOverrides[storeId]?.[mk] ?? defaultQty;
  };

  const handleSend = () => {
    if (selectedStores.size === 0) { toast({ title: "请至少勾选一家门店" }); return; }
    const totalItems = orders.filter(o => selectedStores.has(o.storeId)).reduce((sum, o) => sum + o.items.filter(i => getEditQty(o.storeId, i.materialKey, i.suggestQty) > 0).length, 0);
    toast({ title: `已发送 ${selectedStores.size} 家门店的配货单至总部`, description: `共 ${totalItems} 项物料已标记为待配送(Locked)` });
    setSelectedStores(new Set());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">模式：</span>
          <span className={`text-sm font-medium ${!autoMode ? "text-foreground" : "text-muted-foreground"}`}>Manual</span>
          <Switch checked={autoMode} onCheckedChange={setAutoMode} />
          <span className={`text-sm font-medium ${autoMode ? "text-foreground" : "text-muted-foreground"}`}>Auto</span>
        </div>
        {autoMode && <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">全自动模式已开启</Badge>}
      </div>

      {autoMode ? (
        <Card className="bg-[#121212] border-[#333]">
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-foreground font-medium">全自动推配已激活</p>
            <p className="text-sm text-muted-foreground mt-1">系统将根据阈值策略自动生成整单配货并发送至总部</p>
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card className="bg-[#121212] border-[#333]">
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-foreground">所有门店库存充足，无需补货</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox checked={selectedStores.size === orders.length && orders.length > 0} onCheckedChange={toggleAll} />
              <span className="text-sm text-muted-foreground">全选 ({orders.length} 家门店触发推配)</span>
            </div>
            <Button onClick={handleSend} disabled={selectedStores.size === 0}>
              <Truck className="w-4 h-4 mr-2" />发送至总部 ({selectedStores.size})
            </Button>
          </div>

          <div className="space-y-2">
            {orders.map(order => {
              const isExpanded = expandedStore === order.storeId;
              const bn = getBottleneck(stores.find(s => s.id === order.storeId)!, materials);
              const st = getStoreStatus(bn.pct, materials, bn.key);
              return (
                <Card key={order.storeId} className="bg-[#121212] border-[#333]">
                  <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[#1a1a1a]" onClick={() => toggleExpand(order.storeId)}>
                    <Checkbox checked={selectedStores.has(order.storeId)} onCheckedChange={(e) => { e && e !== "indeterminate" ? null : null; toggleSelect(order.storeId); }} onClick={e => e.stopPropagation()} />
                    <div className="flex-1 flex items-center gap-3">
                      <span className="text-foreground font-medium">{order.storeId} | {order.storeName}</span>
                      <Badge variant="outline" className={statusBg[st]}>{statusLabel[st]}</Badge>
                      <span className="text-xs text-muted-foreground">触发: <span className={statusColor[st]}>{materials[order.triggerMaterial].name}</span></span>
                    </div>
                    <span className="text-xs text-muted-foreground">{order.items.filter(i => i.suggestQty > 0).length} 项物料</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>

                  {isExpanded && (
                    <div className="border-t border-[#333] p-0">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#333] text-muted-foreground text-xs">
                            <th className="text-left p-3">物料</th>
                            <th className="text-right p-3">当前库存</th>
                            <th className="text-right p-3">满载容量</th>
                            <th className="text-right p-3">缺口</th>
                            <th className="text-right p-3">建议补货量 (MPU对齐)</th>
                            <th className="text-right p-3">实际补货量</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map(item => {
                            const m = materials[item.materialKey];
                            const gap = item.fullCapacity - item.currentQty;
                            const editVal = getEditQty(order.storeId, item.materialKey, item.suggestQty);
                            return (
                              <tr key={item.materialKey} className="border-b border-[#222]">
                                <td className="p-3 text-foreground">{m.name} <span className="text-muted-foreground text-xs">({m.mpuUnit})</span></td>
                                <td className="p-3 text-right font-mono text-foreground">{item.currentQty.toLocaleString()} {m.unit}</td>
                                <td className="p-3 text-right font-mono text-muted-foreground">{item.fullCapacity.toLocaleString()} {m.unit}</td>
                                <td className={`p-3 text-right font-mono ${gap > 0 ? "text-yellow-400" : "text-green-400"}`}>{gap > 0 ? gap.toLocaleString() : "0"} {m.unit}</td>
                                <td className="p-3 text-right font-mono text-primary">{item.suggestQty.toLocaleString()} {m.unit}</td>
                                <td className="p-3 text-right">
                                  <Input
                                    type="number" value={editVal} className="w-24 ml-auto bg-[#0a0a0a] border-[#333] text-right font-mono"
                                    onChange={e => updateItemQty(order.storeId, item.materialKey, Math.max(0, Number(e.target.value)))}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Merchant Requests Tab (order list mode with status machine) ──
function MerchantRequestsTab({ requests, setRequests, stores, materials }: { requests: MerchantRequest[]; setRequests: (r: MerchantRequest[]) => void; stores: StoreDef[]; materials: Record<MaterialKey, MaterialDef> }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingApproval, setEditingApproval] = useState<Record<string, Record<string, number>>>({});

  const getApprovedQty = (reqId: string, mk: string, defaultQty: number) => editingApproval[reqId]?.[mk] ?? defaultQty;

  const handleApprove = (id: string) => {
    setRequests(requests.map(r => {
      if (r.id !== id) return r;
      const updatedItems = r.items.map(item => ({
        ...item,
        approvedQty: getApprovedQty(id, item.materialKey, item.approvedQty)
      }));
      return { ...r, status: "pending_shipment" as MerchantRequestStatus, items: updatedItems, logisticsNo: `YH-${r.storeId}-${String(Math.floor(Math.random() * 999)).padStart(3, "0")}` };
    }));
    toast({ title: "已批准 — 已生成出库任务", description: "运费由商家承担" });
  };

  const handleReject = (id: string) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: "rejected" as MerchantRequestStatus } : r));
    toast({ title: "已拒绝申请" });
  };

  const handleShip = (id: string) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: "in_transit" as MerchantRequestStatus } : r));
    toast({ title: "已确认发货 — 状态更新为待配送" });
  };

  const handleComplete = (id: string) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: "completed" as MerchantRequestStatus } : r));
    toast({ title: "商家已确认收货 — 要货单完成" });
  };

  const handleExport = () => {
    const rows = requests.flatMap(req => req.items.map(item => ({
      工单号: req.id, 门店: req.storeName, 物料: materials[item.materialKey].name,
      要货量: item.requestQty, 批准量: item.approvedQty, 原因: req.reason,
      状态: reqStatusMap[req.status].label, 物流单号: req.logisticsNo || "-", 创建时间: req.createdAt,
    })));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "商家要货");
    XLSX.writeFile(wb, `商家要货_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast({ title: "已导出 Excel" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2 text-xs">
          {(Object.keys(reqStatusMap) as MerchantRequestStatus[]).map(st => {
            const count = requests.filter(r => r.status === st).length;
            return count > 0 ? <Badge key={st} variant="outline" className={reqStatusMap[st].cls}>{reqStatusMap[st].label} {count}</Badge> : null;
          })}
        </div>
        <Button variant="outline" size="sm" className="border-[#333]" onClick={handleExport}><Download className="w-4 h-4 mr-1" />导出 Excel</Button>
      </div>

      <div className="space-y-2">
        {requests.map(req => {
          const isExpanded = expandedId === req.id;
          const store = stores.find(s => s.id === req.storeId);
          const totalRequestQty = req.items.length;
          return (
            <Card key={req.id} className="bg-[#121212] border-[#333]">
              <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[#1a1a1a]" onClick={() => setExpandedId(isExpanded ? null : req.id)}>
                <Package className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-foreground text-sm">{req.id}</span>
                    <span className="text-foreground text-sm font-medium">{req.storeName}</span>
                    <Badge variant="outline" className={reqStatusMap[req.status].cls}>{reqStatusMap[req.status].label}</Badge>
                    {req.logisticsNo && <span className="text-xs text-muted-foreground">物流: {req.logisticsNo}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{totalRequestQty} 种物料</span>
                    <span>{req.reason}</span>
                    <span>{req.createdAt}</span>
                    <span className="text-yellow-400">商家要货 · 运费自理</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {req.status === "pending" && (
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <Button size="sm" variant="outline" className="h-7 text-xs border-green-500/30 text-green-400 hover:bg-green-500/20" onClick={() => handleApprove(req.id)}>批准</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs border-red-500/30 text-red-400 hover:bg-red-500/20" onClick={() => handleReject(req.id)}>拒绝</Button>
                    </div>
                  )}
                  {req.status === "pending_shipment" && (
                    <Button size="sm" variant="outline" className="h-7 text-xs border-orange-500/30 text-orange-400 hover:bg-orange-500/20" onClick={e => { e.stopPropagation(); handleShip(req.id); }}>确认发货</Button>
                  )}
                  {req.status === "in_transit" && (
                    <Button size="sm" variant="outline" className="h-7 text-xs border-purple-500/30 text-purple-400 hover:bg-purple-500/20" onClick={e => { e.stopPropagation(); handleComplete(req.id); }}>确认收货</Button>
                  )}
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-[#333] p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#333] text-muted-foreground text-xs">
                        <th className="text-left p-3">物料</th>
                        <th className="text-right p-3">要货量</th>
                        <th className="text-right p-3">系统理论库存</th>
                        <th className="text-center p-3">风控</th>
                        <th className="text-right p-3">{req.status === "pending" ? "批准量 (可修改)" : "批准量"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {req.items.map(item => {
                        const m = materials[item.materialKey];
                        const sysQty = store ? store.inventory[item.materialKey].theoretical : 0;
                        const suspicious = sysQty > item.requestQty * 0.5;
                        const editVal = getApprovedQty(req.id, item.materialKey, item.approvedQty);
                        return (
                          <tr key={item.materialKey} className="border-b border-[#222]">
                            <td className="p-3 text-foreground">{m.name} ({m.unit})</td>
                            <td className="p-3 text-right font-mono text-primary font-bold">{item.requestQty.toLocaleString()} {m.unit}</td>
                            <td className="p-3 text-right font-mono text-muted-foreground">{sysQty.toLocaleString()} {m.unit}</td>
                            <td className="p-3 text-center">
                              {suspicious ? (
                                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                                  <AlertTriangle className="w-3 h-3 mr-1" />囤货嫌疑
                                </Badge>
                              ) : <span className="text-green-400 text-xs">正常</span>}
                            </td>
                            <td className="p-3 text-right">
                              {req.status === "pending" ? (
                                <Input
                                  type="number" value={editVal} className="w-24 ml-auto bg-[#0a0a0a] border-[#333] text-right font-mono"
                                  onClick={e => e.stopPropagation()}
                                  onChange={e => { const v = Math.max(0, Number(e.target.value)); setEditingApproval(prev => { const existing = prev[req.id] || {} as Record<string, number>; return { ...prev, [req.id]: { ...existing, [item.materialKey]: v } as Record<string, number> }; }); }}
                                />
                              ) : (
                                <span className="font-mono text-foreground">{item.approvedQty.toLocaleString()} {m.unit}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          );
        })}
        {requests.length === 0 && (
          <Card className="bg-[#121212] border-[#333]">
            <CardContent className="py-8 text-center text-muted-foreground">暂无商家要货申请</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Audit Tab ──
function AuditTab({ stores, setStores, materials }: { stores: StoreDef[]; setStores: (s: StoreDef[]) => void; materials: Record<MaterialKey, MaterialDef> }) {
  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id || "");
  const [actualValues, setActualValues] = useState<Record<MaterialKey, string>>({} as Record<MaterialKey, string>);
  const store = stores.find(s => s.id === selectedStoreId);

  const handleConfirm = () => {
    if (!store) return;
    const updated = stores.map(s => {
      if (s.id !== selectedStoreId) return s;
      const newInv = { ...s.inventory };
      for (const k of materialKeys) {
        const actual = actualValues[k] ? Number(actualValues[k]) : s.inventory[k].qty;
        newInv[k] = { ...newInv[k], qty: actual };
      }
      return { ...s, inventory: newInv };
    });
    setStores(updated);
    setActualValues({} as Record<MaterialKey, string>);
    toast({ title: "盘点已确认，库存已校准为实测值" });
  };

  const handleExport = () => {
    if (!store) return;
    const rows = materialKeys.map(k => {
      const m = materials[k];
      const inv = store.inventory[k];
      const actual = actualValues[k] ? Number(actualValues[k]) : inv.qty;
      const diff = actual - inv.theoretical;
      const allowedLoss = inv.theoretical * m.industryLossRate;
      const excessLoss = diff < 0 ? Math.max(Math.abs(diff) - allowedLoss, 0) : 0;
      const unitPrice = m.fullCapacity > 1000 ? 0.05 : 5;
      return { 物料: m.name, 单位: m.unit, 系统理论值: inv.theoretical, 实测值: actual, 差异: diff, 允许损耗: allowedLoss.toFixed(1), 超额损耗: excessLoss.toFixed(1), 赔偿金额: (excessLoss * unitPrice).toFixed(2) };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "盘点审计");
    XLSX.writeFile(wb, `盘点_${store.name}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast({ title: "已导出 Excel" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
          <SelectTrigger className="w-64 bg-[#0a0a0a] border-[#333]"><SelectValue placeholder="选择门店" /></SelectTrigger>
          <SelectContent>{stores.map(s => <SelectItem key={s.id} value={s.id}>{s.id} | {s.name}</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleExport} className="border-[#333]"><Download className="w-4 h-4 mr-1" />导出 Excel</Button>
      </div>

      {store && (
        <Card className="bg-[#121212] border-[#333]">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#333] text-muted-foreground text-xs">
                  <th className="text-left p-3">物料</th>
                  <th className="text-right p-3">系统理论值</th>
                  <th className="text-right p-3">实测值 (输入)</th>
                  <th className="text-right p-3">差异</th>
                  <th className="text-right p-3">允许损耗 (2%)</th>
                  <th className="text-right p-3">超额损耗</th>
                  <th className="text-right p-3">赔偿金额 (¥)</th>
                </tr>
              </thead>
              <tbody>
                {materialKeys.map(k => {
                  const m = materials[k];
                  const inv = store.inventory[k];
                  const actual = actualValues[k] ? Number(actualValues[k]) : inv.qty;
                  const diff = actual - inv.theoretical;
                  const allowedLoss = inv.theoretical * m.industryLossRate;
                  const excessLoss = diff < 0 ? Math.max(Math.abs(diff) - allowedLoss, 0) : 0;
                  const unitPrice = m.fullCapacity > 1000 ? 0.05 : 5;
                  const compensation = excessLoss * unitPrice;
                  return (
                    <tr key={k} className="border-b border-[#222]">
                      <td className="p-3 text-foreground">{m.name} ({m.unit})</td>
                      <td className="p-3 text-right font-mono text-muted-foreground">{inv.theoretical.toLocaleString()}</td>
                      <td className="p-3 text-right">
                        <Input type="number" value={actualValues[k] || ""} onChange={e => setActualValues({ ...actualValues, [k]: e.target.value })} placeholder={String(inv.qty)} className="w-28 ml-auto bg-[#0a0a0a] border-[#333] text-right font-mono" />
                      </td>
                      <td className={`p-3 text-right font-mono font-bold ${diff < 0 ? "text-red-400" : diff > 0 ? "text-green-400" : "text-muted-foreground"}`}>{diff >= 0 ? "+" : ""}{diff.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-muted-foreground">{allowedLoss.toFixed(1)}</td>
                      <td className={`p-3 text-right font-mono font-bold ${excessLoss > 0 ? "text-red-400" : "text-muted-foreground"}`}>{excessLoss > 0 ? `-${excessLoss.toFixed(1)}` : "0"}</td>
                      <td className={`p-3 text-right font-mono font-bold ${compensation > 0 ? "text-red-400" : "text-muted-foreground"}`}>{compensation > 0 ? `¥${compensation.toFixed(2)}` : "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleConfirm}><ClipboardCheck className="w-4 h-4 mr-2" />确认盘点 — 校准库存</Button>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function SupplyStoreInventory() {
  const [stores, setStores] = useState(initStores);
  const [materials, setMaterials] = useState(MATERIALS);
  const [requests, setRequests] = useState(initRequests);

  return (
    <div className="h-full space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/supply" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Store className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">门店库存管理</h1>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="bg-[#121212] border border-[#333]">
          <TabsTrigger value="dashboard"><BarChart3 className="w-4 h-4 mr-1.5" />监控看板</TabsTrigger>
          <TabsTrigger value="strategy"><Settings2 className="w-4 h-4 mr-1.5" />策略配置</TabsTrigger>
          <TabsTrigger value="replenish"><Truck className="w-4 h-4 mr-1.5" />智能推配</TabsTrigger>
          <TabsTrigger value="requests"><ShoppingCart className="w-4 h-4 mr-1.5" />商家要货</TabsTrigger>
          <TabsTrigger value="audit"><ClipboardCheck className="w-4 h-4 mr-1.5" />盘点审计</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><DashboardTab stores={stores} materials={materials} /></TabsContent>
        <TabsContent value="strategy"><StrategyTab stores={stores} materials={materials} setMaterials={setMaterials} /></TabsContent>
        <TabsContent value="replenish"><SmartReplenishTab stores={stores} materials={materials} /></TabsContent>
        <TabsContent value="requests"><MerchantRequestsTab requests={requests} setRequests={setRequests} stores={stores} materials={materials} /></TabsContent>
        <TabsContent value="audit"><AuditTab stores={stores} setStores={setStores} materials={materials} /></TabsContent>
      </Tabs>
    </div>
  );
}
