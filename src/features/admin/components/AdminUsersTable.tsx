"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { Select } from "@/components/ui/Select";
import {
  updateUserRoleAction,
  toggleUserActiveAction,
  deleteUserAction,
  type AdminUser,
} from "@/lib/server/admin-actions";
import { toPersianDigits } from "@/utils/text-utils";

interface AdminUsersTableProps {
  initialUsers: AdminUser[];
  currentUserRole: string;
  currentUserId: string;
}

const ROLE_LABELS: Record<string, string> = {
  customer: "مشتری",
  staff: "کارمند",
  admin: "مدیر",
  super_admin: "مدیر ارشد",
};

const ROLE_VARIANTS: Record<
  string,
  "default" | "success" | "warning" | "destructive"
> = {
  customer: "default",
  staff: "warning",
  admin: "success",
  super_admin: "destructive",
};

export function AdminUsersTable({
  initialUsers,
  currentUserRole,
  currentUserId,
}: AdminUsersTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [error, setError] = useState<string | undefined>(undefined);
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined);
  const [busyId, setBusyId] = useState<string | null>(null);

  const isSuperAdmin = currentUserRole === "super_admin";

  // ✅ فیلتر و مرتب‌سازی
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // جستجو
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (u) =>
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          u.mobileNumber.includes(q) ||
          (u.email && u.email.toLowerCase().includes(q))
      );
    }

    // فیلتر نقش
    if (roleFilter !== "all") {
      result = result.filter((u) => u.role === roleFilter);
    }

    // فیلتر وضعیت
    if (statusFilter === "active") {
      result = result.filter((u) => u.isActive);
    } else if (statusFilter === "inactive") {
      result = result.filter((u) => !u.isActive);
    }

    // مرتب‌سازی
    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === "orders-desc") {
      result.sort((a, b) => b.orderCount - a.orderCount);
    } else if (sortBy === "orders-asc") {
      result.sort((a, b) => a.orderCount - b.orderCount);
    } else if (sortBy === "name") {
      result.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, "fa"));
    } else if (sortBy === "points-desc") {
      result.sort((a, b) => b.loyaltyPoints - a.loyaltyPoints);
    }

    return result;
  }, [users, searchQuery, roleFilter, statusFilter, sortBy]);

  // ✅ آمار
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.isActive).length;
    const inactive = total - active;
    const admins = users.filter((u) => u.role === "admin" || u.role === "super_admin").length;
    const customers = users.filter((u) => u.role === "customer").length;
    return { total, active, inactive, admins, customers };
  }, [users]);

  async function handleRoleChange(userId: string, newRole: string) {
    setError(undefined);
    setSuccessMessage(undefined);
    setBusyId(userId);

    const result = await updateUserRoleAction(userId, newRole);

    if (!result.success) {
      setError(result.error || "خطا در تغییر نقش.");
      setBusyId(null);
      return;
    }

    setUsers((current) =>
      current.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    setSuccessMessage("نقش کاربر با موفقیت تغییر یافت.");
    setBusyId(null);
  }

  async function handleToggleActive(userId: string, isActive: boolean) {
    setError(undefined);
    setSuccessMessage(undefined);
    setBusyId(userId);

    const result = await toggleUserActiveAction(userId);

    if (!result.success) {
      setError(result.error || "خطا در تغییر وضعیت.");
      setBusyId(null);
      return;
    }

    setUsers((current) =>
      current.map((u) => (u.id === userId ? { ...u, isActive: !isActive } : u))
    );
    setSuccessMessage(isActive ? "کاربر غیرفعال شد." : "کاربر فعال شد.");
    setBusyId(null);
  }

  async function handleDelete(userId: string, hasOrders: boolean) {
    const mode = hasOrders ? "soft" : "hard";
    const confirmMessage = hasOrders
      ? "این کاربر سفارش دارد. به جای حذف کامل، غیرفعال می‌شود. ادامه می‌دهید؟"
      : "آیا از حذف کامل این کاربر مطمئن هستید؟ این عمل قابل بازگشت نیست.";

    if (!window.confirm(confirmMessage)) return;

    setError(undefined);
    setSuccessMessage(undefined);
    setBusyId(userId);

    const result = await deleteUserAction(userId, mode);

    if (!result.success) {
      setError(result.error || "خطا در حذف کاربر.");
      setBusyId(null);
      return;
    }

    if (result.data.mode === "deleted") {
      setUsers((current) => current.filter((u) => u.id !== userId));
      setSuccessMessage("کاربر به طور کامل حذف شد.");
    } else {
      setUsers((current) =>
        current.map((u) => (u.id === userId ? { ...u, isActive: false } : u))
      );
      setSuccessMessage("کاربر غیرفعال شد (به دلیل داشتن سفارش قابل حذف کامل نبود).");
    }
    setBusyId(null);
  }

  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <div className="flex flex-col gap-md">
      {/* ✅ کارت‌های آمار */}
      <div className="grid grid-cols-2 gap-sm sm:grid-cols-4">
        <Card className="p-3">
          <p className="text-caption text-text-secondary">کل کاربران</p>
          <p className="text-h5 font-bold text-text-primary fa-num">
            {toPersianDigits(stats.total)}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-caption text-text-secondary">فعال</p>
          <p className="text-h5 font-bold text-success fa-num">
            {toPersianDigits(stats.active)}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-caption text-text-secondary">مدیران</p>
          <p className="text-h5 font-bold text-brand-600 fa-num">
            {toPersianDigits(stats.admins)}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-caption text-text-secondary">مشتریان</p>
          <p className="text-h5 font-bold text-blue-500 fa-num">
            {toPersianDigits(stats.customers)}
          </p>
        </Card>
      </div>

      {/* ✅ نوار جستجو و فیلتر */}
      <Card className="flex flex-col gap-sm p-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            placeholder="🔍 جستجو در نام، موبایل، ایمیل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-sm sm:w-auto">
          <div className="flex-1 sm:w-36">
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">همه‌ی نقش‌ها</option>
              <option value="customer">مشتری</option>
              <option value="staff">کارمند</option>
              <option value="admin">مدیر</option>
              <option value="super_admin">مدیر ارشد</option>
            </Select>
          </div>
          <div className="flex-1 sm:w-36">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">همه‌ی وضعیت‌ها</option>
              <option value="active">فعال</option>
              <option value="inactive">غیرفعال</option>
            </Select>
          </div>
          <div className="flex-1 sm:w-40">
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">جدیدترین</option>
              <option value="oldest">قدیمی‌ترین</option>
              <option value="name">نام (الفبا)</option>
              <option value="orders-desc">بیشترین سفارش</option>
              <option value="orders-asc">کمترین سفارش</option>
              <option value="points-desc">بیشترین امتیاز</option>
            </Select>
          </div>
        </div>
      </Card>

      {error && <FormMessage variant="error">{error}</FormMessage>}
      {successMessage && <FormMessage variant="success">{successMessage}</FormMessage>}

      <p className="text-body-sm text-text-secondary">
        {toPersianDigits(filteredUsers.length)} کاربر نمایش داده می‌شود
        {filteredUsers.length !== users.length && (
          <span className="text-text-muted">
            {" "}
            (از {toPersianDigits(users.length)} کاربر)
          </span>
        )}
      </p>

      {filteredUsers.length === 0 ? (
        <Card>
          <p className="text-body-sm text-text-secondary text-center py-lg">
            کاربری با این فیلترها یافت نشد.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-sm">
          {filteredUsers.map((user) => {
            const isBusy = busyId === user.id;
            const isSelf = user.id === currentUserId;
            const isAdminTier = user.role === "admin" || user.role === "super_admin";
            const canToggle = !isSelf && (isSuperAdmin || !isAdminTier);
            const canDelete = isSuperAdmin && !isSelf;

            return (
              <Card
                key={user.id}
                className={`flex flex-col gap-sm ${!user.isActive ? "opacity-60" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-text-primary">
                      {user.firstName} {user.lastName}
                      {isSelf && <span className="text-caption text-text-muted"> (شما)</span>}
                    </p>
                    <p
                      className="text-caption text-text-secondary fa-num"
                      dir="ltr"
                    >
                      {user.mobileNumber}
                    </p>
                    {user.email && (
                      <p
                        className="text-caption text-text-secondary"
                        dir="ltr"
                      >
                        {user.email}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={ROLE_VARIANTS[user.role] || "default"}>
                      {ROLE_LABELS[user.role] || user.role}
                    </Badge>
                    <Badge variant={user.isActive ? "success" : "muted"}>
                      {user.isActive ? "فعال" : "غیرفعال"}
                    </Badge>
                    <span className="text-caption text-text-muted fa-num">
                      {toPersianDigits(user.orderCount)} سفارش
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-end gap-sm">
                  <div className="flex flex-col gap-xs">
                    <label className="text-caption text-text-secondary">
                      تاریخ عضویت
                    </label>
                    <span className="text-body-sm text-text-primary fa-num">
                      {formatDate(user.createdAt)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-xs">
                    <label className="text-caption text-text-secondary">
                      امتیاز وفاداری
                    </label>
                    <span className="text-body-sm text-text-primary fa-num">
                      {toPersianDigits(user.loyaltyPoints)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-xs">
                    <label className="text-caption text-text-secondary">
                      نقش
                    </label>
                    <Select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value)
                      }
                      disabled={!isSuperAdmin || isBusy || isSelf}
                      className="w-36"
                    >
                      <option value="customer">مشتری</option>
                      <option value="staff">کارمند</option>
                      <option value="admin">مدیر</option>
                      <option value="super_admin">مدیر ارشد</option>
                    </Select>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canToggle || isBusy}
                    onClick={() => handleToggleActive(user.id, user.isActive)}
                  >
                    {user.isActive ? "غیرفعال کردن" : "فعال کردن"}
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={!canDelete || isBusy}
                    onClick={() => handleDelete(user.id, user.orderCount > 0)}
                  >
                    {user.orderCount > 0 ? "غیرفعال" : "حذف"}
                  </Button>
                </div>

                {!isSuperAdmin && (
                  <p className="text-caption text-text-muted">
                    ⚠️ فقط مدیر ارشد می‌تواند نقش کاربران را تغییر دهد یا آن‌ها را حذف کند.
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}