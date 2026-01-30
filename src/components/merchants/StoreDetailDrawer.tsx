import { useState } from "react";
import { Copy, Trash2, UserPlus, RotateCcw, ShoppingBag, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StoreData } from "./StoreBlock";
import { toast } from "@/hooks/use-toast";

interface StoreDetailDrawerProps {
  store: StoreData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (store: StoreData) => void;
  onDelete: (id: string) => void;
}

// 模拟订单数据
const mockOrders = [
  { id: "ORD20240115001", time: "2024-01-15 14:32:15", items: "美式咖啡 x2, 拿铁 x1", amount: 78, status: "completed" },
  { id: "ORD20240115002", time: "2024-01-15 14:28:42", items: "卡布奇诺 x1", amount: 32, status: "completed" },
  { id: "ORD20240115003", time: "2024-01-15 14:15:33", items: "摩卡 x2, 美式咖啡 x1", amount: 86, status: "completed" },
  { id: "ORD20240115004", time: "2024-01-15 14:05:21", items: "拿铁 x3", amount: 87, status: "preparing" },
  { id: "ORD20240115005", time: "2024-01-15 13:58:10", items: "冰美式 x1, 热拿铁 x1", amount: 54, status: "completed" },
  { id: "ORD20240115006", time: "2024-01-15 13:45:08", items: "抹茶拿铁 x2", amount: 68, status: "completed" },
  { id: "ORD20240115007", time: "2024-01-15 13:32:55", items: "美式咖啡 x1", amount: 22, status: "completed" },
  { id: "ORD20240115008", time: "2024-01-15 13:20:30", items: "拿铁 x1, 曲奇 x2", amount: 45, status: "completed" },
];

// 模拟账号数据
const mockAccounts = [
  { id: "1", name: "张店长", role: "店长", enabled: true },
  { id: "2", name: "李收银", role: "收银员", enabled: true },
  { id: "3", name: "王调饮", role: "调饮师", enabled: false },
];

// 模拟日志数据
const mockLogs = [
  { time: "2024-01-15 09:32:15", account: "张店长", ip: "192.168.1.105", result: "成功" },
  { time: "2024-01-15 08:15:42", account: "李收银", ip: "192.168.1.108", result: "成功" },
  { time: "2024-01-14 22:18:33", account: "未知", ip: "45.33.12.89", result: "失败" },
  { time: "2024-01-14 18:05:21", account: "张店长", ip: "192.168.1.105", result: "成功" },
];

