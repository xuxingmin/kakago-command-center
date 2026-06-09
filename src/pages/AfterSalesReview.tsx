import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ImageOff } from "lucide-react";

type Reason =
  | "外卖泼洒/漏饮"
  | "外包装破损/污染"
  | "商品错漏/做错"
  | "其他异常情况";

type Status = "待审核" | "已补发" | "已退款" | "已驳回";

interface Ticket {
  id: string;
  applyTime: string;
  orderNo: string;
  store: string;
  user: string;
  reason: Reason;
  claimItems: string;
  proof: string;
  status: Status;
  liability?: "logistics" | "platform" | "store";
  action?: "reissue" | "refund" | "reject";
}

const initial: Ticket[] = [
  {
    id: "AS-001",
    applyTime: "2026-06-08 15:30:00",
    orderNo: "HF001-260215-0005",
    store: "中关村店（KKG-0012）",
    user: "张先生 (138****8888)",
    reason: "商品错漏/做错",
    claimItems: "澳白 ×1",
    proof: "[凭证]吸管未拆、杯贴写卡布奇诺、杯内液体为黑咖啡.jpg",
    status: "待审核",
  },
];

const reasonColor: Record<Reason, string> = {
  "外卖泼洒/漏饮": "bg-blue-500/20 text-blue-300 border-blue-500/40",
  "外包装破损/污染": "bg-orange-500/20 text-orange-300 border-orange-500/40",
  "商品错漏/做错": "bg-purple-500/20 text-purple-300 border-purple-500/40",
  "其他异常情况": "bg-gray-500/20 text-gray-300 border-gray-500/40",
};

const statusColor: Record<Status, string> = {
  待审核: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  已补发: "bg-green-500/20 text-green-300 border-green-500/40",
  已退款: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  已驳回: "bg-red-500/20 text-red-300 border-red-500/40",
};

export default function AfterSalesReview() {
  const [tickets, setTickets] = useState<Ticket[]>(initial);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [action, setAction] = useState<"reissue" | "refund" | "reject">("reissue");
  const [liability, setLiability] = useState<"logistics" | "platform" | "store" | "">("");

  const openHandle = (t: Ticket) => {
    setActiveTicket(t);
    setAction("reissue");
    setLiability("");
  };

  const submit = () => {
    if (!liability) {
      toast({ title: "请先勾选定责类型", variant: "destructive" });
      return;
    }
    if (!activeTicket) return;
    const newStatus: Status =
      action === "reissue" ? "已补发" : action === "refund" ? "已退款" : "已驳回";
    setTickets((arr) =>
      arr.map((t) =>
        t.id === activeTicket.id
          ? { ...t, status: newStatus, liability, action }
          : t
      )
    );
    if (liability === "store") {
      toast({
        title: "已向商家下发扣款通知",
        description: "48 小时申诉倒计时已触发，申诉单同步至【商家客诉申诉处理】。",
      });
    } else {
      toast({ title: "处理完成", description: `状态已更新为：${newStatus}` });
    }
    setActiveTicket(null);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-[#121212] border-[#222] p-4">
        <div className="text-sm text-muted-foreground mb-3">
          初审看板 · 待处理客诉单实时同步
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-[#222]">
              <TableHead>申请时间</TableHead>
              <TableHead>原订单号</TableHead>
              <TableHead>所属加盟门店</TableHead>
              <TableHead>用户信息</TableHead>
              <TableHead>客诉原因</TableHead>
              <TableHead>理赔餐品</TableHead>
              <TableHead>强制凭证</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((t) => (
              <TableRow key={t.id} className="border-[#222]">
                <TableCell className="tabular-nums">{t.applyTime}</TableCell>
                <TableCell className="tabular-nums">{t.orderNo}</TableCell>
                <TableCell>{t.store}</TableCell>
                <TableCell>{t.user}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={reasonColor[t.reason]}>
                    {t.reason}
                  </Badge>
                </TableCell>
                <TableCell>{t.claimItems}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-10 h-10 rounded bg-[#1e1e1e] border border-[#333] flex items-center justify-center">
                      <ImageOff className="w-4 h-4" />
                    </div>
                    <span className="truncate max-w-[180px]" title={t.proof}>
                      {t.proof}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColor[t.status]}>
                    {t.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {t.status === "待审核" ? (
                    <Button size="sm" onClick={() => openHandle(t)}>
                      处理
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">已处理</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!activeTicket} onOpenChange={(o) => !o && setActiveTicket(null)}>
        <DialogContent className="max-w-xl bg-[#121212] border-[#222]">
          <DialogHeader>
            <DialogTitle>客诉处理 · {activeTicket?.orderNo}</DialogTitle>
            <DialogDescription>
              请先选择处理动作，再完成财务对账定责（三选一）。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div>
              <Label className="text-sm mb-2 block">处理动作</Label>
              <RadioGroup value={action} onValueChange={(v) => setAction(v as any)} className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="reissue" id="a-reissue" />
                  <Label htmlFor="a-reissue">同意并原单补发</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="refund" id="a-refund" />
                  <Label htmlFor="a-refund">退款处理</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="reject" id="a-reject" />
                  <Label htmlFor="a-reject">拒绝驳回</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-sm mb-2 block">
                财务对账定责 <span className="text-red-400">*必选</span>
              </Label>
              <RadioGroup value={liability} onValueChange={(v) => setLiability(v as any)} className="space-y-2">
                <div className="flex items-start gap-2 p-3 rounded border border-[#222] hover:border-primary/40">
                  <RadioGroupItem value="logistics" id="l-1" className="mt-1" />
                  <Label htmlFor="l-1" className="font-normal">
                    <div className="font-medium">物流责任</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      系统自动向跑腿平台索赔餐损。商家“制作费用”正常发放，结算账单不予扣款。
                    </div>
                  </Label>
                </div>
                <div className="flex items-start gap-2 p-3 rounded border border-[#222] hover:border-primary/40">
                  <RadioGroupItem value="platform" id="l-2" className="mt-1" />
                  <Label htmlFor="l-2" className="font-normal">
                    <div className="font-medium">平台兜底</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      计入总部营销损耗，商家“制作费用”正常发放。
                    </div>
                  </Label>
                </div>
                <div className="flex items-start gap-2 p-3 rounded border border-[#222] hover:border-primary/40">
                  <RadioGroupItem value="store" id="l-3" className="mt-1" />
                  <Label htmlFor="l-3" className="font-normal">
                    <div className="font-medium">门店责任</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      物料成本与二次配送费由门店承担。不计入补发单的出餐制作费用，向商家端下发扣款通知并触发 48 小时申诉倒计时。
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveTicket(null)}>
              取消
            </Button>
            <Button onClick={submit}>提交处理</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
