"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";

export default function BulkPricePage() {
  const [categorySlug, setCategorySlug] = useState("");
  const [updateType, setUpdateType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [value, setValue] = useState(0);
  const [includeVariants, setIncludeVariants] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/admin/products/bulk-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categorySlug, updateType, value, includeVariants }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || "خطا در به‌روزرسانی");
      }
    } catch (err) {
      setError("خطای شبکه");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">💰 ویرایش گروهی قیمت‌ها</h1>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>دسته‌بندی</Label>
            <Select value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} required>
              <option value="">-- انتخاب کنید --</option>
              <option value="mobile">موبایل</option>
              <option value="tablet">تبلت</option>
              <option value="laptop">لپ‌تاپ</option>
              <option value="accessories">لوازم جانبی</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>نوع به‌روزرسانی</Label>
            <Select value={updateType} onChange={(e) => setUpdateType(e.target.value as any)}>
              <option value="PERCENTAGE">درصدی</option>
              <option value="FIXED">مبلغ ثابت (تومان)</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>مقدار</Label>
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeVariants"
              checked={includeVariants}
              onChange={(e) => setIncludeVariants(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="includeVariants">شامل variantها (قیمت‌های اختصاصی)</Label>
          </div>

          <Button type="submit" disabled={loading || !categorySlug}>
            {loading ? "در حال اعمال..." : "اعمال تغییرات"}
          </Button>

          {error && <p className="text-sm text-red-600 font-bold">{error}</p>}
        </form>
      </Card>

      {result && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">📊 گزارش</h2>
          <p>تعداد کل: {result.total}</p>
          <p className="text-green-600">موفق: {result.successCount}</p>
          <p className="text-red-600">ناموفق: {result.failedCount}</p>
          
          <div className="mt-4 space-y-2">
            {result.results.map((r: any, i: number) => (
              <div key={i} className={`p-2 rounded border ${r.success ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
                <span className="text-sm">{r.title}</span>
                {!r.success && <span className="text-xs text-red-600 mr-2">({r.error})</span>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
