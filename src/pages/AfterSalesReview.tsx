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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  ImageOff,
  Copy,
  ShoppingCart,
  Clock,
  Package,
  Bike,
  Flag,
} from "lucide-react";

type Reason =
  | "外卖泼洒/漏饮"
  | "外包装破损/污染"
  | "商品错漏/做错"
  | "其他异常情况";

type Status = "待审核" | "已补发" | "已退款" | "已驳回";

type ActionKind = "reissue" | "refund" | "reject";

type ReissueLiability = "logistics" | "platform" | "store";
type RefundLiability =
  | "store_refund"
  | "logistics_refund"
  | "platform_refund"
  | "shared_refund";

interface Ticket {
  id: string;
  applyTime: string;
  orderNo: string;
  store: string;
  userName: string;
  userPhone: string;
  reason: Reason;
  claimItems: string;
  proof: string;
  status: Status;
  liabilityLabel?: string;
}

const initial: Ticket[] = [
  {
    id: "AS-001",
    applyTime: "2026-06-08 15:30:00",
    orderNo: "HF001-260215-0005",
    store: "中关村店（KKG-0012）",
    userName: "张先生",
    userPhone: "13812345678",
    reason: "商品错漏/做错",
    claimItems: "澳白 ×1",
    proof: "吸管未拆、杯贴写卡布奇诺、杯内液体明显为黑咖啡.jpg",
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

const reissueOptions: {
  value: ReissueLiability;
  title: string;
  desc: string;
}[] = [
  {
    value: "logistics",
    title: "物流责任",
    desc: "打上物流责任标签。期末结算日给商家的“5元制作费”照常发放，不予扣款；总部向跑腿平台发起对应餐损索赔。",
  },
  {
    value: "platform",
    title: "平台兜底",
    desc: "打上总部营销损耗标签。给商家的“5元制作费”正常发放，由总部大盘承担此次补发损耗。",
  },
  {
    value: "store",
    title: "门店责任",
    desc: "打上门店责任标签。该补发单不计入商家的出餐制作费用，系统向商家端同步下发扣款通知，并触发 48 小时申诉倒计时。",
  },
];

const refundOptions: { value: RefundLiability; title: string; desc: string }[] = [
  {
    value: "store_refund",
    title: "门店责任退款",
    desc: "因门店做错全额退款。收付通账期惩罚记账：期末结算账单中反向扣回该门店原定的 5元制作费；同时扣除对应的供应链物料供价（成本+0.3元，打上"原物料报废赔偿金"标签记账给供应链公司，不计入进项采购）；并扣除该单总部的真实配送费。若此单已过收付通账期，系统自动调用收付通【分账回退 API】或从其其他在途正常订单资金中优先逆向划扣。",
  },
  {
    value: "logistics_refund",
    title: "物流责任退款",
    desc: "外部物流导致泼洒退款。门店无责，商家的 5元制作费 与供应链的（成本+0.3元）正常记账保留；该单总成本与配送费转化为总部对跑腿平台的应收索赔账。",
  },
  {
    value: "platform_refund",
    title: "平台兜底退款",
    desc: "客情维护或系统故障退款。商家得 5元，供应链得（成本+0.3元），全部成本与运费由总部自由账户全额记账承担，计入总部营销损耗。",
  },
  {
    value: "shared_refund",
    title: "骑手与门店共同责任退款",
    desc: "双方各打五十大板。总部向物流发起 50% 索赔；期末账单中扣除门店 50% 的制作费、物料费与运费。",
  },
];

// Lifecycle drawer mock data for the demo order
const lifecycleMock = {
  address: "北京市海淀区中关村大街 27 号 1801 室",
  distance: "1.8km",
  items: [
    { name: "澳白", spec: "中杯 / 热", qty: 1, price: 28 },
    { name: "燕麦拿铁", spec: "大杯 / 冰 / 少冰", qty: 1, price: 32 },
  ],
  timeline: [
    { icon: ShoppingCart, label: "用户下单", time: "2026-06-08 15:00:10", color: "text-blue-300" },
    { icon: Clock, label: "接单制作", time: "2026-06-08 15:01:15", color: "text-yellow-300", note: "商家工作台点按/系统自动接单" },
    { icon: Package, label: "制作完成", time: "2026-06-08 15:08:30", color: "text-purple-300", note: "商家在小票一体机上扫码通知骑手，状态变更为待取餐" },
    { icon: Bike, label: "到店取货", time: "2026-06-08 15:15:22", color: "text-cyan-300", note: "骑手到店通过平台确认回传，状态变更为配送中" },
    { icon: Flag, label: "配送完成", time: "2026-06-08 15:28:45", color: "text-green-300" },
  ],
  finance: {
    userPaid: 0,
    isMarketingPrepaid: true,
    merchantFee: 5,
    supplyShare: "5.6元（物料 5.3 + 配送服务费 0.3）",
    hqRetain: "0元（全额营销垫资）",
    realDelivery: 5.5,
  },
};

export default function AfterSalesReview() {
  const [tickets, setTickets] = useState<Ticket[]>(initial);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [action, setAction] = useState<ActionKind>("reissue");
  const [reissueLib, setReissueLib] = useState<ReissueLiability | "">("");
  const [refundLib, setRefundLib] = useState<RefundLiability | "">("");
  const [drawerOrder, setDrawerOrder] = useState<string | null>(null);

  const openHandle = (t: Ticket) => {
    setActiveTicket(t);
    setAction("reissue");
    setReissueLib("");
    setRefundLib("");
  };

  const copyPhone = (phone: string) => {
    navigator.clipboard?.writeText(phone);
    toast({ title: "已复制", description: phone });
  };

  const submit = () => {
    if (!activeTicket) return;
    let label = "";
    let newStatus: Status = "已驳回";
    if (action === "reissue") {
      if (!reissueLib) {
        toast({ title: "请先勾选定责类型", variant: "destructive" });
        return;
      }
      newStatus = "已补发";
      label = reissueOptions.find((o) => o.value === reissueLib)!.title;
    } else if (action === "refund") {
      if (!refundLib) {
        toast({ title: "请先勾选追偿定责类型", variant: "destructive" });
        return;
      }
      newStatus = "已退款";
      label = refundOptions.find((o) => o.value === refundLib)!.title;
    } else {
      newStatus = "已驳回";
      label = "拒绝驳回 - 无账单变更";
    }

    setTickets((arr) =>
      arr.map((t) =>
        t.id === activeTicket.id
          ? { ...t, status: newStatus, liabilityLabel: label }
          : t
      )
    );

    if (
      (action === "reissue" && reissueLib === "store") ||
      (action === "refund" && (refundLib === "store_refund" || refundLib === "shared_refund"))
    ) {
      toast({
        title: "已向商家下发扣款通知",
        description:
          "48 小时申诉倒计时已触发，申诉单同步至【商家客诉申诉处理】。",
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
                <TableCell>
                  <button
                    onClick={() => setDrawerOrder(t.orderNo)}
                    className="tabular-nums text-purple-400 underline underline-offset-2 hover:text-purple-300"
                  >
                    {t.orderNo}
                  </button>
                </TableCell>
                <TableCell>{t.store}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>
                      {t.userName}（
                      <span className="tabular-nums">{t.userPhone}</span>）
                    </span>
                    <button
                      onClick={() => copyPhone(t.userPhone)}
                      className="text-muted-foreground hover:text-foreground"
                      title="复制手机号"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </TableCell>
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
                  <div className="flex flex-col gap-1">
                    <Badge variant="outline" className={statusColor[t.status]}>
                      {t.status}
                    </Badge>
                    {t.liabilityLabel && (
                      <span className="text-[10px] text-muted-foreground">
                        {t.liabilityLabel}
                      </span>
                    )}
                  </div>
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

      {/* Handle dialog */}
      <Dialog
        open={!!activeTicket}
        onOpenChange={(o) => !o && setActiveTicket(null)}
      >
        <DialogContent className="max-w-2xl bg-[#121212] border-[#222] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>客诉处理 · {activeTicket?.orderNo}</DialogTitle>
            <DialogDescription>
              请先选择处理动作，再完成对应分支的财务记账定责。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div>
              <Label className="text-sm mb-2 block">处理动作</Label>
              <RadioGroup
                value={action}
                onValueChange={(v) => {
                  setAction(v as ActionKind);
                  setReissueLib("");
                  setRefundLib("");
                }}
                className="flex gap-4 flex-wrap"
              >
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

            {/* Branch A: Reissue */}
            {action === "reissue" && (
              <div>
                <Label className="text-sm mb-2 block">
                  财务对账定责{" "}
                  <span className="text-red-400">*三选一必选</span>
                </Label>
                <RadioGroup
                  value={reissueLib}
                  onValueChange={(v) => setReissueLib(v as ReissueLiability)}
                  className="space-y-2"
                >
                  {reissueOptions.map((o) => (
                    <div
                      key={o.value}
                      className="flex items-start gap-2 p-3 rounded border border-[#222] hover:border-primary/40"
                    >
                      <RadioGroupItem
                        value={o.value}
                        id={`re-${o.value}`}
                        className="mt-1"
                      />
                      <Label
                        htmlFor={`re-${o.value}`}
                        className="font-normal flex-1 cursor-pointer"
                      >
                        <div className="font-medium">{o.title}</div>
                        <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {o.desc}
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Branch B: Refund */}
            {action === "refund" && (
              <div>
                <Label className="text-sm mb-2 block">
                  财务反向追偿记账{" "}
                  <span className="text-red-400">*四选一必选</span>
                </Label>
                <RadioGroup
                  value={refundLib}
                  onValueChange={(v) => setRefundLib(v as RefundLiability)}
                  className="space-y-2"
                >
                  {refundOptions.map((o) => (
                    <div
                      key={o.value}
                      className="flex items-start gap-2 p-3 rounded border border-[#222] hover:border-primary/40"
                    >
                      <RadioGroupItem
                        value={o.value}
                        id={`rf-${o.value}`}
                        className="mt-1"
                      />
                      <Label
                        htmlFor={`rf-${o.value}`}
                        className="font-normal flex-1 cursor-pointer"
                      >
                        <div className="font-medium">{o.title}</div>
                        <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {o.desc}
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Branch C: Reject */}
            {action === "reject" && (
              <div className="p-3 rounded border border-[#222] bg-[#0d0d0d] text-xs text-muted-foreground leading-relaxed">
                已拒绝用户的售后申请。记账逻辑：维持原单正常结算，无账单变更，无需定责。
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveTicket(null)}>
              取消
            </Button>
            <Button onClick={submit}>提交处理</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lifecycle drawer */}
      <Sheet
        open={!!drawerOrder}
        onOpenChange={(o) => !o && setDrawerOrder(null)}
      >
        <SheetContent
          side="right"
          className="bg-[#121212] border-[#222] w-full sm:max-w-xl overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>原单全生命周期 · {drawerOrder}</SheetTitle>
            <SheetDescription>
              基本信息 / 物流出餐节点时间线 / 原单记账底盘
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Basic */}
            <section>
              <div className="text-xs text-muted-foreground mb-2">基本信息</div>
              <div className="rounded border border-[#222] p-3 text-sm space-y-1">
                <div>
                  收货地址：
                  <span className="text-foreground">{lifecycleMock.address}</span>
                </div>
                <div>
                  配送距离：
                  <span className="text-foreground tabular-nums">
                    {lifecycleMock.distance}
                  </span>
                </div>
              </div>
              <div className="mt-3 rounded border border-[#222]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#222]">
                      <TableHead>商品</TableHead>
                      <TableHead>规格</TableHead>
                      <TableHead className="text-right">数量</TableHead>
                      <TableHead className="text-right">单价</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lifecycleMock.items.map((i) => (
                      <TableRow key={i.name} className="border-[#222]">
                        <TableCell>{i.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {i.spec}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {i.qty}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          ¥{i.price.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>

            {/* Timeline */}
            <section>
              <div className="text-xs text-muted-foreground mb-2">
                物流与出餐节点
              </div>
              <ol className="relative border-l border-[#333] ml-3 space-y-4">
                {lifecycleMock.timeline.map((n, i) => {
                  const Icon = n.icon;
                  return (
                    <li key={i} className="ml-4">
                      <span
                        className={`absolute -left-[11px] flex items-center justify-center w-5 h-5 rounded-full bg-[#1a1a1a] border border-[#333] ${n.color}`}
                      >
                        <Icon className="w-3 h-3" />
                      </span>
                      <div className="text-sm">{n.label}</div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        {n.time}
                      </div>
                      {n.note && (
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {n.note}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>

            {/* Finance */}
            <section>
              <div className="text-xs text-muted-foreground mb-2">
                原单记账底盘
              </div>
              <div className="rounded border border-[#222] p-3 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">消费者实付</span>
                  <span className="tabular-nums">
                    ¥{lifecycleMock.finance.userPaid.toFixed(2)}
                  </span>
                </div>
                {lifecycleMock.finance.isMarketingPrepaid && (
                  <div className="text-[11px] text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 rounded px-2 py-1">
                    总部全额营销垫资单
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">商家制作费</span>
                  <span className="tabular-nums">
                    ¥{lifecycleMock.finance.merchantFee.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">供应链账期分成</span>
                  <span className="tabular-nums">
                    {lifecycleMock.finance.supplyShare}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">总部留存</span>
                  <span className="tabular-nums">
                    {lifecycleMock.finance.hqRetain}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    实付跑腿平台配送费
                  </span>
                  <span className="tabular-nums">
                    ¥{lifecycleMock.finance.realDelivery.toFixed(2)}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
