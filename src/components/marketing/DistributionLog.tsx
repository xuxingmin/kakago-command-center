import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "待使用", variant: "default" },
  used: { label: "已核销", variant: "secondary" },
  expired: { label: "已过期", variant: "destructive" },
};

export function DistributionLog() {
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: logs = [] } = useQuery({
    queryKey: ["distribution_logs", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("user_coupons")
        .select("*, coupons(name), stores:store_id(name)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as "active" | "used" | "expired");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="active">待使用</SelectItem>
            <SelectItem value="used">已核销</SelectItem>
            <SelectItem value="expired">已过期</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>时间</TableHead>
              <TableHead>用户ID</TableHead>
              <TableHead>券名称</TableHead>
              <TableHead>门店</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>核销时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log: any) => {
              const sc = statusLabels[log.status] ?? statusLabels.active;
              return (
                <TableRow key={log.id} className="border-border">
                  <TableCell className="text-xs numeric">
                    {log.received_at ? format(new Date(log.received_at), "MM/dd HH:mm") : "-"}
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    {log.user_id ? `${log.user_id.slice(0, 8)}...` : "-"}
                  </TableCell>
                  <TableCell>{log.coupons?.name ?? "-"}</TableCell>
                  <TableCell>{log.stores?.name ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={sc.variant} className="text-xs">{sc.label}</Badge>
                  </TableCell>
                  <TableCell className="text-xs numeric">
                    {log.used_at ? format(new Date(log.used_at), "MM/dd HH:mm") : "-"}
                  </TableCell>
                </TableRow>
              );
            })}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">暂无投放记录</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
