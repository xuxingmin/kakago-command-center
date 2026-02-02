import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReceivablePayableProps {
  data: {
    receivable: number;
    payable: number;
    receivableItems: { name: string; amount: number }[];
    payableItems: { name: string; amount: number }[];
  };
}

export function ReceivablePayable({ data }: ReceivablePayableProps) {
  const netAmount = data.receivable - data.payable;

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 10000) {
      return `¥${(value / 10000).toFixed(2)}万`;
    }
    return `¥${value.toLocaleString()}`;
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground">应收/应付</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-green-500/10">
            <div className="flex items-center justify-center gap-1 text-green-500">
              <ArrowUpRight className="h-4 w-4" />
              <span className="text-xs">应收</span>
            </div>
            <p className="text-lg font-bold text-green-500 mt-1">
              {formatCurrency(data.receivable)}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-500/10">
            <div className="flex items-center justify-center gap-1 text-red-500">
              <ArrowDownRight className="h-4 w-4" />
              <span className="text-xs">应付</span>
            </div>
            <p className="text-lg font-bold text-red-500 mt-1">
              {formatCurrency(data.payable)}
            </p>
          </div>
          <div className={cn(
            "text-center p-3 rounded-lg",
            netAmount >= 0 ? "bg-primary/10" : "bg-orange-500/10"
          )}>
            <div className={cn(
              "flex items-center justify-center gap-1",
              netAmount >= 0 ? "text-primary" : "text-orange-500"
            )}>
              <Minus className="h-4 w-4" />
              <span className="text-xs">净额</span>
            </div>
            <p className={cn(
              "text-lg font-bold mt-1",
              netAmount >= 0 ? "text-primary" : "text-orange-500"
            )}>
              {formatCurrency(netAmount)}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">应收明细</p>
            <div className="space-y-1">
              {data.receivableItems.map((item, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="text-green-500">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">应付明细</p>
            <div className="space-y-1">
              {data.payableItems.map((item, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="text-red-500">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
