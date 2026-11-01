"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { PriceChart } from "@/features/admin/components/PriceChart";

interface PriceHistoryItem {
  id: string;
  productTitle: string;
  variantColor: string | null;
  oldPrice: string | null;
  newPrice: string | null;
  oldDiscountPercentage: number | null;
  newDiscountPercentage: number | null;
  changeType: string;
  source: string;
  createdAt: string;
}

export default function PriceHistoryPage() {
  const [history, setHistory] = useState<PriceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/products/price-history", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        } else {
          setError("خطا در بارگذاری تاریخچه");
        }
      } catch (err) {
        setError("خطای شبکه");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // 👈 آماده‌سازی داده برای نمودار (برعکس کردن ترتیب برای نمایش زمانی)
  const chartData = [...history]
    .reverse()
    .map((h) => ({
      date: new Date(h.createdAt).toLocaleDateString("fa-IR"),
      price: h.newPrice ? Math.round(Number(h.newPrice)) : 0,
    }))
    .filter((d) => d.price > 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">📜 تاریخچه تغییرات قیمت</h1>

      {loading && <p className="text-gray-500">در حال بارگذاری...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && history.length === 0 && (
        <Card className="p-6 text-center text-gray-500">
          هیچ تغییری در قیمت‌ها ثبت نشده است.
        </Card>
      )}

      {/* 👈 نمودار */}
      {chartData.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">📈 روند تغییرات قیمت</h2>
          <PriceChart data={chartData} />
        </Card>
      )}

      {/* 👈 جدول */}
      {history.length > 0 && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-right">محصول</th>
                  <th className="p-3 text-right">رنگ</th>
                  <th className="p-3 text-right">قیمت قبلی</th>
                  <th className="p-3 text-right">قیمت جدید</th>
                  <th className="p-3 text-right">منبع</th>
                  <th className="p-3 text-right">تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-t border-gray-200">
                    <td className="p-3">{h.productTitle}</td>
                    <td className="p-3">{h.variantColor || "—"}</td>
                    <td className="p-3" dir="ltr">
                      {h.oldPrice ? Math.round(Number(h.oldPrice)).toLocaleString() : "—"}
                    </td>
                    <td className="p-3" dir="ltr">
                      {h.newPrice ? Math.round(Number(h.newPrice)).toLocaleString() : "—"}
                    </td>
                    <td className="p-3">{h.source}</td>
                    <td className="p-3">{new Date(h.createdAt).toLocaleDateString("fa-IR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
