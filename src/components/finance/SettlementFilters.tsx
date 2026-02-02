import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Download, RefreshCw } from "lucide-react";

interface SettlementFiltersProps {
  periodStart: string;
  periodEnd: string;
  status: string;
  onPeriodStartChange: (value: string) => void;
  onPeriodEndChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onGenerate: () => void;
  onExport: () => void;
  loading?: boolean;
}

export function SettlementFilters({
  periodStart,
  periodEnd,
  status,
  onPeriodStartChange,
  onPeriodEndChange,
  onStatusChange,
  onGenerate,
  onExport,
  loading,
}: SettlementFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-card border border-border rounded-lg">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">结算周期:</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={periodStart}
          onChange={(e) => onPeriodStartChange(e.target.value)}
          className="w-36 h-9 bg-background"
        />
        <span className="text-muted-foreground">~</span>
        <Input
          type="date"
          value={periodEnd}
          onChange={(e) => onPeriodEndChange(e.target.value)}
          className="w-36 h-9 bg-background"
        />
      </div>

      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-32 h-9 bg-background">
          <SelectValue placeholder="状态" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部状态</SelectItem>
          <SelectItem value="pending">待结算</SelectItem>
          <SelectItem value="confirmed">已确认</SelectItem>
          <SelectItem value="paid">已支付</SelectItem>
          <SelectItem value="completed">已完成</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex-1" />

      <Button
        variant="outline"
        size="sm"
        onClick={onExport}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        导出
      </Button>

      <Button
        size="sm"
        onClick={onGenerate}
        disabled={loading}
        className="gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        生成结算
      </Button>
    </div>
  );
}
