import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Settlement type definition
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
// Finance summary data
interface FinanceSummary {
  totalRevenue: number;
  todayRevenue: number;
  materialCost: number;
  grossMargin: number;
  pendingSettlement: number;
  couponCost: number;
}

// Mock data generator for demo purposes
// In production, replace with actual Edge Function calls
function generateMockFinanceData(): FinanceSummary {
  const totalRevenue = 1285600;
  const materialCost = 382000;
  const grossMargin = (totalRevenue - materialCost) / totalRevenue;
  
  return {
    totalRevenue,
    todayRevenue: 12560,
    materialCost,
    grossMargin,
    pendingSettlement: 64000,
    couponCost: 8200,
  };
}

export function useFinanceSummary() {
  const [data, setData] = useState<FinanceSummary>({
    totalRevenue: 0,
    todayRevenue: 0,
    materialCost: 0,
    grossMargin: 0,
    pendingSettlement: 0,
    couponCost: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch real order data
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [ordersResult, todayOrdersResult, settlementsResult] = await Promise.all([
          supabase
            .from("orders")
            .select("total_amount")
            .eq("status", "completed"),
          supabase
            .from("orders")
            .select("total_amount")
            .eq("status", "completed")
            .gte("created_at", today.toISOString()),
          supabase
            .from("settlements")
            .select("settlement_amount")
            .eq("status", "pending"),
        ]);

        const totalRevenue = ordersResult.data?.reduce(
          (sum, o) => sum + Number(o.total_amount), 0
        ) || 0;
        
        const todayRevenue = todayOrdersResult.data?.reduce(
          (sum, o) => sum + Number(o.total_amount), 0
        ) || 0;

        const pendingSettlement = settlementsResult.data?.reduce(
          (sum, s) => sum + Number(s.settlement_amount), 0
        ) || 0;

        // For demo, use some mock values for material cost and coupon cost
        // In production, calculate from inventory_logs and user_coupons
        const materialCost = totalRevenue * 0.3; // Estimate 30% material cost
        const couponCost = totalRevenue * 0.02; // Estimate 2% coupon cost
        const grossMargin = totalRevenue > 0 
          ? (totalRevenue - materialCost) / totalRevenue 
          : 0;

        // If no real data, use mock data for demo
        if (totalRevenue === 0) {
          setData(generateMockFinanceData());
        } else {
          setData({
            totalRevenue,
            todayRevenue,
            materialCost,
            grossMargin,
            pendingSettlement,
            couponCost,
          });
        }
      } catch (error) {
        console.error("Error fetching finance data:", error);
        // Fallback to mock data
        setData(generateMockFinanceData());
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, loading };
}

// Cashflow data
export function useCashflowData() {
  const { data: summary } = useFinanceSummary();
  
  return [
    { name: "订单营收", value: summary.totalRevenue, type: "income" as const },
    { name: "物料成本", value: -summary.materialCost, type: "expense" as const },
    { name: "门店结算", value: -summary.pendingSettlement, type: "expense" as const },
    { name: "优惠券成本", value: -summary.couponCost, type: "expense" as const },
    { name: "净利润", value: summary.totalRevenue - summary.materialCost - summary.pendingSettlement - summary.couponCost, type: "net" as const },
  ];
}

// Revenue trend data (mock for demo)
export function useRevenueTrend() {
  const generateTrendData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      
      data.push({
        date: dateStr,
        revenue: Math.floor(10000 + Math.random() * 5000),
        cost: Math.floor(3000 + Math.random() * 2000),
      });
    }
    
    return data;
  };

  return generateTrendData();
}

// Cost breakdown data (mock for demo)
export function useCostBreakdown() {
  return [
    { name: "物料成本", value: 38200, color: "hsl(var(--chart-1))" },
    { name: "优惠券成本", value: 8200, color: "hsl(var(--chart-2))" },
    { name: "平台运营", value: 12000, color: "hsl(var(--chart-3))" },
    { name: "其他支出", value: 5600, color: "hsl(var(--chart-4))" },
  ];
}

// Receivable/Payable data (mock for demo)
export function useReceivablePayable() {
  return {
    receivable: 12800,
    payable: 72200,
    receivableItems: [
      { name: "会员预充值", amount: 8800 },
      { name: "待收款订单", amount: 4000 },
    ],
    payableItems: [
      { name: "门店结算", amount: 64000 },
      { name: "供应商货款", amount: 8200 },
    ],
  };
}

