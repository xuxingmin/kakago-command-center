import { useState } from "react";
import { Headphones, AlertCircle, Clock, CheckCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Urgency = "high" | "medium" | "low";
type Status = "pending" | "processing" | "completed";

interface Ticket {
  id: string;
  user: string;
  type: string;
  urgency: Urgency;
  status: Status;
  time: string;
}

const urgencyConfig: Record<Urgency, { label: string; color: string; bg: string }> = {
  high: { label: "高", color: "text-destructive", bg: "bg-destructive/20" },
  medium: { label: "中", color: "text-warning", bg: "bg-warning/20" },
  low: { label: "低", color: "text-muted-foreground", bg: "bg-muted" },
};

const statusConfig: Record<Status, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "待处理", color: "text-destructive", icon: AlertCircle },
  processing: { label: "处理中", color: "text-warning", icon: Clock },
  completed: { label: "已完成", color: "text-success", icon: CheckCircle },
};

// 模拟工单数据
const initialTickets: Ticket[] = [
  { id: "TK001", user: "刘*强", type: "配送延迟", urgency: "high", status: "pending", time: "14:45" },
  { id: "TK002", user: "赵*娜", type: "饮品质量", urgency: "high", status: "processing", time: "14:32" },
  { id: "TK003", user: "陈*伟", type: "订单错误", urgency: "medium", status: "pending", time: "14:18" },
  { id: "TK004", user: "孙*丽", type: "退款申请", urgency: "medium", status: "processing", time: "13:55" },
  { id: "TK005", user: "周*杰", type: "服务态度", urgency: "low", status: "completed", time: "13:40" },
];

export function TicketList() {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);

  const handleProcess = (ticketId: string) => {
    setTickets(prev =>
      prev.map(t =>
        t.id === ticketId
          ? { ...t, status: t.status === "pending" ? "processing" : "completed" }
          : t
      )
    );
  };

  const pendingCount = tickets.filter(t => t.status === "pending").length;

  return (
    <div className="bg-card border border-secondary rounded-lg p-4 h-full flex flex-col">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Headphones className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">投诉工单</span>
          {pendingCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive numeric">
              {pendingCount} 待处理
            </span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">
          今日 {tickets.length} 条
        </span>
      </div>

      {/* 工单列表 */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {tickets.map((ticket) => {
          const urgency = urgencyConfig[ticket.urgency];
          const status = statusConfig[ticket.status];
          const StatusIcon = status.icon;

          return (
            <div
              key={ticket.id}
              className={cn(
                "flex items-center gap-3 p-2.5 rounded border transition-all",
                "bg-background/50 border-secondary/50 hover:border-primary/30",
                ticket.status === "pending" && ticket.urgency === "high" && "border-destructive/30"
              )}
            >
              {/* 用户信息 */}
              <div className="flex items-center gap-2 w-20 flex-shrink-0">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-foreground truncate">{ticket.user}</span>
              </div>

              {/* 投诉类型 */}
              <span className="text-xs text-muted-foreground w-16 flex-shrink-0 truncate">
                {ticket.type}
              </span>

              {/* 紧急程度 */}
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded flex-shrink-0",
                urgency.bg, urgency.color
              )}>
                {urgency.label}
              </span>

              {/* 状态 */}
              <div className={cn("flex items-center gap-1 flex-shrink-0", status.color)}>
                <StatusIcon className="w-3 h-3" />
                <span className="text-[10px]">{status.label}</span>
              </div>

              {/* 时间 */}
              <span className="text-[10px] text-muted-foreground numeric flex-shrink-0 ml-auto">
                {ticket.time}
              </span>

              {/* 操作按钮 */}
              <Button
                size="sm"
                variant={ticket.status === "completed" ? "ghost" : "default"}
                className={cn(
                  "h-6 px-2 text-[10px] flex-shrink-0",
                  ticket.status === "completed" 
                    ? "text-muted-foreground" 
                    : "bg-primary hover:bg-primary/90"
                )}
                onClick={() => handleProcess(ticket.id)}
                disabled={ticket.status === "completed"}
              >
                {ticket.status === "pending" ? "处理" : ticket.status === "processing" ? "完成" : "已结"}
              </Button>
            </div>
          );
        })}
      </div>

      {/* 底部统计 */}
      <div className="flex-shrink-0 pt-2 border-t border-secondary mt-2">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
              待处理: {tickets.filter(t => t.status === "pending").length}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-warning" />
              处理中: {tickets.filter(t => t.status === "processing").length}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              已完成: {tickets.filter(t => t.status === "completed").length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
