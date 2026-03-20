import { useState, useEffect } from "react";
import { StoreKPIHeader } from "@/components/merchants/StoreKPIHeader";
import { StoreBlock, StoreData } from "@/components/merchants/StoreBlock";
import { StoreDetailDrawer } from "@/components/merchants/StoreDetailDrawer";
import { JoinApplications } from "@/components/merchants/JoinApplications";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function Merchants() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("matrix");
  const [pendingAppCount, setPendingAppCount] = useState(0);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error("Error fetching stores:", error);
      toast({ title: "加载失败", description: "无法获取门店数据", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const totalStores = stores.length;
  const activeStores = stores.filter((s) => s.status === "active").length;

  const handleStoreClick = (store: StoreData) => {
    setSelectedStore(store);
    setDrawerOpen(true);
  };

  const handleAddStore = () => {
    const newStore: StoreData = {
      id: crypto.randomUUID(),
      name: "新门店",
      status: "inactive",
      address: "",
      contact_phone: "",
      head_barista: "",
      coffee_machine_model: "",
      grinder_model: "",
      store_description: "",
      store_message: "",
      longitude: 0,
      latitude: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setSelectedStore(newStore);
    setDrawerOpen(true);
  };

  const handleSave = async (store: StoreData) => {
    try {
      const exists = stores.find((s) => s.id === store.id);
      if (exists) {
        const { error } = await supabase
          .from("stores")
          .update({
            name: store.name, address: store.address, contact_phone: store.contact_phone,
            status: store.status, head_barista: store.head_barista,
            coffee_machine_model: store.coffee_machine_model, grinder_model: store.grinder_model,
            store_description: store.store_description, store_message: store.store_message,
            longitude: store.longitude, latitude: store.latitude,
          })
          .eq("id", store.id);
        if (error) throw error;
        setStores((prev) => prev.map((s) => (s.id === store.id ? store : s)));
      } else {
        const { data, error } = await supabase
          .from("stores")
          .insert({
            name: store.name, address: store.address, contact_phone: store.contact_phone,
            status: store.status, head_barista: store.head_barista,
            coffee_machine_model: store.coffee_machine_model, grinder_model: store.grinder_model,
            store_description: store.store_description, store_message: store.store_message,
            longitude: store.longitude, latitude: store.latitude,
          })
          .select()
          .single();
        if (error) throw error;
        if (data) setStores((prev) => [data, ...prev]);
      }
      toast({ title: "保存成功", description: `门店 ${store.name} 已更新` });
      setDrawerOpen(false);
    } catch (error) {
      console.error("Error saving store:", error);
      toast({ title: "保存失败", description: "无法保存门店数据", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("stores").delete().eq("id", id);
      if (error) throw error;
      setStores((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "删除成功", description: "门店已删除" });
      setDrawerOpen(false);
    } catch (error) {
      console.error("Error deleting store:", error);
      toast({ title: "删除失败", description: "无法删除门店", variant: "destructive" });
    }
  };

  const handleNavigateToStore = (storeId: string) => {
    setActiveTab("matrix");
    const store = stores.find((s) => s.id === storeId);
    if (store) {
      setTimeout(() => {
        setSelectedStore(store);
        setDrawerOpen(true);
      }, 300);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 p-2 overflow-auto bg-background">
      <StoreKPIHeader totalStores={totalStores} openStores={activeStores} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-fit">
          <TabsTrigger value="matrix">门店矩阵</TabsTrigger>
          <TabsTrigger value="applications" className="relative">
            加盟申请管理
            {pendingAppCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
                {pendingAppCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="flex-1 mt-4">
          <div className="grid grid-cols-8 gap-4">
            <StoreBlock isAddButton onClick={handleAddStore} />
            {stores.map((store) => (
              <StoreBlock key={store.id} store={store} onClick={() => handleStoreClick(store)} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="applications" className="flex-1 mt-4">
          <JoinApplications onNavigateToStore={handleNavigateToStore} />
        </TabsContent>
      </Tabs>

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
