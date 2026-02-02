import { Card, CardContent } from "@/components/ui/card";
import { Store, ShoppingBag, Ticket, CreditCard, Wallet } from "lucide-react";

interface SettlementSummaryProps {
  data: {
    totalStores: number;
    totalOrders: number;
    orderTotal: number;
    couponCost: number;
    platformFee: number;
    settlementAmount: number;
  };
}

export function SettlementSummary({ data }: SettlementSummaryProps) {
  const formatCurrency = (value: number) => {
    if (value >= 10000) {
      return `¥${(value / 10000).toFixed(2)}万`;
    }
    return `¥${value.toLocaleString()}`;
  };

  const items = [
    { icon: Store, label: "门店数", value: `${data.totalStores}家`, color: "text-blue-500" },
    { icon: ShoppingBag, label: "订单总额", value: formatCurrency(data.orderTotal), color: "text-green-500" },
    { icon: Ticket, label: "券成本", value: formatCurrency(data.couponCost), color: "text-orange-500" },
    { icon: CreditCard, label: "平台费", value: formatCurrency(data.platformFee), color: "text-purple-500" },
    { icon: Wallet, label: "应结金额", value: formatCurrency(data.settlementAmount), color: "text-primary" },
  ];

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
