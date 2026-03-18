"use client";

import { HAIRSTYLES, Hairstyle } from "@/lib/hairstyles";

interface HairstyleGridProps {
  selected: string | null;
  onSelect: (style: Hairstyle) => void;
  disabled?: boolean;
}

export default function HairstyleGrid({ selected, onSelect, disabled }: HairstyleGridProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {HAIRSTYLES.map((style) => (
        <button
          key={style.id}
          disabled={disabled}
          onClick={() => onSelect(style)}
          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-150 ${
            selected === style.id
              ? "border-violet-500 bg-violet-50 shadow-md scale-105"
              : "border-gray-200 hover:border-violet-300 hover:bg-gray-50"
          } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <span className="text-2xl">{style.emoji}</span>
          <span className="text-xs text-gray-700 font-medium text-center leading-tight">
            {style.name}
          </span>
        </button>
      ))}
    </div>
  );
}
