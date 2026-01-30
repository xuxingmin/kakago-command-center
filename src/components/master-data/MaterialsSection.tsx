import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, Pencil, Package, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { BatchUploadButton, FieldMapping } from "./BatchUploadButton";

type Material = {
  id: string;
  name: string;
  category: "bean" | "milk" | "packaging" | "syrup" | "other";
  cost: number;
  unit_purchase: string;
  unit_usage: string;
  conversion_rate: number;
};

const materialSchema = z.object({
  name: z.string().trim().min(1, "物料名称不能为空").max(100, "名称不能超过100字符"),
  category: z.enum(["bean", "milk", "packaging", "syrup", "other"]),
  unit_purchase: z.string().trim().min(1, "采购单位不能为空"),
  unit_usage: z.string().trim().min(1, "消耗单位不能为空"),
  conversion_rate: z.number().positive("换算率必须大于0"),
  cost: z.number().min(0, "成本不能为负数"),
});

const categoryLabels: Record<string, string> = {
  bean: "咖啡豆",
  milk: "乳制品",
  packaging: "包材",
  syrup: "糖浆",
  other: "其他",
};

// Category mapping from Chinese to enum
const categoryMap: Record<string, Material["category"]> = {
  "咖啡豆": "bean",
  "食材": "other",
  "牛奶": "milk",
  "乳制品": "milk",
  "包材": "packaging",
  "纸杯": "packaging",
  "PE杯": "packaging",
  "PP盖": "packaging",
  "PE盖": "packaging",
  "PP吸管": "packaging",
  "纸袋": "packaging",
  "热敏纸": "packaging",
  "纸杯套": "packaging",
  "可撕拉纸浆托": "packaging",
  "糖浆": "syrup",
};

const materialFieldMappings: FieldMapping[] = [
  { dbField: "name", excelField: "产品名称", label: "物料名称", required: true },
  { 
    dbField: "category", 
    excelField: "分类目名称", 
    label: "分类",
    transform: (v) => categoryMap[v] || "other"
  },
  { dbField: "unit_purchase", excelField: "采购单位", label: "采购单位", required: true },
  { dbField: "unit_usage", excelField: "消耗单位", label: "消耗单位", required: true },
  { dbField: "conversion_rate", excelField: "换算率", label: "换算率", required: true, transform: (v) => parseFloat(v) || 1 },
  { dbField: "cost", excelField: "单位成本", label: "成本", transform: (v) => parseFloat(v) || 0 },
];

const materialSampleData = [
  { "物料 ID": "M001", "产品名称": "未来牧场4.0", "分类目名称": "牛奶", "大类目名称": "乳制品", "采购单位": "盒", "消耗单位": "ml", "换算率": "1000", "单位成本": "0.0075", "供应商": "蒙牛" },
  { "物料 ID": "M002", "产品名称": "KAKA01拼配", "分类目名称": "咖啡豆", "大类目名称": "咖啡豆", "采购单位": "包", "消耗单位": "g", "换算率": "1000", "单位成本": "0.09", "供应商": "云南咖啡" },
];

interface MaterialsSectionProps {
  materials: Material[];
  queryClient: any;
}

