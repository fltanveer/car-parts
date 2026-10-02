// Mock preview rows for phase-2/3 admin placeholders (clearly labelled "নমুনা").
import type { Tone } from "@/lib/labels";

export type CarDoc = "registration" | "tax_token" | "fitness" | "insurance";
export const carDocLabel: Record<CarDoc, [string, string]> = {
  registration: ["রেজিস্ট্রেশন সনদ", "Registration"],
  tax_token: ["ট্যাক্স টোকেন", "Tax token"],
  fitness: ["ফিটনেস", "Fitness"],
  insurance: ["ইন্স্যুরেন্স", "Insurance"],
};
export type DocState = "ok" | "pending" | "expired" | "missing";
export const docStateTone: Record<DocState, Tone> = { ok: "ok", pending: "wait", expired: "bad", missing: "info" };
export const docStateLabel: Record<DocState, [string, string]> = { ok: ["✅ ঠিক আছে", "✅ OK"], pending: ["দেখা বাকি", "To check"], expired: ["মেয়াদ শেষ", "Expired"], missing: ["দেয়নি", "Missing"] };

export interface SampleCarAd {
  id: string;
  title: string;
  year: number;
  km: number;
  price: number;
  market_mid: number;
  seller: string;
  seller_type: "individual" | "dealer";
  area: string;
  photos: number;
  hoursAgo: number;
  flags: { bn: string; en: string; tone: Tone }[];
  docs: Record<CarDoc, DocState>;
}

export const sampleCarAds: SampleCarAd[] = [
  {
    id: "ca-101", title: "Toyota Axio 2016 (NKE165) হাইব্রিড", year: 2016, km: 68000, price: 1650000, market_mid: 1700000, seller: "রফিক আহমেদ", seller_type: "individual", area: "মিরপুর, ঢাকা", photos: 9, hoursAgo: 3,
    flags: [], docs: { registration: "pending", tax_token: "pending", fitness: "pending", insurance: "missing" },
  },
  {
    id: "ca-102", title: "Toyota Premio 2018 (NZT260)", year: 2018, km: 41000, price: 1450000, market_mid: 2600000, seller: "অজানা বিক্রেতা", seller_type: "individual", area: "উত্তরা, ঢাকা", photos: 6, hoursAgo: 1,
    flags: [{ bn: "বাজারদরের ৪৪% নিচে", en: "44% below market", tone: "bad" }, { bn: "একই ছবি অন্য বিজ্ঞাপনে", en: "Same photos in another ad", tone: "bad" }],
    docs: { registration: "missing", tax_token: "missing", fitness: "missing", insurance: "missing" },
  },
  {
    id: "ca-103", title: "Honda Vezel 2017 (RU3)", year: 2017, km: 55000, price: 2350000, market_mid: 2300000, seller: "ঢাকা কার হাট", seller_type: "dealer", area: "তেজগাঁও, ঢাকা", photos: 14, hoursAgo: 6,
    flags: [{ bn: "সাল ও মডেলে অসঙ্গতি (RU3 ২০১৩-এর পরে)", en: "Year/model mismatch check", tone: "wait" }],
    docs: { registration: "ok", tax_token: "ok", fitness: "expired", insurance: "ok" },
  },
  {
    id: "ca-104", title: "Toyota Noah 2015 (ZRR80)", year: 2015, km: 92000, price: 2050000, market_mid: 2100000, seller: "জামাল উদ্দিন", seller_type: "individual", area: "আগ্রাবাদ, চট্টগ্রাম", photos: 5, hoursAgo: 20,
    flags: [{ bn: "ছবি ৬টার কম", en: "Fewer than 6 photos", tone: "wait" }],
    docs: { registration: "ok", tax_token: "pending", fitness: "ok", insurance: "missing" },
  },
];

export const sampleFraud: { signal_bn: string; signal_en: string; count: number; tone: Tone }[] = [
  { signal_bn: "একই ছবি একাধিক বিজ্ঞাপনে", signal_en: "Same photo in multiple ads", count: 3, tone: "bad" },
  { signal_bn: "বাজারদরের অনেক নিচে দাম", signal_en: "Price far below market", count: 2, tone: "bad" },
  { signal_bn: "\"অগ্রিম চেয়েছে\" রিপোর্ট", signal_en: "\"Asked for advance\" reports", count: 1, tone: "bad" },
  { signal_bn: "একই নম্বরে অনেক বিজ্ঞাপন", signal_en: "Many ads from one number", count: 4, tone: "wait" },
];

