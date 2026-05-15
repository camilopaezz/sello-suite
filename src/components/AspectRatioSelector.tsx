"use client";

import type { AspectRatio, AspectRatioOption } from "@/lib/types";
import { ASPECT_RATIO_OPTIONS } from "@/lib/types";
import { Button } from "@/components/ui/button";

function RatioIcon({ icon }: { icon: AspectRatioOption["icon"] }) {
  return (
    <span className="text-xs">
      {icon === "square" && "▢"}
      {icon === "portrait" && "▯"}
      {icon === "landscape" && "▭"}
    </span>
  );
}

interface AspectRatioSelectorProps {
  value: AspectRatio;
  onChange: (value: AspectRatio) => void;
}

export function AspectRatioSelector({ value, onChange }: AspectRatioSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        Relación de aspecto
      </label>
      <div className="flex flex-wrap gap-1">
        {ASPECT_RATIO_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            size="xs"
            variant={value === opt.value ? "default" : "outline"}
            className="shrink-0 gap-1.5"
          >
            <RatioIcon icon={opt.icon} />
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
