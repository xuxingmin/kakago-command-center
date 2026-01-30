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
      
      {/* 中间区域 - 65% 地图 + 35% 侧边栏 */}
      <div className="flex gap-3 min-h-0" style={{ height: "calc(55% - 1rem)" }}>
        {/* 左侧地图 65% */}
        <div className="w-[65%] h-full">
          <StoreMap />
        </div>
        
        {/* 右侧面板 35% - 上下等分 */}
        <div className="w-[35%] flex flex-col gap-3 h-full">
          <div className="flex-1 min-h-0">
            <OrderStream />
          </div>
          <div className="flex-1 min-h-0">
            <ExceptionMonitor />
          </div>
        </div>
      </div>

      {/* 底部区域 - 客户满意度 + 投诉工单 1:1 */}
      <div className="flex gap-3" style={{ height: "calc(25%)" }}>
        <div className="w-1/2 h-full">
          <CustomerSatisfaction />
        </div>
        <div className="w-1/2 h-full">
          <TicketList />
        </div>
      </div>
    </div>
  );
}
