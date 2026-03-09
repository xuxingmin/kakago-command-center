import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Coupon = Tables<"coupons">;

interface CouponDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Coupon | null;
}

type ValidityMode = "days" | "range";
type ScopeMode = "all" | "include" | "exclude";

export function CouponDrawer({ open, onOpenChange, editing }: CouponDrawerProps) {
  const queryClient = useQueryClient();

  // Basic fields
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("fixed");
  const [value, setValue] = useState("");
  const [minOrder, setMinOrder] = useState("");

  // Validity
  const [validityMode, setValidityMode] = useState<ValidityMode>("days");
  const [validDays, setValidDays] = useState("7");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  // Inventory
  const [totalQuota, setTotalQuota] = useState("");
  const [perUserLimit, setPerUserLimit] = useState("1");

  // Stacking
  const [allowStacking, setAllowStacking] = useState(false);

  // Store scope
  const [storeScope, setStoreScope] = useState<"all" | "specific">("all");
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);

  // SKU scope
  const [skuScope, setSkuScope] = useState<ScopeMode>("all");
  const [selectedSkuIds, setSelectedSkuIds] = useState<string[]>([]);

  const { data: stores = [] } = useQuery({
    queryKey: ["stores_list"],
    queryFn: async () => {
      const { data } = await supabase.from("stores").select("id, name").order("name");
      return data ?? [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products_list"],
    queryFn: async () => {
      const { data } = await supabase.from("sku_products").select("id, name").eq("is_active", true).order("name");
      return data ?? [];
    },
  });

  useEffect(() => {
    if (open) {
      if (editing) {
        setName(editing.name);
        setType(editing.type);
        setValue(String(editing.value));
        setMinOrder(String(editing.min_order ?? ""));
        setValidDays(String(editing.valid_days ?? 7));
        setTotalQuota(String(editing.total_quota ?? ""));
        setValidityMode("days");
        setPerUserLimit("1");
        setAllowStacking(false);
        setStoreScope("all");
        setSelectedStoreIds([]);
        setSkuScope("all");
        setSelectedSkuIds([]);
      } else {
        setName("");
        setType("fixed");
        setValue("");
        setMinOrder("");
        setValidDays("7");
        setDateStart("");
        setDateEnd("");
        setTotalQuota("");
        setPerUserLimit("1");
        setAllowStacking(false);
        setStoreScope("all");
        setSelectedStoreIds([]);
        setSkuScope("all");
        setSelectedSkuIds([]);
        setValidityMode("days");
      }
    }
  }, [open, editing]);

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload: Partial<Coupon> = {
        name,
        type: type as any,
        value: Number(value),
        min_order: minOrder ? Number(minOrder) : 0,
        valid_days: validityMode === "days" ? Number(validDays) : null,
        total_quota: totalQuota ? Number(totalQuota) : null,
      };
      if (editing) {
        const { error } = await supabase.from("coupons").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("coupons").insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      onOpenChange(false);
      toast({ title: editing ? "券模板已更新" : "券模板已创建" });
    },
    onError: (e) => toast({ title: "操作失败", description: e.message, variant: "destructive" }),
  });

  const toggleStore = (id: string) => {
    setSelectedStoreIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const toggleSku = (id: string) => {
    setSelectedSkuIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] sm:max-w-[480px] bg-card border-border p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="text-foreground">{editing ? "编辑券模板" : "新建券模板"}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="space-y-6 pr-2">
            {/* ── 基础信息 ── */}
            <section className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">基础信息</h3>
              <div>
                <Label className="text-xs">券名称</Label>
                <Input className="mt-1 h-9 text-sm bg-background" value={name} onChange={(e) => setName(e.target.value)} placeholder="如：新人满30减10" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">类型</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="mt-1 h-9 text-sm bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">满减</SelectItem>
                      <SelectItem value="discount">折扣</SelectItem>
                      <SelectItem value="freebie">赠品</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{type === "discount" ? "折扣值" : "面额 (¥)"}</Label>
                  <Input className="mt-1 h-9 text-sm bg-background" type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === "discount" ? "如 8.5" : "如 10"} />
                </div>
              </div>
            </section>

            {/* ── 适用范围 ── */}
            <section className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">适用范围</h3>

              {/* Store scope */}
              <div>
                <Label className="text-xs">门店限制</Label>
                <Select value={storeScope} onValueChange={(v) => setStoreScope(v as any)}>
                  <SelectTrigger className="mt-1 h-9 text-sm bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全场可用</SelectItem>
                    <SelectItem value="specific">指定门店可用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {storeScope === "specific" && (
                <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-auto rounded border border-border bg-background p-2">
                  {stores.map((s) => (
                    <label key={s.id} className="flex items-center gap-1.5 text-xs cursor-pointer hover:text-primary transition-colors">
                      <Checkbox checked={selectedStoreIds.includes(s.id)} onCheckedChange={() => toggleStore(s.id)} className="h-3.5 w-3.5" />
                      {s.name}
                    </label>
                  ))}
                </div>
              )}

              <Separator className="bg-border/50" />

              {/* SKU scope */}
              <div>
                <Label className="text-xs">商品限制</Label>
                <Select value={skuScope} onValueChange={(v) => setSkuScope(v as ScopeMode)}>
                  <SelectTrigger className="mt-1 h-9 text-sm bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全场通用</SelectItem>
                    <SelectItem value="include">指定 SKU 可用</SelectItem>
                    <SelectItem value="exclude">指定 SKU 排除</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {skuScope !== "all" && (
                <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-auto rounded border border-border bg-background p-2">
                  {products.map((p) => (
                    <label key={p.id} className="flex items-center gap-1.5 text-xs cursor-pointer hover:text-primary transition-colors">
                      <Checkbox checked={selectedSkuIds.includes(p.id)} onCheckedChange={() => toggleSku(p.id)} className="h-3.5 w-3.5" />
                      {p.name}
                    </label>
                  ))}
                </div>
              )}
            </section>

            {/* ── 使用规则 ── */}
            <section className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">使用规则</h3>

              <div>
                <Label className="text-xs">最低消费额 (¥)</Label>
                <Input className="mt-1 h-9 text-sm bg-background" type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} placeholder="0 表示无门槛" />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs">允许与活动叠加</Label>
                <Switch checked={allowStacking} onCheckedChange={setAllowStacking} />
              </div>

              <Separator className="bg-border/50" />

              {/* Validity */}
              <div>
                <Label className="text-xs">有效期模式</Label>
                <Select value={validityMode} onValueChange={(v) => setValidityMode(v as ValidityMode)}>
                  <SelectTrigger className="mt-1 h-9 text-sm bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">领取后 X 天有效</SelectItem>
                    <SelectItem value="range">固定日期范围</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {validityMode === "days" ? (
                <div>
                  <Label className="text-xs">有效天数</Label>
                  <Input className="mt-1 h-9 text-sm bg-background" type="number" value={validDays} onChange={(e) => setValidDays(e.target.value)} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">开始日期</Label>
                    <Input className="mt-1 h-9 text-sm bg-background" type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">结束日期</Label>
                    <Input className="mt-1 h-9 text-sm bg-background" type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
                  </div>
                </div>
              )}

              <Separator className="bg-border/50" />

              {/* Inventory */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">发行总量</Label>
                  <Input className="mt-1 h-9 text-sm bg-background" type="number" value={totalQuota} onChange={(e) => setTotalQuota(e.target.value)} placeholder="不限" />
                </div>
                <div>
                  <Label className="text-xs">单人限领上限</Label>
                  <Input className="mt-1 h-9 text-sm bg-background" type="number" value={perUserLimit} onChange={(e) => setPerUserLimit(e.target.value)} placeholder="1" />
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border">
          <Button className="w-full" onClick={() => upsertMutation.mutate()} disabled={!name || !value || upsertMutation.isPending}>
            {upsertMutation.isPending ? "提交中..." : editing ? "保存修改" : "创建券模板"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
