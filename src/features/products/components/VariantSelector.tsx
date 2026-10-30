"use client";

import { useState } from "react";

export function VariantSelector({ variants }: { variants: any[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!variants || variants.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-text-primary">انتخاب رنگ:</p>
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => {
          const isOutOfStock = v.inventoryCount === 0;
          
          return (
            <button
              key={v.id}
              onClick={() => !isOutOfStock && setSelectedId(v.id)}
              disabled={isOutOfStock}
              className={`flex items-center gap-2 px-3 py-1 border rounded-full transition ${
                isOutOfStock
                  ? "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                  : selectedId === v.id
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary"
              }`}
            >
              <span className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: v.colorHex || "#000000" }} />
              <span className="text-sm">{v.color}</span>
              {isOutOfStock && <span className="text-xs">(ناموجود)</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
