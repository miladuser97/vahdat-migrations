import {
  PaperIcon,
  OfficeSuppliesIcon,
  WritingInstrumentIcon,
  SchoolSuppliesIcon,
  PrinterSuppliesIcon,
  OfficeEquipmentIcon,
} from "@/components/ui/icons";
import type { Category } from "../types";
import type { ComponentType } from "react";

// Extension of Category to include React Icon for development
export interface DevCategory extends Category {
  iconComponent?: ComponentType;
}

export const CATEGORY_FIXTURES: DevCategory[] = [
  {
    id: "cat_1",
    slug: "smartphones",
    title: "گوشی‌های هوشمند",
    description: "جدیدترین گوشی‌های موبایل از برندهای معتبر جهان",
    iconComponent: PaperIcon,
  },
  {
    id: "cat_2",
    slug: "tablets",
    title: "تبلت",
    description: "تبلت‌های اندرویدی، ویندوزی و آیپد اپل",
    iconComponent: OfficeSuppliesIcon,
  },
  {
    id: "cat_3",
    slug: "smartwatches",
    title: "ساعت هوشمند",
    description: "ساعت‌های هوشمند و مچ‌بندهای سلامتی",
    iconComponent: WritingInstrumentIcon,
  },
  {
    id: "cat_4",
    slug: "headphones",
    title: "هدفون و هندزفری",
    description: "هدفون، هندزفری و هدست بی‌سیم و با سیم",
    iconComponent: SchoolSuppliesIcon,
  },
  {
    id: "cat_5",
    slug: "mobile-accessories",
    title: "لوازم جانبی موبایل",
    description: "قاب، گلس، شارژر، کابل و پاوربانک",
    iconComponent: PrinterSuppliesIcon,
  },
  {
    id: "cat_6",
    slug: "gaming",
    title: "لوازم گیمینگ",
    description: "گوشی گیمینگ، دسته بازی و لوازم جانبی",
    iconComponent: OfficeEquipmentIcon,
  },
  {
    id: "cat_7",
    slug: "sim-cards",
    title: "سیم‌کارت",
    description: "سیم‌کارت دائمی و اعتباری اپراتورهای مختلف",
    iconComponent: undefined,
  },
  {
    id: "cat_8",
    slug: "used",
    title: "گوشی کارکرده",
    description: "گوشی‌های کارکرده با کیفیت و ضمانت",
    iconComponent: undefined,
  },
];