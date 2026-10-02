import type { DeliveryMethod, SizeClass } from "../types";

// Mirrors the `settings` key-value table. Every business number is read from
// here, never hardcoded in UI (spec section 8).
export const settings = {
  cod_limit: 5000,
  quote_validity_hours: 48,
  return_window_days_default: 3,
  damage_claim_hours: 24,
  voice_retention_days: 90,
  max_voice_seconds: 120,
  voice_warn_seconds: 100,
  guest_requests_per_day: 5,
  sourcing_advance_percent_default: 40,
  heavy_advance_percent: 80,
  new_customer_call_threshold: 3000,
  business_hours: { open: 10, close: 20 }, // Asia/Dhaka
  hotline: "+8809612345678",
  hotline_display: "০৯৬১২-৩৪৫৬৭৮",
  whatsapp_number: "8801712345678",
  bkash_number: "01712-345678",
  nagad_number: "01812-345678",
  quote_reply_hours: "২ থেকে ৪",
};

export type Zone = "dhaka" | "outside";

export const deliveryRates: { zone: Zone; size_class: SizeClass; method: DeliveryMethod; charge: number }[] = [
  { zone: "dhaka", size_class: "small", method: "home_dhaka", charge: 80 },
  { zone: "dhaka", size_class: "medium", method: "home_dhaka", charge: 120 },
  { zone: "dhaka", size_class: "large_heavy", method: "home_dhaka", charge: 350 },
  { zone: "outside", size_class: "small", method: "home_outside", charge: 150 },
  { zone: "outside", size_class: "medium", method: "home_outside", charge: 220 },
  { zone: "outside", size_class: "large_heavy", method: "branch_pickup", charge: 600 },
];

export const fragilePackingCharge = 100;

export const deliveryDays: Record<DeliveryMethod, [number, number]> = {
  home_dhaka: [1, 2],
  home_outside: [2, 4],
  branch_pickup: [2, 5],
};

// Subset of bd_locations. zone decides the delivery rate.
export const locations: { division: string; districts: { name: string; zone: Zone; areas: string[] }[] }[] = [
  {
    division: "ঢাকা",
    districts: [
      {
        name: "ঢাকা সিটি",
        zone: "dhaka",
        areas: ["ধানমন্ডি", "মিরপুর", "উত্তরা", "গুলশান", "বনানী", "মোহাম্মদপুর", "তেজগাঁও", "বাড্ডা", "রামপুরা", "যাত্রাবাড়ী", "পুরান ঢাকা", "খিলগাঁও", "মালিবাগ", "মতিঝিল", "বসুন্ধরা"],
      },
      { name: "গাজীপুর", zone: "outside", areas: ["গাজীপুর সদর", "টঙ্গী", "কালিয়াকৈর", "শ্রীপুর"] },
      { name: "নারায়ণগঞ্জ", zone: "outside", areas: ["নারায়ণগঞ্জ সদর", "সিদ্ধিরগঞ্জ", "রূপগঞ্জ"] },
      { name: "সাভার", zone: "outside", areas: ["সাভার", "আশুলিয়া"] },
      { name: "টাঙ্গাইল", zone: "outside", areas: ["টাঙ্গাইল সদর", "মির্জাপুর"] },
    ],
  },
  {
    division: "চট্টগ্রাম",
    districts: [
      { name: "চট্টগ্রাম", zone: "outside", areas: ["পাঁচলাইশ", "আগ্রাবাদ", "হালিশহর", "চকবাজার", "পতেঙ্গা"] },
      { name: "কুমিল্লা", zone: "outside", areas: ["কুমিল্লা সদর", "চৌদ্দগ্রাম"] },
      { name: "নোয়াখালী", zone: "outside", areas: ["মাইজদী", "বেগমগঞ্জ"] },
      { name: "কক্সবাজার", zone: "outside", areas: ["কক্সবাজার সদর", "টেকনাফ"] },
    ],
  },
  { division: "সিলেট", districts: [{ name: "সিলেট", zone: "outside", areas: ["সিলেট সদর", "জিন্দাবাজার", "বিয়ানীবাজার"] }, { name: "মৌলভীবাজার", zone: "outside", areas: ["শ্রীমঙ্গল", "মৌলভীবাজার সদর"] }] },
  { division: "রাজশাহী", districts: [{ name: "রাজশাহী", zone: "outside", areas: ["বোয়ালিয়া", "রাজপাড়া"] }, { name: "বগুড়া", zone: "outside", areas: ["বগুড়া সদর", "শেরপুর"] }] },
  { division: "খুলনা", districts: [{ name: "খুলনা", zone: "outside", areas: ["খুলনা সদর", "সোনাডাঙ্গা"] }, { name: "যশোর", zone: "outside", areas: ["যশোর সদর", "বেনাপোল"] }] },
  { division: "বরিশাল", districts: [{ name: "বরিশাল", zone: "outside", areas: ["বরিশাল সদর", "বাকেরগঞ্জ"] }] },
  { division: "রংপুর", districts: [{ name: "রংপুর", zone: "outside", areas: ["রংপুর সদর", "মিঠাপুকুর"] }, { name: "দিনাজপুর", zone: "outside", areas: ["দিনাজপুর সদর"] }] },
  { division: "ময়মনসিংহ", districts: [{ name: "ময়মনসিংহ", zone: "outside", areas: ["ময়মনসিংহ সদর", "ভালুকা"] }] },
];

export const zoneForDistrict = (district: string): Zone =>
  locations.flatMap((d) => d.districts).find((d) => d.name === district)?.zone ?? "outside";
