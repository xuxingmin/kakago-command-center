import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Database, 
  Search, 
  Code2, 
  Warehouse, 
  Package, 
  Store, 
  Layers,
  FileJson2,
  Copy,
  Check,
  Radio,
  Zap
} from "lucide-react";
import { toast } from "sonner";

type TabType = "overview" | "api-docs" | "materials" | "products" | "stores" | "inventory";

const API_ENDPOINTS = [
  {
    category: "门店管理",
    endpoints: [
      { method: "GET", path: "/stores", desc: "获取所有门店列表", example: "select=*" },
      { method: "GET", path: "/stores?id=eq.{id}", desc: "获取单个门店详情", example: "id=eq.abc123" },
      { method: "POST", path: "/stores", desc: "创建新门店", example: '{ "name": "新店", "address": "..." }' },
    ]
  },
  {
    category: "库存管理",
    endpoints: [
      { method: "GET", path: "/store_inventory?store_id=eq.{id}", desc: "获取门店库存", example: "store_id=eq.abc123" },
      { method: "PATCH", path: "/store_inventory?id=eq.{id}", desc: "更新库存数量", example: '{ "current_quantity": 100 }' },
    ]
  },
  {
    category: "补货系统",
    endpoints: [
      { method: "GET", path: "/restock_batches?status=eq.shipped", desc: "获取配送中批次", example: "status=eq.shipped" },
      { method: "POST", path: "/restock_batches", desc: "创建补货批次", example: '{ "store_id": "...", "status": "pending" }' },
      { method: "PATCH", path: "/restock_batches?id=eq.{id}", desc: "更新批次状态", example: '{ "status": "received" }' },
    ]
  },
  {
    category: "产品与配方",
    endpoints: [
      { method: "GET", path: "/sku_products?is_active=eq.true", desc: "获取上架产品", example: "is_active=eq.true" },
      { method: "GET", path: "/sku_materials", desc: "获取原物料列表", example: "select=*" },
      { method: "GET", path: "/bom_recipes?product_id=eq.{id}", desc: "获取产品配方", example: "product_id=eq.abc123" },
    ]
  },
];

