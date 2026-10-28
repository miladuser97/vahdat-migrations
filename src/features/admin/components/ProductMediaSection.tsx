"use client";

import { useState, useEffect } from "react";
import { ProductVariantSection } from "./ProductVariantSection";

interface ProductMediaSectionProps {
  productId: string;
}

export function ProductMediaSection({ productId }: ProductMediaSectionProps) {
  const [url, setUrl] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [candidates, setCandidates] = useState<any[]>([]);
  const [approvedMedia, setApprovedMedia] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);

  async function fetchCandidates() {
    try {
      const res = await fetch(`/api/admin/media/candidates?productId=${productId}`);
      if (res.ok) setCandidates(await res.json());
    } catch (err) { console.error(err); }
  }

  async function fetchApproved() {
    try {
      const res = await fetch(`/api/admin/media/approved?productId=${productId}`);
      if (res.ok) setApprovedMedia(await res.json());
    } catch (err) { console.error(err); }
  }

  async function fetchVariants() {
    try {
      const res = await fetch(`/api/admin/products/variants?productId=${productId}`);
      if (res.ok) setVariants(await res.json());
    } catch (err) { console.error(err); }
  }

  useEffect(() => {
    fetchCandidates();
    fetchApproved();
    fetchVariants();
  }, [productId]);

  const handleImport = async () => {
    if (!url) return;
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/admin/media/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, url, variantId: selectedVariantId || undefined }),
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

  const handleAction = async (candidateId: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/admin/media/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, productId }),
      });
      if (res.ok) {
        setMsg(`✅ عکس با موفقیت ${action === "approve" ? "تایید" : "رد"} شد.`);
        fetchCandidates();
        if (action === "approve") fetchApproved();
      } else {
        setMsg(`❌ خطا در عملیات.`);
      }
    } catch (err) {
      setMsg("❌ خطای شبکه.");
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm("آیا از حذف این عکس مطمئنید؟")) return;
    try {
      const res = await fetch(`/api/admin/media/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId }),
      });
      if (res.ok) {
        setMsg("✅ عکس از گالری حذف شد.");
        fetchApproved();
      } else {
        setMsg("❌ خطا در حذف عکس.");
      }
    } catch (err) {
      setMsg("❌ خطای شبکه.");
    }
  };

  return (
    <div className="space-y-6">
      {/* بخش مدیریت رنگ‌ها */}
      <ProductVariantSection productId={productId} />

      {/* بخش عکس‌ها */}
      <div className="space-y-6 p-4 border rounded-lg bg-background">
        <h3 className="font-bold text-lg">📸 عکس‌های محصول</h3>
        
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="لینک عکس را وارد کنید..."
            className="border p-2 rounded flex-1 bg-background text-text-primary focus:ring-primary focus:border-primary min-w-[200px]"
          />
          
          <select
            value={selectedVariantId}
            onChange={(e) => setSelectedVariantId(e.target.value)}
            className="border p-2 rounded bg-background text-text-primary"
          >
            <option value="">بدون رنگ (همه رنگ‌ها)</option>
            {variants.map((v) => (
              <option key={v.id} value={v.id}>{v.color}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleImport}
            disabled={loading || !url}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? "..." : "افزودن"}
          </button>
        </div>
        {msg && <p className="text-sm font-bold">{msg}</p>}

        <div className="mt-4">
          <h4 className="font-semibold text-sm mb-2 text-green-700">✅ عکس‌های اصلی محصول:</h4>
          {approvedMedia.length === 0 ? (
            <p className="text-xs text-gray-500">هیچ عکسی هنوز تایید نشده است.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {approvedMedia.map((m) => (
                <div key={m.id} className="border rounded p-1 flex flex-col items-center bg-card text-text-primary relative">
                  <img src={m.media.url} alt="approved" className="w-full h-20 object-cover rounded mb-1" />
                  {m.variant && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full border border-white shadow" style={{ backgroundColor: m.variant.colorHex }} title={m.variant.color}></span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteMedia(m.id)}
                    className="bg-red-500 text-white text-xs py-1 px-2 rounded w-full"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4">
          <h4 className="font-semibold text-sm mb-2 text-blue-700">⏳ عکس‌های در انتظار تایید:</h4>
          {candidates.length === 0 ? (
            <p className="text-xs text-gray-500">هیچ عکسی در انتظار تایید نیست.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {candidates.map((c) => (
                <div key={c.id} className="border rounded p-1 flex flex-col items-center bg-card text-text-primary">
                  <img src={c.previewUrl} alt="candidate" className="w-full h-20 object-cover rounded mb-1" />
                  <div className="flex gap-1 w-full">
                    <button
                      type="button"
                      onClick={() => handleAction(c.id, "approve")}
                      className="flex-1 bg-green-500 text-white text-xs py-1 rounded"
                    >
                      تایید
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(c.id, "reject")}
                      className="flex-1 bg-red-500 text-white text-xs py-1 rounded"
                    >
                      رد
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
