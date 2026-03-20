import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Send, Loader2, UserPlus } from "lucide-react";

interface AccountRow {
  id: string;
  user_id: string;
  role: string;
  store_id: string | null;
  created_at: string;
  phone: string | null;
  store_name: string | null;
}

const ROLE_MAP: Record<string, string> = {
  merchant: "店主",
  staff: "店员",
};

export function AccountManagement() {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [smsSending, setSmsSending] = useState(false);

  // Form state
  const [phone, setPhone] = useState("");
  const [storeId, setStoreId] = useState("");
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchAccounts();
    fetchStores();
  }, []);

  const fetchAccounts = async () => {
    try {
      // Get user_roles with merchant/staff roles, join profiles for phone
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("id, user_id, role, store_id, created_at")
        .in("role", ["merchant", "staff"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for phone numbers
      const userIds = [...new Set((roles || []).map((r) => r.user_id))];
      let profilesMap: Record<string, string | null> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, phone")
          .in("user_id", userIds);
        (profiles || []).forEach((p) => {
          profilesMap[p.user_id] = p.phone;
        });
      }

      // Fetch store names
      const storeIds = [...new Set((roles || []).filter((r) => r.store_id).map((r) => r.store_id!))];
      let storeMap: Record<string, string> = {};
      if (storeIds.length > 0) {
        const { data: storeData } = await supabase
          .from("stores")
          .select("id, name")
          .in("id", storeIds);
        (storeData || []).forEach((s) => {
          storeMap[s.id] = s.name;
        });
      }

      const mapped: AccountRow[] = (roles || []).map((r) => ({
        id: r.id,
        user_id: r.user_id,
        role: r.role,
        store_id: r.store_id,
        created_at: r.created_at,
        phone: profilesMap[r.user_id] || null,
        store_name: r.store_id ? storeMap[r.store_id] || "未知门店" : null,
      }));

      setAccounts(mapped);
    } catch (err) {
      console.error("Error fetching accounts:", err);
      toast({ title: "加载失败", description: "无法获取账号列表", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    const { data } = await supabase.from("stores").select("id, name").order("name");
    setStores(data || []);
  };

  const validatePhone = (value: string) => /^1\d{10}$/.test(value);

  const handleCreate = async () => {
    if (!validatePhone(phone)) {
      toast({ title: "格式错误", description: "请输入有效的11位手机号", variant: "destructive" });
      return;
    }
    if (!storeId) {
      toast({ title: "请选择门店", description: "店主账号必须关联门店", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      // Create auth user via edge function which also sends SMS
      const response = await supabase.functions.invoke("create-store-owner", {
        body: { phone, store_id: storeId },
      });

      if (response.error) throw response.error;

      const result = response.data;
      if (!result?.success) {
        throw new Error(result?.error || "创建失败");
      }

      toast({
        title: "✅ 店主账号创建成功",
        description: `已向 ${phone} 发送密码设置短信`,
      });

      setDialogOpen(false);
      setPhone("");
      setStoreId("");
      fetchAccounts();
    } catch (err: any) {
      console.error("Error creating account:", err);
      toast({
        title: "创建失败",
        description: err.message || "无法创建店主账号",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">账号管理</h2>
        <Button
          size="sm"
          onClick={() => setDialogOpen(true)}
          className="gap-2"
        >
          <UserPlus className="w-4 h-4" />
          新建店主账号
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground w-[200px]">账号名（手机号）</TableHead>
                <TableHead className="text-muted-foreground w-[120px]">角色</TableHead>
                <TableHead className="text-muted-foreground w-[200px]">关联门店</TableHead>
                <TableHead className="text-muted-foreground w-[180px]">创建时间</TableHead>
                <TableHead className="text-muted-foreground w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    暂无账号数据
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => (
                  <TableRow key={account.id} className="border-border">
                    <TableCell className="font-mono text-foreground">
                      {account.phone || "未绑定手机"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={account.role === "merchant" ? "default" : "secondary"}
                        className={
                          account.role === "merchant"
                            ? "bg-primary/20 text-primary border-primary/30"
                            : "bg-secondary text-secondary-foreground"
                        }
                      >
                        {ROLE_MAP[account.role] || account.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground">
                      {account.store_name || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(account.created_at).toLocaleDateString("zh-CN")}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                        详情
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">创建店主账号</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label className="text-foreground">手机号（账号名）</Label>
              <Input
                placeholder="请输入11位手机号"
                value={phone}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 11);
                  setPhone(v);
                }}
                className="bg-muted border-border font-mono tracking-wider"
                maxLength={11}
              />
              {phone && !validatePhone(phone) && (
                <p className="text-xs text-destructive">请输入有效的11位手机号</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">角色</Label>
              <div className="flex h-10 items-center rounded-md border border-border bg-muted px-3">
                <Badge className="bg-primary/20 text-primary border-primary/30">店主</Badge>
                <span className="ml-2 text-xs text-muted-foreground">仅允许创建店主账号</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">关联门店</Label>
              <Select value={storeId} onValueChange={setStoreId}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="选择关联门店" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md bg-muted/50 border border-border p-3">
              <div className="flex items-start gap-2">
                <Send className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  账号创建成功后，系统将自动向该手机号发送一条<span className="text-foreground font-medium">密码设置短信</span>，
                  店主可通过短信链接完成首次密码设置。
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border">
              取消
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !validatePhone(phone) || !storeId}
              className="gap-2"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              创建并发送短信
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
