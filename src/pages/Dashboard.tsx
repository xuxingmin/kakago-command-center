import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { StoreMap } from "@/components/dashboard/StoreMap";
import { OrderStream } from "@/components/dashboard/OrderStream";
import { ExceptionMonitor } from "@/components/dashboard/ExceptionMonitor";

export default function Dashboard() {
  return (
    <div className="h-full flex flex-col gap-3">
      {/* 顶部KPI */}
      <div className="flex-shrink-0">
        <KPIGrid />
      </div>
      
      {/* 地图 + 订单流 */}
      <div className="flex gap-3 flex-1 min-h-0">
        <div className="w-[62%] h-full">
          <StoreMap />
        </div>
        <div className="w-[38%] h-full">
          <OrderStream />
        </div>
      </div>

      {/* 预警模块 - 全宽 */}
      <div className="h-[150px] flex-shrink-0">
        <ExceptionMonitor />
      </div>
    </div>
  );
}
