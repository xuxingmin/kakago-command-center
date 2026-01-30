import { UserKPICards } from "@/components/users/UserKPICards";
import { UserSegmentChart } from "@/components/users/UserSegmentChart";
import { RepurchaseTrendChart } from "@/components/users/RepurchaseTrendChart";
import { UserDataTable } from "@/components/users/UserDataTable";

export default function Users() {
  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Row 1: KPI Cards */}
      <div className="flex-shrink-0">
        <UserKPICards />
      </div>

      {/* Row 2: Charts - 用户分层饼图 + 复购趋势折线图 */}
      <div className="grid grid-cols-5 gap-4 h-[240px] flex-shrink-0">
        <div className="col-span-2">
          <UserSegmentChart />
        </div>
        <div className="col-span-3">
          <RepurchaseTrendChart />
        </div>
      </div>

      {/* Row 3: User Data Table */}
      <div className="flex-1 min-h-0">
        <UserDataTable />
      </div>
    </div>
  );
}
