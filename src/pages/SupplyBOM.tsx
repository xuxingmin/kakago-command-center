import { useState } from "react";
import { Plus, Save, Trash2, Coffee } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface Material {
  id: string;
  name: string;
  amount: number;
  unit: string;
}

interface SKU {
  id: string;
  name: string;
  materials: Material[];
}

const mockSKUs: SKU[] = [
  {
    id: "sku-001",
    name: "标准美式",
    materials: [
      { id: "m1", name: "A级咖啡豆", amount: 18, unit: "g" },
      { id: "m2", name: "90口径纸杯", amount: 1, unit: "个" },
      { id: "m3", name: "杯盖", amount: 1, unit: "个" },
    ],
  },
  {
    id: "sku-002",
    name: "生椰拿铁",
    materials: [
      { id: "m1", name: "A级咖啡豆", amount: 18, unit: "g" },
      { id: "m2", name: "厚椰乳", amount: 220, unit: "ml" },
      { id: "m3", name: "90口径纸杯", amount: 1, unit: "个" },
      { id: "m4", name: "杯盖", amount: 1, unit: "个" },
    ],
  },
  {
    id: "sku-003",
    name: "澳白",
    materials: [
      { id: "m1", name: "A级咖啡豆", amount: 20, unit: "g" },
      { id: "m2", name: "全脂牛奶", amount: 180, unit: "ml" },
      { id: "m3", name: "90口径纸杯", amount: 1, unit: "个" },
      { id: "m4", name: "杯盖", amount: 1, unit: "个" },
    ],
  },
  {
    id: "sku-004",
    name: "香草拿铁",
    materials: [
      { id: "m1", name: "A级咖啡豆", amount: 18, unit: "g" },
      { id: "m2", name: "全脂牛奶", amount: 200, unit: "ml" },
      { id: "m3", name: "香草糖浆", amount: 15, unit: "ml" },
      { id: "m4", name: "90口径纸杯", amount: 1, unit: "个" },
    ],
  },
  {
    id: "sku-005",
    name: "焦糖玛奇朵",
    materials: [
      { id: "m1", name: "A级咖啡豆", amount: 18, unit: "g" },
      { id: "m2", name: "全脂牛奶", amount: 180, unit: "ml" },
      { id: "m3", name: "焦糖酱", amount: 20, unit: "ml" },
      { id: "m4", name: "90口径纸杯", amount: 1, unit: "个" },
    ],
  },
];

export default function SupplyBOM() {
  const [skuList, setSkuList] = useState<SKU[]>(mockSKUs);
  const [selectedSKU, setSelectedSKU] = useState<SKU>(mockSKUs[0]);

  const handleMaterialChange = (materialId: string, field: keyof Material, value: string | number) => {
    const updatedMaterials = selectedSKU.materials.map((m) =>
      m.id === materialId ? { ...m, [field]: value } : m
    );
    setSelectedSKU({ ...selectedSKU, materials: updatedMaterials });
  };

  const handleAddMaterial = () => {
    const newMaterial: Material = {
      id: `m-${Date.now()}`,
      name: "",
      amount: 0,
      unit: "g",
    };
    setSelectedSKU({
      ...selectedSKU,
      materials: [...selectedSKU.materials, newMaterial],
    });
  };

  const handleRemoveMaterial = (materialId: string) => {
    setSelectedSKU({
      ...selectedSKU,
      materials: selectedSKU.materials.filter((m) => m.id !== materialId),
    });
  };

  const handleSave = () => {
    setSkuList(skuList.map((sku) => (sku.id === selectedSKU.id ? selectedSKU : sku)));
    toast({
      title: "保存成功",
      description: `${selectedSKU.name} 的配方已更新`,
    });
  };

  return (
    <div className="h-full flex gap-4">
      {/* 左侧 SKU 列表 */}
      <Card className="w-64 shrink-0 bg-[#121212] border-[#333333]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-foreground flex items-center gap-2">
            <Coffee className="w-4 h-4 text-primary" />
            SKU 列表
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-220px)]">
            <div className="px-2 pb-2 space-y-1">
              {skuList.map((sku) => (
                <button
                  key={sku.id}
                  onClick={() => setSelectedSKU(sku)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-md transition-all duration-200",
                    "text-sm font-medium",
                    selectedSKU.id === sku.id
                      ? "bg-primary/20 text-primary border border-primary/50"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
                  )}
                >
                  {sku.name}
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* 右侧配方详情 */}
      <Card className="flex-1 bg-[#121212] border-[#333333]">
        <CardHeader className="border-b border-[#333333]">
          <CardTitle className="text-xl text-foreground">
            {selectedSKU.name}
            <span className="ml-3 text-xs text-muted-foreground font-mono">
              ID: {selectedSKU.id}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* 原料消耗清单 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              原料消耗清单
            </h3>

            <div className="space-y-3">
              {/* 表头 */}
              <div className="grid grid-cols-[1fr_100px_80px_40px] gap-3 px-3 py-2 bg-secondary/30 rounded-md">
                <span className="text-xs text-muted-foreground font-medium">原料名称</span>
                <span className="text-xs text-muted-foreground font-medium">消耗量</span>
                <span className="text-xs text-muted-foreground font-medium">单位</span>
                <span className="text-xs text-muted-foreground font-medium"></span>
              </div>

              {/* 原料列表 */}
              <ScrollArea className="h-[calc(100vh-420px)]">
                <div className="space-y-2">
                  {selectedSKU.materials.map((material) => (
                    <div
                      key={material.id}
                      className="grid grid-cols-[1fr_100px_80px_40px] gap-3 items-center px-3 py-2 bg-secondary/10 rounded-md border border-[#333333] hover:border-primary/30 transition-colors"
                    >
                      <Input
                        value={material.name}
                        onChange={(e) => handleMaterialChange(material.id, "name", e.target.value)}
                        className="h-8 bg-background border-[#333333] text-sm"
                        placeholder="原料名称"
                      />
                      <Input
                        type="number"
                        value={material.amount}
                        onChange={(e) => handleMaterialChange(material.id, "amount", parseFloat(e.target.value) || 0)}
                        className="h-8 bg-background border-[#333333] text-sm font-mono text-center"
                      />
                      <Input
                        value={material.unit}
                        onChange={(e) => handleMaterialChange(material.id, "unit", e.target.value)}
                        className="h-8 bg-background border-[#333333] text-sm text-center"
                        placeholder="单位"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMaterial(material.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 pt-4 border-t border-[#333333]">
              <Button
                variant="outline"
                onClick={handleAddMaterial}
                className="border-[#333333] hover:border-primary hover:bg-primary/10"
              >
                <Plus className="w-4 h-4 mr-2" />
                新增原料
              </Button>
              <Button
                onClick={handleSave}
                className="bg-primary hover:bg-primary/90"
              >
                <Save className="w-4 h-4 mr-2" />
                保存配方
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