export function MaterialsSection({ materials, queryClient }: MaterialsSectionProps) {
  const [search, setSearch] = useState("");

  const filteredMaterials = materials.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleBatchUpload = async (data: any[]) => {
    const { error } = await supabase.from("sku_materials").insert(data);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["master_materials"] });
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            原物料管理
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索物料..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64 bg-background border-border"
              />
            </div>
            <BatchUploadButton
              title="批量导入原物料"
              description="上传 Excel 文件批量导入原物料数据，支持 .xlsx 和 .csv 格式"
              fieldMappings={materialFieldMappings}
              onUpload={handleBatchUpload}
              sampleData={materialSampleData}
            />
            <MaterialDialog queryClient={queryClient} existingNames={materials.map(m => m.name)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>物料名称</TableHead>
              <TableHead>分类</TableHead>
              <TableHead className="text-center">采购单位</TableHead>
              <TableHead className="text-center">消耗单位</TableHead>
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
              filteredMaterials.map((material) => (
                <TableRow key={material.id} className="border-border">
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-border">
                      {categoryLabels[material.category]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">{material.unit_purchase}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{material.unit_usage}</TableCell>
                  <TableCell className="text-center">
                    <span className="font-mono text-primary font-semibold">{material.conversion_rate}</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      (1{material.unit_purchase}={material.conversion_rate}{material.unit_usage})
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">¥{material.cost.toFixed(2)}</TableCell>
                  <TableCell>
                    <MaterialDialog 
                      queryClient={queryClient} 
                      material={material} 
                      existingNames={materials.filter(m => m.id !== material.id).map(m => m.name)}
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

function MaterialDialog({ 
  queryClient, 
  material, 
  existingNames 
}: { 
  queryClient: any; 
  material?: Material;
  existingNames: string[];
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(material?.name || "");
  const [category, setCategory] = useState<Material["category"]>(material?.category || "other");
  const [cost, setCost] = useState(material?.cost?.toString() || "0");
  const [unitPurchase, setUnitPurchase] = useState(material?.unit_purchase || "箱");
  const [unitUsage, setUnitUsage] = useState(material?.unit_usage || "ml");
  const [conversionRate, setConversionRate] = useState(material?.conversion_rate?.toString() || "1");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!material;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) newErrors.name = "物料名称不能为空";
    else if (existingNames.includes(name.trim())) newErrors.name = "物料名称已存在";
    
    if (!unitPurchase.trim()) newErrors.unitPurchase = "采购单位不能为空";
    if (!unitUsage.trim()) newErrors.unitUsage = "消耗单位不能为空";
    
    const rate = parseFloat(conversionRate);
    if (!rate || rate <= 0) newErrors.conversionRate = "换算率必须大于0";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!validate()) throw new Error("验证失败");

      const payload = {
        name: name.trim(),
        category,
        cost: parseFloat(cost) || 0,
        unit_purchase: unitPurchase.trim(),
        unit_usage: unitUsage.trim(),
        conversion_rate: parseFloat(conversionRate),
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
      queryClient.invalidateQueries({ queryKey: ["master_materials"] });
      queryClient.invalidateQueries({ queryKey: ["datahub_materials"] });
      toast.success(isEdit ? "物料已更新" : "物料已添加");
      setOpen(false);
      if (!isEdit) resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "操作失败");
    },
  });

  const resetForm = () => {
    setName("");
    setCategory("other");
    setCost("0");
    setUnitPurchase("箱");
    setUnitUsage("ml");
    setConversionRate("1");
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setErrors({}); }}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="w-4 h-4" />
          </Button>
        ) : (
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            新增物料
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑物料" : "新增物料"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>物料名称 *</Label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="如：厚椰乳" 
              className={`bg-background border-border ${errors.name ? 'border-destructive' : ''}`}
            />
            {errors.name && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>分类 *</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Material["category"])}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bean">咖啡豆</SelectItem>
                <SelectItem value="milk">乳制品</SelectItem>
                <SelectItem value="packaging">包材</SelectItem>
                <SelectItem value="syrup">糖浆</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>采购单位 *</Label>
              <Input 
                value={unitPurchase} 
                onChange={(e) => setUnitPurchase(e.target.value)} 
                placeholder="箱"
                className={`bg-background border-border ${errors.unitPurchase ? 'border-destructive' : ''}`}
              />
            </div>
            <div className="space-y-2">
              <Label>消耗单位 *</Label>
              <Input 
                value={unitUsage} 
                onChange={(e) => setUnitUsage(e.target.value)} 
                placeholder="ml"
                className={`bg-background border-border ${errors.unitUsage ? 'border-destructive' : ''}`}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-primary font-semibold flex items-center gap-2">
              换算率 * 
              <Badge variant="outline" className="text-xs border-primary/50 text-primary">核心字段</Badge>
            </Label>
            <Input
              type="number"
              value={conversionRate}
              onChange={(e) => setConversionRate(e.target.value)}
              placeholder="12000"
              className={`bg-background border-border border-primary/50 ${errors.conversionRate ? 'border-destructive' : ''}`}
            />
            <div className="bg-primary/10 border border-primary/30 rounded-md p-2">
              <p className="text-sm text-primary font-medium">
                📐 1 {unitPurchase || "箱"} = {conversionRate || "?"} {unitUsage || "ml"}
              </p>
            </div>
            {errors.conversionRate && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.conversionRate}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>成本 (每采购单位)</Label>
            <Input 
              type="number" 
              value={cost} 
              onChange={(e) => setCost(e.target.value)} 
              placeholder="0.00" 
              className="bg-background border-border" 
            />
          </div>

          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {mutation.isPending ? "保存中..." : "保存物料"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
