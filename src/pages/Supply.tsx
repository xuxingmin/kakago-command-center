import { Link } from "react-router-dom";
import { Box, FileText, BarChart3, ClipboardList, Truck, Package, ShoppingCart, Warehouse, Store } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
    title: "总部库存管理",
    description: "总部实仓看板、采购入库、出库执行与直供流水",
    icon: Warehouse,
    path: "/supply/hq-warehouse",
  },
  {
    title: "门店库存管理",
    description: "门店库存监控、策略配置、智能推配与盘点审计",
    icon: Store,
    path: "/supply/store-inventory",
  },
];

export default function Supply() {
  return (
    <div className="h-full space-y-6">
      <div className="flex items-center gap-3">
        <Box className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">供应链管理</h1>
      </div>

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
