import { UserKPICards } from "@/components/users/UserKPICards";
import { UserSegmentCards } from "@/components/users/UserSegmentCards";
import { UserSegmentPie } from "@/components/users/UserSegmentPie";
import { RepurchaseTrendChart } from "@/components/users/RepurchaseTrendChart";
import { UserDataTable } from "@/components/users/UserDataTable";

export default function Users() {
  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden">
      {/* Row 1: KPI Cards - 固定高度 */}
      <section className="h-[72px] flex-shrink-0">
        <UserKPICards />
      </section>

      {/* Row 2: 人群分层卡片 - 固定高度 */}
      <section className="h-[90px] flex-shrink-0">
        <UserSegmentCards />
      </section>

      {/* Row 3: 图表区 - flex-1 自适应 */}
      <section className="flex-1 min-h-[200px] grid grid-cols-5 gap-3">
        <div className="col-span-2 h-full">
          <UserSegmentPie />
        </div>
        <div className="col-span-3 h-full">
          <RepurchaseTrendChart />
        </div>
      </section>

      {/* Row 4: User Data Table - 固定高度 */}
      <section className="h-[240px] flex-shrink-0">
        <UserDataTable />
      </section>
    </div>
  );
}
