"use client";

import Image from "next/image";
import { cn } from "@/utils/cn";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const sizes = {
    sm: { width: 80, height: 27 },
    md: { width: 110, height: 37 },
    lg: { width: 160, height: 53 },
  };

  const { width, height } = sizes[size];

  return (
    <div className={cn("relative flex items-center", className)}>
      <Image
        src="/logo-light.png"
        alt="وحدت"
        width={width}
        height={height}
        priority
        className="block dark:hidden object-contain mix-blend-multiply"
      />
      <Image
        src="/logo-dark.png"
        alt="وحدت"
        width={width}
        height={height}
        priority
        className="hidden dark:block object-contain mix-blend-screen"
      />
    </div>
  );
}