export function StoreDetailDrawer({
  store,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: StoreDetailDrawerProps) {
  const [formData, setFormData] = useState<StoreData | null>(store);
  const [pauseReason, setPauseReason] = useState("");

  // 当 store 变化时更新表单
  if (store && store.id !== formData?.id) {
    setFormData(store);
  }

  const handleCopyId = () => {
    if (formData?.id) {
      navigator.clipboard.writeText(formData.id);
      toast({ title: "已复制门店ID" });
    }
  };

  const statusBadge = {
    open: <Badge className="bg-green-500/20 text-green-500 border-green-500/30">营业中</Badge>,
    paused: <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">暂停营业</Badge>,
    closed: <Badge className="bg-red-500/20 text-red-500 border-red-500/30">已关闭</Badge>,
  };

  if (!formData) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] bg-card border-border overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-3">
            <SheetTitle className="text-xl">{formData.name}</SheetTitle>
            {statusBadge[formData.status]}
          </div>
        </SheetHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="basic">基础信息</TabsTrigger>
            <TabsTrigger value="orders">订单统计</TabsTrigger>
            <TabsTrigger value="status">营业状态</TabsTrigger>
            <TabsTrigger value="accounts">账号管理</TabsTrigger>
            <TabsTrigger value="logs">登录日志</TabsTrigger>
          </TabsList>

          {/* Tab A: 基础信息 */}
          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label>门店名称</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>门店 ID</Label>
              <div className="flex gap-2">
                <Input value={formData.id} readOnly className="font-mono bg-muted" />
                <Button variant="outline" size="icon" onClick={handleCopyId}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>详细地址</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>联系电话</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>负责人</Label>
              <Input
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <Button className="flex-1" onClick={() => onSave(formData)}>
                保存修改
              </Button>
              <Button
                variant="destructive"
                onClick={() => onDelete(formData.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                删除门店
              </Button>
            </div>
          </TabsContent>

          {/* Tab B: 订单统计 */}
          <TabsContent value="orders" className="space-y-4">
            {/* 订单 KPI 卡片 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">今日订单</span>
                </div>
                <p className="text-2xl font-bold font-mono">156</p>
                <p className="text-xs text-green-500 mt-1">↑ 12% vs 昨日</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">今日营收</span>
                </div>
                <p className="text-2xl font-bold font-mono">¥4,280</p>
                <p className="text-xs text-green-500 mt-1">↑ 8% vs 昨日</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs text-muted-foreground">平均出餐时间</span>
                </div>
                <p className="text-2xl font-bold font-mono">4.2<span className="text-sm">分钟</span></p>
                <p className="text-xs text-muted-foreground mt-1">目标: 5分钟</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground">完成率</span>
                </div>
                <p className="text-2xl font-bold font-mono">98.5<span className="text-sm">%</span></p>
                <p className="text-xs text-green-500 mt-1">优秀</p>
              </div>
            </div>

            {/* 订单列表 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">实时订单</p>
                <Button variant="ghost" size="sm" className="text-xs">查看全部</Button>
              </div>
              <div className="border border-border rounded-lg overflow-hidden max-h-[320px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs">订单号</TableHead>
                      <TableHead className="text-xs">商品</TableHead>
                      <TableHead className="text-xs">金额</TableHead>
                      <TableHead className="text-xs">状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs py-2">{order.id.slice(-6)}</TableCell>
                        <TableCell className="text-xs py-2 max-w-[140px] truncate">{order.items}</TableCell>
                        <TableCell className="font-mono text-xs py-2">¥{order.amount}</TableCell>
                        <TableCell className="py-2">
                          <Badge
                            className={
                              order.status === "completed"
                                ? "bg-green-500/20 text-green-500 text-xs"
                                : "bg-yellow-500/20 text-yellow-500 text-xs"
                            }
                          >
                            {order.status === "completed" ? "已完成" : "制作中"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* Tab C: 营业状态 */}
          <TabsContent value="status" className="space-y-4">
            <RadioGroup
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value as StoreData["status"] })
              }
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-4 rounded-lg border border-border bg-muted/30 hover:border-green-500/50 transition-colors">
                <RadioGroupItem value="open" id="open" />
                <Label htmlFor="open" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">🟢</span>
                    <span className="font-medium">正常营业</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">允许接单，正常运营</p>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-lg border border-border bg-muted/30 hover:border-gray-500/50 transition-colors">
                <RadioGroupItem value="paused" id="paused" />
                <Label htmlFor="paused" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">⚪</span>
                    <span className="font-medium">暂停营业</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">临时停止接单</p>
                </Label>
              </div>

              {formData.status === "paused" && (
                <div className="ml-7 space-y-2">
                  <Label>暂停原因</Label>
                  <Textarea
                    placeholder="请填写暂停原因..."
                    value={pauseReason}
                    onChange={(e) => setPauseReason(e.target.value)}
                    rows={2}
                  />
                </div>
              )}

              <div className="flex items-center space-x-3 p-4 rounded-lg border border-border bg-muted/30 hover:border-red-500/50 transition-colors">
                <RadioGroupItem value="closed" id="closed" />
                <Label htmlFor="closed" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">🔴</span>
                    <span className="font-medium">下架 / 关闭</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">永久关闭门店</p>
                </Label>
              </div>
            </RadioGroup>

            <Button className="w-full mt-4" onClick={() => onSave(formData)}>
              保存状态
            </Button>
          </TabsContent>

          {/* Tab C: 账号管理 */}
          <TabsContent value="accounts" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">管理该门店下的员工账号</p>
              <Button size="sm">
                <UserPlus className="w-4 h-4 mr-2" />
                新建账号
              </Button>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>账号名</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell>{account.role}</TableCell>
                      <TableCell>
                        <Switch checked={account.enabled} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <RotateCcw className="w-4 h-4 mr-1" />
                          重置密码
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Tab D: 登录日志 */}
          <TabsContent value="logs" className="space-y-4">
            <p className="text-sm text-muted-foreground">查看账号登录活动记录</p>

            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>时间</TableHead>
                    <TableHead>操作账号</TableHead>
                    <TableHead>IP 地址</TableHead>
                    <TableHead>结果</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockLogs.map((log, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-xs">{log.time}</TableCell>
                      <TableCell>{log.account}</TableCell>
                      <TableCell className="font-mono text-xs">{log.ip}</TableCell>
                      <TableCell>
                        <Badge
                          variant={log.result === "成功" ? "default" : "destructive"}
                          className={log.result === "成功" ? "bg-green-500/20 text-green-500" : ""}
                        >
                          {log.result}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
