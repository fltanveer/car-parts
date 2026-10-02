// Business rules from file 00 (sections 5–9) as pure functions. Screens show
// what these return; the backend must recompute with the same logic.
import { deliveryRates, fulfillmentExtra, quoteWeights, settings, vendorScoreWeights, zoneForDistrict } from "./mock/settings";
import type {
  ClaimType, Condition, Fulfillment, Listing, OrderItemSnapshot, PaymentMethod, PriceBenchmark, Quote, SizeClass, Source, Vendor,
} from "./types";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const SIZE_RANK: Record<SizeClass, number> = { small: 0, medium: 1, large_heavy: 2 };

// ---------- delivery (8.1, 8.3) ----------
export const largestSize = (sizes: SizeClass[]): SizeClass =>
  sizes.reduce<SizeClass>((max, s) => (SIZE_RANK[s] > SIZE_RANK[max] ? s : max), "small");

/** Delivery charge for one sub-order (one vendor = one parcel). */
export const subOrderDeliveryCharge = (district: string, sizes: SizeClass[], fulfillment: Fulfillment) => {
  if (fulfillment === "store_pickup") return 0;
  const zone = zoneForDistrict(district);
  const rate = deliveryRates.find((r) => r.zone === zone && r.size_class === largestSize(sizes))!;
  return rate.charge + fulfillmentExtra[fulfillment];
};

export const deliveryDeadlineDays = (district: string) =>
  zoneForDistrict(district) === "same_city" ? settings.delivery_days_same_city : settings.delivery_days_other;

export const smallOrderShortfall = (subtotal: number) => Math.max(0, settings.min_order_value - subtotal);

// ---------- payment (8.2 + legal 10% cap, section 5) ----------
export interface PaymentOption {
  method: PaymentMethod;
  advance: number;
  cod: number;
  recommended?: boolean;
}

export const maxManualAdvance = (total: number) => Math.floor((total * settings.manual_advance_max_percent) / 100);

export const getPaymentOptions = (a: { total: number; deliveryTotal: number; isNewCustomer: boolean; forceAdvance: boolean; storePickupOnly: boolean }): PaymentOption[] => {
  const opts: PaymentOption[] = [];
  const advanceForDelivery = Math.min(a.deliveryTotal, maxManualAdvance(a.total)) || Math.min(a.deliveryTotal, a.total);
  const codAllowed = !a.forceAdvance && a.total <= settings.cod_limit && !a.storePickupOnly;
  if (codAllowed && !a.isNewCustomer) opts.push({ method: "cod", advance: 0, cod: a.total });
  if (!a.storePickupOnly && a.deliveryTotal > 0) {
    opts.push({ method: "delivery_advance_cod", advance: advanceForDelivery, cod: a.total - advanceForDelivery, recommended: !codAllowed || a.isNewCustomer });
  }
  if (codAllowed && a.isNewCustomer) opts.push({ method: "cod", advance: 0, cod: a.total });
  // Escrow gateway: full amount is fine because the platform holds it (legal exemption).
  opts.push({ method: "online", advance: a.total, cod: 0, recommended: a.total > settings.cod_limit });
  return opts;
};

/** Manual bKash/Nagad advance can never exceed the legal 10% (or delivery charge if lower). */
export const isManualAdvanceAllowed = (advance: number, total: number) => advance <= maxManualAdvance(total) || advance <= 0;

// ---------- money (6.4) ----------
export const commissionFor = (vendor: Pick<Vendor, "commission_percent">, subtotal: number) => {
  const commission = Math.round((subtotal * vendor.commission_percent) / 100);
  return { commission, payable: subtotal - commission };
};

// ---------- SLA deadlines (9.3) ----------
export const acceptBy = (createdAt: number) => new Date(createdAt + settings.vendor_accept_hours * HOUR).toISOString();
export const handoverBy = (paidAt: number) => new Date(paidAt + settings.handover_hours * HOUR).toISOString();
export const deliverBy = (paidAt: number, district: string) => new Date(paidAt + deliveryDeadlineDays(district) * DAY).toISOString();
export const returnWindowEnds = (deliveredAt: number) => new Date(deliveredAt + settings.return_window_days * DAY).toISOString();

