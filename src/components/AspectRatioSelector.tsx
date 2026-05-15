"use client";

import type { AspectRatio, AspectRatioOption } from "@/lib/types";
import { ASPECT_RATIO_OPTIONS } from "@/lib/types";

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
      <label className="text-xs text-zinc-500 font-medium">Relación de aspecto</label>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {ASPECT_RATIO_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              value === opt.value
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
            }`}
          >
            <RatioIcon icon={opt.icon} />
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
