import { UserKPICards } from "@/components/users/UserKPICards";
import { UserSegmentCards } from "@/components/users/UserSegmentCards";
import { UserSegmentPie } from "@/components/users/UserSegmentPie";
import { RepurchaseTrendChart } from "@/components/users/RepurchaseTrendChart";
import { UserDataTable } from "@/components/users/UserDataTable";

export default function Users() {
  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden p-1">
      {/* Row 1: KPI Cards - 紧凑高度 */}
      <div className="flex-shrink-0">
        <UserKPICards />
      </div>

      {/* Row 2: 人群分层卡片 (4个) - 独立一行，确保全部显示 */}
      <div className="flex-shrink-0 h-[200px]">
        <UserSegmentCards />
      </div>

      {/* Row 3: 图表区 - 饼图 + 趋势图 */}
      <div className="grid grid-cols-5 gap-3 h-[180px] flex-shrink-0">
        <div className="col-span-2">
          <UserSegmentPie />
        </div>
        <div className="col-span-3">
          <RepurchaseTrendChart />
        </div>
      </div>

      {/* Row 4: User Data Table - 自适应剩余高度 */}
      <div className="flex-1 min-h-0">
        <UserDataTable />
      </div>
    </div>
  );
}
