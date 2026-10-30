"use client";

import { useState, useEffect } from "react";

interface ProductVariantSectionProps {
  productId: string;
}

export function ProductVariantSection({ productId }: ProductVariantSectionProps) {
  const [color, setColor] = useState("");
  const [colorHex, setColorHex] = useState("#000000");
  const [inventoryCount, setInventoryCount] = useState(0); // 👈 جدید
  const [variants, setVariants] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  async function fetchVariants() {
    try {
      const res = await fetch(`/api/admin/products/variants?productId=${productId}`);
      if (res.ok) setVariants(await res.json());
    } catch (err) { console.error(err); }
  }

  useEffect(() => {
    fetchVariants();
  }, [productId]);

  const handleAdd = async () => {
    if (!color) return;
    setMsg("");

    try {
      const res = await fetch(`/api/admin/products/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, color, colorHex, inventoryCount }), // 👈 ارسال موجودی
      });

      if (res.ok) {
        setMsg("✅ رنگ با موفقیت اضافه شد.");
        setColor("");
        setInventoryCount(0);
        fetchVariants();
      } else {
        const data = await res.json();
        setMsg(`❌ خطا: ${data.error || "نامشخص"}`);
      }
    } catch (err) {
      setMsg("❌ خطای شبکه.");
    }
  };

  const handleDelete = async (variantId: string) => {
    if (!confirm("آیا از حذف این رنگ مطمئنید؟")) return;
    try {
      const res = await fetch(`/api/admin/products/variants?variantId=${variantId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMsg("✅ رنگ حذف شد.");
        fetchVariants();
      } else {
        setMsg("❌ خطا در حذف رنگ.");
      }
    } catch (err) {
      setMsg("❌ خطای شبکه.");
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-background">
      <h3 className="font-bold text-lg">🎨 رنگ‌های محصول</h3>
      
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          placeholder="نام رنگ (مثلاً: سفید)"
          className="border p-2 rounded bg-background text-text-primary flex-1"
        />
        <input
          type="color"
          value={colorHex}
          onChange={(e) => setColorHex(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded border"
          title="انتخاب رنگ"
        />
        <input
          type="number"
          value={inventoryCount}
          onChange={(e) => setInventoryCount(Number(e.target.value))}
          placeholder="موجودی"
          className="border p-2 rounded bg-background text-text-primary w-24"
          min="0"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!color}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          افزودن رنگ
        </button>
      </div>
      {msg && <p className="text-sm font-bold">{msg}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {variants.length === 0 ? (
          <p className="text-xs text-gray-500">هیچ رنگی برای این محصول تعریف نشده است.</p>
        ) : (
          variants.map((v) => (
            <div key={v.id} className="flex items-center gap-2 border rounded-full px-3 py-1 bg-card text-text-primary">
              <span className="w-4 h-4 rounded-full border border-gray-400" style={{ backgroundColor: v.colorHex }}></span>
              <span className="text-sm">{v.color}</span>
              <span className={`text-xs font-bold ${v.inventoryCount > 0 ? "text-green-600" : "text-red-600"}`}>
                ({v.inventoryCount} عدد)
              </span>
              <button
                type="button"
                onClick={() => handleDelete(v.id)}
                className="text-red-500 hover:text-red-700 mr-2"
                title="حذف رنگ"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
