import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, CheckCircle, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Settlement {
  id: string;
  store_id: string;
  store_name: string;
  period_start: string;
  period_end: string;
  order_count: number;
  order_total: number;
  coupon_count: number;
  coupon_cost: number;
  platform_fee: number;
  settlement_amount: number;
  status: "pending" | "confirmed" | "paid" | "completed";
}

interface SettlementTableProps {
  settlements: Settlement[];
  onViewDetail: (settlement: Settlement) => void;
  onConfirm: (settlement: Settlement) => void;
  onPay: (settlement: Settlement) => void;
  loading?: boolean;
}

export function SettlementTable({
  settlements,
  onViewDetail,
  onConfirm,
  onPay,
  loading,
}: SettlementTableProps) {
  const formatCurrency = (value: number) => {
    return `¥${value.toLocaleString()}`;
  };

  const getStatusBadge = (status: Settlement["status"]) => {
    const config = {
      pending: { label: "待结算", variant: "outline" as const, className: "border-yellow-500 text-yellow-500" },
      confirmed: { label: "已确认", variant: "outline" as const, className: "border-blue-500 text-blue-500" },
      paid: { label: "已支付", variant: "outline" as const, className: "border-green-500 text-green-500" },
      completed: { label: "已完成", variant: "secondary" as const, className: "bg-muted text-muted-foreground" },
    };
    const { label, variant, className } = config[status];
    return <Badge variant={variant} className={className}>{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        加载中...
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-muted-foreground">门店名称</TableHead>
            <TableHead className="text-muted-foreground">结算周期</TableHead>
            <TableHead className="text-muted-foreground text-right">订单数</TableHead>
            <TableHead className="text-muted-foreground text-right">订单总额</TableHead>
            <TableHead className="text-muted-foreground text-right">券核销</TableHead>
            <TableHead className="text-muted-foreground text-right">券成本</TableHead>
            <TableHead className="text-muted-foreground text-right">平台费</TableHead>
            <TableHead className="text-muted-foreground text-right">应结金额</TableHead>
            <TableHead className="text-muted-foreground">状态</TableHead>
            <TableHead className="text-muted-foreground">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {settlements.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                暂无结算数据
              </TableCell>
            </TableRow>
          ) : (
            settlements.map((settlement) => (
              <TableRow key={settlement.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">{settlement.store_name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {settlement.period_start} ~ {settlement.period_end}
                </TableCell>
                <TableCell className="text-right">{settlement.order_count}</TableCell>
                <TableCell className="text-right text-green-500">
                  {formatCurrency(settlement.order_total)}
                </TableCell>
                <TableCell className="text-right">{settlement.coupon_count}</TableCell>
                <TableCell className="text-right text-orange-500">
                  {formatCurrency(settlement.coupon_cost)}
                </TableCell>
                <TableCell className="text-right text-purple-500">
                  {formatCurrency(settlement.platform_fee)}
                </TableCell>
                <TableCell className="text-right font-bold text-primary">
                  {formatCurrency(settlement.settlement_amount)}
                </TableCell>
                <TableCell>{getStatusBadge(settlement.status)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onViewDetail(settlement)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {settlement.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-500"
                        onClick={() => onConfirm(settlement)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {settlement.status === "confirmed" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-500"
                        onClick={() => onPay(settlement)}
                      >
                        <CreditCard className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
