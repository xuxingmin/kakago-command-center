import { useState } from "react";
import { Headphones, AlertCircle, Clock, CheckCircle, User, ChevronDown, ChevronUp, MessageSquare, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Urgency = "high" | "medium" | "low";
type Status = "pending" | "processing" | "completed";

interface Ticket {
  id: string;
  user: string;
  phone: string;
  type: string;
  urgency: Urgency;
  status: Status;
  time: string;
  detail: string;
  order: string;
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
  { id: "TK001", user: "刘*强", phone: "138****5678", type: "配送延迟", urgency: "high", status: "pending", time: "14:45", detail: "订单配送超时40分钟，客户要求退款并投诉骑手", order: "KK5100039328" },
  { id: "TK002", user: "赵*娜", phone: "139****1234", type: "饮品质量", urgency: "high", status: "processing", time: "14:32", detail: "冰拿铁温度不对，客户反映口感异常", order: "KK5099786978" },
  { id: "TK003", user: "陈*伟", phone: "137****9012", type: "订单错误", urgency: "medium", status: "pending", time: "14:18", detail: "订单漏送一杯热美式，需补发", order: "KK5099652341" },
  { id: "TK004", user: "孙*丽", phone: "136****3456", type: "退款申请", urgency: "medium", status: "processing", time: "13:55", detail: "客户临时取消订单，申请全额退款", order: "KK5099543210" },
  { id: "TK005", user: "周*杰", phone: "135****7890", type: "服务态度", urgency: "low", status: "completed", time: "13:40", detail: "反馈店员态度问题，已道歉处理", order: "KK5099432109" },
];

export function TicketList() {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
    <div className="bg-[#121212] border border-[#333333] rounded-lg p-3 h-full flex flex-col">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Headphones className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-white">投诉工单</span>
          {pendingCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive font-mono">
              {pendingCount} 待处理
            </span>
          )}
        </div>
        <span className="text-[10px] text-[#9CA3AF]">
          今日 {tickets.length} 条
        </span>
      </div>

      {/* 工单列表 */}
      <div className="flex-1 space-y-1.5 overflow-y-auto">
        {tickets.map((ticket) => {
          const urgency = urgencyConfig[ticket.urgency];
          const status = statusConfig[ticket.status];
          const StatusIcon = status.icon;
          const isExpanded = expandedId === ticket.id;

          return (
            <div
              key={ticket.id}
              className={cn(
                "rounded border transition-all duration-200",
                "bg-black/50 border-[#333333] hover:border-primary/30",
                ticket.status === "pending" && ticket.urgency === "high" && "border-destructive/30",
                isExpanded && "border-primary/50"
              )}
            >
              {/* 主行 */}
              <div className="flex items-center gap-2 p-2">
                {/* 展开按钮 */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                  className="p-0.5 hover:bg-[#333333] rounded transition-colors"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-3 h-3 text-[#9CA3AF]" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-[#9CA3AF]" />
                  )}
                </button>

                {/* 用户信息 */}
                <div className="flex items-center gap-1 w-14 flex-shrink-0">
                  <User className="w-3 h-3 text-[#9CA3AF]" />
                  <span className="text-xs text-white truncate">{ticket.user}</span>
                </div>

                {/* 投诉类型 */}
                <span className="text-[10px] text-[#9CA3AF] w-14 flex-shrink-0 truncate">
                  {ticket.type}
                </span>

                {/* 状态 */}
                <div className={cn("flex items-center gap-0.5 flex-shrink-0", status.color)}>
                  <StatusIcon className="w-2.5 h-2.5" />
                  <span className="text-[10px]">{status.label}</span>
                </div>

                {/* 操作按钮 */}
                <Button
                  size="sm"
                  variant={ticket.status === "completed" ? "ghost" : "default"}
                  className={cn(
                    "h-5 px-2 text-[10px] flex-shrink-0 ml-auto",
                    ticket.status === "completed" 
                      ? "text-[#9CA3AF]" 
                      : "bg-primary hover:bg-primary/90"
                  )}
                  onClick={() => handleProcess(ticket.id)}
                  disabled={ticket.status === "completed"}
                >
                  {ticket.status === "pending" ? "处理" : ticket.status === "processing" ? "完成" : "已结"}
                </Button>
              </div>

              {/* 展开详情 */}
              {isExpanded && (
                <div className="px-2 pb-2 pt-1 border-t border-[#333333] space-y-2">
                  <div className="flex items-center gap-4 text-[10px]">
                    <span className="text-[#9CA3AF]">订单号:</span>
                    <span className="font-mono text-primary">{ticket.order}</span>
                    <span className="text-[#9CA3AF]">时间:</span>
                    <span className="font-mono text-white">{ticket.time}</span>
                  </div>
                  <p className="text-[10px] text-[#9CA3AF] leading-relaxed">{ticket.detail}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <Button size="sm" variant="outline" className="h-5 px-2 text-[10px] border-[#333333] hover:border-primary/50">
                      <Phone className="w-2.5 h-2.5 mr-1" />
                      {ticket.phone}
                    </Button>
                    <Button size="sm" variant="outline" className="h-5 px-2 text-[10px] border-[#333333] hover:border-primary/50">
                      <MessageSquare className="w-2.5 h-2.5 mr-1" />
                      发送消息
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 底部统计 */}
      <div className="flex-shrink-0 pt-2 border-t border-[#333333] mt-2">
        <div className="flex justify-between text-[10px] text-[#9CA3AF]">
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
