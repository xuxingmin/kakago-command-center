import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Search, Filter, Loader2, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const statusMap: Record<string, { label: string; class: string }> = {
  pending: { label: "待处理", class: "bg-orange-400/15 text-orange-400 border-orange-400/30" },
  making: { label: "制作中", class: "bg-blue-400/15 text-blue-400 border-blue-400/30" },
  delivering: { label: "配送中", class: "bg-purple-400/15 text-purple-400 border-purple-400/30" },
  completed: { label: "已完成", class: "bg-success/15 text-success border-success/30" },
  cancelled: { label: "已取消", class: "bg-destructive/15 text-destructive border-destructive/30" },
};

export default function OrderCenter() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const storeId = searchParams.get("store_id");
  const storeName = searchParams.get("store_name") || "全部门店";

  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    () => { const d = new Date(); d.setDate(d.getDate() - 30); return d; }
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [statusFilter, setStatusFilter] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [exporting, setExporting] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["order-center", storeId, dateFrom?.toISOString(), dateTo?.toISOString(), statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select("*, stores!inner(name), coupons(name)")
        .order("created_at", { ascending: false })
        .limit(500);

      if (storeId) query = query.eq("store_id", storeId);
      if (dateFrom) query = query.gte("created_at", dateFrom.toISOString());
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        query = query.lte("created_at", end.toISOString());
      }
      if (statusFilter !== "all") query = query.eq("status", statusFilter);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    if (!keyword) return orders;
    const kw = keyword.toLowerCase();
    return orders.filter((o: any) =>
      o.order_no?.toLowerCase().includes(kw) ||
      o.customer_name?.toLowerCase().includes(kw) ||
      o.customer_phone?.includes(kw)
    );
  }, [orders, keyword]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const rows = filtered.map((o: any) => ({
        "订单号": o.order_no,
        "门店": (o.stores as any)?.name || "-",
        "下单时间": format(new Date(o.created_at), "yyyy-MM-dd HH:mm:ss"),
        "商品总额": Number(o.total_amount).toFixed(2),
        "优惠券": (o.coupons as any)?.name || "-",
        "券抵扣": Number(o.coupon_discount || 0).toFixed(2),
        "实付金额": (Number(o.total_amount) - Number(o.coupon_discount || 0)).toFixed(2),
        "状态": statusMap[o.status]?.label || o.status,
        "客户": o.customer_name || "-",
        "电话": o.customer_phone || "-",
        "备注": o.notes || "-",
      }));
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "订单明细");
      XLSX.writeFile(wb, `订单明细_${storeName}_${format(new Date(), "yyyyMMdd")}.xlsx`);
      toast.success("导出成功");
    } catch (e) {
      toast.error("导出失败");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-base font-semibold">订单明细中心</h1>
          <p className="text-xs text-muted-foreground">{storeName}</p>
        </div>
        <div className="ml-auto">
          <Button
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90"
          >
            {exporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            导出当前门店报表
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
        {/* Date range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <CalendarDays className="w-3 h-3" />
              {dateFrom ? format(dateFrom, "MM/dd") : "起始"} - {dateTo ? format(dateTo, "MM/dd") : "截止"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 flex" align="start">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={setDateFrom}
              className="p-3 pointer-events-auto"
            />
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={setDateTo}
              className="p-3 pointer-events-auto border-l border-border"
            />
          </PopoverContent>
        </Popover>

        {/* Status filter */}
        <div className="flex items-center gap-1">
          {["all", "pending", "making", "completed", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-2 py-1 text-xs rounded transition-all",
                statusFilter === s
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:bg-secondary border border-transparent"
              )}
            >
              {s === "all" ? "全部" : statusMap[s]?.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative ml-auto">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索订单号/客户..."
            className="h-8 pl-7 w-48 text-xs"
          />
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-6 py-2 px-3 bg-card rounded border border-secondary flex-shrink-0 text-xs">
        <div>
          <span className="text-muted-foreground">共</span>
          <span className="font-mono font-bold text-foreground ml-1">{filtered.length}</span>
          <span className="text-muted-foreground ml-1">笔</span>
        </div>
        <div className="w-px h-4 bg-secondary" />
        <div>
          <span className="text-muted-foreground">总额</span>
          <span className="font-mono font-bold text-success ml-1">
            ¥{filtered.reduce((s: number, o: any) => s + Number(o.total_amount), 0).toLocaleString()}
          </span>
        </div>
        <div className="w-px h-4 bg-secondary" />
        <div>
          <span className="text-muted-foreground">券抵扣</span>
          <span className="font-mono font-bold text-orange-400 ml-1">
            ¥{filtered.reduce((s: number, o: any) => s + Number(o.coupon_discount || 0), 0).toLocaleString()}
          </span>
        </div>
        <div className="w-px h-4 bg-secondary" />
        <div>
          <span className="text-muted-foreground">实付</span>
          <span className="font-mono font-bold text-primary ml-1">
            ¥{filtered.reduce((s: number, o: any) => s + Number(o.total_amount) - Number(o.coupon_discount || 0), 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto border border-secondary rounded-lg bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> 加载中...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-xs w-[140px]">订单号</TableHead>
                <TableHead className="text-xs">门店</TableHead>
                <TableHead className="text-xs">下单时间</TableHead>
                <TableHead className="text-xs text-right">商品总额</TableHead>
                <TableHead className="text-xs text-right">优惠抵扣</TableHead>
                <TableHead className="text-xs text-right">实付金额</TableHead>
                <TableHead className="text-xs text-center">状态</TableHead>
                <TableHead className="text-xs">客户</TableHead>
                <TableHead className="text-xs">备注</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                    暂无订单数据
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((o: any) => {
                  const couponName = (o.coupons as any)?.name;
                  const couponDiscount = Number(o.coupon_discount || 0);
                  const actualPay = Number(o.total_amount) - couponDiscount;
                  const st = statusMap[o.status] || statusMap.pending;
                  return (
                    <TableRow key={o.id} className="hover:bg-primary/5">
                      <TableCell className="font-mono text-xs py-2">{o.order_no}</TableCell>
                      <TableCell className="text-xs py-2 truncate max-w-[120px]">
                        {(o.stores as any)?.name || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-xs py-2 text-muted-foreground">
                        {format(new Date(o.created_at), "MM-dd HH:mm")}
                      </TableCell>
                      <TableCell className="font-mono text-xs py-2 text-right text-success">
                        ¥{Number(o.total_amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-xs py-2 text-right">
                        {couponDiscount > 0 ? (
                          <span className="text-orange-400">
                            -¥{couponDiscount.toFixed(2)}
                            {couponName && <span className="text-muted-foreground ml-1">({couponName})</span>}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs py-2 text-right font-bold text-primary">
                        ¥{actualPay.toFixed(2)}
                      </TableCell>
                      <TableCell className="py-2 text-center">
                        <Badge className={cn("text-[10px]", st.class)}>{st.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs py-2 text-muted-foreground truncate max-w-[80px]">
                        {o.customer_name || "-"}
                      </TableCell>
                      <TableCell className="text-xs py-2 text-muted-foreground truncate max-w-[100px]">
                        {o.notes || "-"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
