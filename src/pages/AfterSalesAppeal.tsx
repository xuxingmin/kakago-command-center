import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Verdict = "pending" | "upheld" | "overturned";

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
  verdictLabel?: string;
}

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
    verdict: "overturned",
    verdictLabel: "已改判 - 物流责任结案",
  },
];

export default function AfterSalesAppeal() {
  const [list, setList] = useState<Appeal[]>(initial);

  const decide = (id: string, kind: "uphold" | "overturn") => {
    setList((arr) =>
      arr.map((a) =>
        a.id === id
          ? {
              ...a,
              verdict: kind === "uphold" ? "upheld" : "overturned",
              verdictLabel:
                kind === "uphold"
                  ? "维持原判 - 门店责任结案"
                  : "已改判 - 物流责任/平台兜底结案",
            }
          : a
      )
    );
    toast({
      title: kind === "uphold" ? "已维持原判" : "已改判",
      description:
        kind === "uphold"
          ? "扣款已在期末账单生效，单据归档。"
          : "已释放制作费用，账单中物料费与二次配送费划扣记录已抹除。",
    });
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
                  {settled ? (
                    <Badge
                      variant="outline"
                      className={
                        a.verdict === "overturned"
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                          : "bg-red-500/20 text-red-300 border-red-500/40"
                      }
                    >
                      {a.verdictLabel}
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
                  {/* User side */}
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

                  {/* Merchant side */}
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
                    onClick={() => decide(a.id, "uphold")}
                  >
                    维持原判 - 确认扣款
                  </Button>
                  <Button
                    size="sm"
                    disabled={settled}
                    onClick={() => decide(a.id, "overturn")}
                  >
                    改判为物流责任 / 平台兜底
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
