"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";

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
                  <th className="p-3 text-right">تخفیف قبلی</th>
                  <th className="p-3 text-right">تخفیف جدید</th>
                  <th className="p-3 text-right">منبع</th>
                  <th className="p-3 text-right">تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-t border-gray-200">
                    <td className="p-3">{h.productTitle}</td>
                    <td className="p-3">{h.variantColor || "—"}</td>
                    <td className="p-3" dir="ltr">{h.oldPrice ? Number(h.oldPrice).toLocaleString() : "—"}</td>
                    <td className="p-3" dir="ltr">{h.newPrice ? Number(h.newPrice).toLocaleString() : "—"}</td>
                    <td className="p-3">{h.oldDiscountPercentage ?? "—"}</td>
                    <td className="p-3">{h.newDiscountPercentage ?? "—"}</td>
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
