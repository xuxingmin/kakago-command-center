import { useState, useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

export interface AudienceConfig {
  tags: string[];
  recencyMin: string;
  recencyMax: string;
  frequencyMin: string;
  frequencyMax: string;
  monetaryMin: string;
  monetaryMax: string;
}

interface AudienceFilterProps {
  value: AudienceConfig;
  onChange: (config: AudienceConfig) => void;
}

const presetTags = [
  { key: "new", label: "新用户", desc: "首单用户" },
  { key: "sleeping", label: "沉睡用户", desc: "30天未下单" },
  { key: "highValue", label: "高客单价", desc: "客单价 Top 20%" },
  { key: "active", label: "活跃老客", desc: "近7天下单" },
];

export const defaultAudienceConfig: AudienceConfig = {
  tags: [],
  recencyMin: "",
  recencyMax: "",
  frequencyMin: "",
  frequencyMax: "",
  monetaryMin: "",
  monetaryMax: "",
};

export function AudienceFilter({ value, onChange }: AudienceFilterProps) {
  const estimatedCount = useMemo(() => {
    // Mock estimation based on filters
    let base = 2480;
    if (value.tags.includes("new")) base = Math.min(base, 620);
    if (value.tags.includes("sleeping")) base = Math.min(base, 340);
    if (value.tags.includes("highValue")) base = Math.min(base, 496);
    if (value.tags.includes("active")) base = Math.min(base, 870);
    if (value.recencyMax) base = Math.min(base, Math.round(2480 * (Number(value.recencyMax) / 90)));
    if (value.frequencyMin && Number(value.frequencyMin) > 3) base = Math.round(base * 0.4);
    if (value.monetaryMin && Number(value.monetaryMin) > 200) base = Math.round(base * 0.3);
    return Math.max(base, 12);
  }, [value]);

  const toggleTag = (tag: string) => {
    const next = value.tags.includes(tag) ? value.tags.filter((t) => t !== tag) : [...value.tags, tag];
    onChange({ ...value, tags: next });
  };

  const update = (field: keyof AudienceConfig, v: string) => {
    onChange({ ...value, [field]: v });
  };

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">用户画像筛选</h3>
        <Badge variant="outline" className="gap-1 text-xs border-primary/40 text-primary">
          <Users className="w-3 h-3" />
          预估覆盖 {estimatedCount.toLocaleString()} 人
        </Badge>
      </div>

      {/* Quick tags */}
      <div>
        <Label className="text-xs mb-2 block">快捷标签</Label>
        <div className="grid grid-cols-2 gap-2">
          {presetTags.map((t) => (
            <label
              key={t.key}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer transition-all text-xs
                ${value.tags.includes(t.key) ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-foreground hover:border-primary/40"}`}
            >
              <Checkbox checked={value.tags.includes(t.key)} onCheckedChange={() => toggleTag(t.key)} className="h-3.5 w-3.5" />
              <div>
                <span className="font-medium">{t.label}</span>
                <span className="ml-1 text-muted-foreground">{t.desc}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* RFM model */}
      <div className="space-y-3">
        <Label className="text-xs block text-muted-foreground">RFM 模型筛选</Label>

        {/* R - Recency */}
        <div className="rounded-md border border-border bg-background p-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">R</span>
            <span className="text-xs font-medium">最近消费距今（天）</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input className="h-8 text-xs bg-muted/50" type="number" placeholder="最小" value={value.recencyMin} onChange={(e) => update("recencyMin", e.target.value)} />
            <Input className="h-8 text-xs bg-muted/50" type="number" placeholder="最大" value={value.recencyMax} onChange={(e) => update("recencyMax", e.target.value)} />
          </div>
        </div>

        {/* F - Frequency */}
        <div className="rounded-md border border-border bg-background p-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">F</span>
            <span className="text-xs font-medium">累计消费次数</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input className="h-8 text-xs bg-muted/50" type="number" placeholder="最小" value={value.frequencyMin} onChange={(e) => update("frequencyMin", e.target.value)} />
            <Input className="h-8 text-xs bg-muted/50" type="number" placeholder="最大" value={value.frequencyMax} onChange={(e) => update("frequencyMax", e.target.value)} />
          </div>
        </div>

        {/* M - Monetary */}
        <div className="rounded-md border border-border bg-background p-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">M</span>
            <span className="text-xs font-medium">累计消费金额（¥）</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input className="h-8 text-xs bg-muted/50" type="number" placeholder="最小" value={value.monetaryMin} onChange={(e) => update("monetaryMin", e.target.value)} />
            <Input className="h-8 text-xs bg-muted/50" type="number" placeholder="最大" value={value.monetaryMax} onChange={(e) => update("monetaryMax", e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}
