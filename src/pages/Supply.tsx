import { Link } from "react-router-dom";
import { Box, FileText, BarChart3, ClipboardList, Truck, Package, ShoppingCart } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InventorySummaryCards } from "@/components/supply/InventorySummaryCards";

const supplyModules = [
  {
    title: "SKU 主数据",
    description: "管理产品与原物料基础信息",
    icon: Package,
    path: "/supply/sku",
  },
  {
    title: "BOM 配方配置",
    description: "定义 SKU 与原料的消耗关系",
    icon: FileText,
    path: "/supply/bom",
  },
  {
    title: "全城产能监控",
    description: "实时查看各门店剩余产能",
    icon: BarChart3,
    path: "/supply/dashboard",
  },
  {
    title: "商户要货",
    description: "门店主动追加物料申请",
    icon: ShoppingCart,
    path: "/supply/request",
  },
  {
    title: "库存修正与盘点",
    description: "校准系统库存与实际库存",
    icon: ClipboardList,
    path: "/supply/adjust",
  },
  {
    title: "智能推配中心",
    description: "自动计算补货量并生成配送单",
    icon: Truck,
    path: "/supply/push",
  },
];

export default function Supply() {
  return (
    <div className="h-full space-y-6">
      <div className="flex items-center gap-3">
        <Box className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">供应链管理</h1>
      </div>

      {/* 库存汇总卡片 */}
      <InventorySummaryCards />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {supplyModules.map((module) => (
          <Link key={module.path} to={module.path}>
            <Card className="h-full bg-[#121212] border-[#333333] hover:border-primary/50 transition-all duration-200 cursor-pointer group">
              <CardHeader>
                <module.icon className="w-8 h-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-base text-foreground">{module.title}</CardTitle>
                <CardDescription className="text-muted-foreground text-sm">
                  {module.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
