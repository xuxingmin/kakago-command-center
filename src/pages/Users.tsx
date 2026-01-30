import { Users as UsersIcon, UserPlus, Moon, UserX } from "lucide-react";
import { UserKPICards } from "@/components/users/UserKPICards";
import { SegmentCard, SegmentData } from "@/components/users/SegmentCard";
import { UserSegmentPie } from "@/components/users/UserSegmentPie";
import { RepurchaseTrendChart } from "@/components/users/RepurchaseTrendChart";
import { GenderCard, RegionCard, TimeSlotCard, TasteCard } from "@/components/users/UserCharacteristics";

const segmentData: SegmentData[] = [
  { 
    id: "new",
    name: "新用户", 
    value: 2850, 
    color: "#22c55e",
    icon: UserPlus,
    rule: "注册<7天 且 订单≤1",
    ruleDetail: "注册不足7天且订单数≤1",
    strategy: "首单转化/二次留存"
  },
  { 
    id: "active",
    name: "活跃老客", 
    value: 4200, 
    color: "#7c3aed",
    icon: UsersIcon,
    rule: "订单≥3 且 7天内消费",
    ruleDetail: "累计订单≥3次且7天内有消费",
    strategy: "保持记忆/新品转化"
  },
  { 
    id: "sleeping",
    name: "沉睡用户", 
    value: 1680, 
    color: "#f59e0b",
    icon: Moon,
    rule: "15-30天未消费",
    ruleDetail: "15-30天未下单",
    strategy: "精准激活"
  },
  { 
    id: "lost",
    name: "流失用户", 
    value: 920, 
    color: "#ef4444",
    icon: UserX,
    rule: ">30天未消费",
    ruleDetail: "超过30天未下单",
    strategy: "深度召回"
  },
];

const total = segmentData.reduce((sum, item) => sum + item.value, 0);

export default function Users() {
  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden p-1">
      {/* Row 1: KPI Cards - 20% */}
      <section className="h-[20%] min-h-[70px]">
        <UserKPICards />
      </section>

      {/* Row 2: 新用户25% + 活跃用户25% + 用户构成50% - 20% */}
      <section className="h-[20%] min-h-[100px] grid grid-cols-4 gap-4">
        <SegmentCard segment={segmentData[0]} total={total} />
        <SegmentCard segment={segmentData[1]} total={total} />
        <div className="col-span-2">
          <UserSegmentPie />
        </div>
      </section>

      {/* Row 3: 沉睡用户25% + 流失用户25% + 复购趋势50% - 20% */}
      <section className="h-[20%] min-h-[100px] grid grid-cols-4 gap-4">
        <SegmentCard segment={segmentData[2]} total={total} />
        <SegmentCard segment={segmentData[3]} total={total} />
        <div className="col-span-2">
          <RepurchaseTrendChart />
        </div>
      </section>

      {/* Row 4: 用户特征 - 40% */}
      <section className="h-[40%] min-h-[200px] grid gap-4" style={{ gridTemplateColumns: '20% 30% 30% 20%' }}>
        <GenderCard />
        <RegionCard />
        <TimeSlotCard />
        <TasteCard />
      </section>
    </div>
  );
}