function JsonViewer({ data, title }: { data: any; title: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("JSON 已复制");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100">
          <FileJson2 className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson2 className="w-4 h-4 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 z-10"
            onClick={handleCopy}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
          <ScrollArea className="h-[400px]">
            <pre className="bg-background p-4 rounded-lg text-xs font-mono overflow-x-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
      {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
    </Button>
  );
}

export default function DataHub() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [globalSearch, setGlobalSearch] = useState("");
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const queryClient = useQueryClient();

  // Fetch all core data
  const { data: stores = [] } = useQuery({
    queryKey: ["datahub_stores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("stores").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: materials = [] } = useQuery({
    queryKey: ["datahub_materials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sku_materials").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["datahub_products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sku_products").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["datahub_inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_inventory")
        .select("*, stores(name), sku_materials(name, unit_usage)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: bomRecipes = [] } = useQuery({
    queryKey: ["datahub_bom"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bom_recipes")
        .select("*, sku_products(name), sku_materials(name)");
      if (error) throw error;
      return data;
    },
  });

  // Setup realtime subscription for store_inventory
  useEffect(() => {
    const channel = supabase
      .channel("datahub-inventory-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "store_inventory",
        },
        (payload) => {
          console.log("Realtime update:", payload);
          queryClient.invalidateQueries({ queryKey: ["datahub_inventory"] });
          toast.info("库存数据已实时更新", { duration: 2000 });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("connected");
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setRealtimeStatus("disconnected");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Global search filter
  const filterBySearch = (items: any[], keys: string[]) => {
    if (!globalSearch.trim()) return items;
    const search = globalSearch.toLowerCase();
    return items.filter((item) =>
      keys.some((key) => {
        const value = key.split(".").reduce((obj, k) => obj?.[k], item);
        return String(value || "").toLowerCase().includes(search);
      })
    );
  };

  const filteredStores = filterBySearch(stores, ["name", "address"]);
  const filteredMaterials = filterBySearch(materials, ["name", "category"]);
  const filteredProducts = filterBySearch(products, ["name"]);
  const filteredInventory = filterBySearch(inventory, ["stores.name", "sku_materials.name"]);

  const categoryLabels: Record<string, string> = {
    bean: "咖啡豆",
    milk: "乳制品",
    packaging: "包材",
    syrup: "糖浆",
    other: "其他",
  };

  return (
    <div className="h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">KAKAGO 数据中心</h1>
          <Badge 
            variant="outline" 
            className={`ml-2 ${
              realtimeStatus === "connected" 
                ? "border-success text-success" 
                : realtimeStatus === "connecting"
                ? "border-yellow-500 text-yellow-500"
                : "border-destructive text-destructive"
            }`}
          >
            <Radio className="w-3 h-3 mr-1 animate-pulse" />
            {realtimeStatus === "connected" ? "实时同步" : realtimeStatus === "connecting" ? "连接中..." : "离线"}
          </Badge>
        </div>
        
        {/* Global Search */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="全局搜索：门店名 / SKU名 / 物料名..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Zap className="w-4 h-4 mr-2" />
            总览
          </TabsTrigger>
          <TabsTrigger value="api-docs" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Code2 className="w-4 h-4 mr-2" />
            API 字典
          </TabsTrigger>
          <TabsTrigger value="stores" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Store className="w-4 h-4 mr-2" />
            门店
          </TabsTrigger>
          <TabsTrigger value="materials" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Layers className="w-4 h-4 mr-2" />
            物料
          </TabsTrigger>
          <TabsTrigger value="products" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Package className="w-4 h-4 mr-2" />
            产品
          </TabsTrigger>
          <TabsTrigger value="inventory" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Warehouse className="w-4 h-4 mr-2" />
            库存
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  门店总数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stores.length}</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  物料种类
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{materials.length}</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  产品数量
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{products.length}</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Warehouse className="w-4 h-4" />
                  库存记录
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{inventory.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  最近库存变动
                  <Badge variant="outline" className="border-primary text-primary">
                    <Radio className="w-3 h-3 mr-1" />
                    实时
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {inventory.slice(0, 5).map((inv: any) => (
                    <div key={inv.id} className="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
                      <span className="text-muted-foreground">{inv.stores?.name}</span>
                      <span className="text-foreground">{inv.sku_materials?.name}</span>
                      <span className="font-mono text-primary">{inv.current_quantity} {inv.sku_materials?.unit_usage}</span>
                      <JsonViewer data={inv} title={`${inv.stores?.name} - ${inv.sku_materials?.name}`} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm">BOM 配方概览</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {bomRecipes.slice(0, 5).map((bom: any) => (
                    <div key={bom.id} className="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
                      <span className="text-foreground">{bom.sku_products?.name}</span>
                      <span className="text-muted-foreground">← {bom.sku_materials?.name}</span>
                      <span className="font-mono text-primary">{bom.usage_quantity}</span>
                      <JsonViewer data={bom} title={`配方: ${bom.sku_products?.name}`} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* API Docs Tab */}
        <TabsContent value="api-docs" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-primary" />
                API 接口字典
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Base URL: <code className="bg-background px-2 py-0.5 rounded text-primary">https://krhfrxllnrtjwqbpnbvv.supabase.co/rest/v1</code>
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {API_ENDPOINTS.map((category) => (
                <div key={category.category}>
                  <h3 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-2">
                    {category.category}
                  </h3>
                  <div className="space-y-2">
                    {category.endpoints.map((endpoint, idx) => (
                      <div key={idx} className="bg-background rounded-lg p-3 border border-border">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge 
                            variant="outline" 
                            className={`font-mono text-xs ${
                              endpoint.method === "GET" 
                                ? "border-success text-success" 
                                : endpoint.method === "POST"
                                ? "border-primary text-primary"
                                : "border-yellow-500 text-yellow-500"
                            }`}
                          >
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm text-foreground flex-1">{endpoint.path}</code>
                          <CopyButton text={`${endpoint.path}`} />
                        </div>
                        <p className="text-xs text-muted-foreground">{endpoint.desc}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">示例:</span>
                          <code className="text-xs bg-card px-2 py-0.5 rounded text-primary">{endpoint.example}</code>
                          <CopyButton text={endpoint.example} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stores Tab */}
        <TabsContent value="stores" className="space-y-4">
          <Card className="bg-card border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>门店名称</TableHead>
                  <TableHead>地址</TableHead>
                  <TableHead>联系电话</TableHead>
                  <TableHead className="text-center">状态</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      暂无门店数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStores.map((store: any) => (
                    <TableRow key={store.id} className="border-border">
                      <TableCell className="font-medium">{store.name}</TableCell>
                      <TableCell className="text-muted-foreground">{store.address || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{store.contact_phone || "-"}</TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={store.status === "active" ? "default" : "secondary"}
                          className={store.status === "active" ? "bg-success text-success-foreground" : ""}
                        >
                          {store.status === "active" ? "营业中" : store.status === "renovating" ? "装修中" : "暂停"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <JsonViewer data={store} title={store.name} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-4">
          <Card className="bg-card border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>物料名称</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead className="text-center">采购规格</TableHead>
                  <TableHead className="text-center">消耗规格</TableHead>
                  <TableHead className="text-center">换算率</TableHead>
                  <TableHead className="text-right">成本</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      暂无物料数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMaterials.map((material: any) => (
                    <TableRow key={material.id} className="border-border">
                      <TableCell className="font-medium">{material.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-border">
                          {categoryLabels[material.category] || material.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">{material.unit_purchase}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{material.unit_usage}</TableCell>
                      <TableCell className="text-center">
                        <span className="font-mono text-primary font-semibold">{material.conversion_rate}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono">¥{material.cost?.toFixed(2)}</TableCell>
                      <TableCell>
                        <JsonViewer data={material} title={material.name} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card className="bg-card border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-16">图片</TableHead>
                  <TableHead>产品名称</TableHead>
                  <TableHead className="text-right">售价</TableHead>
                  <TableHead className="text-center">状态</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      暂无产品数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product: any) => (
                    <TableRow key={product.id} className="border-border">
                      <TableCell>
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right font-mono">¥{product.price?.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={product.is_active ? "default" : "secondary"}
                          className={product.is_active ? "bg-success text-success-foreground" : ""}
                        >
                          {product.is_active ? "上架" : "下架"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <JsonViewer data={product} title={product.name} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <Card className="bg-card border-border overflow-hidden">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-sm flex items-center gap-2">
                <Warehouse className="w-4 h-4" />
                全网库存实时视图
                <Badge variant="outline" className="border-primary text-primary ml-2">
                  <Radio className="w-3 h-3 mr-1 animate-pulse" />
                  实时同步
                </Badge>
              </CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>门店</TableHead>
                  <TableHead>物料</TableHead>
                  <TableHead className="text-right">当前库存</TableHead>
                  <TableHead className="text-right">理论库存</TableHead>
                  <TableHead className="text-center">最后盘点</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      暂无库存数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map((inv: any) => (
                    <TableRow key={inv.id} className="border-border">
                      <TableCell className="font-medium">{inv.stores?.name || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{inv.sku_materials?.name || "-"}</TableCell>
                      <TableCell className="text-right font-mono text-foreground">
                        {inv.current_quantity} <span className="text-muted-foreground text-xs">{inv.sku_materials?.unit_usage}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {inv.theoretical_quantity}
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground">
                        {inv.last_stocktake_at 
                          ? new Date(inv.last_stocktake_at).toLocaleDateString("zh-CN")
                          : "-"
                        }
                      </TableCell>
                      <TableCell>
                        <JsonViewer data={inv} title={`${inv.stores?.name} - ${inv.sku_materials?.name}`} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
