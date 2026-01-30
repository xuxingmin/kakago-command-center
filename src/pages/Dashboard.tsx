import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { StoreMap } from "@/components/dashboard/StoreMap";
import { OrderStream } from "@/components/dashboard/OrderStream";
import { ExceptionMonitor } from "@/components/dashboard/ExceptionMonitor";
import { CustomerSatisfaction } from "@/components/dashboard/CustomerSatisfaction";
import { TicketList } from "@/components/dashboard/TicketList";

export default function Dashboard() {
  return (
    <div className="h-full flex flex-col gap-3">
      {/* 顶部经营数据看板 */}
      <KPIGrid />
      
      {/* 中间区域 - 65% 地图 + 35% 实时订单流 */}
      <div className="flex gap-3 min-h-0" style={{ height: "calc(55% - 1rem)" }}>
        {/* 左侧地图 65% */}
        <div className="w-[65%] h-full">
          <StoreMap />
        </div>
        
        {/* 右侧订单流 35% - 扩大显示 */}
        <div className="w-[35%] h-full">
          <OrderStream />
        </div>
      </div>

      {/* 底部区域 - 事件预警 50% | 客户满意度+投诉工单 各25% */}
      <div className="flex gap-3" style={{ height: "calc(25%)" }}>
        <div className="w-1/2 h-full">
          <ExceptionMonitor />
        </div>
        <div className="w-1/4 h-full">
          <CustomerSatisfaction />
        </div>
        <div className="w-1/4 h-full">
          <TicketList />
        </div>
      </div>
    </div>
  );
}
