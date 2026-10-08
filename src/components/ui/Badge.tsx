import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-brand-100 text-brand-700",
        secondary: "bg-muted text-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        success: "bg-success text-success-foreground",
        warning: "bg-warning text-warning-foreground",
        outline: "border border-border text-foreground",
        techno: "bg-gradient-to-l from-pink-500 to-purple-500 text-white",
        new: "bg-success text-success-foreground",
        bestSeller: "bg-amber-500 text-white",
        fastShipping: "bg-brand-600 text-white",
        // ✅ اضافه شد — برای OrderStatus
        error: "bg-destructive text-destructive-foreground",
        info: "bg-brand-100 text-brand-700",
        muted: "bg-muted text-muted-foreground",
        // ✅ اضافه شد — برای RepairStatus
        pending: "bg-amber-100 text-amber-700",
        processing: "bg-blue-100 text-blue-700",
      },
      size: {
        sm: "text-[10px] px-1.5 py-0.5",
        md: "text-xs px-2 py-0.5",
        lg: "text-sm px-3 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };