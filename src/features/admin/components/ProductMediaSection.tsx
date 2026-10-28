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
  const [approvedMedia, setApprovedMedia] = useState<any[]>([]);

  async function fetchCandidates() {
    try {
      const res = await fetch(`/api/admin/media/candidates?productId=${productId}`);
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
      }
    } catch (err) { console.error(err); }
  }

  async function fetchApproved() {
    try {
      const res = await fetch(`/api/admin/media/approved?productId=${productId}`);
      if (res.ok) {
        const data = await res.json();
        setApprovedMedia(data);
      }
    } catch (err) { console.error(err); }
  }

  useEffect(() => {
    fetchCandidates();
    fetchApproved();
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
    // 👇 این خط تغییر کرد (bg-background به جای bg-gray-50)
    <div className="space-y-6 p-4 border rounded-lg bg-background">
      <h3 className="font-bold text-lg">📸 عکس‌های محصول</h3>
      
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="لینک عکس را وارد کنید..."
          className="border p-2 rounded flex-1 bg-background text-text-primary focus:ring-primary focus:border-primary"
        />
        {/* 👇 type="button" اضافه شد */}
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
              <div key={m.id} className="border rounded p-1 flex flex-col items-center bg-card text-text-primary">
                <img src={m.media.url} alt="approved" className="w-full h-20 object-cover rounded mb-1" />
                {/* 👇 type="button" اضافه شد */}
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
                  {/* 👇 type="button" اضافه شد */}
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
  );
}
