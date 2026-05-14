"use client";

import type { ImageSize, AspectRatio } from "@/lib/types";
import { IMAGE_SIZE_OPTIONS, computeDimensions } from "@/lib/types";

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
      <label className="text-xs text-zinc-500 font-medium">Resolution</label>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {IMAGE_SIZE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              imageSize === opt.value
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-zinc-600">{dims}</p>
    </div>
  );
}
