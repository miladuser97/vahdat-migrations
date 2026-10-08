"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { FormMessage } from "@/components/ui/FormMessage";
import {
  updateRepairRequestAction,
  deleteRepairRequestAction,
} from "@/lib/server/repair-actions";
import {
  REPAIR_STATUS_LABELS,
  REPAIR_STATUS_VARIANTS,
  type RepairRequest,
  type RepairStatus,
} from "@/features/repair/types";
import { toPersianDigits } from "@/utils/text-utils";

const STATUS_OPTIONS = [
  { value: "pending", label: "در انتظار بررسی" },
  { value: "reviewing", label: "در حال بررسی" },
  { value: "approved", label: "تأیید شده" },
  { value: "repairing", label: "در حال تعمیر" },
  { value: "ready", label: "آماده تحویل" },
  { value: "delivered", label: "تحویل داده شد" },
  { value: "rejected", label: "رد شد" },
];

interface AdminRepairTableProps {
  initialRequests: RepairRequest[];
}

export function AdminRepairTable({ initialRequests }: AdminRepairTableProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // ✅ جستجو و فیلتر
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  const [editData, setEditData] = useState<{
    status: string;
    estimatedCost: string;
    adminNote: string;
  }>({
    status: "",
    estimatedCost: "",
    adminNote: "",
  });

  // ✅ فیلتر و مرتب‌سازی
  const filteredRequests = useMemo(() => {
    let result = [...requests];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.trackingCode.toLowerCase().includes(q) ||
          r.firstName.toLowerCase().includes(q) ||
          r.lastName.toLowerCase().includes(q) ||
          r.mobileNumber.includes(q) ||
          r.brand.toLowerCase().includes(q) ||
          r.model.toLowerCase().includes(q) ||
          r.problemType.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }

    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === "trackingCode") {
      result.sort((a, b) => a.trackingCode.localeCompare(b.trackingCode));
    }

    return result;
  }, [requests, searchQuery, statusFilter, sortBy]);

  // ✅ آمار
  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "pending").length;
    const repairing = requests.filter((r) => r.status === "repairing" || r.status === "reviewing").length;
    const ready = requests.filter((r) => r.status === "ready").length;
    const delivered = requests.filter((r) => r.status === "delivered").length;
    return { total, pending, repairing, ready, delivered };
  }, [requests]);

  const startEdit = (request: RepairRequest) => {
    setEditingId(request.id);
    setEditData({
      status: request.status,
      estimatedCost: request.estimatedCost?.toString() || "",
      adminNote: request.adminNote || "",
    });
    setError(null);
    setSuccess(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError(null);
    setSuccess(null);
  };

  const handleSave = async (id: string) => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const status = editData.status as RepairStatus;

    const result = await updateRepairRequestAction(id, {
      status,
      estimatedCost: editData.estimatedCost ? Number(editData.estimatedCost) : undefined,
      adminNote: editData.adminNote || undefined,
    });

    if (result.success && result.data) {
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? result.data! : r))
      );
      setSuccess("درخواست با موفقیت به‌روزرسانی شد.");
      setEditingId(null);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error || "خطا در به‌روزرسانی.");
    }

    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این درخواست اطمینان دارید؟")) return;

    setBusyId(id);
    const result = await deleteRepairRequestAction(id);

    if (result.success) {
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setSuccess("درخواست با موفقیت حذف شد.");
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error || "خطا در حذف.");
    }
    setBusyId(null);
  };

  const getStatusBadge = (status: string) => {
    const variant = REPAIR_STATUS_VARIANTS[status as keyof typeof REPAIR_STATUS_VARIANTS] || "muted";
    return (
      <Badge variant={variant}>
        {REPAIR_STATUS_LABELS[status as keyof typeof REPAIR_STATUS_LABELS] || status}
      </Badge>
    );
  };

  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  if (requests.length === 0) {
    return (
      <Card>
        <p className="text-body-sm text-text-secondary text-center py-lg">
          هیچ درخواست تعمیری یافت نشد.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-md">
      {/* ✅ کارت‌های آمار */}
      <div className="grid grid-cols-2 gap-sm sm:grid-cols-5">
        <Card className="p-3">
          <p className="text-caption text-text-secondary">کل</p>
          <p className="text-h5 font-bold text-text-primary fa-num">
            {toPersianDigits(stats.total)}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-caption text-text-secondary">در انتظار</p>
          <p className="text-h5 font-bold text-amber-500 fa-num">
            {toPersianDigits(stats.pending)}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-caption text-text-secondary">در حال تعمیر</p>
          <p className="text-h5 font-bold text-blue-500 fa-num">
            {toPersianDigits(stats.repairing)}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-caption text-text-secondary">آماده تحویل</p>
          <p className="text-h5 font-bold text-brand-600 fa-num">
            {toPersianDigits(stats.ready)}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-caption text-text-secondary">تحویل‌شده</p>
          <p className="text-h5 font-bold text-success fa-num">
            {toPersianDigits(stats.delivered)}
          </p>
        </Card>
      </div>

      {/* ✅ نوار جستجو و فیلتر */}
      <Card className="flex flex-col gap-sm p-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            placeholder="🔍 جستجو در کد پیگیری، نام، موبایل، برند..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-sm sm:w-auto">
          <div className="flex-1 sm:w-44">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">همه‌ی وضعیت‌ها</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex-1 sm:w-40">
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">جدیدترین</option>
              <option value="oldest">قدیمی‌ترین</option>
              <option value="trackingCode">کد پیگیری</option>
            </Select>
          </div>
        </div>
      </Card>

      {success && (
        <Card className="border-success/30 bg-success/5 p-4">
          <p className="text-body-sm text-success">{success}</p>
        </Card>
      )}
      {error && <FormMessage variant="error">{error}</FormMessage>}

      <p className="text-body-sm text-text-secondary">
        {toPersianDigits(filteredRequests.length)} درخواست نمایش داده می‌شود
        {filteredRequests.length !== requests.length && (
          <span className="text-text-muted">
            {" "}
            (از {toPersianDigits(requests.length)} درخواست)
          </span>
        )}
      </p>

      {filteredRequests.length === 0 ? (
        <Card>
          <p className="text-body-sm text-text-secondary text-center py-lg">
            درخواستی با این فیلترها یافت نشد.
          </p>
        </Card>
      ) : (
        filteredRequests.map((request) => {
          const isEditing = editingId === request.id;
          const isBusy = busyId === request.id || isSaving;

          return (
            <Card key={request.id} className="p-4">
              {!isEditing ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-bold text-brand-600 fa-num" dir="ltr">
                          #{request.trackingCode}
                        </span>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-body font-medium mt-2">
                        {request.firstName} {request.lastName}
                      </p>
                      <p className="text-sm text-text-secondary fa-num" dir="ltr">
                        {request.mobileNumber}
                      </p>
                      <p className="text-sm text-text-secondary mt-1">
                        {request.brand} {request.model}
                      </p>
                      <p className="text-caption text-text-muted mt-1">
                        {formatDate(request.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(request)}
                        disabled={isBusy}
                      >
                        ✏️ ویرایش
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                        onClick={() => handleDelete(request.id)}
                        disabled={isBusy}
                      >
                        {isBusy ? "..." : "🗑️ حذف"}
                      </Button>
                    </div>
                  </div>

                  {/* ✅ جزئیات مشکل */}
                  <div className="rounded-lg bg-muted/30 border border-border/50 p-3">
                    <p className="text-caption font-medium text-text-secondary mb-1">
                      🔧 مشکل اعلام‌شده:
                    </p>
                    <p className="text-body-sm text-text-primary">
                      {request.problemType}
                    </p>
                    {request.description && (
                      <>
                        <p className="text-caption font-medium text-text-secondary mt-2 mb-1">
                          📝 توضیحات مشتری:
                        </p>
                        <p className="text-body-sm text-text-primary">
                          {request.description}
                        </p>
                      </>
                    )}
                  </div>

                  {request.estimatedCost !== null && request.estimatedCost !== undefined && (
                    <p className="text-sm font-medium text-brand-600 fa-num">
                      💰 هزینه تخمینی: {toPersianDigits(request.estimatedCost.toLocaleString("en-US"))} تومان
                    </p>
                  )}

                  {request.adminNote && (
                    <div className="text-sm text-text-secondary bg-blue-50 dark:bg-blue-950/30 p-2 rounded-lg">
                      <span className="font-medium text-blue-700 dark:text-blue-300">
                        📌 یادداشت کارشناس:
                      </span>{" "}
                      {request.adminNote}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-body font-bold text-text-primary">
                      ویرایش درخواست #{request.trackingCode}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`status-${request.id}`}>وضعیت</Label>
                      <Select
                        id={`status-${request.id}`}
                        value={editData.status}
                        onChange={(e) =>
                          setEditData({ ...editData, status: e.target.value })
                        }
                        disabled={isSaving}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`cost-${request.id}`}>هزینه تخمینی (تومان)</Label>
                      <Input
                        id={`cost-${request.id}`}
                        type="number"
                        inputMode="numeric"
                        dir="ltr"
                        value={editData.estimatedCost}
                        onChange={(e) =>
                          setEditData({ ...editData, estimatedCost: e.target.value })
                        }
                        disabled={isSaving}
                        placeholder="مثلاً 500000"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`note-${request.id}`}>یادداشت کارشناس</Label>
                    <Textarea
                      id={`note-${request.id}`}
                      value={editData.adminNote}
                      onChange={(e) =>
                        setEditData({ ...editData, adminNote: e.target.value })
                      }
                      disabled={isSaving}
                      rows={3}
                      placeholder="توضیحات مربوط به تعمیر..."
                    />
                  </div>

                  <div className="flex gap-3 pt-2 border-t border-border/50">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleSave(request.id)}
                      disabled={isSaving}
                    >
                      {isSaving ? "در حال ذخیره..." : "💾 ذخیره"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelEdit}
                      disabled={isSaving}
                    >
                      انصراف
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}