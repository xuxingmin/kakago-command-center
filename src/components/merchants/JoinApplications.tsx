import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, Send, Eye, RefreshCw, Store } from "lucide-react";

type AppStatus = "pending_contact" | "invited" | "submitted" | "completed";

interface JoinApplication {
  id: string;
  phone: string;
  status: AppStatus;
  user_id: string | null;
  store_id: string | null;
  store_name: string | null;
  store_address: string | null;
  store_location_lat: number | null;
  store_location_lng: number | null;
  store_front_photo: string | null;
  store_interior_photo: string | null;
  business_intro: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_MAP: Record<AppStatus, { label: string; color: string }> = {
  pending_contact: { label: "待处理", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  invited: { label: "已邀请", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  submitted: { label: "待审核", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  completed: { label: "已转正", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
};

interface JoinApplicationsProps {
  onNavigateToStore?: (storeId: string) => void;
}

export function JoinApplications({ onNavigateToStore }: JoinApplicationsProps) {
  const [applications, setApplications] = useState<JoinApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reviewApp, setReviewApp] = useState<JoinApplication | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const DEMO_APPLICATIONS: JoinApplication[] = [
    {
      id: "demo-1", phone: "13912345678", status: "pending_contact", user_id: null, store_id: null,
      store_name: null, store_address: null, store_location_lat: null, store_location_lng: null,
      store_front_photo: null, store_interior_photo: null, business_intro: null, review_notes: null,
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(), updated_at: new Date().toISOString(),
    },
    {
      id: "demo-2", phone: "13887654321", status: "pending_contact", user_id: null, store_id: null,
      store_name: null, store_address: null, store_location_lat: null, store_location_lng: null,
      store_front_photo: null, store_interior_photo: null, business_intro: null, review_notes: null,
      created_at: new Date(Date.now() - 5 * 3600000).toISOString(), updated_at: new Date().toISOString(),
    },
    {
      id: "demo-3", phone: "15011223344", status: "invited", user_id: "demo-user-3", store_id: null,
      store_name: null, store_address: null, store_location_lat: null, store_location_lng: null,
      store_front_photo: null, store_interior_photo: null, business_intro: null, review_notes: null,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(), updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "demo-4", phone: "18699887766", status: "submitted", user_id: "demo-user-4", store_id: null,
      store_name: "朝阳公园店", store_address: "北京市朝阳区朝阳公园南路8号",
      store_location_lat: 39.9342, store_location_lng: 116.4737,
      store_front_photo: "store_front_chaoyang.jpg", store_interior_photo: "store_interior_chaoyang.jpg",
      business_intro: "位于朝阳公园南门，周边写字楼密集，工作日客流量大。已有3年咖啡行业从业经验，擅长精品手冲。",
      review_notes: null,
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(), updated_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    },
    {
      id: "demo-5", phone: "13766554433", status: "submitted", user_id: "demo-user-5", store_id: null,
      store_name: "望京SOHO店", store_address: "北京市朝阳区望京SOHO T1 一层",
      store_location_lat: 39.9985, store_location_lng: 116.4827,
      store_front_photo: "store_front_wangjing.jpg", store_interior_photo: "store_interior_wangjing.jpg",
      business_intro: "望京核心商圈，紧邻地铁15号线望京站。店面60㎡，已完成装修。",
      review_notes: null,
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(), updated_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    },
    {
      id: "demo-6", phone: "13500112233", status: "completed", user_id: "demo-user-6", store_id: "demo-store-6",
      store_name: "国贸CBD店", store_address: "北京市朝阳区建外大街1号",
      store_location_lat: 39.9087, store_location_lng: 116.4605,
      store_front_photo: "store_front_guomao.jpg", store_interior_photo: "store_interior_guomao.jpg",
      business_intro: "国贸商圈旗舰店，已正式运营。",
      review_notes: "资料齐全，审核通过。",
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(), updated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
  ];

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("join_applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const mapped = (data as unknown as JoinApplication[]) || [];
      setApplications(mapped.length > 0 ? mapped : DEMO_APPLICATIONS);
    } catch (err) {
      console.error(err);
      setApplications(DEMO_APPLICATIONS);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async (app: JoinApplication) => {
    setActionLoading(app.id);
    try {
      // Create a merchant user_role with null store_id
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: crypto.randomUUID(), role: "merchant" as const, store_id: null })
        .select()
        .single();

      if (roleError) throw roleError;

      // Update application status
      const { error: updateError } = await supabase
        .from("join_applications")
        .update({ status: "invited", user_id: roleData.user_id, updated_at: new Date().toISOString() } as Record<string, unknown>)
        .eq("id", app.id);

      if (updateError) throw updateError;

      // Simulate SMS
      console.log(`[SMS] 向 ${app.phone} 发送密码设置链接`);

      toast({ title: "邀请已发送", description: `已向 ${app.phone} 发送密码设置短信` });
      setApplications((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, status: "invited" as AppStatus, user_id: roleData.user_id } : a))
      );
    } catch (err) {
      console.error(err);
      toast({ title: "发送失败", description: "无法发送邀请", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (app: JoinApplication) => {
    setActionLoading(app.id);
    try {
      // 1. Create store
      const { data: storeData, error: storeError } = await supabase
        .from("stores")
        .insert({
          name: app.store_name || "新门店",
          address: app.store_address || "",
          latitude: app.store_location_lat || 0,
          longitude: app.store_location_lng || 0,
          store_description: app.business_intro || "",
          status: "active" as const,
        })
        .select()
        .single();

      if (storeError) throw storeError;

      // 2. Update user_role store_id
      if (app.user_id) {
        await supabase
          .from("user_roles")
          .update({ store_id: storeData.id })
          .eq("user_id", app.user_id);
      }

      // 3. Update application
      const { error: updateError } = await supabase
        .from("join_applications")
        .update({
          status: "completed",
          store_id: storeData.id,
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>)
        .eq("id", app.id);

      if (updateError) throw updateError;

      toast({ title: "审核通过", description: `门店「${storeData.name}」已创建` });
      setApplications((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, status: "completed" as AppStatus, store_id: storeData.id } : a))
      );
      setReviewApp(null);
    } catch (err) {
      console.error(err);
      toast({ title: "审核失败", description: "无法完成审核", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const renderActions = (app: JoinApplication) => {
    const isLoading = actionLoading === app.id;

    switch (app.status) {
      case "pending_contact":
        return (
          <Button size="sm" variant="outline" onClick={() => handleSendInvite(app)} disabled={isLoading}
            className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10">
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
            发送邀请
          </Button>
        );
      case "invited":
        return (
          <Button size="sm" variant="outline" onClick={() => handleSendInvite(app)} disabled={isLoading}
            className="border-muted text-muted-foreground hover:bg-muted/20">
            <RefreshCw className="w-3 h-3 mr-1" />
            重发邀请
          </Button>
        );
      case "submitted":
        return (
          <Button size="sm" variant="outline" onClick={() => setReviewApp(app)}
            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
            <Eye className="w-3 h-3 mr-1" />
            审核资料
          </Button>
        );
      case "completed":
        return (
          <Button size="sm" variant="outline"
            onClick={() => app.store_id && onNavigateToStore?.(app.store_id)}
            className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10">
            <Store className="w-3 h-3 mr-1" />
            查看门店
          </Button>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-muted-foreground font-medium">申请手机号</TableHead>
              <TableHead className="text-muted-foreground font-medium">申请时间</TableHead>
              <TableHead className="text-muted-foreground font-medium">当前进度</TableHead>
              <TableHead className="text-muted-foreground font-medium text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                  暂无加盟申请
                </TableCell>
              </TableRow>
            ) : (
              applications.map((app) => {
                const statusInfo = STATUS_MAP[app.status];
                return (
                  <TableRow key={app.id} className="border-border/30">
                    <TableCell className="font-mono text-foreground tracking-wider">{app.phone}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(app.created_at).toLocaleDateString("zh-CN", {
                        year: "numeric", month: "2-digit", day: "2-digit",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusInfo.color}>
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{renderActions(app)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Review Sheet */}
      <Sheet open={!!reviewApp} onOpenChange={(open) => !open && setReviewApp(null)}>
        <SheetContent className="sm:max-w-lg bg-background border-border">
          <SheetHeader>
            <SheetTitle className="text-foreground">审核加盟资料</SheetTitle>
          </SheetHeader>
          {reviewApp && (
            <div className="mt-6 space-y-5">
              <InfoRow label="申请手机号" value={reviewApp.phone} />
              <InfoRow label="门店名称" value={reviewApp.store_name || "—"} />
              <InfoRow label="门店地址" value={reviewApp.store_address || "—"} />
              <InfoRow label="经营介绍" value={reviewApp.business_intro || "—"} multiline />

              {reviewApp.store_front_photo && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">门头照</p>
                  <div className="w-full h-40 bg-muted/30 rounded-md flex items-center justify-center text-muted-foreground text-sm border border-border/50">
                    {reviewApp.store_front_photo}
                  </div>
                </div>
              )}
              {reviewApp.store_interior_photo && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">店内照片</p>
                  <div className="w-full h-40 bg-muted/30 rounded-md flex items-center justify-center text-muted-foreground text-sm border border-border/50">
                    {reviewApp.store_interior_photo}
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setReviewApp(null)}>
                  暂不处理
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleApprove(reviewApp)}
                  disabled={actionLoading === reviewApp.id}
                >
                  {actionLoading === reviewApp.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : null}
                  通过审核 · 一键开店
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function InfoRow({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-sm text-foreground ${multiline ? "whitespace-pre-wrap" : ""}`}>{value}</p>
    </div>
  );
}
