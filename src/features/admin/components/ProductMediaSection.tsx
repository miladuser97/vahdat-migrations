"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ProductMediaSection({ productId }: { productId: string }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleImport = async () => {
    if (!url) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/media/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, url }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("عکس با موفقیت اضافه شد.");
        setUrl("");
      } else {
        setMessage(data.error || "خطا در اضافه کردن عکس.");
      }
    } catch (err) {
      setMessage("خطای شبکه.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <h3 className="font-bold text-lg">افزودن عکس با لینک</h3>
      <div className="flex gap-2">
        <Input
          placeholder="لینک عکس را اینجا وارد کنید..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleImport} disabled={loading || !url}>
          {loading ? "در حال دانلود..." : "افزودن"}
        </Button>
      </div>
      {message && <p className="text-sm text-blue-600">{message}</p>}
    </div>
  );
}
