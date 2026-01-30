import { UserKPICards } from "@/components/users/UserKPICards";
import { UserSegmentCards } from "@/components/users/UserSegmentCards";
import { UserSegmentPie } from "@/components/users/UserSegmentPie";
import { RepurchaseTrendChart } from "@/components/users/RepurchaseTrendChart";
import { UserDataTable } from "@/components/users/UserDataTable";

export default function Users() {
  return (
    <div className="h-full flex flex-col gap-2 overflow-hidden">
      {/* Row 1: KPI Cards - 20% */}
      <div className="h-[20%] min-h-0">
        <UserKPICards />
      </div>

      {/* Row 2: 人群分层卡片 - 20% */}
      <div className="h-[20%] min-h-0">
        <UserSegmentCards />
      </div>

      {/* Row 3: 图表区 - 20% */}
      <div className="h-[20%] min-h-0 grid grid-cols-5 gap-2">
        <div className="col-span-2">
          <UserSegmentPie />
        </div>
        <div className="col-span-3">
          <RepurchaseTrendChart />
        </div>
      </div>

      {/* Row 4: User Data Table - 40% */}
      <div className="h-[40%] min-h-0">
        <UserDataTable />
      </div>
    </div>
  );
}
