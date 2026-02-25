import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MarketingKPIRow } from "./MarketingKPIRow";
import { Plus, Pencil, Power } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Coupon = Tables<"coupons">;

const typeLabels: Record<string, string> = { fixed: "满减", discount: "折扣", freebie: "赠品" };

export function CouponTemplates() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState({ name: "", type: "fixed" as string, value: "", min_order: "", valid_days: "7", total_quota: "" });

  const { data: coupons = [] } = useQuery({
    queryKey: ["coupons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Coupon[];
    },
  });

  const { data: userCoupons = [] } = useQuery({
    queryKey: ["user_coupons_stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_coupons").select("id, status");
      if (error) throw error;
      return data;
    },
  });

  const totalIssued = userCoupons.length;
  const usedCount = userCoupons.filter((c) => c.status === "used").length;
  const redemptionRate = totalIssued > 0 ? Math.round((usedCount / totalIssued) * 100) : 0;

  const upsertMutation = useMutation({
    mutationFn: async (payload: Partial<Coupon>) => {
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
      setDialogOpen(false);
      setEditing(null);
      toast({ title: editing ? "券模板已更新" : "券模板已创建" });
    },
    onError: (e) => toast({ title: "操作失败", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === "active" ? "inactive" : "active";
      const { error } = await supabase.from("coupons").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["coupons"] }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", type: "fixed", value: "", min_order: "", valid_days: "7", total_quota: "" });
    setDialogOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      name: c.name,
      type: c.type,
      value: String(c.value),
      min_order: String(c.min_order ?? ""),
      valid_days: String(c.valid_days ?? 7),
      total_quota: String(c.total_quota ?? ""),
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    upsertMutation.mutate({
      name: form.name,
      type: form.type as any,
      value: Number(form.value),
      min_order: form.min_order ? Number(form.min_order) : 0,
      valid_days: Number(form.valid_days),
      total_quota: form.total_quota ? Number(form.total_quota) : null,
    });
  };

  return (
    <div className="space-y-4">
      <MarketingKPIRow
        data={{
          totalCoupons: coupons.length,
          activeCoupons: coupons.filter((c) => c.status === "active").length,
          totalIssued,
          redemptionRate,
        }}
      />

      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1" />
              新建券模板
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>{editing ? "编辑券模板" : "新建券模板"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>券名称</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>类型</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">满减</SelectItem>
                    <SelectItem value="discount">折扣</SelectItem>
                    <SelectItem value="freebie">赠品</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>面额/折扣值</Label>
                  <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
                </div>
                <div>
                  <Label>最低消费</Label>
                  <Input type="number" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>有效天数</Label>
                  <Input type="number" value={form.valid_days} onChange={(e) => setForm({ ...form, valid_days: e.target.value })} />
                </div>
                <div>
                  <Label>总限额</Label>
                  <Input type="number" value={form.total_quota} onChange={(e) => setForm({ ...form, total_quota: e.target.value })} placeholder="不限" />
                </div>
              </div>
              <Button className="w-full" onClick={handleSubmit} disabled={!form.name || !form.value}>
                {editing ? "保存" : "创建"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>券名称</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>面额</TableHead>
              <TableHead>门槛</TableHead>
              <TableHead>有效期</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((c) => (
              <TableRow key={c.id} className="border-border">
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{typeLabels[c.type] ?? c.type}</TableCell>
                <TableCell className="numeric">
                  {c.type === "discount" ? `${c.value}折` : `¥${c.value}`}
                </TableCell>
                <TableCell className="numeric">¥{c.min_order ?? 0}</TableCell>
                <TableCell className="numeric">{c.valid_days}天</TableCell>
                <TableCell>
                  <Badge variant={c.status === "active" ? "default" : "secondary"} className="text-xs">
                    {c.status === "active" ? "活跃" : "停用"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleMutation.mutate({ id: c.id, status: c.status ?? "active" })}>
                    <Power className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {coupons.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">暂无券模板</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
