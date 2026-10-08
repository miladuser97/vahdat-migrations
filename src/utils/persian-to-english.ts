// ============================================================
// دیکشنری فارسی → انگلیسی (برای جستجو)
// ============================================================

const PERSIAN_TO_ENGLISH_MAP: Record<string, string[]> = {
  // ============================================================
  // برندها
  // ============================================================
  "پوکو": ["poco"],
  "سامسونگ": ["samsung", "galaxy"],
  "اپل": ["apple", "iphone"],
  "آیفون": ["iphone"],
  "شیائومی": ["xiaomi", "redmi"],
  "ردمی": ["redmi", "xiaomi"],
  "هواوی": ["huawei"],
  "آنر": ["honor"],
  "نوکیا": ["nokia"],
  "سونی": ["sony"],
  "ال‌جی": ["lg"],
  "ایسوس": ["asus"],
  "ایسر": ["acer"],
  "اچ‌پی": ["hp"],
  "اچ پی": ["hp"],
  "دل": ["dell"],
  "لنوو": ["lenovo"],
  "لنووا": ["lenovo"],
  "ام‌اس‌آی": ["msi"],
  "ام اس آی": ["msi"],
  "مایکروسافت": ["microsoft", "surface"],
  "سرفیس": ["surface", "microsoft"],
  "ریلمی": ["realme"],
  "وان‌پلاس": ["oneplus"],
  "وان پلاس": ["oneplus"],
  "جی‌بی‌ال": ["jbl"],
  "جی بی ال": ["jbl"],
  "بوز": ["bose"],
  "ساندیسک": ["sandisk"],
  "کینگستون": ["kingston"],
  "سیلیکون پاور": ["silicon power"],
  "توشیبا": ["toshiba"],
  "سیگیت": ["seagate"],
  "وسترن دیجیتال": ["western digital", "wd"],
  "تی‌پی‌لینک": ["tp-link"],
  "تی پی لینک": ["tp-link"],
  "دی‌لینک": ["d-link"],
  "دی لینک": ["d-link"],
  "لجیتک": ["logitech"],
  "ریزر": ["razer"],
  "کورسیر": ["corsair"],
  "انویا": ["nvidia"],
  "ای‌ام‌دی": ["amd"],
  "ای ام دی": ["amd"],
  "اینتل": ["intel"],
  "کوالکام": ["qualcomm"],
  "مدیاتک": ["mediatek"],
  "اپو": ["oppo"],
  "اوپو": ["oppo"],
  "ویوو": ["vivo"],
  "اینفینیکس": ["infinix"],
  "تکنو": ["tecno"],
  "جوجل": ["google", "pixel"],
  "پیکسل": ["pixel", "google"],
  "ناتینگ": ["nothing"],
  "ایربادز": ["airpods"],
  "ایرپادز": ["airpods"],
  "ایرپاد": ["airpods"],
  "ایرتگ": ["airtag"],
  "اپل واچ": ["apple watch"],
  "گلکسی": ["galaxy"],
  "ژوپیتر": ["jupiter"],

  // ============================================================
  // مدل‌ها و کلمات کلیدی
  // ============================================================
  "ایکس": ["x"],
  "پرو": ["pro"],
  "پلاس": ["plus"],
  "مکس": ["max"],
  "اولترا": ["ultra"],
  "لایت": ["lite"],
  "مینی": ["mini"],
  "نوت": ["note"],
  "نوت‌بوک": ["notebook"],
  "نوتبوک": ["notebook"],
  "تب": ["tab"],
  "پد": ["pad"],
  "آیپد": ["ipad"],
  "مک": ["mac"],
  "مک‌بوک": ["macbook"],
  "مک بوک": ["macbook"],
  "ایر": ["air"],
  "گلکسی تب": ["galaxy tab"],
  "گلکسی واچ": ["galaxy watch"],
  "گلکسی بادز": ["galaxy buds"],
  "گلکسی نوت": ["galaxy note"],
  "گلکسی اس": ["galaxy s"],
  "گلکسی ای": ["galaxy a"],
  "گلکسی زد": ["galaxy z"],
  "پوکو اف": ["poco f"],
  "پوکو ایکس": ["poco x"],
  "پوکو ام": ["poco m"],
  "پوکو سی": ["poco c"],
  "ردمی نوت": ["redmi note"],

  // ============================================================
  // محصولات و لوازم جانبی
  // ============================================================
  "هدفون": ["headphone", "headset"],
  "هدست": ["headset", "headphone"],
  "هندزفری": ["earphone", "headphone"],
  "ایرباد": ["earbuds"],
  "اسپیکر": ["speaker"],
  "بلندگو": ["speaker"],
  "شارژر": ["charger"],
  "پاوربانک": ["powerbank", "power bank"],
  "پاور بانک": ["powerbank", "power bank"],
  "کابل": ["cable"],
  "تبدیل": ["adapter"],
  "مبدل": ["adapter"],
  "قاب": ["case"],
  "کیف": ["bag", "case"],
  "گلس": ["glass", "screen protector"],
  "محافظ صفحه": ["screen protector"],
  "ساعت هوشمند": ["smartwatch", "smart watch"],
  "مچ‌بند": ["smartband", "smart band"],
  "تبلت": ["tablet"],
  "لپ‌تاپ": ["laptop"],
  "لپ تاپ": ["laptop"],
  "مانیتور": ["monitor"],
  "کیبورد": ["keyboard"],
  "ماوس": ["mouse"],
  "موس": ["mouse"],
  "هارد": ["hard", "hard drive", "hdd"],
  "اس‌اس‌دی": ["ssd"],
  "اس اس دی": ["ssd"],
  "فلش": ["flash", "usb"],
  "مموری": ["memory card", "microsd"],
  "کارت حافظه": ["memory card", "microsd"],
  "رم": ["ram"],
  "پردازنده": ["cpu", "processor"],
  "کارت گرافیک": ["gpu", "graphics card"],
  "مودم": ["modem"],
  "روتر": ["router"],
  "سوییچ": ["switch"],
  "کنسول بازی": ["console", "game console"],
  "پلی‌استیشن": ["playstation", "ps"],
  "پلی استیشن": ["playstation", "ps"],
  "ایکس‌باکس": ["xbox"],
  "ایکس باکس": ["xbox"],
  "دسته بازی": ["gamepad", "controller"],

  // ============================================================
  // رنگ‌ها
  // ============================================================
  "مشکی": ["black"],
  "سفید": ["white"],
  "نقره‌ای": ["silver"],
  "طلایی": ["gold"],
  "آبی": ["blue"],
  "قرمز": ["red"],
  "سبز": ["green"],
  "خاکستری": ["gray", "grey"],
  "صورتی": ["pink"],
  "بنفش": ["purple"],
  "زرد": ["yellow"],
  "نارنجی": ["orange"],
  "بژ": ["beige"],
  "گرافیتی": ["graphite"],
  "تیتانیوم": ["titanium"],

  // ============================================================
  // ویژگی‌ها
  // ============================================================
  "اورجینال": ["original"],
  "اصل": ["original"],
  "کارکرده": ["used"],
  "دست دوم": ["used", "second hand"],
  "نو": ["new"],
  "جدید": ["new"],
  "گارانتی": ["warranty", "guarantee"],
  "ضمانت": ["warranty", "guarantee"],
  "ارزان": ["cheap"],
  "اقتصادی": ["economic", "budget"],
  "پرچمدار": ["flagship"],
  "میان‌رده": ["mid-range", "midrange"],
  "میان رده": ["mid-range", "midrange"],
  "پرقدرت": ["powerful", "high performance"],
  "بازی": ["gaming"],
  "گیمینگ": ["gaming"],
  "عکاسی": ["photography", "camera"],
  "دانش‌آموزی": ["student"],
  "دانش اموزی": ["student"],
  "اداری": ["office"],

  // ============================================================
  // اعداد فارسی
  // ============================================================
  "یک": ["1", "one"],
  "دو": ["2", "two"],
  "سه": ["3", "three"],
  "چهار": ["4", "four"],
  "پنج": ["5", "five"],
  "شش": ["6", "six"],
  "هفت": ["7", "seven"],
  "هشت": ["8", "eight"],
  "نه": ["9", "nine"],
  "ده": ["10", "ten"],
};

export function getEnglishEquivalents(persianWord: string): string[] {
  const normalized = persianWord.trim().toLowerCase();
  return PERSIAN_TO_ENGLISH_MAP[normalized] ?? [];
}

export function expandPersianQuery(persianQuery: string): string[] {
  const trimmed = persianQuery.trim();
  if (!trimmed) return [];

  const results = new Set<string>([trimmed]);
  const words = trimmed.split(/\s+/).filter(Boolean);

  const wordEquivalents = words.map((word) => {
    const english = getEnglishEquivalents(word);
    return english.length > 0 ? english : [word];
  });

  const allEnglish = wordEquivalents
    .map((eqs) => eqs[0])
    .join(" ");
  if (allEnglish !== trimmed) {
    results.add(allEnglish);
  }

  wordEquivalents.forEach((eqs) => {
    eqs.forEach((eq) => {
      if (eq !== trimmed && eq.length > 1) {
        results.add(eq);
      }
    });
  });

  return Array.from(results);
}

export function hasPersianBrandWords(text: string): boolean {
  const words = text.split(/\s+/);
  return words.some((word) => getEnglishEquivalents(word).length > 0);
}