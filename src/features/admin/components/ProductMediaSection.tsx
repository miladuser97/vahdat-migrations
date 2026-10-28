"use client";

import { useState, useEffect } from "react";

interface ProductMediaSectionProps {
  productId: string;
}

export function ProductMediaSection({ productId }: ProductMediaSectionProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [candidates, setCandidates] = useState<any[]>([]);

  async function fetchCandidates() {
    try {
      const res = await fetch(`/api/admin/media/candidates?productId=${productId}`);
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
      }
    } catch (err) {
      console.error("خطا در گرفتن کاندیدها", err);
    }
  }

  useEffect(() => {
    fetchCandidates();
  }, [productId]);

  const handleImport = async () => {
    if (!url) return;
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/admin/media/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, url }),
      });
      const data = await res.json();

      if (res.ok) {
        setMsg("✅ عکس با موفقیت به لیست کاندیدها اضافه شد.");
        setUrl("");
        fetchCandidates();
      } else {
        setMsg(`❌ خطا: ${data.error || "نامشخص"}`);
      }
    } catch (err) {
      setMsg("❌ خطای شبکه.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <h3 className="font-bold text-lg">📸 عکس‌های محصول</h3>
      
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="لینک عکس را وارد کنید..."
          className="border p-2 rounded flex-1"
        />
        <button
          type="button" // 👈 این خط تغییر کرد (به جای submit)
          onClick={handleImport} // 👈 این خط اضافه شد
          disabled={loading || !url}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "..." : "افزودن"}
        </button>
      </div>
      {msg && <p className="text-sm font-bold">{msg}</p>}

      <div className="mt-4">
        <h4 className="font-semibold text-sm mb-2">عکس‌های در انتظار تایید:</h4>
        {candidates.length === 0 ? (
          <p className="text-xs text-gray-500">هیچ عکسی در انتظار تایید نیست.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {candidates.map((c) => (
              <div key={c.id} className="border rounded p-1">
                <img src={c.previewUrl} alt="candidate" className="w-full h-20 object-cover rounded" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
