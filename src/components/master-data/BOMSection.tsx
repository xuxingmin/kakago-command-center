import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Link2, Trash2, Coffee, Package, AlertTriangle, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BatchUploadButton, FieldMapping } from "./BatchUploadButton";

type Product = {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
};

type Material = {
  id: string;
  name: string;
  unit_usage: string;
  category: string;
};

type BOMRecipe = {
  id: string;
  product_id: string;
  material_id: string;
  usage_quantity: number;
  sku_materials?: {
    name: string;
    unit_usage: string;
  };
};

interface BOMSectionProps {
  products: Product[];
  materials: Material[];
  queryClient: any;
}

// BOM field mappings for batch upload
const bomFieldMappings: FieldMapping[] = [
  { dbField: "product_name", excelField: "产品名称", label: "产品名称", required: true },
  { dbField: "material_name", excelField: "物料名称", label: "物料名称", required: true },
  { dbField: "usage_quantity", excelField: "消耗量", label: "消耗量", required: true, transform: (v) => parseFloat(v) || 0 },
];

const bomSampleData = [
  { "产品名称": "热拿铁", "物料名称": "KAKA01拼配", "消耗量": "18" },
  { "产品名称": "热拿铁", "物料名称": "未来牧场4.0", "消耗量": "220" },
  { "产品名称": "热拿铁", "物料名称": "热杯", "消耗量": "1" },
  { "产品名称": "冰拿铁", "物料名称": "KAKA01拼配", "消耗量": "18" },
  { "产品名称": "冰拿铁", "物料名称": "未来牧场4.0", "消耗量": "180" },
  { "产品名称": "冰拿铁", "物料名称": "冰杯", "消耗量": "1" },
];

