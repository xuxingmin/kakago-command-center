import { ChevronRight, Search, Filter } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UserData {
  id: string;
  phone: string;
  registeredAt: string;
  lastConsumeAt: string;
  totalOrders: number;
  frequency: "高频" | "中频" | "低频";
  preference: string;
  preferenceTag: string;
  kakaBeans: number;
}

const mockUsers: UserData[] = [
  { id: "U001", phone: "138****6789", registeredAt: "2024-12-15", lastConsumeAt: "2025-01-29", totalOrders: 28, frequency: "高频", preference: "拿铁", preferenceTag: "拿铁控", kakaBeans: 1250 },
  { id: "U002", phone: "139****1234", registeredAt: "2025-01-03", lastConsumeAt: "2025-01-28", totalOrders: 5, frequency: "中频", preference: "美式", preferenceTag: "美式达人", kakaBeans: 320 },
  { id: "U003", phone: "137****5678", registeredAt: "2024-11-22", lastConsumeAt: "2025-01-27", totalOrders: 42, frequency: "高频", preference: "澳白", preferenceTag: "澳白专属", kakaBeans: 2180 },
  { id: "U004", phone: "136****9012", registeredAt: "2025-01-18", lastConsumeAt: "2025-01-20", totalOrders: 3, frequency: "低频", preference: "卡布", preferenceTag: "卡布新手", kakaBeans: 150 },
  { id: "U005", phone: "135****3456", registeredAt: "2024-10-08", lastConsumeAt: "2025-01-25", totalOrders: 67, frequency: "高频", preference: "拿铁", preferenceTag: "拿铁控", kakaBeans: 3420 },
  { id: "U006", phone: "158****7890", registeredAt: "2024-09-25", lastConsumeAt: "2025-01-15", totalOrders: 89, frequency: "高频", preference: "美式", preferenceTag: "美式达人", kakaBeans: 4560 },
  { id: "U007", phone: "159****2345", registeredAt: "2025-01-25", lastConsumeAt: "2025-01-26", totalOrders: 1, frequency: "低频", preference: "拿铁", preferenceTag: "新客探索", kakaBeans: 50 },
  { id: "U008", phone: "188****6789", registeredAt: "2024-08-12", lastConsumeAt: "2025-01-29", totalOrders: 112, frequency: "高频", preference: "澳白", preferenceTag: "澳白专属", kakaBeans: 5890 },
];

const preferenceColors: Record<string, string> = {
  "拿铁控": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "美式达人": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "卡布新手": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "澳白专属": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "新客探索": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

const frequencyColors: Record<string, string> = {
  "高频": "bg-success/20 text-success border-success/30",
  "中频": "bg-warning/20 text-warning border-warning/30",
  "低频": "bg-muted text-muted-foreground border-muted",
};

export function UserDataTable() {
  return (
    <div className="bg-[#121212] border border-[#2A2A2E] rounded-xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2E] flex-shrink-0">
        <h3 className="text-sm font-semibold text-white">用户画像数据库</h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
            <Input 
              placeholder="搜索用户ID/手机号" 
              className="pl-9 h-9 w-56 text-sm bg-[#0A0A0A] border-[#2A2A2E] text-white placeholder:text-[#6B7280]"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9 gap-2 bg-transparent border-[#2A2A2E] text-[#9CA3AF] hover:bg-[#1F1F23] hover:text-white">
            <Filter className="w-4 h-4" />
            <span className="text-sm">筛选</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-[#2A2A2E]">
              <TableHead className="text-xs text-[#6B7280] font-medium h-12">用户ID</TableHead>
              <TableHead className="text-xs text-[#6B7280] font-medium">手机号</TableHead>
              <TableHead className="text-xs text-[#6B7280] font-medium">注册时间</TableHead>
              <TableHead className="text-xs text-[#6B7280] font-medium">最近消费</TableHead>
              <TableHead className="text-xs text-[#6B7280] font-medium text-center">累计单数</TableHead>
              <TableHead className="text-xs text-[#6B7280] font-medium text-center">消费频次</TableHead>
              <TableHead className="text-xs text-[#6B7280] font-medium">口味偏好</TableHead>
              <TableHead className="text-xs text-[#6B7280] font-medium text-right">KAKA豆</TableHead>
              <TableHead className="text-xs text-[#6B7280] font-medium text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockUsers.map((user) => (
              <TableRow 
                key={user.id} 
                className="border-[#2A2A2E] hover:bg-[#1A1A1A] transition-colors cursor-pointer h-12"
              >
                <TableCell className="font-mono text-sm text-white">{user.id}</TableCell>
                <TableCell className="font-mono text-sm text-[#9CA3AF]">{user.phone}</TableCell>
                <TableCell className="font-mono text-sm text-[#6B7280]">{user.registeredAt}</TableCell>
                <TableCell className="font-mono text-sm text-[#9CA3AF]">{user.lastConsumeAt}</TableCell>
                <TableCell className="font-mono text-sm text-white text-center font-bold">{user.totalOrders}</TableCell>
                <TableCell className="text-center">
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs font-medium", frequencyColors[user.frequency])}
                  >
                    {user.frequency}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs font-medium", preferenceColors[user.preferenceTag])}
                  >
                    {user.preferenceTag}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm text-primary text-right font-bold">
                  {user.kakaBeans.toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-primary/10"
                  >
                    <ChevronRight className="w-4 h-4 text-[#6B7280]" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-[#2A2A2E] flex-shrink-0">
        <span className="text-sm text-[#6B7280]">
          显示 1-8 共 86,432 条记录
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-8 px-3 text-sm bg-transparent border-[#2A2A2E] text-[#6B7280]" disabled>
            上一页
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-3 text-sm bg-primary/10 border-primary/30 text-primary">
            1
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-3 text-sm bg-transparent border-[#2A2A2E] text-[#9CA3AF] hover:bg-[#1F1F23]">
            2
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-3 text-sm bg-transparent border-[#2A2A2E] text-[#9CA3AF] hover:bg-[#1F1F23]">
            3
          </Button>
          <span className="text-sm text-[#6B7280] px-2">...</span>
          <Button variant="outline" size="sm" className="h-8 px-3 text-sm bg-transparent border-[#2A2A2E] text-[#9CA3AF] hover:bg-[#1F1F23]">
            下一页
          </Button>
        </div>
      </div>
    </div>
  );
}