// Settlements hook
export function useSettlements(periodStart: string, periodEnd: string, status: string) {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalStores: 0,
    totalOrders: 0,
    orderTotal: 0,
    couponCost: 0,
    platformFee: 0,
    settlementAmount: 0,
  });

  useEffect(() => {
    async function fetchSettlements() {
      setLoading(true);
      try {
        let query = supabase
          .from("settlements")
          .select(`
            *,
            stores!inner(name)
          `)
          .gte("period_start", periodStart)
          .lte("period_end", periodEnd);

        if (status !== "all") {
          query = query.eq("status", status as "pending" | "confirmed" | "paid" | "completed");
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data && data.length > 0) {
          const mappedSettlements: Settlement[] = data.map((s: any) => ({
            id: s.id,
            store_id: s.store_id,
            store_name: s.stores?.name || "未知门店",
            period_start: s.period_start,
            period_end: s.period_end,
            order_count: s.order_count,
            order_total: Number(s.order_total),
            coupon_count: s.coupon_count,
            coupon_cost: Number(s.coupon_cost),
            platform_fee: Number(s.platform_fee),
            settlement_amount: Number(s.settlement_amount),
            status: s.status,
          }));

          setSettlements(mappedSettlements);

          // Calculate summary
          setSummary({
            totalStores: mappedSettlements.length,
            totalOrders: mappedSettlements.reduce((sum, s) => sum + s.order_count, 0),
            orderTotal: mappedSettlements.reduce((sum, s) => sum + s.order_total, 0),
            couponCost: mappedSettlements.reduce((sum, s) => sum + s.coupon_cost, 0),
            platformFee: mappedSettlements.reduce((sum, s) => sum + s.platform_fee, 0),
            settlementAmount: mappedSettlements.reduce((sum, s) => sum + s.settlement_amount, 0),
          });
        } else {
          // Generate mock data for demo
          const mockSettlements = generateMockSettlements(periodStart, periodEnd);
          setSettlements(mockSettlements);
          setSummary({
            totalStores: mockSettlements.length,
            totalOrders: mockSettlements.reduce((sum, s) => sum + s.order_count, 0),
            orderTotal: mockSettlements.reduce((sum, s) => sum + s.order_total, 0),
            couponCost: mockSettlements.reduce((sum, s) => sum + s.coupon_cost, 0),
            platformFee: mockSettlements.reduce((sum, s) => sum + s.platform_fee, 0),
            settlementAmount: mockSettlements.reduce((sum, s) => sum + s.settlement_amount, 0),
          });
        }
      } catch (error) {
        console.error("Error fetching settlements:", error);
        // Use mock data on error
        const mockSettlements = generateMockSettlements(periodStart, periodEnd);
        setSettlements(mockSettlements);
      } finally {
        setLoading(false);
      }
    }

    fetchSettlements();
  }, [periodStart, periodEnd, status]);

  return { settlements, summary, loading };
}

// Generate mock settlements for demo
function generateMockSettlements(periodStart: string, periodEnd: string): Settlement[] {
  const storeNames = ["望京店", "朝阳店", "海淀店", "西城店", "东城店"];
  
  return storeNames.map((name, index) => {
    const orderCount = Math.floor(100 + Math.random() * 150);
    const orderTotal = Math.floor(5000 + Math.random() * 10000);
    const couponCount = Math.floor(5 + Math.random() * 20);
    const couponCost = couponCount * 15; // Average 30 yuan coupon * 50%
    const platformFee = Math.floor(orderTotal * 0.05);
    const settlementAmount = orderTotal - couponCost - platformFee;
    
    const statuses: Settlement["status"][] = ["pending", "confirmed", "paid", "completed"];
    
    return {
      id: `mock-${index}`,
      store_id: `store-${index}`,
      store_name: name,
      period_start: periodStart,
      period_end: periodEnd,
      order_count: orderCount,
      order_total: orderTotal,
      coupon_count: couponCount,
      coupon_cost: couponCost,
      platform_fee: platformFee,
      settlement_amount: settlementAmount,
      status: index % 3 === 0 ? "confirmed" : index % 3 === 1 ? "paid" : "pending" as const,
    };
  });
}
