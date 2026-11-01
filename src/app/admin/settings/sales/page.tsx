"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function SalesSettingsPage() {
  const [isSalesEnabled, setIsSalesEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/settings/site-sales");
        if (res.ok) {
          const data = await res.json();
          setIsSalesEnabled(data.isSalesEnabled ?? true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleToggle = async () => {
    const newValue = !isSalesEnabled;
    setMsg("");

    try {
      const res = await fetch("/api/admin/settings/sales-toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSalesEnabled: newValue }),
      });

      if (res.ok) {
        setIsSalesEnabled(newValue);
        setMsg(`✅ فروش ${newValue ? "باز" : "بسته"} شد.`);
      } else {
        setMsg("❌ خطا در تغییر وضعیت.");
      }
    } catch (err) {
      setMsg("❌ خطای شبکه.");
    }
  };

  if (loading) return <p className="p-6">در حال بارگذاری...</p>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">⚙️ تنظیمات فروش</h1>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">وضعیت فروش کل سایت</h2>
            <p className="text-sm text-gray-500">
              {isSalesEnabled ? "فروش باز است (کاربران می‌توانند خرید کنند)" : "فروش بسته است (دکمه خرید غیرفعال است)"}
            </p>
          </div>
          <Button onClick={handleToggle} variant={isSalesEnabled ? "outline" : "default"}>
            {isSalesEnabled ? "🔒 بستن فروش" : "🔓 باز کردن فروش"}
          </Button>
        </div>
        {msg && <p className="text-sm font-bold">{msg}</p>}
      </Card>
    </div>
  );
}