export type SlaTone = "ok" | "warn" | "late";
export const slaTone = (deadline: string | null, now = Date.now(), warnHours = 12): SlaTone => {
  if (!deadline) return "ok";
  const left = new Date(deadline).getTime() - now;
  return left < 0 ? "late" : left < warnHours * HOUR ? "warn" : "ok";
};

// ---------- quotes (7.3) ----------
const SOURCE_RANK: Record<Source, number> = { genuine: 1, oem_brand: 0.85, aftermarket: 0.6, local_made: 0.4, unknown: 0.3 };
const CONDITION_RANK: Record<Condition, number> = { new: 1, refurbished: 0.7, used_import: 0.75, used_local: 0.5, for_parts: 0.1 };

export const scoreQuotes = (quotes: Quote[], vendors: Record<string, Pick<Vendor, "score">>) => {
  if (!quotes.length) return new Map<string, number>();
  const prices = quotes.map((q) => q.price + q.delivery_charge_estimate);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const out = new Map<string, number>();
  for (const q of quotes) {
    const total = q.price + q.delivery_charge_estimate;
    const price = maxP === minP ? 1 : 1 - (total - minP) / (maxP - minP);
    const vendor = (vendors[q.vendor_id]?.score ?? 50) / 100;
    const gradeBonus = q.grade ? { A: 1, B: 0.8, C: 0.55, D: 0.3 }[q.grade] : 1;
    const quality = SOURCE_RANK[q.source] * 0.5 + CONDITION_RANK[q.condition] * 0.3 + gradeBonus * 0.2;
    const speed = Math.max(0, 1 - q.dispatch_days / 5);
    const warranty = Math.min(1, q.warranty_days / 180);
    const distance = 0.7; // no geo in the mock
    const w = quoteWeights;
    out.set(q.id, Math.round(price * w.price + vendor * w.vendor + quality * w.quality + speed * w.speed + warranty * w.warranty + distance * w.distance));
  }
  return out;
};

export type QuoteSort = "best" | "cheapest" | "fastest" | "nearest" | "genuine_only" | "new_only";

// ---------- price sanity (7.2) ----------
export const priceAnomaly = (price: number, b: PriceBenchmark | undefined) => {
  if (!b) return null;
  if (price < b.p25 * 0.6) return "too_low" as const;
  if (price > b.p75 * 1.8) return "too_high" as const;
  return null;
};

// ---------- vendor score (6.2) ----------
export const vendorScoreBreakdown = (v: Vendor) => {
  const w = vendorScoreWeights;
  const parts = [
    { key: "rating", bn: "কাস্টমার রেটিং", en: "Customer rating", weight: w.rating, value: v.rating_count ? v.rating_avg / 5 : 0.6 },
    { key: "not_as_described", bn: "ছবির মতো জিনিস", en: "Item as described", weight: w.not_as_described, value: Math.min(1, v.score / 90) },
    { key: "on_time", bn: "সময়মতো পাঠানো", en: "On-time dispatch", weight: w.on_time, value: v.on_time_rate },
    { key: "cancel", bn: "বাতিল কম", en: "Low cancellations", weight: w.cancel, value: Math.min(1, v.score / 85) },
    { key: "response", bn: "দাম দেওয়ার গতি", en: "Quote speed", weight: w.response, value: Math.max(0, 1 - v.response_minutes / 180) },
    { key: "verification", bn: "যাচাই স্তর", en: "Verification", weight: w.verification, value: v.verification_level / 3 },
  ];
  return parts.map((p) => ({ ...p, points: Math.round(p.value * p.weight) }));
};

export const vendorStanding = (score: number) =>
  score < settings.vendor_score_suspend ? ("suspend" as const) : score < settings.vendor_score_warn ? ("warn" as const) : ("good" as const);

