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
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, Pencil, Coffee, Package, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";

type Product = {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  image_url: string | null;
};

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
  const [price, setPrice] = useState(product?.price?.toString() || "0");
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [imageUrl, setImageUrl] = useState(product?.image_url || "");
  const [error, setError] = useState("");

  const isEdit = !!product;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) {
        setError("产品名称不能为空");
        throw new Error("验证失败");
      }
      if (existingNames.includes(name.trim())) {
        setError("产品名称已存在");
        throw new Error("验证失败");
      }
      setError("");

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
      queryClient.invalidateQueries({ queryKey: ["master_products"] });
      queryClient.invalidateQueries({ queryKey: ["datahub_products"] });
      toast.success(isEdit ? "产品已更新" : "产品已添加");
      setOpen(false);
      if (!isEdit) {
        setName("");
        setPrice("0");
        setIsActive(true);
        setImageUrl("");
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
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑产品" : "新增产品"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>产品名称 *</Label>
            <Input 
              value={name} 
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="如：生椰拿铁" 
              className={`bg-background border-border ${error ? 'border-destructive' : ''}`}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label>售价 *</Label>
            <Input 
              type="number" 
              value={price} 
              onChange={(e) => setPrice(e.target.value)} 
              placeholder="0.00" 
              className="bg-background border-border" 
            />
          </div>

          <div className="space-y-2">
            <Label>图片链接</Label>
            <Input 
              value={imageUrl} 
              onChange={(e) => setImageUrl(e.target.value)} 
              placeholder="https://..." 
              className="bg-background border-border" 
            />
          </div>

          <div className="flex items-center justify-between py-2">
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
