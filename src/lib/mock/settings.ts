import type { Fulfillment, SizeClass } from "../types";

// Mirrors the `settings` key-value table (file 00 12.13). Every business
// number is read from here, never hardcoded in screens.
export const settings = {
  brand: "GaariHub",
  brand_bn: "গাড়িহাব",
  cod_limit: 10000,
  manual_advance_max_percent: 10,
  return_window_days: 3,
  damage_claim_hours: 24,
  vendor_accept_hours: 12,
  handover_hours: 48,
  delivery_days_same_city: 5,
  delivery_days_other: 10,
  request_expiry_hours: 72,
  max_quotes_per_request: 10,
  quotes_shown_first: 3,
  vendor_dispute_response_hours: 48,
  complaint_first_response_hours: 72,
  refund_hours_unfulfillable: 72,
  refund_days_late: 10,
  voice_retention_days: 90,
  max_voice_seconds: 120,
  voice_warn_seconds: 100,
  guest_requests_per_day: 5,
  min_order_value: 300,
  small_order_surcharge: 40,
  payout_min: 500,
  payout_day: 0, // Sunday
  default_commission_percent: 5,
  promo_commission_percent: 0,
  used_airbag_allowed: false,
  vendor_score_warn: 50,
  vendor_score_suspend: 30,
  random_audit_percent: 2,
  verified_vendor_publish_limit_l1: 20,
  hotline: "+8809612345678",
  hotline_display: "০৯৬১২-৩৪৫৬৭৮",
  whatsapp_number: "8801712345678",
  bkash_number: "01712-345678",
  nagad_number: "01812-345678",
  business_hours: { open: 9, close: 21 },
  feature_flags: { cars: false, services: false, assured: true, gateway: false },
};

// "Best choice" weights (file 00 7.3).
export const quoteWeights = { price: 35, vendor: 30, quality: 15, speed: 10, warranty: 5, distance: 5 };

// Vendor score weights (file 00 6.2).
export const vendorScoreWeights = { rating: 30, not_as_described: 20, on_time: 15, cancel: 15, response: 10, verification: 10 };

export const markets = [
  { id: "dholaikhal", bn: "ধোলাইখাল", en: "Dholaikhal", slots: ["সকাল ১১টা", "বিকাল ৪টা"] },
  { id: "nawabpur", bn: "নবাবপুর", en: "Nawabpur", slots: ["দুপুর ১২টা"] },
  { id: "banglamotor", bn: "বাংলামোটর", en: "Banglamotor", slots: ["দুপুর ১টা"] },
  { id: "tejgaon", bn: "তেজগাঁও", en: "Tejgaon", slots: ["বিকাল ৩টা"] },
  { id: "chattogram", bn: "চট্টগ্রাম (কদমতলী)", en: "Chattogram (Kadamtali)", slots: [] },
  { id: "other", bn: "অন্য এলাকা", en: "Other area", slots: [] },
];

export type Zone = "same_city" | "other";

// delivery_rates: zone × size × fulfillment. Per sub-order (file 00 8.1).
export const deliveryRates: { zone: Zone; size_class: SizeClass; charge: number; courier_cost: number }[] = [
  { zone: "same_city", size_class: "small", charge: 70, courier_cost: 55 },
  { zone: "same_city", size_class: "medium", charge: 120, courier_cost: 90 },
  { zone: "same_city", size_class: "large_heavy", charge: 350, courier_cost: 280 },
  { zone: "other", size_class: "small", charge: 130, courier_cost: 100 },
  { zone: "other", size_class: "medium", charge: 200, courier_cost: 160 },
  { zone: "other", size_class: "large_heavy", charge: 600, courier_cost: 480 },
];

export const fulfillmentExtra: Record<Fulfillment, number> = {
  vendor_ship: 0,
  platform_pickup: 0,
  assured_hub: 60,
  store_pickup: 0,
};

