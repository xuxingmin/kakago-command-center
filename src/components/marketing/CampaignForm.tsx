import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const segmentLabels: Record<string, string> = {
  new: "新用户", active: "活跃老客", sleeping: "沉睡用户", lost: "流失用户", all: "全部用户",
};

interface CampaignFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: any;
}

export function CampaignForm({ open, onOpenChange, editing }: CampaignFormProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    coupon_id: editing?.coupon_id ?? "",
    target_segment: editing?.target_segment ?? "all",
    target_count: String(editing?.target_count ?? "0"),
    start_at: editing?.start_at?.slice(0, 16) ?? "",
    end_at: editing?.end_at?.slice(0, 16) ?? "",
  });

  const { data: coupons = [] } = useQuery({
    queryKey: ["coupons"],
    queryFn: async () => {
      const { data } = await supabase.from("coupons").select("id, name").eq("status", "active");
      return data ?? [];
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        coupon_id: form.coupon_id || null,
        target_segment: form.target_segment,
        target_count: Number(form.target_count),
        start_at: form.start_at ? new Date(form.start_at).toISOString() : null,
        end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
      };
      if (editing) {
        const { error } = await supabase.from("marketing_campaigns").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("marketing_campaigns").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_campaigns"] });
      onOpenChange(false);
      toast({ title: editing ? "活动已更新" : "活动已创建" });
    },
    onError: (e) => toast({ title: "操作失败", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>{editing ? "编辑活动" : "创建活动"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>活动名称</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>关联券种</Label>
            <Select value={form.coupon_id} onValueChange={(v) => setForm({ ...form, coupon_id: v })}>
              <SelectTrigger><SelectValue placeholder="选择券种" /></SelectTrigger>
              <SelectContent>
                {coupons.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>目标人群</Label>
            <Select value={form.target_segment} onValueChange={(v) => setForm({ ...form, target_segment: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(segmentLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>目标人数</Label>
            <Input type="number" value={form.target_count} onChange={(e) => setForm({ ...form, target_count: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>开始时间</Label>
              <Input type="datetime-local" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} />
            </div>
            <div>
              <Label>结束时间</Label>
              <Input type="datetime-local" value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} />
            </div>
          </div>
          <Button className="w-full" onClick={() => mutation.mutate()} disabled={!form.name}>
            {editing ? "保存" : "创建"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
