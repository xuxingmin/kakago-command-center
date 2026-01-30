import { UserKPICards } from "@/components/users/UserKPICards";
import { UserSegmentCards } from "@/components/users/UserSegmentCards";
import { UserSegmentPie } from "@/components/users/UserSegmentPie";
import { RepurchaseTrendChart } from "@/components/users/RepurchaseTrendChart";
import { UserCharacteristics } from "@/components/users/UserCharacteristics";

export default function Users() {
  return (
    <div className="h-full flex flex-col gap-5 overflow-hidden p-1">
      {/* Row 1: KPI Cards - 固定高度 */}
      <section className="h-[76px] flex-shrink-0">
        <UserKPICards />
      </section>

      {/* Row 2: 人群营销与图表 - Split View */}
      <section className="flex-1 min-h-[240px] grid grid-cols-5 gap-4">
        {/* 左侧 40% - 人群分层 2x2 网格 */}
        <div className="col-span-2 h-full">
          <UserSegmentCards />
        </div>
        
        {/* 右侧 60% - 图表区域 */}
        <div className="col-span-3 h-full grid grid-rows-2 gap-4">
          <UserSegmentPie />
          <RepurchaseTrendChart />
        </div>
      </section>

      {/* Row 3: 用户特征分析 - 四栏布局 */}
      <section className="h-[200px] flex-shrink-0">
        <UserCharacteristics />
      </section>
    </div>
  );
}