/** What each verification level unlocks (6.1). */
export const verificationPerks = [
  { level: 0, bn: "ড্রাফট করা যাবে, প্রকাশ নয়", en: "Can draft, not publish" },
  { level: 1, bn: "২০টা পর্যন্ত পণ্য প্রকাশ", en: "Publish up to 20 products" },
  { level: 2, bn: "সীমাহীন পণ্য, দাম চাওয়ায় অংশ, ✅ যাচাইকৃত ব্যাজ", en: "Unlimited products, quote on requests, ✅ verified badge" },
  { level: 3, bn: "🏅 বিশ্বস্ত বিক্রেতা, দ্রুত পেআউট, সার্চে আগে", en: "🏅 Trusted badge, faster payouts, search boost" },
];

// ---------- listing quality (file 04 9.3) ----------
export const listingQuality = (l: Pick<Listing, "media" | "part_number" | "fitments" | "is_universal" | "attributes" | "description_bn" | "warranty_days" | "is_returnable" | "updated_at">) => {
  const checks = [
    { key: "photos", bn: "৩+ ছবি", en: "3+ photos", points: 20, ok: l.media.filter((m) => m.role !== "running_video").length >= 3 },
    { key: "part_number", bn: "পার্ট নম্বর / লেবেলের ছবি", en: "Part number / label photo", points: 15, ok: !!l.part_number || l.media.some((m) => m.role === "label") },
    { key: "fitment", bn: "গাড়ির তথ্য", en: "Fitment", points: 20, ok: l.is_universal || l.fitments.length > 0 },
    { key: "attributes", bn: "বিশেষ তথ্য", en: "Specs", points: 15, ok: Object.keys(l.attributes).length >= 2 },
    { key: "description", bn: "বিবরণ", en: "Description", points: 10, ok: !!l.description_bn },
    { key: "warranty", bn: "ওয়ারেন্টি / ফেরত", en: "Warranty / returns", points: 10, ok: l.warranty_days > 0 || l.is_returnable },
    { key: "fresh", bn: "স্টক ৭ দিনে আপডেট", en: "Stock updated in 7 days", points: 10, ok: Date.now() - new Date(l.updated_at).getTime() < 7 * DAY },
  ];
  return { score: checks.reduce((s, c) => s + (c.ok ? c.points : 0), 0), checks };
};

/** New/low-score vendors and restricted categories go to review (file 02 5.1). */
export const needsReview = (vendor: Pick<Vendor, "verification_level" | "score">, restrictedCategory: boolean) =>
  vendor.verification_level < 2 || vendor.score < 50 || restrictedCategory;

// ---------- claims (9.1) ----------
export interface ClaimOption {
  type: ClaimType;
  eligible: boolean;
  liability: "vendor" | "customer" | "review";
  rule_bn: string;
  rule_en: string;
  reason_bn?: string;
  reason_en?: string;
}

