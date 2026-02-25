import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CouponTemplates } from "@/components/marketing/CouponTemplates";
import { CampaignList } from "@/components/marketing/CampaignList";
import { DistributionLog } from "@/components/marketing/DistributionLog";

export default function Marketing() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-foreground">营销中心</h1>
      </div>

      <Tabs defaultValue="coupons" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="bg-muted w-fit">
          <TabsTrigger value="coupons">券模板管理</TabsTrigger>
          <TabsTrigger value="campaigns">营销活动</TabsTrigger>
          <TabsTrigger value="logs">投放记录</TabsTrigger>
        </TabsList>

        <TabsContent value="coupons" className="flex-1 overflow-auto mt-4">
          <CouponTemplates />
        </TabsContent>

        <TabsContent value="campaigns" className="flex-1 overflow-auto mt-4">
          <CampaignList />
        </TabsContent>

        <TabsContent value="logs" className="flex-1 overflow-auto mt-4">
          <DistributionLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}
