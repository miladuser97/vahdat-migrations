"use client";

import { Card } from "@/components/ui/Card";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { RadioOption } from "@/components/ui/RadioOption";
import { HelperText } from "@/components/ui/HelperText";
import { useCheckout } from "@/features/checkout/CheckoutProvider";

// ============================================================
// ✅ اضافه شدن هزینه به هر روش ارسال
// ============================================================
const SHIPPING_METHODS = [
  { id: "standard-post", label: "پست معمولی", cost: 35000, estimatedDays: "۳-۵ روز" },
  { id: "express-post", label: "پست پیشتاز", cost: 65000, estimatedDays: "۱-۲ روز" },
  { id: "courier", label: "پیک", cost: 120000, estimatedDays: "همان روز" },
  { id: "local-delivery", label: "تحویل درون‌شهری", cost: 50000, estimatedDays: "۲۴ ساعته" },
  { id: "store-pickup", label: "تحویل حضوری از فروشگاه", cost: 0, estimatedDays: "همان روز" },
  { id: "free-shipping", label: "ارسال رایگان (بالای ۵ میلیون)", cost: 0, estimatedDays: "۳-۵ روز" },
] as const;

// ✅ اصلاح P0: استفاده از ثابت به جای SHIPPING_METHODS[0]
const DEFAULT_SHIPPING_METHOD = "standard-post" as const;

export function ShippingSection() {
  const { shippingMethod, setShippingMethod } = useCheckout();
  const selected = shippingMethod ?? DEFAULT_SHIPPING_METHOD;

  // پیدا کردن روش انتخاب شده
  const selectedMethod = SHIPPING_METHODS.find(m => m.id === selected);

  return (
    <Card className="flex flex-col gap-md">
      <h2 className="text-h4 font-semibold text-text-primary">ارسال</h2>

      <RadioGroup legend="روش ارسال">
        {SHIPPING_METHODS.map((method) => (
          <RadioOption
            key={method.id}
            name="shippingMethod"
            value={method.id}
            label={`${method.label} (${method.cost.toLocaleString("fa-IR")} تومان)`}
            checked={selected === method.id}
            onChange={() => setShippingMethod(method.id)}
          />
        ))}
      </RadioGroup>

      {selectedMethod && (
        <div className="bg-muted/50 p-3 rounded-lg text-sm">
          <p className="text-text-secondary">
            <span className="font-medium">زمان تحویل:</span> {selectedMethod.estimatedDays}
          </p>
          <p className="text-text-secondary mt-1">
            <span className="font-medium">هزینه ارسال:</span> {selectedMethod.cost.toLocaleString("fa-IR")} تومان
          </p>
        </div>
      )}

      <HelperText>
        هزینه ارسال به مبلغ نهایی سفارش اضافه می‌شود.
      </HelperText>
    </Card>
  );
}