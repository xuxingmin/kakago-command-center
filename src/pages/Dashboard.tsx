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
      
      {/* 中间区域 - 地图 + 实时订单流 */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* 左侧地图 */}
        <div className="w-[62%] h-full">
          <StoreMap />
        </div>
        
        {/* 右侧订单流 */}
        <div className="w-[38%] h-full">
          <OrderStream />
        </div>
      </div>

      {/* 底部区域 - 事件预警 | 客户满意度 | 投诉工单 */}
      <div className="flex gap-3 h-[200px] flex-shrink-0">
        <div className="w-[45%] h-full">
          <ExceptionMonitor />
        </div>
        <div className="w-[27%] h-full">
          <CustomerSatisfaction />
        </div>
        <div className="w-[28%] h-full">
          <TicketList />
        </div>
      </div>
    </div>
  );
}
