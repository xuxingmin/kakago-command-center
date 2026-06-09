import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type Verdict = "pending" | "upheld" | "overturned_logistics" | "overturned_platform";

interface Appeal {
  id: string;
  orderNo: string;
  store: string;
  userReason: string;
  userClaim: string;
  userProof: string;
  merchantReason: string;
  merchantProof: string;
  verdict: Verdict;
}

const verdictMeta: Record<
  Exclude<Verdict, "pending">,
  { label: string; className: string }
> = {
  upheld: {
    label: "已维持原判 - 门店责任结案",
    className: "bg-red-500/20 text-red-300 border-red-500/40",
  },
  overturned_logistics: {
    label: "已改判 - 物流责任结案",
    className: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  },
  overturned_platform: {
    label: "已改判 - 平台兜底结案",
    className: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  },
};

const initial: Appeal[] = [
  {
    id: "AP-001",
    orderNo: "HF001-260215-0001",
    store: "中关村店（KKG-0012）",
    userReason: "外卖泼洒/漏饮",
    userClaim: "全套饮品 ×2",
    userProof: "全泼洒照片.jpg",
    merchantReason:
      "出餐时打包袋已用密封贴完全封死，有出餐监控为证。此单全泼洒纯属骑手配送过程中剧烈颠簸、开箱倒翻导致，不应归为门店责任。",
    merchantProof: "吧台监控下打包完好的监控截图.jpg",
    verdict: "pending",
  },
  {
    id: "AP-002",
    orderNo: "HF001-260211-0023",
    store: "合肥蜀山测试店",
    userReason: "外包装破损/污染",
    userClaim: "拿铁 ×1",
    userProof: "外卖箱内饮品倾洒.jpg",
    merchantReason:
      "出餐前杯口已二次封膜，监控显示骑手取餐后倒置放置外卖箱，造成密封失效。",
    merchantProof: "出餐封膜与骑手装箱监控.jpg",
    verdict: "overturned_logistics",
  },
];

