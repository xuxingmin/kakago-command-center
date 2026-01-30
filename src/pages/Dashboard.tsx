import { KPIGrid } from "@/components/dashboard/KPIGrid";

export default function Dashboard() {
  return (
    <div className="h-full flex flex-col gap-4">
      {/* 顶部经营数据看板 */}
      <KPIGrid />
      
      {/* 下方区域预留 */}
      <div className="flex-1 grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-card border border-border rounded-lg p-4 flex items-center justify-center">
          <span className="text-muted-foreground text-sm">门店分布地图 · 开发中</span>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex-1 bg-card border border-border rounded-lg p-4 flex items-center justify-center">
            <span className="text-muted-foreground text-sm">实时订单流 · 开发中</span>
          </div>
          <div className="flex-1 bg-card border border-border rounded-lg p-4 flex items-center justify-center">
            <span className="text-muted-foreground text-sm">预警中心 · 开发中</span>
          </div>
        </div>
      </div>
    </div>
  );
}