export const getClaimOptions = (item: OrderItemSnapshot, deliveredAt: string | null, now = Date.now()): ClaimOption[] => {
  const since = deliveredAt ? now - new Date(deliveredAt).getTime() : Infinity;
  const withinReturn = since <= item.return_window_days * DAY;
  const opts: ClaimOption[] = [
    {
      type: "not_as_described", eligible: !!deliveredAt, liability: "vendor",
      rule_bn: "ভুল জিনিস বা ছবির সাথে মেলে না: পুরো টাকা ফেরত বা বদল। আসা-যাওয়ার খরচ দোকানের।",
      rule_en: "Wrong item or not as pictured: full refund or replacement. Seller pays shipping both ways.",
    },
    {
      type: "wrong_fitment", eligible: !!deliveredAt, liability: item.fits_user_vehicle ? "vendor" : "customer",
      rule_bn: item.fits_user_vehicle
        ? "আপনার গাড়ি সেট করা ছিল আর দোকান লিখেছিল ফিট করবে, তাই দায় দোকানের।"
        : "গাড়ি সেট না করে বা সতর্কতা উপেক্ষা করে কিনলে দায় ক্রেতার; ফেরতযোগ্য হলে খরচ আপনার।",
      rule_en: item.fits_user_vehicle
        ? "Your car was set and the seller said it fits, so the seller is responsible."
        : "Bought without setting your car or ignoring the warning: buyer is responsible; returnable items at your cost.",
    },
    {
      type: "damaged_on_arrival", eligible: since <= settings.damage_claim_hours * HOUR, liability: "vendor",
      rule_bn: `পৌঁছানোর ${settings.damage_claim_hours} ঘণ্টার মধ্যে ছবি/ভিডিওসহ জানাতে হবে।`,
      rule_en: `Report within ${settings.damage_claim_hours} hours of delivery with photos/video.`,
      reason_bn: `${settings.damage_claim_hours} ঘণ্টা পার হয়ে গেছে।`, reason_en: `More than ${settings.damage_claim_hours} hours passed.`,
    },
    {
      type: "missing_item", eligible: !!deliveredAt && since <= 2 * DAY, liability: "review",
      rule_bn: "প্যাকেটে কিছু কম থাকলে ২ দিনের মধ্যে জানান। প্যাকিং ছবি দেখে সিদ্ধান্ত।",
      rule_en: "Report missing items within 2 days. Decided using the packing photo.",
    },
  ];
  if (item.warranty_days > 0) {
    const ok = since <= item.warranty_days * DAY;
    opts.push({
      type: "warranty", eligible: ok, liability: "vendor",
      rule_bn: "দোকানের দেওয়া ওয়ারেন্টি অনুযায়ী। পাঠানোর খরচ আপনার, ফেরত দোকানের।",
      rule_en: "As per the seller's warranty. You ship it in, the seller ships it back.",
      reason_bn: "ওয়ারেন্টির মেয়াদ শেষ।", reason_en: "Warranty expired.",
    });
  }
  let mind = item.is_returnable && withinReturn;
  let reason_bn: string | undefined;
  let reason_en: string | undefined;
  if (item.is_electrical) {
    mind = false;
    reason_bn = "ইলেকট্রিক্যাল পার্ট লাগানোর পর মন বদলালে ফেরত হয় না।";
    reason_en = "Electrical parts can't be returned for change of mind.";
  } else if (!item.is_returnable) {
    reason_bn = "এই জিনিস ফেরতযোগ্য নয়।";
    reason_en = "This item is not returnable.";
  } else if (!withinReturn) {
    reason_bn = `ফেরতের সময় (${item.return_window_days} দিন) শেষ।`;
    reason_en = `Return window (${item.return_window_days} days) has passed.`;
  }
  opts.push({
    type: "change_of_mind", eligible: mind, liability: "customer",
    rule_bn: `${item.return_window_days} দিনের মধ্যে, না লাগানো ও অক্ষত অবস্থায়। আসা-যাওয়ার খরচ আপনার।`,
    rule_en: `Within ${item.return_window_days} days, unfitted and intact. You pay shipping both ways.`,
    reason_bn, reason_en,
  });
  return opts;
};

// ---------- chat safety (6.3) ----------
const PHONE_RE = /(?:\+?88)?0?1[3-9][\d\s-]{8,10}|[০-৯]{11}/g;
const LINK_RE = /(wa\.me|whatsapp|https?:\/\/|www\.|facebook\.com|imo)/i;

export const maskContactInfo = (text: string) => {
  const hasPhone = PHONE_RE.test(text);
  PHONE_RE.lastIndex = 0;
  const hasLink = LINK_RE.test(text);
  const masked = text.replace(PHONE_RE, "•••• ••••").replace(/\S*(wa\.me|whatsapp|https?:\/\/|www\.)\S*/gi, "[লিংক লুকানো]");
  return { masked, found: hasPhone || hasLink };
};

// Simple PII detection for request summaries vendors see (file 03 6.2).
export const containsPersonalInfo = (text: string) => maskContactInfo(text).found || /(বাড়ি|রোড|house|road)\s*[#নং]?\s*\d/i.test(text);

export const pickupCode = () => String(Math.floor(1000 + Math.random() * 9000));
