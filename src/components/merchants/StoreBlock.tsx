import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StoreData {
  id: string;
  name: string;
  status: "open" | "paused" | "closed";
  address: string;
  phone: string;
  manager: string;
}

interface StoreBlockProps {
  store?: StoreData;
  isAddButton?: boolean;
  onClick: () => void;
}

export function StoreBlock({ store, isAddButton, onClick }: StoreBlockProps) {
  if (isAddButton) {
    return (
      <button
        onClick={onClick}
        className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 bg-[#1A1A1A] flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-[#1A1A1A]/80 transition-all duration-200"
      >
        <Plus className="w-8 h-8 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">添加门店</span>
      </button>
    );
  }

  if (!store) return null;

  const statusColor = {
    open: "bg-green-500",
    paused: "bg-gray-500",
    closed: "bg-red-500",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "aspect-square rounded-lg border border-[#333333] bg-[#1A1A1A] relative",
        "flex items-center justify-center p-4",
        "hover:border-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20",
        "transition-all duration-200 group"
      )}
    >
      {/* 状态指示灯 */}
      <div className={cn("absolute top-3 right-3 w-2.5 h-2.5 rounded-full", statusColor[store.status])} />
      
      {/* 门店名称 */}
      <span className="text-sm font-bold text-foreground text-center leading-tight">
        {store.name}
      </span>
    </button>
  );
}
