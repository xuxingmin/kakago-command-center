import { Store, CheckCircle } from "lucide-react";

interface StoreKPIHeaderProps {
  totalStores: number;
  openStores: number;
}

export function StoreKPIHeader({ totalStores, openStores }: StoreKPIHeaderProps) {
  return (
    <div className="grid grid-cols-2 gap-6 h-32">
      {/* 门店总数 */}
      <div className="bg-[#121212] rounded-lg border border-border flex items-center px-8">
        <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mr-6">
          <Store className="w-7 h-7 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">门店总数</p>
          <p className="text-4xl font-bold text-foreground font-mono">{totalStores}</p>
        </div>
      </div>

      {/* 营业中门店 */}
      <div className="bg-[#121212] rounded-lg border border-border flex items-center px-8">
        <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center mr-6">
          <CheckCircle className="w-7 h-7 text-green-500" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">营业中门店</p>
          <p className="text-4xl font-bold text-green-500 font-mono">{openStores}</p>
        </div>
      </div>
    </div>
  );
}