export function BOMSection({ products, materials, queryClient }: BOMSectionProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Fetch BOM recipes for selected product
  const { data: productRecipes = [], isLoading } = useQuery({
    queryKey: ["bom_recipes", selectedProductId],
    queryFn: async () => {
      if (!selectedProductId) return [];
      const { data, error } = await supabase
        .from("bom_recipes")
        .select("*, sku_materials(name, unit_usage)")
        .eq("product_id", selectedProductId);
      if (error) throw error;
      return data as BOMRecipe[];
    },
    enabled: !!selectedProductId,
  });

  // Fetch all BOM to check which products have recipes
  const { data: allBOM = [] } = useQuery({
    queryKey: ["all_bom_check"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bom_recipes").select("product_id");
      if (error) throw error;
      return data;
    },
  });

  const productIdsWithBOM = new Set(allBOM.map(b => b.product_id));

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Get materials not yet in recipe
  const usedMaterialIds = new Set(productRecipes.map(r => r.material_id));
  const availableMaterials = materials.filter(m => !usedMaterialIds.has(m.id));

  // Handle BOM batch upload
  const handleBOMBatchUpload = async (data: any[]) => {
    // Build name-to-ID lookup maps
    const productNameToId = new Map(products.map(p => [p.name, p.id]));
    const materialNameToId = new Map(materials.map(m => [m.name, m.id]));

    const bomRecords: { product_id: string; material_id: string; usage_quantity: number }[] = [];
    const errors: string[] = [];

    data.forEach((row, index) => {
      const productId = productNameToId.get(row.product_name);
      const materialId = materialNameToId.get(row.material_name);

      if (!productId) {
        errors.push(`第 ${index + 1} 行: 产品 "${row.product_name}" 不存在`);
        return;
      }
      if (!materialId) {
        errors.push(`第 ${index + 1} 行: 物料 "${row.material_name}" 不存在`);
        return;
      }

      bomRecords.push({
        product_id: productId,
        material_id: materialId,
        usage_quantity: row.usage_quantity,
      });
    });

    if (errors.length > 0) {
      throw new Error(errors.slice(0, 5).join("\n"));
    }

    const { error } = await supabase.from("bom_recipes").insert(bomRecords);
    if (error) throw error;

    queryClient.invalidateQueries({ queryKey: ["bom_recipes"] });
    queryClient.invalidateQueries({ queryKey: ["master_bom"] });
    queryClient.invalidateQueries({ queryKey: ["all_bom_check"] });
  };

  return (
    <div className="grid grid-cols-3 gap-4 h-[calc(100vh-280px)]">
      {/* Left: Product List */}
      <Card className="bg-card border-border col-span-1 flex flex-col">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Coffee className="w-4 h-4 text-amber-400" />
            选择产品
          </CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索产品..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background border-border"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => setSelectedProductId(product.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                    selectedProductId === product.id
                      ? "bg-primary/20 border border-primary/50"
                      : "hover:bg-secondary border border-transparent"
                  }`}
                >
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-muted-foreground">¥{product.price.toFixed(2)}</p>
                  </div>
                  {productIdsWithBOM.has(product.id) ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Right: BOM Configuration */}
      <Card className="bg-card border-border col-span-2 flex flex-col">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-purple-400" />
              {selectedProduct ? (
                <>
                  配方配置: <span className="text-primary">{selectedProduct.name}</span>
                </>
              ) : (
                "配方配置"
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <BatchUploadButton
                title="批量导入配方"
                description="上传 Excel 文件批量导入 BOM 配方数据。请确保产品和物料已存在于系统中。"
                fieldMappings={bomFieldMappings}
                onUpload={handleBOMBatchUpload}
                sampleData={bomSampleData}
              />
              {selectedProductId && (
                <AddMaterialDialog 
                  productId={selectedProductId}
                  availableMaterials={availableMaterials}
                queryClient={queryClient}
                />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          {!selectedProductId ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Link2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>请从左侧选择一个产品</p>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : productRecipes.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>该产品尚未配置原物料</p>
                <p className="text-xs mt-1">点击右上角"添加原物料"开始配置</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>原物料</TableHead>
                  <TableHead className="text-center">消耗量</TableHead>
                  <TableHead className="text-center">单位</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productRecipes.map((recipe) => (
                  <RecipeRow 
                    key={recipe.id} 
                    recipe={recipe} 
                    queryClient={queryClient}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RecipeRow({ recipe, queryClient }: { recipe: BOMRecipe; queryClient: any }) {
  const [quantity, setQuantity] = useState(recipe.usage_quantity.toString());
  const [isEditing, setIsEditing] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("bom_recipes")
        .update({ usage_quantity: parseFloat(quantity) || 0 })
        .eq("id", recipe.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bom_recipes"] });
      queryClient.invalidateQueries({ queryKey: ["master_bom"] });
      queryClient.invalidateQueries({ queryKey: ["all_bom_check"] });
      toast.success("配方已更新");
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("bom_recipes").delete().eq("id", recipe.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bom_recipes"] });
      queryClient.invalidateQueries({ queryKey: ["master_bom"] });
      queryClient.invalidateQueries({ queryKey: ["all_bom_check"] });
      toast.success("已移除原物料");
    },
  });

  return (
    <TableRow className="border-border">
      <TableCell className="font-medium">{recipe.sku_materials?.name}</TableCell>
      <TableCell className="text-center">
        {isEditing ? (
          <div className="flex items-center gap-2 justify-center">
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-20 h-8 text-center bg-background border-border"
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-8"
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="font-mono text-primary font-semibold hover:underline"
          >
            {recipe.usage_quantity}
          </button>
        )}
      </TableCell>
      <TableCell className="text-center text-muted-foreground">
        {recipe.sku_materials?.unit_usage}
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </Button>
      </TableCell>
    </TableRow>
  );
}

function AddMaterialDialog({ 
  productId, 
  availableMaterials, 
  queryClient 
}: { 
  productId: string;
  availableMaterials: Material[];
  queryClient: any;
}) {
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [quantity, setQuantity] = useState("0");

  const selectedMaterial = availableMaterials.find(m => m.id === selectedMaterialId);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedMaterialId) throw new Error("请选择原物料");
      const qty = parseFloat(quantity);
      if (!qty || qty <= 0) throw new Error("消耗量必须大于0");

      const { error } = await supabase.from("bom_recipes").insert({
        product_id: productId,
        material_id: selectedMaterialId,
        usage_quantity: qty,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bom_recipes"] });
      queryClient.invalidateQueries({ queryKey: ["master_bom"] });
      queryClient.invalidateQueries({ queryKey: ["all_bom_check"] });
      toast.success("原物料已添加");
      setSelectedMaterialId("");
      setQuantity("0");
    },
    onError: (err: any) => {
      toast.error(err.message || "添加失败");
    },
  });

  if (availableMaterials.length === 0) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        已添加所有原物料
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
        <SelectTrigger className="w-40 bg-background border-border">
          <SelectValue placeholder="选择原物料" />
        </SelectTrigger>
        <SelectContent>
          {availableMaterials.map((material) => (
            <SelectItem key={material.id} value={material.id}>
              {material.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder="消耗量"
        className="w-24 bg-background border-border"
      />
      
      {selectedMaterial && (
        <span className="text-sm text-muted-foreground">{selectedMaterial.unit_usage}</span>
      )}
      
      <Button
        size="sm"
        onClick={() => mutation.mutate()}
        disabled={!selectedMaterialId || mutation.isPending}
        className="bg-primary hover:bg-primary/90"
      >
        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
      </Button>
    </div>
  );
}
