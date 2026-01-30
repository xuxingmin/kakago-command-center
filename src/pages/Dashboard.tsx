import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { StoreMap } from "@/components/dashboard/StoreMap";
import { OrderStream } from "@/components/dashboard/OrderStream";
import { ExceptionMonitor } from "@/components/dashboard/ExceptionMonitor";

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
        
        {/* 右侧面板 35% - 上下等分 */}
        <div className="w-[35%] flex flex-col gap-3">
          <div className="flex-1 min-h-0">
            <OrderStream />
          </div>
          <div className="flex-1 min-h-0">
            <ExceptionMonitor />
          </div>
        </div>
      </div>
    </div>
  );
}
