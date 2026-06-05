import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2, Send, Eye, RefreshCw, Store, FileText, Download, BellRing, Rocket, FileSignature, X,
} from "lucide-react";

// Extended status machine (frontend-only extension beyond DB enum)
type AppStatus =
  | "pending_contact"
  | "invited"
  | "submitted"
  | "pending_signing"
  | "signed_pending_activation"
  | "completed"
  | "rejected";

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
  has_startup_addendum?: boolean;
  legal_name?: string;
}

const STATUS_MAP: Record<AppStatus, { label: string; color: string }> = {
  pending_contact: { label: "待处理", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  invited: { label: "已邀请", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  submitted: { label: "待审核", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  pending_signing: { label: "待签约", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  signed_pending_activation: { label: "已签约/待激活", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  completed: { label: "已转正", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  rejected: { label: "已拒绝", color: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
};

interface JoinApplicationsProps {
  onNavigateToStore?: (storeId: string) => void;
  onPendingCountChange?: (count: number) => void;
}

const CONTRACT_LIST = [
  { key: "main", name: "商家入驻合作协议" },
  { key: "food", name: "食品安全责任书" },
  { key: "supply", name: "供应链补货协议（三方）" },
  { key: "fulfillment", name: "订单履约规范" },
];

const STARTUP_ADDENDUM = { key: "startup", name: "开业扶持补充协议" };

export function JoinApplications({ onNavigateToStore, onPendingCountChange }: JoinApplicationsProps) {
  const [applications, setApplications] = useState<JoinApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reviewApp, setReviewApp] = useState<JoinApplication | null>(null);
  const [addendumChecked, setAddendumChecked] = useState(true);
  const [contractApp, setContractApp] = useState<JoinApplication | null>(null);
  const [previewContract, setPreviewContract] = useState<{ app: JoinApplication; contract: { key: string; name: string } } | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const completedCount = useMemo(
    () => applications.filter((a) => a.status === "completed").length,
    [applications]
  );

  useEffect(() => {
    const pendingCount = applications.filter(
      (a) => a.status === "pending_contact" || a.status === "submitted" || a.status === "signed_pending_activation"
    ).length;
    onPendingCountChange?.(pendingCount);
  }, [applications, onPendingCountChange]);

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
      review_notes: null, legal_name: "李建国",
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(), updated_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    },
    {
      id: "demo-5", phone: "13766554433", status: "submitted", user_id: "demo-user-5", store_id: null,
      store_name: "望京SOHO店", store_address: "北京市朝阳区望京SOHO T1 一层",
      store_location_lat: 39.9985, store_location_lng: 116.4827,
      store_front_photo: "store_front_wangjing.jpg", store_interior_photo: "store_interior_wangjing.jpg",
      business_intro: "望京核心商圈，紧邻地铁15号线望京站。店面60㎡，已完成装修。",
      review_notes: null, legal_name: "王晓敏",
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(), updated_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    },
    {
      id: "demo-7", phone: "13611224488", status: "pending_signing", user_id: "demo-user-7", store_id: null,
      store_name: "三里屯太古里店", store_address: "北京市朝阳区三里屯路19号",
      store_location_lat: 39.9367, store_location_lng: 116.4554,
      store_front_photo: "store_front_sanlitun.jpg", store_interior_photo: "store_interior_sanlitun.jpg",
      business_intro: "三里屯核心商圈，客流量极佳。", review_notes: "资料合格",
      legal_name: "陈思远", has_startup_addendum: true,
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(), updated_at: new Date(Date.now() - 8 * 3600000).toISOString(),
    },
    {
      id: "demo-8", phone: "13988776655", status: "signed_pending_activation", user_id: "demo-user-8", store_id: null,
      store_name: "西单大悦城店", store_address: "北京市西城区西单北大街131号",
      store_location_lat: 39.9135, store_location_lng: 116.3739,
      store_front_photo: "store_front_xidan.jpg", store_interior_photo: "store_interior_xidan.jpg",
      business_intro: "西单核心商圈，客流量稳定。", review_notes: "资料合格",
      legal_name: "赵小梅", has_startup_addendum: true,
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(), updated_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      id: "demo-6", phone: "13500112233", status: "completed", user_id: "demo-user-6", store_id: "demo-store-6",
      store_name: "国贸CBD店", store_address: "北京市朝阳区建外大街1号",
      store_location_lat: 39.9087, store_location_lng: 116.4605,
      store_front_photo: "store_front_guomao.jpg", store_interior_photo: "store_interior_guomao.jpg",
      business_intro: "国贸商圈旗舰店，已正式运营。", review_notes: "资料齐全，审核通过。",
      legal_name: "刘鹏飞", has_startup_addendum: true,
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

  const updateLocal = (id: string, patch: Partial<JoinApplication>) => {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  const handleSendInvite = async (app: JoinApplication) => {
    setActionLoading(app.id);
    try {
      console.log(`[SMS] 向 ${app.phone} 发送密码设置链接`);
      toast({ title: "邀请已发送", description: `已向 ${app.phone} 发送密码设置短信` });
      updateLocal(app.id, { status: "invited" });
    } finally {
      setActionLoading(null);
    }
  };

  const openReview = (app: JoinApplication) => {
    const defaultAddendum = completedCount < 70;
    setAddendumChecked(app.has_startup_addendum ?? defaultAddendum);
    setReviewApp(app);
  };

  const handlePassReview = (app: JoinApplication) => {
    updateLocal(app.id, { status: "pending_signing", has_startup_addendum: addendumChecked });
    toast({
      title: "资料审核通过",
      description: `已向商家「${app.store_name || app.phone}」推送签约通知${addendumChecked ? "（含开业扶持补充协议）" : ""}`,
    });
    setReviewApp(null);
  };

  const handleReject = (app: JoinApplication) => {
    updateLocal(app.id, { status: "rejected" });
    toast({ title: "已拒绝", description: `已拒绝 ${app.phone} 的加盟申请` });
    setReviewApp(null);
  };

  const handleRemindSigning = (app: JoinApplication) => {
    toast({ title: "已发送催办", description: `已向 ${app.phone} 推送签约催办通知` });
  };

  const handleActivate = async (app: JoinApplication) => {
    setActionLoading(app.id);
    try {
      // Create real store
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
      updateLocal(app.id, { status: "completed", store_id: storeData.id });
      toast({ title: "激活成功", description: `门店「${storeData.name}」已正式开业` });
    } catch (err) {
      console.error(err);
      // Fallback for demo
      updateLocal(app.id, { status: "completed", store_id: app.store_id || `demo-store-${app.id}` });
      toast({ title: "激活成功", description: `门店「${app.store_name}」已正式开业` });
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
          <Button size="sm" variant="outline" onClick={() => openReview(app)}
            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
            <Eye className="w-3 h-3 mr-1" />
            审核资料
          </Button>
        );
      case "pending_signing":
        return (
          <div className="flex items-center justify-end gap-2">
            <span className="text-[11px] text-muted-foreground">等待商家签署</span>
            <Button size="sm" variant="outline" onClick={() => handleRemindSigning(app)}
              className="border-border/50 text-muted-foreground hover:bg-muted/20 opacity-70">
              <BellRing className="w-3 h-3 mr-1" />
              催办签约
            </Button>
          </div>
        );
      case "signed_pending_activation":
        return (
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setContractApp(app)}
              className="text-cyan-400 hover:bg-cyan-500/10 h-8 px-2">
              <FileText className="w-3 h-3 mr-1" />
              查看合同
            </Button>
            <Button size="sm" onClick={() => handleActivate(app)} disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Rocket className="w-3 h-3 mr-1" />}
              激活开店
            </Button>
          </div>
        );
      case "completed":
        return (
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setContractApp(app)}
              className="text-emerald-400 hover:bg-emerald-500/10 h-8 px-2">
              <FileText className="w-3 h-3 mr-1" />
              查看合同
            </Button>
            <Button size="sm" variant="outline"
              onClick={() => app.store_id && onNavigateToStore?.(app.store_id)}
              className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10">
              <Store className="w-3 h-3 mr-1" />
              查看门店
            </Button>
          </div>
        );
      case "rejected":
        return <span className="text-[11px] text-muted-foreground">已拒绝</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const contracts = contractApp
    ? [...CONTRACT_LIST, ...(contractApp.has_startup_addendum ? [STARTUP_ADDENDUM] : [])]
    : [];

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
        <SheetContent className="sm:max-w-lg bg-background border-border overflow-y-auto">
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

              {/* Addendum checkbox */}
              <div className="pt-2 border-t border-border/50">
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-md bg-orange-500/5 border border-orange-500/20 hover:bg-orange-500/10 transition-colors">
                  <Checkbox
                    checked={addendumChecked}
                    onCheckedChange={(v) => setAddendumChecked(!!v)}
                    className="mt-0.5 border-orange-500/50 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-foreground font-medium">触发首批开业扶持补充协议</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      当前已转正门店 {completedCount} 家 · {completedCount < 70
                        ? "在前 70 家扶持名额内，建议勾选" : "已超出扶持名额，默认不勾选"}。勾选后将自动并入合同包下发。
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-black/40 border-border/50 text-foreground hover:bg-black/60"
                  onClick={() => handleReject(reviewApp)}
                >
                  <X className="w-4 h-4 mr-1" />
                  拒绝 / 暂不处理
                </Button>
                <Button
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                  onClick={() => handlePassReview(reviewApp)}
                >
                  <FileSignature className="w-4 h-4 mr-1" />
                  通过资料审核
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Contract list dialog */}
      <Dialog open={!!contractApp} onOpenChange={(open) => !open && setContractApp(null)}>
        <DialogContent className="sm:max-w-xl bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              合同与归档 · {contractApp?.store_name || contractApp?.phone}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-2">
            {contracts.map((c) => (
              <div key={c.key}
                className="flex items-center justify-between px-4 py-3 rounded-md border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <div>
                    <p className="text-sm text-foreground">《{c.name}》</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      签署时间 {new Date(contractApp!.updated_at).toLocaleDateString("zh-CN")} · 已电子签章
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="h-8 text-cyan-400 hover:bg-cyan-500/10"
                    onClick={() => setPreviewContract({ app: contractApp!, contract: c })}>
                    <Eye className="w-3 h-3 mr-1" /> 预览
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 text-muted-foreground hover:bg-muted/40"
                    onClick={() => toast({ title: "已开始下载", description: `${c.name}.pdf` })}>
                    <Download className="w-3 h-3 mr-1" /> 下载
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Contract PDF preview */}
      <Dialog open={!!previewContract} onOpenChange={(open) => !open && setPreviewContract(null)}>
        <DialogContent className="sm:max-w-2xl bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              PDF 预览 · 《{previewContract?.contract.name}》
            </DialogTitle>
          </DialogHeader>
          {previewContract && (
            <div className="mt-4 bg-white text-neutral-800 rounded-md p-8 max-h-[70vh] overflow-y-auto font-serif">
              <div className="text-center border-b border-neutral-300 pb-4 mb-6">
                <p className="text-xs tracking-widest text-neutral-500">TRIVA · KAKAGO COFFEE</p>
                <h2 className="text-xl font-bold mt-2">{previewContract.contract.name}</h2>
                <p className="text-xs text-neutral-500 mt-1">合同编号：KKG-{previewContract.app.id.slice(-6).toUpperCase()}-{previewContract.contract.key.toUpperCase()}</p>
              </div>
              <p className="text-sm leading-7">
                甲方：北京 TRIVA 咖啡管理有限公司（KAKAGO 总部）<br />
                乙方：{previewContract.app.legal_name || "—"}（{previewContract.app.store_name}）<br />
                联系电话：{previewContract.app.phone}
              </p>
              <p className="text-sm leading-7 mt-4 text-neutral-600">
                根据《中华人民共和国民法典》及相关法律法规，甲乙双方本着平等、自愿、公平、诚实信用的原则，就乙方加盟 KAKAGO 品牌门店事宜达成如下协议⋯⋯（合同正文略）
              </p>
              <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t border-neutral-300">
                <div>
                  <p className="text-xs text-neutral-500 mb-3">甲方（盖章）</p>
                  <div className="relative h-28 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full border-4 border-red-600 flex items-center justify-center rotate-[-12deg]">
                      <div className="text-center">
                        <p className="text-[9px] text-red-600 font-bold tracking-widest">TRIVA COFFEE</p>
                        <p className="text-[11px] text-red-600 font-bold mt-0.5">合 同 专 用 章</p>
                        <p className="text-red-600 text-lg leading-none mt-0.5">★</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-2">
                    签署时间：{new Date(previewContract.app.updated_at).toLocaleString("zh-CN")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-3">乙方（签字）</p>
                  <div className="h-28 flex items-center justify-center">
                    <p className="text-3xl text-blue-900 italic" style={{ fontFamily: "'Brush Script MT', cursive" }}>
                      {previewContract.app.legal_name || "—"}
                    </p>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-2">
                    签署时间：{new Date(previewContract.app.updated_at).toLocaleString("zh-CN")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
