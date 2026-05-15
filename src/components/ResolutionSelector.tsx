"use client";

import type { ImageSize, AspectRatio } from "@/lib/types";
import { IMAGE_SIZE_OPTIONS, computeDimensions } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface ResolutionSelectorProps {
  imageSize: ImageSize;
  aspectRatio: AspectRatio;
  onChange: (value: ImageSize) => void;
}

export function ResolutionSelector({
  imageSize,
  aspectRatio,
  onChange,
}: ResolutionSelectorProps) {
  const dims = computeDimensions(aspectRatio, imageSize);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        Resolución
      </label>
      <div className="flex flex-wrap gap-1">
        {IMAGE_SIZE_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            size="xs"
            variant={imageSize === opt.value ? "default" : "outline"}
            className="shrink-0"
          >
            {opt.label}
          </Button>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">{dims}</p>
    </div>
  );
}