export const sampleInspectors = [
  { id: "in-1", name: "মাহবুব (ইন্সপেক্টর)", area: "ঢাকা উত্তর", today: 2 },
  { id: "in-2", name: "সুমন (ইন্সপেক্টর)", area: "ঢাকা দক্ষিণ", today: 1 },
  { id: "in-3", name: "রুবেল (ইন্সপেক্টর)", area: "চট্টগ্রাম", today: 0 },
];

export interface SampleBooking {
  id: string;
  car: string;
  customer: string;
  area: string;
  slot_bn: string;
  slot_en: string;
  fee: number;
  inspector: string | null;
  status: "requested" | "scheduled" | "done";
}
export const sampleInspections: SampleBooking[] = [
  { id: "IN-2001", car: "Toyota Axio 2016", customer: "রাকিব", area: "মিরপুর", slot_bn: "আগামীকাল সকাল ১০টা", slot_en: "Tomorrow 10 am", fee: 2500, inspector: null, status: "requested" },
  { id: "IN-2002", car: "Honda Vezel 2017", customer: "নাসির", area: "তেজগাঁও", slot_bn: "আজ বিকাল ৩টা", slot_en: "Today 3 pm", fee: 3000, inspector: "in-1", status: "scheduled" },
  { id: "IN-2003", car: "Toyota Premio 2018", customer: "ফারহানা", area: "ধানমন্ডি", slot_bn: "গতকাল", slot_en: "Yesterday", fee: 2500, inspector: "in-2", status: "done" },
];

export const sampleProviders = [
  { id: "sp-1", name: "মিরপুর অটো সার্ভিস", type_bn: "গ্যারেজ", type_en: "Garage", area: "মিরপুর", rating: 4.6, bookings: 38, cancel: 0.05, no_show: 0.03, verified: true },
  { id: "sp-2", name: "ঝকঝকে কার ওয়াশ", type_bn: "ওয়াশ", type_en: "Wash", area: "গুলশান", rating: 4.2, bookings: 61, cancel: 0.12, no_show: 0.08, verified: true },
  { id: "sp-3", name: "দ্রুত টোয়িং", type_bn: "টোয়িং", type_en: "Towing", area: "যাত্রাবাড়ী", rating: 3.9, bookings: 12, cancel: 0.25, no_show: 0.17, verified: false },
  { id: "sp-4", name: "কাগজপত্র সহায়তা কেন্দ্র", type_bn: "কাগজ এজেন্ট", type_en: "Paper agent", area: "মিরপুর BRTA", rating: 4.4, bookings: 9, cancel: 0.0, no_show: 0.0, verified: false },
];

export const sampleServiceBookings = [
  { id: "BK-301", service_bn: "অয়েল চেঞ্জ", service_en: "Oil change", provider: "sp-1", slot_bn: "আজ ১১টা", slot_en: "Today 11 am", price: 1200, status: "confirmed" as const },
  { id: "BK-302", service_bn: "ফুল ওয়াশ", service_en: "Full wash", provider: "sp-2", slot_bn: "আজ ২টা", slot_en: "Today 2 pm", price: 800, status: "in_progress" as const },
  { id: "BK-303", service_bn: "টোয়িং (১৫ কিমি)", service_en: "Tow (15 km)", provider: "sp-3", slot_bn: "গতকাল", slot_en: "Yesterday", price: 3500, status: "no_show" as const },
  { id: "BK-304", service_bn: "পার্টস ফিটিং (হেডলাইট)", service_en: "Part fitting (headlight)", provider: "sp-1", slot_bn: "আগামীকাল", slot_en: "Tomorrow", price: 600, status: "requested" as const },
];
export const bookingTone = { requested: "wait", confirmed: "info", in_progress: "wait", completed: "ok", cancelled: "bad", no_show: "bad" } as const;
export const bookingLabel: Record<keyof typeof bookingTone, [string, string]> = {
  requested: ["অনুরোধ", "Requested"], confirmed: ["নিশ্চিত", "Confirmed"], in_progress: ["চলছে", "In progress"], completed: ["সম্পন্ন", "Completed"], cancelled: ["বাতিল", "Cancelled"], no_show: ["আসেনি", "No-show"],
};
