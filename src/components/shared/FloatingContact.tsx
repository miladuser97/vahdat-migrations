"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { cn } from "@/utils/cn";
import { SITE_FEATURES } from "@/config/features";
import {
  CloseIcon,
  ChatIcon,
} from "@/components/ui/icons";
import {
  InstagramBrandIcon,
  WhatsAppBrandIcon,
  TelegramBrandIcon,
  BaleBrandIcon,
} from "@/components/ui/brand-icons";

interface ContactMethod {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  enabled: boolean;
}

export function FloatingContact() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const contactMethods: ContactMethod[] = [
    {
      id: "instagram",
      label: "اینستاگرام",
      icon: <InstagramBrandIcon className="h-12 w-12" />,
      href: "https://www.instagram.com/mobile.vahdat",
      enabled: SITE_FEATURES.social.instagram.enabled,
    },
    {
      id: "telegram",
      label: "تلگرام",
      icon: <TelegramBrandIcon className="h-12 w-12" />,
      href: "https://t.me/yourchannel",
      enabled: SITE_FEATURES.social.telegram.enabled,
    },
    {
      id: "whatsapp",
      label: "واتساپ",
      icon: <WhatsAppBrandIcon className="h-12 w-12" />,
      href: "https://wa.me/989127809720",
      enabled: SITE_FEATURES.social.whatsapp.enabled,
    },
    {
      id: "bale",
      label: "بله",
      icon: <BaleBrandIcon className="h-12 w-12" />,
      href: "https://bale.ai/u/@vahdat",
      enabled: SITE_FEATURES.social.bale.enabled,
    },
  ];

  const enabledMethods = contactMethods.filter((m) => m.enabled);

  if (enabledMethods.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="lg:hidden fixed bottom-20 left-4 z-40 flex flex-col items-center gap-2"
    >
      {isOpen && (
        <div className="flex flex-col items-center gap-2 animate-in slide-in-from-bottom-5 duration-200">
          {enabledMethods.map((method) => (
            <Link
              key={method.id}
              href={method.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full shadow-lg transition-all hover:scale-110 hover:shadow-xl"
              title={method.label}
              aria-label={method.label}
            >
              {method.icon}
            </Link>
          ))}
        </div>
      )}

      {/* ✅ دکمه اصلی — شیشه‌ای آبی (Glassmorphism) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300",
          "bg-brand-600/90 backdrop-blur-lg border-2 border-white/40 text-white",
          "hover:bg-brand-700 hover:shadow-xl hover:scale-105 active:scale-95",
          "dark:bg-brand-600/70 dark:border-white/20",
          isOpen && "rotate-45",
          "cursor-pointer select-none"
        )}
        aria-label={isOpen ? "بستن" : "تماس با ما"}
        style={{ touchAction: "manipulation" }}
      >
        {isOpen ? <CloseIcon className="h-6 w-6" /> : <ChatIcon className="h-6 w-6" />}
      </button>
    </div>
  );
}