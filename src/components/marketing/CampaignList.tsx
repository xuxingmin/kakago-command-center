import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CampaignForm } from "./CampaignForm";
import { Plus, Play, Pause } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

const segmentLabels: Record<string, string> = {
  new: "新用户", active: "活跃老客", sleeping: "沉睡用户", lost: "流失用户", all: "全部",
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "草稿", variant: "secondary" },
  active: { label: "进行中", variant: "default" },
  paused: { label: "已暂停", variant: "outline" },
  completed: { label: "已结束", variant: "secondary" },
};

export function CampaignList() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);

  const { data: campaigns = [] } = useQuery({
    queryKey: ["marketing_campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_campaigns")
        .select("*, coupons(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === "active" ? "paused" : "active";
      const { error } = await supabase.from("marketing_campaigns").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_campaigns"] });
      toast({ title: "状态已更新" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          创建活动
        </Button>
      </div>

      {formOpen && <CampaignForm open={formOpen} onOpenChange={setFormOpen} />}

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>活动名称</TableHead>
              <TableHead>目标人群</TableHead>
              <TableHead>关联券种</TableHead>
              <TableHead>发放/目标</TableHead>
              <TableHead>核销</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((c: any) => {
              const sc = statusConfig[c.status] ?? statusConfig.draft;
              return (
                <TableRow key={c.id} className="border-border">
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{segmentLabels[c.target_segment] ?? c.target_segment}</TableCell>
                  <TableCell>{c.coupons?.name ?? "-"}</TableCell>
                  <TableCell className="numeric">{c.sent_count}/{c.target_count}</TableCell>
                  <TableCell className="numeric">{c.used_count}</TableCell>
                  <TableCell>
                    <Badge variant={sc.variant} className="text-xs">{sc.label}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.start_at ? format(new Date(c.start_at), "MM/dd HH:mm") : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => toggleMutation.mutate({ id: c.id, status: c.status })}
                    >
                      {c.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {campaigns.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">暂无营销活动</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
