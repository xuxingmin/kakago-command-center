import { useState } from "react";
import { Download, Loader2, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { useQuery } from "@tanstack/react-query";

export function BulkExportDialog() {
  const [open, setOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    () => { const d = new Date(); d.setDate(d.getDate() - 30); return d; }
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [selectedStore, setSelectedStore] = useState("all");
  const [exporting, setExporting] = useState(false);

  const { data: stores = [] } = useQuery({
    queryKey: ["stores-list-export"],
    queryFn: async () => {
      const { data } = await supabase
        .from("stores")
        .select("id, name")
        .eq("status", "active")
        .order("name");
      return data || [];
    },
    enabled: open,
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      let query = supabase
        .from("orders")
        .select("*, stores!inner(name), coupons(name)")
        .order("created_at", { ascending: false });

      if (dateFrom) query = query.gte("created_at", dateFrom.toISOString());
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        query = query.lte("created_at", end.toISOString());
      }
      if (selectedStore !== "all") query = query.eq("store_id", selectedStore);

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []).map((o: any) => {
        const couponDiscount = Number(o.coupon_discount || 0);
        const totalAmount = Number(o.total_amount);
        return {
          "订单号": o.order_no,
          "门店": (o.stores as any)?.name || "-",
          "下单时间": format(new Date(o.created_at), "yyyy-MM-dd HH:mm:ss"),
          "商品总额": totalAmount.toFixed(2),
          "优惠券名称": (o.coupons as any)?.name || "-",
          "券抵扣金额": couponDiscount.toFixed(2),
          "实付金额": (totalAmount - couponDiscount).toFixed(2),
          "平台费(5%)": (totalAmount * 0.05).toFixed(2),
          "门店应结": (totalAmount - couponDiscount * 0.5 - totalAmount * 0.05).toFixed(2),
          "订单状态": o.status,
          "客户姓名": o.customer_name || "-",
          "客户电话": o.customer_phone || "-",
          "备注": o.notes || "-",
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "全量订单明细");
      XLSX.writeFile(wb, `全量订单对账_${format(new Date(), "yyyyMMdd")}.xlsx`);
      toast.success(`成功导出 ${rows.length} 条订单`);
      setOpen(false);
    } catch (e) {
      toast.error("导出失败");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1.5 bg-primary hover:bg-primary/90">
          <Download className="w-3 h-3" />
          导出全量订单明细
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card/80 backdrop-blur-xl border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-sm">导出全量订单对账明细</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Date range */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">日期范围</label>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 flex-1">
                    <CalendarDays className="w-3 h-3" />
                    {dateFrom ? format(dateFrom, "yyyy-MM-dd") : "开始日期"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <span className="text-xs text-muted-foreground">至</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 flex-1">
                    <CalendarDays className="w-3 h-3" />
                    {dateTo ? format(dateTo, "yyyy-MM-dd") : "截止日期"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Store filter */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">筛选门店</label>
            <div className="max-h-[160px] overflow-y-auto border border-border rounded-lg p-2 space-y-1">
              <button
                onClick={() => setSelectedStore("all")}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded text-xs transition-all",
                  selectedStore === "all"
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-secondary"
                )}
              >
                全部门店
              </button>
              {stores.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStore(s.id)}
                  className={cn(
                    "w-full text-left px-2 py-1.5 rounded text-xs transition-all truncate",
                    selectedStore === s.id
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleExport}
            disabled={exporting}
            className="w-full gap-1.5"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? "正在导出..." : "确认导出"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
