import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { StoreMap } from "@/components/dashboard/StoreMap";

export default function Dashboard() {
  return (
    <div className="h-full flex flex-col gap-4">
      {/* 顶部经营数据看板 */}
      <KPIGrid />
      
      {/* 下方区域 - 65% 地图 + 35% 侧边栏 */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* 左侧地图 65% */}
        <div className="w-[65%]">
          <StoreMap />
        </div>
        
        {/* 右侧面板 35% */}
        <div className="w-[35%] flex flex-col gap-4">
          <div className="flex-1 bg-card border border-border rounded-lg p-4 flex items-center justify-center">
            <span className="text-muted-foreground text-sm">实时订单流 · 开发中</span>
          </div>
          <div className="flex-1 bg-card border border-border rounded-lg p-4 flex items-center justify-center">
            <span className="text-muted-foreground text-sm">预警中心 · 开发中</span>
          </div>
        </div>
      </div>
    </div>
  );
}
