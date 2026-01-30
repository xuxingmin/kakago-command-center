import { UserKPICards } from "@/components/users/UserKPICards";
import { UserSegmentCards } from "@/components/users/UserSegmentCards";
import { UserSegmentPie } from "@/components/users/UserSegmentPie";
import { RepurchaseTrendChart } from "@/components/users/RepurchaseTrendChart";
import { UserDataTable } from "@/components/users/UserDataTable";

export default function Users() {
  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden">
      {/* Row 1: KPI Cards - 10% */}
      <div style={{ height: "10%" }} className="min-h-[70px] flex-shrink-0">
        <UserKPICards />
      </div>

      {/* Row 2: 人群分层卡片 - 15% */}
      <div style={{ height: "15%" }} className="min-h-[100px] flex-shrink-0">
        <UserSegmentCards />
      </div>

      {/* Row 3: 图表区 - 35% */}
      <div style={{ height: "35%" }} className="min-h-[180px] flex-shrink-0 grid grid-cols-5 gap-3">
        <div className="col-span-2 h-full">
          <UserSegmentPie />
        </div>
        <div className="col-span-3 h-full">
          <RepurchaseTrendChart />
        </div>
      </div>

      {/* Row 4: User Data Table - 30% */}
      <div style={{ height: "30%" }} className="min-h-[150px] flex-shrink-0">
        <UserDataTable />
      </div>
    </div>
  );
}
