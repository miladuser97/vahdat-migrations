"use client";

import { useState } from "react";

export function ImportMediaForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/admin/media/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setMsg("با موفقیت اضافه شد.");
        setUrl("");
      } else {
        setMsg(`خطا: ${data.error || "نامشخص"}`); // 👈 اینجا خطای دقیق رو نشون می‌ده
      }
    } catch {
      setMsg("خطای شبکه.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="لینک عکس..."
        className="border p-2 rounded flex-1"
      />
      <button type="submit" disabled={loading || !url} className="bg-blue-600 text-white px-4 py-2 rounded">
        {loading ? "..." : "افزودن"}
      </button>
      {msg && <span className="text-sm font-bold text-red-600">{msg}</span>}
    </form>
  );
}
