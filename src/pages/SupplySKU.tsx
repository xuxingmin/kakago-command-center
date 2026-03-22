import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Package, Layers, Check, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Product = {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  image_url: string | null;
};

type Material = {
  id: string;
  name: string;
  category: string;
  main_category: string;
  sub_category: string;
  cost: number;
  unit_purchase: string;
  unit_usage: string;
  conversion_rate: number;
};

// Two-level category mapping
const CATEGORY_TREE: Record<string, string[]> = {
  "食材": ["咖啡豆", "乳制品", "糖浆", "其他"],
  "包材": ["杯具", "打包物", "其他"],
};

const MAIN_CATEGORIES = Object.keys(CATEGORY_TREE);

// Sort weight: 食材=1, 包材·杯具=2, 包材·打包物=3, 包材·其他=4
const getSortWeight = (main: string, sub: string): number => {
  if (main === "食材") return 1;
  if (main === "包材" && sub === "杯具") return 2;
  if (main === "包材" && sub === "打包物") return 3;
  return 4;
};

export default function SupplySKU() {
  const [activeTab, setActiveTab] = useState("products");
  const [productSearch, setProductSearch] = useState("");
  const [materialSearch, setMaterialSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ["sku_products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sku_products").select("*").order("name");
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: materials = [] } = useQuery({
    queryKey: ["sku_materials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sku_materials").select("*").order("name");
      if (error) throw error;
      return data as Material[];
    },
  });

  const { data: bomRecipes = [] } = useQuery({
    queryKey: ["bom_recipes_status"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bom_recipes").select("product_id");
      if (error) throw error;
      return data;
    },
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sku_materials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sku_materials"] });
      toast.success("物料已删除");
    },
    onError: () => toast.error("删除失败，该物料可能被配方引用"),
  });

  const productIdsWithRecipe = new Set(bomRecipes.map((r) => r.product_id));

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Sort materials by weight then name
  const sortedMaterials = [...materials]
    .filter((m) => m.name.toLowerCase().includes(materialSearch.toLowerCase()))
    .sort((a, b) => {
      const wa = getSortWeight(a.main_category, a.sub_category);
      const wb = getSortWeight(b.main_category, b.sub_category);
      if (wa !== wb) return wa - wb;
      if (a.sub_category !== b.sub_category) return a.sub_category.localeCompare(b.sub_category);
      return a.name.localeCompare(b.name);
    });

  // Group materials by main_category → sub_category (preserving sort order)
  const groupedMaterials: { main: string; sub: string; items: Material[] }[] = [];
  for (const m of sortedMaterials) {
    const last = groupedMaterials[groupedMaterials.length - 1];
    if (last && last.main === m.main_category && last.sub === m.sub_category) {
      last.items.push(m);
    } else {
      groupedMaterials.push({ main: m.main_category, sub: m.sub_category, items: [m] });
    }
  }

  // Pre-compute mainCategory spans
  const mainSpans: Record<string, number> = {};
  for (const g of groupedMaterials) {
    mainSpans[g.main] = (mainSpans[g.main] || 0) + g.items.length;
  }

  // Track which main categories have been rendered
  const mainRendered = new Set<string>();

  return (
    <div className="h-full space-y-4">
      <div className="flex items-center gap-3">
        <Package className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">SKU 主数据</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="products" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Package className="w-4 h-4 mr-2" />
            产品管理
          </TabsTrigger>
          <TabsTrigger value="materials" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Layers className="w-4 h-4 mr-2" />
            原物料管理
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Products */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索产品..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-9 bg-card border-border"
              />
            </div>
            <ProductDialog queryClient={queryClient} />
          </div>

          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-16">图片</TableHead>
                  <TableHead>产品名称</TableHead>
                  <TableHead className="text-right">售价</TableHead>
                  <TableHead className="text-center">状态</TableHead>
                  <TableHead className="text-center">配方状态</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      暂无产品数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
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
                      <TableCell className="text-right font-mono">¥{product.price.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={product.is_active ? "default" : "secondary"} className={product.is_active ? "bg-success text-success-foreground" : ""}>
                          {product.is_active ? "上架" : "下架"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {productIdsWithRecipe.has(product.id) ? (
                          <Badge className="bg-success/20 text-success border-success/30">
                            <Check className="w-3 h-3 mr-1" />
                            已配置
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            未配置
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <ProductDialog queryClient={queryClient} product={product} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tab 2: Materials — weight-sorted, sticky header, vertical scroll */}
        <TabsContent value="materials" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索原物料..."
                value={materialSearch}
                onChange={(e) => setMaterialSearch(e.target.value)}
                className="pl-9 bg-card border-border"
              />
            </div>
            <MaterialDialog queryClient={queryClient} />
          </div>

          <div className="rounded-lg border border-border bg-card overflow-hidden overflow-x-hidden max-h-[calc(100vh-250px)] overflow-y-auto relative">
            <table className="w-full caption-bottom text-sm table-fixed">
              <thead className="sticky top-0 z-10 bg-card border-b border-border">
                 <tr className="border-border">
                  <th className="h-11 px-3 text-left align-middle font-medium text-muted-foreground w-[10%]">一级分类</th>
                  <th className="h-11 px-3 text-left align-middle font-medium text-muted-foreground w-[10%]">二级分类</th>
                  <th className="h-11 px-3 text-left align-middle font-medium text-muted-foreground w-[18%]">物料名称</th>
                  <th className="h-11 px-3 text-center align-middle font-medium text-muted-foreground w-[10%]">采购规格</th>
                  <th className="h-11 px-3 text-center align-middle font-medium text-muted-foreground w-[10%]">消耗规格</th>
                  <th className="h-11 px-3 text-center align-middle font-medium text-muted-foreground w-[18%]">换算率</th>
                  <th className="h-11 px-3 text-right align-middle font-medium text-muted-foreground w-[14%]">
                    <span title="由入库记录加权计算，不可手动修改">加权平均单价</span>
                    <span className="block text-[10px] text-muted-foreground/60 font-normal">（消耗单位·只读）</span>
                  </th>
                  <th className="h-11 px-3 align-middle font-medium text-muted-foreground w-[10%]">操作</th>
                </tr>
              </thead>
              <tbody>
                {groupedMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted-foreground py-8">
                      暂无物料数据
                    </td>
                  </tr>
                ) : (
                  groupedMaterials.map((group) => {
                    const showMain = !mainRendered.has(group.main);
                    if (showMain) mainRendered.add(group.main);

                    return group.items.map((material, idx) => (
                      <tr key={material.id} className="border-b border-border transition-colors hover:bg-muted/50">
                        {/* Main category rowSpan */}
                        {showMain && idx === 0 && (
                          <td
                            rowSpan={mainSpans[group.main]}
                            className="px-3 py-2 align-top font-semibold text-primary border-r border-border bg-primary/5"
                          >
                            {group.main}
                          </td>
                        )}
                        {/* Sub category rowSpan */}
                        {idx === 0 && (
                          <td
                            rowSpan={group.items.length}
                            className="px-3 py-2 align-top text-muted-foreground border-r border-border"
                          >
                            {group.sub}
                          </td>
                        )}
                        <td className="px-3 py-2 font-medium">{material.name}</td>
                        <td className="px-3 py-2 text-center text-muted-foreground">{material.unit_purchase}</td>
                        <td className="px-3 py-2 text-center text-muted-foreground">{material.unit_usage}</td>
                        <td className="px-3 py-2 text-center">
                          <span className="font-mono text-primary font-semibold">{material.conversion_rate}</span>
                          <span className="text-xs text-muted-foreground ml-1 break-words">
                            (1{material.unit_purchase}={material.conversion_rate}{material.unit_usage})
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-muted-foreground" title="由入库加权计算，此处不可编辑">¥{material.cost.toFixed(2)}/{material.unit_usage}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            <MaterialDialog queryClient={queryClient} material={material} />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => deleteMaterialMutation.mutate(material.id)}
                              disabled={deleteMaterialMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ));
                  })
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Product Dialog Component
function ProductDialog({ queryClient, product }: { queryClient: any; product?: Product }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(product?.name || "");
  const [price, setPrice] = useState(product?.price?.toString() || "0");
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [imageUrl, setImageUrl] = useState(product?.image_url || "");

  const isEdit = !!product;

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        price: parseFloat(price) || 0,
        is_active: isActive,
        image_url: imageUrl.trim() || null,
      };
      if (isEdit) {
        const { error } = await supabase.from("sku_products").update(payload).eq("id", product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sku_products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sku_products"] });
      toast.success(isEdit ? "产品已更新" : "产品已添加");
      setOpen(false);
      if (!isEdit) { setName(""); setPrice("0"); setIsActive(true); setImageUrl(""); }
    },
    onError: () => toast.error("操作失败"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="w-4 h-4" /></Button>
        ) : (
          <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />新增产品</Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader><DialogTitle>{isEdit ? "编辑产品" : "新增产品"}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>产品名称 *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：拿铁" className="bg-background border-border" />
          </div>
          <div className="space-y-2">
            <Label>售价 *</Label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className="bg-background border-border" />
          </div>
          <div className="space-y-2">
            <Label>图片链接</Label>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="bg-background border-border" />
          </div>
          <div className="space-y-2">
            <Label>状态</Label>
            <Select value={isActive ? "active" : "inactive"} onValueChange={(v) => setIsActive(v === "active")}>
              <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">上架</SelectItem>
                <SelectItem value="inactive">下架</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending} className="w-full bg-primary hover:bg-primary/90">
            {mutation.isPending ? "保存中..." : "保存"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Material Dialog Component — with cascading category selects
function MaterialDialog({ queryClient, material }: { queryClient: any; material?: Material }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(material?.name || "");
  const [mainCategory, setMainCategory] = useState(material?.main_category || "食材");
  const [subCategory, setSubCategory] = useState(material?.sub_category || "咖啡豆");
  const [unitPurchase, setUnitPurchase] = useState(material?.unit_purchase || "箱");
  const [unitUsage, setUnitUsage] = useState(material?.unit_usage || "g");
  const [conversionRate, setConversionRate] = useState(material?.conversion_rate?.toString() || "1");

  const isEdit = !!material;

  const mapToLegacyCategory = (main: string, sub: string): string => {
    if (sub === "咖啡豆") return "bean";
    if (sub === "乳制品") return "milk";
    if (sub === "糖浆") return "syrup";
    if (main === "包材") return "packaging";
    return "other";
  };

  const subOptions = CATEGORY_TREE[mainCategory] || ["其他"];

  const handleMainChange = (val: string) => {
    setMainCategory(val);
    const subs = CATEGORY_TREE[val] || ["其他"];
    setSubCategory(subs[0]);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const rate = parseFloat(conversionRate);
      if (!rate || rate <= 0) throw new Error("换算率必须大于0");

      const payload = {
        name: name.trim(),
        category: mapToLegacyCategory(mainCategory, subCategory) as any,
        main_category: mainCategory,
        sub_category: subCategory,
        unit_purchase: unitPurchase.trim(),
        unit_usage: unitUsage.trim(),
        conversion_rate: rate,
      };

      if (isEdit) {
        const { error } = await supabase.from("sku_materials").update(payload).eq("id", material.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sku_materials").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sku_materials"] });
      toast.success(isEdit ? "物料已更新" : "物料已添加");
      setOpen(false);
      if (!isEdit) {
        setName(""); setMainCategory("食材"); setSubCategory("咖啡豆");
        setCost("0"); setUnitPurchase("箱"); setUnitUsage("g"); setConversionRate("1");
      }
    },
    onError: (err: any) => toast.error(err.message || "操作失败"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="w-4 h-4" /></Button>
        ) : (
          <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />新增物料</Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? "编辑物料" : "新增物料"}</DialogTitle></DialogHeader>
        <div className="space-y-5 pt-4">
          {/* Section: 分类信息 */}
          <div className="space-y-3 p-3 rounded-lg border border-border bg-secondary/10">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">分类信息</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">一级分类 *</Label>
                <Select value={mainCategory} onValueChange={handleMainChange}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MAIN_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">二级分类 *</Label>
                <Select value={subCategory} onValueChange={setSubCategory}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {subOptions.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section: 基础信息 */}
          <div className="space-y-3 p-3 rounded-lg border border-border bg-secondary/10">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">基础信息</p>
            <div className="space-y-2">
              <Label className="text-xs">物料名称 *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：厚椰乳" className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">单位成本 (¥)</Label>
              <Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} className="bg-background border-border" />
            </div>
          </div>

          {/* Section: 规格换算 */}
          <div className="space-y-3 p-3 rounded-lg border border-border bg-secondary/10">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">规格换算</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">采购规格</Label>
                <Input value={unitPurchase} onChange={(e) => setUnitPurchase(e.target.value)} className="bg-background border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">消耗规格</Label>
                <Input value={unitUsage} onChange={(e) => setUnitUsage(e.target.value)} className="bg-background border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">换算率</Label>
                <Input type="number" value={conversionRate} onChange={(e) => setConversionRate(e.target.value)} className="bg-background border-border" />
              </div>
            </div>
            {parseFloat(conversionRate) > 0 && (
              <p className="text-xs text-primary font-mono">
                1 {unitPurchase} = {conversionRate} {unitUsage}
              </p>
            )}
          </div>

          <Button onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending} className="w-full bg-primary hover:bg-primary/90">
            {mutation.isPending ? "保存中..." : "保存"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
