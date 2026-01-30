import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, Pencil, Coffee, Package, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";
import { BatchUploadButton, FieldMapping } from "./BatchUploadButton";

type Product = {
  id: string;
  name: string;
  name_en: string | null;
  price: number;
  spec_ml: number | null;
  description: string | null;
  attributes: string | null;
  notes: string | null;
  is_active: boolean;
  image_url: string | null;
};

const productFieldMappings: FieldMapping[] = [
  { dbField: "name", excelField: "产品名称", label: "产品名称", required: true },
  { dbField: "name_en", excelField: "英文名称", label: "英文名称" },
  { dbField: "price", excelField: "售价 (元)", label: "售价", required: true, transform: (v) => parseFloat(v) || 0 },
  { dbField: "spec_ml", excelField: "规格 (ml)", label: "规格ml", transform: (v) => v ? parseFloat(v) : null },
  { dbField: "description", excelField: "产品介绍", label: "介绍" },
  { dbField: "attributes", excelField: "产品属性", label: "属性" },
  { dbField: "notes", excelField: "备注", label: "备注" },
  { 
    dbField: "is_active", 
    excelField: "上架状态", 
    label: "上架",
    transform: (v) => v === "是" || v === "true" || v === true || v === 1
  },
];

const productSampleData = [
  { "产品名称": "热美式", "英文名称": "Hot Americano", "售价 (元)": "12", "规格 (ml)": "350", "上架状态": "是" },
  { "产品名称": "冰拿铁", "英文名称": "Iced Latte", "售价 (元)": "15", "规格 (ml)": "450", "上架状态": "是" },
];

interface ProductsSectionProps {
  products: Product[];
  productsWithoutBOM: Product[];
  queryClient: any;
}

export function ProductsSection({ products, productsWithoutBOM, queryClient }: ProductsSectionProps) {
  const [search, setSearch] = useState("");

  const productIdsWithoutBOM = new Set(productsWithoutBOM.map(p => p.id));

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleBatchUpload = async (data: any[]) => {
    const { error } = await supabase.from("sku_products").insert(data);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["master_products"] });
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <Coffee className="w-5 h-5 text-amber-400" />
              产品/SKU 管理
            </CardTitle>
            {productsWithoutBOM.length > 0 && (
              <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {productsWithoutBOM.length} 个未配置 BOM
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索产品..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64 bg-background border-border"
              />
            </div>
            <BatchUploadButton
              title="批量导入产品"
              description="上传 Excel 文件批量导入产品数据，支持 .xlsx 和 .csv 格式"
              fieldMappings={productFieldMappings}
              onUpload={handleBatchUpload}
              sampleData={productSampleData}
            />
            <ProductDialog queryClient={queryClient} existingNames={products.map(p => p.name)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-16">图片</TableHead>
              <TableHead>产品名称</TableHead>
              <TableHead className="text-right">售价</TableHead>
              <TableHead className="text-center">状态</TableHead>
              <TableHead className="text-center">BOM 状态</TableHead>
              <TableHead className="w-12"></TableHead>
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
                    <Badge 
                      variant={product.is_active ? "default" : "secondary"}
                      className={product.is_active ? "bg-success text-success-foreground" : ""}
                    >
                      {product.is_active ? "上架" : "下架"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {productIdsWithoutBOM.has(product.id) ? (
                      <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        未配置
                      </Badge>
                    ) : (
                      <Badge className="bg-success/20 text-success border-success/30">
                        <Check className="w-3 h-3 mr-1" />
                        已配置
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <ProductDialog 
                      queryClient={queryClient} 
                      product={product}
                      existingNames={products.filter(p => p.id !== product.id).map(p => p.name)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ProductDialog({ 
  queryClient, 
  product,
  existingNames 
}: { 
  queryClient: any; 
  product?: Product;
  existingNames: string[];
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(product?.name || "");
  const [nameEn, setNameEn] = useState(product?.name_en || "");
  const [price, setPrice] = useState(product?.price?.toString() || "0");
  const [specMl, setSpecMl] = useState(product?.spec_ml?.toString() || "");
  const [description, setDescription] = useState(product?.description || "");
  const [attributes, setAttributes] = useState(product?.attributes || "");
  const [notes, setNotes] = useState(product?.notes || "");
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [error, setError] = useState("");

  const isEdit = !!product;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) {
        setError("产品中文名称不能为空");
        throw new Error("验证失败");
      }
      if (existingNames.includes(name.trim())) {
        setError("产品名称已存在");
        throw new Error("验证失败");
      }
      setError("");

      const payload = {
        name: name.trim(),
        name_en: nameEn.trim() || null,
        price: parseFloat(price) || 0,
        spec_ml: specMl ? parseFloat(specMl) : null,
        description: description.trim() || null,
        attributes: attributes.trim() || null,
        notes: notes.trim() || null,
        is_active: isActive,
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
      queryClient.invalidateQueries({ queryKey: ["master_products"] });
      queryClient.invalidateQueries({ queryKey: ["datahub_products"] });
      toast.success(isEdit ? "产品已更新" : "产品已添加");
      setOpen(false);
      if (!isEdit) {
        setName("");
        setNameEn("");
        setPrice("0");
        setSpecMl("");
        setDescription("");
        setAttributes("");
        setNotes("");
        setIsActive(true);
      }
    },
    onError: (err: any) => {
      if (err.message !== "验证失败") {
        toast.error("操作失败");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setError(""); }}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="w-4 h-4" />
          </Button>
        ) : (
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            新增产品
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑产品" : "新增产品"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>产品中文名称 *</Label>
              <Input 
                value={name} 
                onChange={(e) => { setName(e.target.value); setError(""); }}
                placeholder="如：生椰拿铁" 
                className={`bg-background border-border ${error ? 'border-destructive' : ''}`}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
            <div className="space-y-2">
              <Label>英文名称</Label>
              <Input 
                value={nameEn} 
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Coconut Latte" 
                className="bg-background border-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>售价 (¥) *</Label>
              <Input 
                type="number" 
                value={price} 
                onChange={(e) => setPrice(e.target.value)} 
                placeholder="0.00" 
                className="bg-background border-border" 
              />
            </div>
            <div className="space-y-2">
              <Label>产品规格 (ml)</Label>
              <Input 
                type="number" 
                value={specMl} 
                onChange={(e) => setSpecMl(e.target.value)} 
                placeholder="如：350" 
                className="bg-background border-border" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>产品介绍</Label>
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="描述产品的特色、口味、原料等..."
              className="bg-background border-border min-h-[80px]" 
            />
          </div>

          <div className="space-y-2">
            <Label>产品属性</Label>
            <Input 
              value={attributes} 
              onChange={(e) => setAttributes(e.target.value)} 
              placeholder="如：冷饮、热饮、含咖啡因" 
              className="bg-background border-border" 
            />
          </div>

          <div className="space-y-2">
            <Label>产品备注</Label>
            <Textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="内部备注信息..."
              className="bg-background border-border min-h-[60px]" 
            />
          </div>

          <div className="flex items-center justify-between py-2 border-t border-border pt-4">
            <Label>上架状态</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {mutation.isPending ? "保存中..." : "保存产品"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
