import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Ticket, Megaphone, ChevronDown, Search } from "lucide-react";
import { format } from "date-fns";

const typeLabels: Record<string, string> = { fixed: "满减", discount: "折扣", freebie: "赠品" };
const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "待使用", variant: "default" },
  used: { label: "已核销", variant: "secondary" },
  expired: { label: "已过期", variant: "destructive" },
};

export function MarketingAnalytics() {
  const [phone, setPhone] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [logOpen, setLogOpen] = useState(false);

  // Macro KPIs
  const { data: coupons = [] } = useQuery({
    queryKey: ["coupons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["marketing_campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_campaigns")
        .select("*, coupons(name, value, type)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: userCoupons = [] } = useQuery({
    queryKey: ["user_coupons_stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_coupons").select("id, status, coupon_id");
      if (error) throw error;
      return data;
    },
  });

  // Orders for revenue calc
  const { data: orders = [] } = useQuery({
    queryKey: ["orders_for_marketing"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("id, coupon_id, coupon_discount, total_amount, status");
      if (error) throw error;
      return data;
    },
  });

  // Phone search logs
  const { data: phoneLogs = [] } = useQuery({
    queryKey: ["distribution_logs_phone", searchPhone],
    queryFn: async () => {
      if (!searchPhone) return [];
      // Search profiles by phone, then get user_coupons
      const { data: profiles } = await supabase.from("profiles").select("user_id").eq("phone", searchPhone);
      if (!profiles || profiles.length === 0) return [];
      const userIds = profiles.map(p => p.user_id);
      const { data, error } = await supabase
        .from("user_coupons")
        .select("*, coupons(name), stores:store_id(name)")
        .in("user_id", userIds)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!searchPhone,
  });

  const activeCampaigns = campaigns.filter((c: any) => c.status === "active").length;

  // Campaign analysis data
  const campaignAnalysis = campaigns.map((c: any) => {
    const sent = c.sent_count ?? 0;
    const used = c.used_count ?? 0;
    // "领" = sent for simplicity (issued to users)
    const claimed = sent;
    const couponValue = c.coupons?.value ?? 0;
    const couponCost = couponValue * used;
    // Revenue from orders using this campaign's coupon
    const relatedOrders = orders.filter((o: any) => o.coupon_id === c.coupon_id && o.status === "completed");
    const revenue = relatedOrders.reduce((sum: number, o: any) => sum + Number(o.total_amount), 0);
    const roi = couponCost > 0 ? (revenue - couponCost) / couponCost : 0;
    const redemptionRate = claimed > 0 ? (used / claimed) * 100 : 0;

    return {
      id: c.id,
      name: c.name,
      couponName: c.coupons?.name ?? "-",
      sent,
      claimed,
      used,
      revenue,
      couponCost,
      roi,
      redemptionRate,
    };
  });

  // Coupon template analysis
  const couponAnalysis = coupons.map((c: any) => {
    const issued = userCoupons.filter(uc => uc.coupon_id === c.id);
    const totalIssued = issued.length;
    const usedCount = issued.filter(uc => uc.status === "used").length;
    const redemptionRate = totalIssued > 0 ? (usedCount / totalIssued) * 100 : 0;
    const remaining = (c.total_quota ?? 0) - totalIssued;

    return {
      id: c.id,
      name: c.name,
      type: typeLabels[c.type] ?? c.type,
      totalIssued,
      usedCount,
      redemptionRate,
      remaining: remaining > 0 ? remaining : 0,
    };
  });

  const handlePhoneSearch = () => {
    setSearchPhone(phone.trim());
    if (phone.trim()) setLogOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Macro KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
            <Ticket className="w-3.5 h-3.5" />
            <span>券种总数</span>
          </div>
          <div className="numeric text-2xl font-semibold text-foreground">
            {coupons.length}
            <span className="text-xs text-muted-foreground ml-1">种</span>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
            <Megaphone className="w-3.5 h-3.5" />
            <span>活跃营销活动</span>
          </div>
          <div className="numeric text-2xl font-semibold text-foreground">
            {activeCampaigns}
            <span className="text-xs text-muted-foreground ml-1">场</span>
          </div>
        </div>
      </div>

      {/* Core analysis tabs */}
      <Tabs defaultValue="campaigns" className="flex-1 flex flex-col">
        <TabsList className="bg-muted w-fit">
          <TabsTrigger value="campaigns">按活动分析</TabsTrigger>
          <TabsTrigger value="coupons">按券模板分析</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-3">
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>活动名称</TableHead>
                  <TableHead>关联券</TableHead>
                  <TableHead>发放</TableHead>
                  <TableHead>领取</TableHead>
                  <TableHead>核销</TableHead>
                  <TableHead>核销率</TableHead>
                  <TableHead>带动营收</TableHead>
                  <TableHead>ROI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignAnalysis.map((c) => {
                  const lowRedemption = c.redemptionRate < 10;
                  const negativeRoi = c.roi < 0;
                  return (
                    <TableRow key={c.id} className="border-border">
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.couponName}</TableCell>
                      <TableCell className="numeric">{c.sent}</TableCell>
                      <TableCell className="numeric">{c.claimed}</TableCell>
                      <TableCell className="numeric">{c.used}</TableCell>
                      <TableCell className={`numeric ${lowRedemption ? "text-destructive font-medium" : ""}`}>
                        {c.redemptionRate.toFixed(1)}%
                        {lowRedemption && <span className="text-[10px] ml-1">⚠</span>}
                      </TableCell>
                      <TableCell className="numeric">¥{c.revenue.toFixed(0)}</TableCell>
                      <TableCell className={`numeric font-medium ${negativeRoi ? "text-destructive" : c.roi > 0 ? "text-emerald-500" : ""}`}>
                        {c.roi > 0 ? "+" : ""}{(c.roi * 100).toFixed(0)}%
                        {negativeRoi && <span className="text-[10px] ml-1">⚠</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {campaignAnalysis.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">暂无活动数据</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            ROI = (带动营收 − 券成本) ÷ 券成本 × 100%
          </p>
        </TabsContent>

        <TabsContent value="coupons" className="mt-3">
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>券名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>累计发放</TableHead>
                  <TableHead>已核销</TableHead>
                  <TableHead>核销率</TableHead>
                  <TableHead>剩余库存</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {couponAnalysis.map((c) => {
                  const lowRedemption = c.redemptionRate < 10 && c.totalIssued > 0;
                  return (
                    <TableRow key={c.id} className="border-border">
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.type}</TableCell>
                      <TableCell className="numeric">{c.totalIssued}</TableCell>
                      <TableCell className="numeric">{c.usedCount}</TableCell>
                      <TableCell className={`numeric ${lowRedemption ? "text-destructive font-medium" : ""}`}>
                        {c.redemptionRate.toFixed(1)}%
                        {lowRedemption && <span className="text-[10px] ml-1">⚠</span>}
                      </TableCell>
                      <TableCell className="numeric">{c.remaining}</TableCell>
                    </TableRow>
                  );
                })}
                {couponAnalysis.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">暂无券模板数据</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Collapsed user lookup */}
      <Collapsible open={logOpen} onOpenChange={setLogOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full py-2 border-t border-border">
          <ChevronDown className={`w-4 h-4 transition-transform ${logOpen ? "rotate-180" : ""}`} />
          <span>用户券记录反查</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="输入手机号查询"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePhoneSearch()}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <button
              onClick={handlePhoneSearch}
              className="h-8 px-3 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              查询
            </button>
          </div>

          {searchPhone && (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>领取时间</TableHead>
                    <TableHead>券名称</TableHead>
                    <TableHead>门店</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>核销时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {phoneLogs.map((log: any) => {
                    const sc = statusLabels[log.status] ?? statusLabels.active;
                    return (
                      <TableRow key={log.id} className="border-border">
                        <TableCell className="text-xs numeric">
                          {log.received_at ? format(new Date(log.received_at), "MM/dd HH:mm") : "-"}
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
                  {phoneLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">未找到该手机号的券记录</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
