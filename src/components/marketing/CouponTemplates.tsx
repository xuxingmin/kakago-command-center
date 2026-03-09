import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MarketingKPIRow } from "./MarketingKPIRow";
import { Plus, Pencil, Power } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { CouponDrawer } from "./CouponDrawer";
import type { Tables } from "@/integrations/supabase/types";

type Coupon = Tables<"coupons">;

const typeLabels: Record<string, string> = { fixed: "满减", discount: "折扣", freebie: "赠品" };

export function CouponTemplates() {
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);

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
    setDrawerOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setDrawerOpen(true);
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
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" />
          新建券模板
        </Button>
      </div>

      <CouponDrawer open={drawerOpen} onOpenChange={setDrawerOpen} editing={editing} />

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
