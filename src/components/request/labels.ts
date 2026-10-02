import { settings } from "@/lib/api";
import type { CallTime, PreferredContact } from "@/lib/types";

export const contactOptions: { key: PreferredContact; icon: string; bn: string; en: string }[] = [
  { key: "call", icon: "📞", bn: "ফোন কল", en: "Phone call" },
  { key: "whatsapp", icon: "🟢", bn: "WhatsApp", en: "WhatsApp" },
  { key: "chat", icon: "💬", bn: "সাইটের চ্যাট", en: "Site chat" },
];

export const callTimeOptions: { key: CallTime; icon: string; bn: string; en: string; sub_bn: string; sub_en: string }[] = [
  { key: "morning", icon: "🌅", bn: "সকাল", en: "Morning", sub_bn: "১০টা থেকে ১২টা", sub_en: "10am to 12pm" },
  { key: "afternoon", icon: "☀️", bn: "দুপুর", en: "Afternoon", sub_bn: "১২টা থেকে ৪টা", sub_en: "12pm to 4pm" },
  { key: "evening", icon: "🌆", bn: "সন্ধ্যা", en: "Evening", sub_bn: "৪টা থেকে ৮টা", sub_en: "4pm to 8pm" },
  { key: "any", icon: "🕐", bn: "যেকোনো সময়", en: "Any time", sub_bn: "সকাল ১০টা থেকে রাত ৮টা", sub_en: "10am to 8pm" },
];

export const contactLabel = (k: PreferredContact, lang: "bn" | "en") => {
  const o = contactOptions.find((x) => x.key === k)!;
  return `${o.icon} ${o[lang]}`;
};

export const callTimeLabel = (k: CallTime, lang: "bn" | "en") => {
  const o = callTimeOptions.find((x) => x.key === k)!;
  return `${o.icon} ${o[lang]}`;
};

export const replyPromise = (lang: "bn" | "en") =>
  lang === "bn"
    ? `সাধারণত ${settings.quote_reply_hours} ঘণ্টার মধ্যে (সকাল ১০টা থেকে রাত ৮টা) আমরা দাম জানিয়ে দেবো`
    : "We usually send you a price within 2 to 4 hours (10am to 8pm)";
