import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { StoreMap } from "@/components/dashboard/StoreMap";
import { OrderStream } from "@/components/dashboard/OrderStream";
import { ExceptionMonitor } from "@/components/dashboard/ExceptionMonitor";
import { CustomerSatisfaction } from "@/components/dashboard/CustomerSatisfaction";
import { TicketList } from "@/components/dashboard/TicketList";

export default function Dashboard() {
  return (
    <div className="h-full flex flex-col gap-2">
      {/* 第一行: 顶部KPI - 紧凑 */}
      <div className="flex-shrink-0">
        <KPIGrid />
      </div>
      
      {/* 第二行: 地图 + 订单流 - 最大化 */}
      <div className="flex gap-2 flex-1 min-h-0">
        <div className="w-[65%] h-full">
          <StoreMap />
        </div>
        <div className="w-[35%] h-full">
          <OrderStream />
        </div>
      </div>

      {/* 第三行: 预警模块 - 紧凑 */}
      <div className="flex gap-2 h-[160px] flex-shrink-0">
        <div className="w-[45%] h-full">
          <ExceptionMonitor />
        </div>
        <div className="w-[28%] h-full">
          <CustomerSatisfaction />
        </div>
        <div className="w-[27%] h-full">
          <TicketList />
        </div>
      </div>
    </div>
  );
}
