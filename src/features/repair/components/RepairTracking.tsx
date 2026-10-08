"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormMessage } from "@/components/ui/FormMessage";
import { Badge } from "@/components/ui/Badge";
import { getRepairRequestByTrackingAction } from "@/lib/server/repair-actions";
import { REPAIR_STATUS_LABELS, REPAIR_STATUS_VARIANTS, type RepairRequest } from "@/features/repair/types";

export function RepairTracking() {
  const [trackingCode, setTrackingCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState<RepairRequest | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) {
      setError("لطفاً کد پیگیری را وارد کنید.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setRequest(null);

    const result = await getRepairRequestByTrackingAction(trackingCode.trim());

    if (result.success && result.data) {
      setRequest(result.data);
    } else {
      setError(result.error || "درخواستی با این کد پیگیری یافت نشد.");
    }

    setIsLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const variant = REPAIR_STATUS_VARIANTS[status as keyof typeof REPAIR_STATUS_VARIANTS] || "muted";
    return <Badge variant={variant}>{REPAIR_STATUS_LABELS[status as keyof typeof REPAIR_STATUS_LABELS] || status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 md:p-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <Label htmlFor="trackingCode">کد پیگیری</Label>
            <div className="flex flex-col sm:flex-row gap-3 mt-1.5">
              <Input
                id="trackingCode"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="مثلاً R-1234"
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" variant="default" disabled={isLoading}>
                {isLoading ? "در حال جستجو..." : "جستجو"}
              </Button>
            </div>
            <p className="text-xs text-text-secondary mt-2">
              کد پیگیری را پس از ثبت درخواست دریافت کردید.
            </p>
          </div>

          {error && <FormMessage variant="error">{error}</FormMessage>}
        </form>
      </Card>

      {request && (
        <Card className="p-6 md:p-8 border-success/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-h4 font-bold text-text-primary">
                درخواست تعمیر #{request.trackingCode}
              </h3>
              <p className="text-sm text-text-secondary">
                تاریخ ثبت: {new Date(request.createdAt).toLocaleDateString("fa-IR")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">وضعیت:</span>
              {getStatusBadge(request.status)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-text-secondary">نام و نام خانوادگی</p>
              <p className="text-body font-medium">{request.firstName} {request.lastName}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-text-secondary">شماره موبایل</p>
              <p className="text-body font-medium">{request.mobileNumber}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <p className="text-sm text-text-secondary">برند و مدل گوشی</p>
              <p className="text-body font-medium">{request.brand} - {request.model}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-text-secondary">نوع مشکل</p>
              <p className="text-body font-medium">{request.problemType}</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-text-secondary">توضیحات مشکل</p>
            <p className="text-body mt-1 p-3 bg-muted rounded-lg">{request.description}</p>
          </div>

          {request.address && (
            <div className="mt-4">
              <p className="text-sm text-text-secondary">آدرس</p>
              <p className="text-body mt-1">{request.address}</p>
            </div>
          )}

          {request.estimatedCost !== null && request.estimatedCost !== undefined && (
            <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-text-secondary">هزینه تخمینی تعمیر</p>
              <p className="text-xl font-bold text-primary">
                {request.estimatedCost.toLocaleString("fa-IR")} تومان
              </p>
            </div>
          )}

          {request.adminNote && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-text-secondary">یادداشت کارشناس</p>
              <p className="text-body mt-1">{request.adminNote}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}