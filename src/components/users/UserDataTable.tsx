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
  totalOrders: number;
  preference: "美式" | "拿铁" | "卡布" | "澳白";
  kakaBeans: number;
}

const mockUsers: UserData[] = [
  { id: "U001", phone: "138****6789", registeredAt: "2024-12-15", totalOrders: 28, preference: "拿铁", kakaBeans: 1250 },
  { id: "U002", phone: "139****1234", registeredAt: "2025-01-03", totalOrders: 5, preference: "美式", kakaBeans: 320 },
  { id: "U003", phone: "137****5678", registeredAt: "2024-11-22", totalOrders: 42, preference: "澳白", kakaBeans: 2180 },
  { id: "U004", phone: "136****9012", registeredAt: "2025-01-18", totalOrders: 3, preference: "卡布", kakaBeans: 150 },
  { id: "U005", phone: "135****3456", registeredAt: "2024-10-08", totalOrders: 67, preference: "拿铁", kakaBeans: 3420 },
  { id: "U006", phone: "158****7890", registeredAt: "2024-09-25", totalOrders: 89, preference: "美式", kakaBeans: 4560 },
  { id: "U007", phone: "159****2345", registeredAt: "2025-01-25", totalOrders: 1, preference: "拿铁", kakaBeans: 50 },
  { id: "U008", phone: "188****6789", registeredAt: "2024-08-12", totalOrders: 112, preference: "澳白", kakaBeans: 5890 },
];

const preferenceColors: Record<string, string> = {
  "美式": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "拿铁": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "卡布": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "澳白": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

export function UserDataTable() {
  return (
    <div className="bg-card border border-border rounded-lg flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-sm font-medium text-foreground">用户数据库</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input 
              placeholder="搜索用户ID/手机号" 
              className="pl-8 h-8 w-48 text-xs bg-secondary border-border"
            />
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            <span className="text-xs">筛选</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-xs text-muted-foreground font-medium">用户ID</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">手机号</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">注册时间</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium text-center">累计单数</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">口味偏好</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium text-right">KAKA豆</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockUsers.map((user) => (
              <TableRow 
                key={user.id} 
                className="border-border hover:bg-secondary/50 transition-colors cursor-pointer"
              >
                <TableCell className="font-mono text-xs text-foreground">{user.id}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{user.phone}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{user.registeredAt}</TableCell>
                <TableCell className="font-mono text-xs text-foreground text-center font-bold">{user.totalOrders}</TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={cn("text-[10px] font-medium", preferenceColors[user.preference])}
                  >
                    {user.preference}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-primary text-right font-bold">
                  {user.kakaBeans.toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 hover:bg-primary/10"
                  >
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <span className="text-xs text-muted-foreground">
          显示 1-8 共 86,432 条记录
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled>
            上一页
          </Button>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-primary/10 border-primary/30 text-primary">
            1
          </Button>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
            2
          </Button>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
            3
          </Button>
          <span className="text-xs text-muted-foreground px-1">...</span>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
            下一页
          </Button>
        </div>
      </div>
    </div>
  );
}