export default function AfterSalesAppeal() {
  const [list, setList] = useState<Appeal[]>(initial);
  const [overturnTarget, setOverturnTarget] = useState<Appeal | null>(null);
  const [overturnKind, setOverturnKind] = useState<
    "overturned_logistics" | "overturned_platform" | ""
  >("");

  const uphold = (id: string) => {
    setList((arr) =>
      arr.map((a) => (a.id === id ? { ...a, verdict: "upheld" } : a))
    );
    toast({
      title: "已维持原判",
      description: "扣款已在期末账单生效，单据归档。",
    });
  };

  const confirmOverturn = () => {
    if (!overturnTarget || !overturnKind) {
      toast({ title: "请选择改判财务分流", variant: "destructive" });
      return;
    }
    setList((arr) =>
      arr.map((a) =>
        a.id === overturnTarget.id ? { ...a, verdict: overturnKind } : a
      )
    );
    toast({
      title: "已改判",
      description:
        overturnKind === "overturned_logistics"
          ? "已重新释放 5元制作费与物料费，整笔费用变更为「外部跑腿平台应收索赔账目」，由总部于期末向跑腿公司开票索赔。"
          : "已重新释放 5元制作费与物料费，损失变更为「总部大盘营销/客情损耗」，由总部利润对账承担。",
    });
    setOverturnTarget(null);
    setOverturnKind("");
  };

  return (
    <div className="space-y-4">
      <Card className="bg-[#121212] border-[#222] p-4">
        <div className="text-sm text-muted-foreground mb-3">
          双向对账看板 · 加盟商 48 小时申诉复核
        </div>

        <div className="space-y-4">
          {list.map((a) => {
            const settled = a.verdict !== "pending";
            const meta = settled
              ? verdictMeta[a.verdict as Exclude<Verdict, "pending">]
              : null;
            return (
              <div
                key={a.id}
                className="border border-[#222] rounded-lg overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-2 bg-[#0d0d0d] border-b border-[#222]">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium tabular-nums">
                      {a.orderNo}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {a.store}
                    </span>
                  </div>
                  {meta ? (
                    <Badge variant="outline" className={meta.className}>
                      {meta.label}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40"
                    >
                      待二审裁决
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 divide-x divide-[#222]">
                  <div className="p-4 space-y-3">
                    <div className="text-xs font-semibold text-blue-300">
                      用户客诉（左）
                    </div>
                    <div className="text-xs text-muted-foreground">客诉原因</div>
                    <div className="text-sm">{a.userReason}</div>
                    <div className="text-xs text-muted-foreground">理赔数量</div>
                    <div className="text-sm">{a.userClaim}</div>
                    <div className="text-xs text-muted-foreground">强制凭证</div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-12 h-12 rounded bg-[#1e1e1e] border border-[#333] flex items-center justify-center">
                        <ImageOff className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="text-muted-foreground">{a.userProof}</span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="text-xs font-semibold text-purple-300">
                      商家申诉（右）
                    </div>
                    <div className="text-xs text-muted-foreground">申诉理由</div>
                    <div className="text-sm leading-relaxed">
                      {a.merchantReason}
                    </div>
                    <div className="text-xs text-muted-foreground">反证照片</div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-12 h-12 rounded bg-[#1e1e1e] border border-[#333] flex items-center justify-center">
                        <ImageOff className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="text-muted-foreground">
                        {a.merchantProof}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 px-4 py-3 bg-[#0d0d0d] border-t border-[#222]">
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={settled}
                    onClick={() => uphold(a.id)}
                  >
                    维持原判 - 确认扣款
                  </Button>
                  <Button
                    size="sm"
                    disabled={settled}
                    onClick={() => {
                      setOverturnTarget(a);
                      setOverturnKind("");
                    }}
                  >
                    同意商家申诉并改判
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Dialog
        open={!!overturnTarget}
        onOpenChange={(o) => !o && setOverturnTarget(null)}
      >
        <DialogContent className="max-w-lg bg-[#121212] border-[#222]">
          <DialogHeader>
            <DialogTitle>
              改判财务分流 · {overturnTarget?.orderNo}
            </DialogTitle>
            <DialogDescription>
              请精确选择费用归类，用于期末对账跑批（二选一必选）。
            </DialogDescription>
          </DialogHeader>

          <RadioGroup
            value={overturnKind}
            onValueChange={(v) => setOverturnKind(v as any)}
            className="space-y-2"
          >
            <div className="flex items-start gap-2 p-3 rounded border border-[#222] hover:border-primary/40">
              <RadioGroupItem
                value="overturned_logistics"
                id="ov-1"
                className="mt-1"
              />
              <Label htmlFor="ov-1" className="font-normal flex-1 cursor-pointer">
                <div className="font-medium">改判为物流责任结案</div>
                <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  撤销对该加盟店的扣款处罚。系统在期末结算单中重新释放并计发商家该单的 5元制作费与物料费，抹除门店账中的划扣罚款记录；同时将该整笔费用标签变更为「外部跑腿平台应收索赔账目」，由总部于期末向跑腿公司开票索赔。
                </div>
              </Label>
            </div>
            <div className="flex items-start gap-2 p-3 rounded border border-[#222] hover:border-primary/40">
              <RadioGroupItem
                value="overturned_platform"
                id="ov-2"
                className="mt-1"
              />
              <Label htmlFor="ov-2" className="font-normal flex-1 cursor-pointer">
                <div className="font-medium">改判为平台兜底结案</div>
                <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  撤销对该加盟店的扣款处罚。重新释放并计发商家该单的 5元制作费；系统自动将这整笔损失标签变更为「总部大盘营销/客情损耗」，由总部利润对账承担。
                </div>
              </Label>
            </div>
          </RadioGroup>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOverturnTarget(null)}>
              取消
            </Button>
            <Button onClick={confirmOverturn}>确认改判</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
