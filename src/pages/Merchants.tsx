import { useState } from "react";
import { StoreKPIHeader } from "@/components/merchants/StoreKPIHeader";
import { StoreBlock, StoreData } from "@/components/merchants/StoreBlock";
import { StoreDetailDrawer } from "@/components/merchants/StoreDetailDrawer";
import { toast } from "@/hooks/use-toast";

// 模拟门店数据
const initialStores: StoreData[] = [
  { id: "S001", name: "国贸中心店", status: "open", address: "北京市朝阳区国贸中心B1层", phone: "010-88881234", manager: "张伟" },
  { id: "S002", name: "三里屯店", status: "open", address: "北京市朝阳区三里屯太古里南区", phone: "010-88882345", manager: "李娜" },
  { id: "S003", name: "望京SOHO店", status: "open", address: "北京市朝阳区望京SOHO T1", phone: "010-88883456", manager: "王强" },
  { id: "S004", name: "西单大悦城店", status: "paused", address: "北京市西城区西单北大街131号", phone: "010-88884567", manager: "赵敏" },
  { id: "S005", name: "中关村店", status: "open", address: "北京市海淀区中关村大街", phone: "010-88885678", manager: "刘洋" },
  { id: "S006", name: "五道口店", status: "open", address: "北京市海淀区五道口华联", phone: "010-88886789", manager: "陈晨" },
  { id: "S007", name: "王府井店", status: "open", address: "北京市东城区王府井大街", phone: "010-88887890", manager: "周杰" },
  { id: "S008", name: "朝阳大悦城店", status: "closed", address: "北京市朝阳区朝阳北路101号", phone: "010-88888901", manager: "吴芳" },
  { id: "S009", name: "合生汇店", status: "open", address: "北京市朝阳区西大望路", phone: "010-88889012", manager: "郑明" },
  { id: "S010", name: "蓝色港湾店", status: "open", address: "北京市朝阳区朝阳公园路6号", phone: "010-88880123", manager: "孙丽" },
  { id: "S011", name: "颐堤港店", status: "open", address: "北京市朝阳区酒仙桥路18号", phone: "010-88881235", manager: "钱军" },
  { id: "S012", name: "华贸中心店", status: "open", address: "北京市朝阳区建国路89号", phone: "010-88882346", manager: "冯雪" },
  { id: "S013", name: "银泰中心店", status: "open", address: "北京市朝阳区建国门外大街", phone: "010-88883457", manager: "褚琳" },
  { id: "S014", name: "金融街店", status: "open", address: "北京市西城区金融大街", phone: "010-88884568", manager: "卫东" },
  { id: "S015", name: "新中关店", status: "paused", address: "北京市海淀区中关村大街19号", phone: "010-88885679", manager: "蒋峰" },
];

export default function Merchants() {
  const [stores, setStores] = useState<StoreData[]>(initialStores);
  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const totalStores = stores.length;
  const openStores = stores.filter((s) => s.status === "open").length;

  const handleStoreClick = (store: StoreData) => {
    setSelectedStore(store);
    setDrawerOpen(true);
  };

  const handleAddStore = () => {
    const newId = `S${String(stores.length + 1).padStart(3, "0")}`;
    const newStore: StoreData = {
      id: newId,
      name: "新门店",
      status: "paused",
      address: "",
      phone: "",
      manager: "",
    };
    setSelectedStore(newStore);
    setDrawerOpen(true);
  };

  const handleSave = (store: StoreData) => {
    setStores((prev) => {
      const exists = prev.find((s) => s.id === store.id);
      if (exists) {
        return prev.map((s) => (s.id === store.id ? store : s));
      }
      return [...prev, store];
    });
    toast({ title: "保存成功", description: `门店 ${store.name} 已更新` });
    setDrawerOpen(false);
  };

  const handleDelete = (id: string) => {
    setStores((prev) => prev.filter((s) => s.id !== id));
    toast({ title: "删除成功", description: "门店已删除" });
    setDrawerOpen(false);
  };

  return (
    <div className="h-full flex flex-col gap-6 p-2 overflow-auto bg-black">
      {/* 顶部 KPI */}
      <StoreKPIHeader totalStores={totalStores} openStores={openStores} />

      {/* 门店网格 */}
      <div className="flex-1">
        <h2 className="text-lg font-semibold text-foreground mb-4">门店矩阵</h2>
        <div className="grid grid-cols-8 gap-4">
          {/* 添加门店按钮 */}
          <StoreBlock isAddButton onClick={handleAddStore} />
          
          {/* 门店方块 */}
          {stores.map((store) => (
            <StoreBlock
              key={store.id}
              store={store}
              onClick={() => handleStoreClick(store)}
            />
          ))}
        </div>
      </div>

      {/* 详情抽屉 */}
      <StoreDetailDrawer
        store={selectedStore}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
