import { settings } from "@/lib/mock/settings";
import { digits } from "@/lib/format";
import type { Lang } from "@/lib/types";

// "সকাল ১০টা" / "10 am" from a 0-23 hour in settings.business_hours.
export const hourLabel = (h: number, lang: Lang, bnDigits = true) => {
  const h12 = h % 12 === 0 ? 12 : h % 12;
  if (lang === "en") return `${h12} ${h < 12 ? "am" : "pm"}`;
  const part = h < 4 ? "রাত" : h < 12 ? "সকাল" : h < 16 ? "দুপুর" : h < 18 ? "বিকেল" : h < 20 ? "সন্ধ্যা" : "রাত";
  return `${part} ${digits(h12, lang, bnDigits)}টা`;
};

export const businessHoursLabel = (lang: Lang, bnDigits = true) => {
  const { open, close } = settings.business_hours;
  return lang === "bn"
    ? `${hourLabel(open, lang, bnDigits)} থেকে ${hourLabel(close, lang, bnDigits)}`
    : `${hourLabel(open, lang)} to ${hourLabel(close, lang)}`;
};