// Subset of bd_locations.
export const locations: { division: string; districts: { name: string; zone: Zone; areas: string[] }[] }[] = [
  {
    division: "ঢাকা",
    districts: [
      { name: "ঢাকা", zone: "same_city", areas: ["ধানমন্ডি", "মিরপুর", "উত্তরা", "গুলশান", "বনানী", "মোহাম্মদপুর", "তেজগাঁও", "বাড্ডা", "রামপুরা", "যাত্রাবাড়ী", "পুরান ঢাকা", "খিলগাঁও", "মতিঝিল", "বসুন্ধরা"] },
      { name: "গাজীপুর", zone: "other", areas: ["গাজীপুর সদর", "টঙ্গী", "শ্রীপুর"] },
      { name: "নারায়ণগঞ্জ", zone: "other", areas: ["নারায়ণগঞ্জ সদর", "সিদ্ধিরগঞ্জ", "রূপগঞ্জ"] },
      { name: "টাঙ্গাইল", zone: "other", areas: ["টাঙ্গাইল সদর", "মির্জাপুর"] },
    ],
  },
  {
    division: "চট্টগ্রাম",
    districts: [
      { name: "চট্টগ্রাম", zone: "other", areas: ["পাঁচলাইশ", "আগ্রাবাদ", "হালিশহর", "চকবাজার"] },
      { name: "কুমিল্লা", zone: "other", areas: ["কুমিল্লা সদর", "চৌদ্দগ্রাম"] },
      { name: "কক্সবাজার", zone: "other", areas: ["কক্সবাজার সদর"] },
    ],
  },
  { division: "সিলেট", districts: [{ name: "সিলেট", zone: "other", areas: ["সিলেট সদর", "জিন্দাবাজার"] }] },
  { division: "রাজশাহী", districts: [{ name: "রাজশাহী", zone: "other", areas: ["বোয়ালিয়া", "রাজপাড়া"] }, { name: "বগুড়া", zone: "other", areas: ["বগুড়া সদর"] }] },
  { division: "খুলনা", districts: [{ name: "খুলনা", zone: "other", areas: ["খুলনা সদর", "সোনাডাঙ্গা"] }, { name: "যশোর", zone: "other", areas: ["যশোর সদর"] }] },
  { division: "বরিশাল", districts: [{ name: "বরিশাল", zone: "other", areas: ["বরিশাল সদর"] }] },
  { division: "রংপুর", districts: [{ name: "রংপুর", zone: "other", areas: ["রংপুর সদর"] }] },
  { division: "ময়মনসিংহ", districts: [{ name: "ময়মনসিংহ", zone: "other", areas: ["ময়মনসিংহ সদর"] }] },
];

export const zoneForDistrict = (district: string): Zone =>
  locations.flatMap((d) => d.districts).find((d) => d.name === district)?.zone ?? "other";

export const brands = [
  { id: "br-toyota", name: "Toyota", type: "oem_vehicle", country: "Japan" },
  { id: "br-honda", name: "Honda", type: "oem_vehicle", country: "Japan" },
  { id: "br-denso", name: "Denso", type: "oem_supplier", country: "Japan" },
  { id: "br-aisin", name: "Aisin", type: "oem_supplier", country: "Japan" },
  { id: "br-ngk", name: "NGK", type: "oem_supplier", country: "Japan" },
  { id: "br-kyb", name: "KYB", type: "oem_supplier", country: "Japan" },
  { id: "br-koito", name: "Koito", type: "oem_supplier", country: "Japan" },
  { id: "br-bosch", name: "Bosch", type: "oem_supplier", country: "Germany" },
  { id: "br-depo", name: "DEPO", type: "aftermarket", country: "Taiwan" },
  { id: "br-sakura", name: "Sakura", type: "aftermarket", country: "Indonesia" },
  { id: "br-hamko", name: "Hamko", type: "local", country: "Bangladesh" },
  { id: "br-mobil", name: "Mobil", type: "aftermarket", country: "Singapore" },
  { id: "br-shell", name: "Shell", type: "aftermarket", country: "Malaysia" },
  { id: "br-dunlop", name: "Dunlop", type: "aftermarket", country: "Thailand" },
  { id: "br-local", name: "দেশি", type: "local", country: "Bangladesh" },
] as const;
