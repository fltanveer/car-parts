// Selectors and pure helpers for the customer shopping screens.
import { categoryPath, describeVehicle, fitsVehicle, getBrand, getProduct, isPublic, models, publicListings, vendorById } from "@/lib/db/queries";
import type { DB } from "@/lib/db/seed";
import { conditionLabel, sourceLabel } from "@/lib/labels";
import { subOrderDeliveryCharge } from "@/lib/rules";
import type { CatalogProduct, Condition, Grade, Listing, Source, Vendor } from "@/lib/types";

// ---------- who / which car ----------
export const ownerOf = (s: DB) => s.session.customerPhone ?? "guest";
export const myVehicles = (s: DB) => s.vehicles.filter((v) => v.owner === ownerOf(s));
export const activeVehicleOf = (s: DB) => {
  const mine = myVehicles(s);
  return mine.find((v) => v.id === s.activeVehicleId) ?? mine.find((v) => v.is_primary) ?? mine[0] ?? null;
};
export const myProfile = (s: DB) => s.profiles.find((p) => p.phone === s.session.customerPhone) ?? null;
export const myAddresses = (s: DB) => s.addresses.filter((a) => a.owner === ownerOf(s));
/** District used for delivery estimates before checkout. */
export const homeDistrict = (s: DB) => {
  const a = myAddresses(s);
  return (a.find((x) => x.is_default) ?? a[0])?.district ?? "ঢাকা";
};

// ---------- offers ----------
export const deliveryEstimate = (district: string, l: Pick<Listing, "size_class">) => subOrderDeliveryCharge(district, [l.size_class], "platform_pickup");

/** "Best choice" for catalogue offers: price, shop score, quality, speed, warranty (file 00 7.3 weights). */
export const rankOffers = (offers: Listing[], vendors: Vendor[], district: string) => {
  if (!offers.length) return [];
  const totals = offers.map((l) => l.price + deliveryEstimate(district, l));
  const min = Math.min(...totals);
  const max = Math.max(...totals);
  const SRC: Record<Source, number> = { genuine: 1, oem_brand: 0.85, aftermarket: 0.6, local_made: 0.4, unknown: 0.3 };
  const COND: Record<Condition, number> = { new: 1, refurbished: 0.7, used_import: 0.75, used_local: 0.5, for_parts: 0.1 };
  return offers
    .map((l, i) => {
      const v = vendors.find((x) => x.id === l.vendor_id);
      const price = max === min ? 1 : 1 - (totals[i] - min) / (max - min);
      const shop = (v?.score ?? 50) / 100;
      const quality = SRC[l.source] * 0.5 + COND[l.condition] * 0.3 + (l.grade ? { A: 1, B: 0.8, C: 0.55, D: 0.3 }[l.grade] : 1) * 0.2;
      const speed = Math.max(0, 1 - l.dispatch_days / 5);
      const warranty = Math.min(1, l.warranty_days / 180);
      const score = Math.round(price * 35 + shop * 30 + quality * 15 + speed * 10 + warranty * 5 + 0.7 * 5);
      return { listing: l, vendor: v ?? null, score, total: totals[i], priceScore: price, shopScore: shop };
    })
    .sort((a, b) => b.score - a.score);
};
export type RankedOffer = ReturnType<typeof rankOffers>[number];

/** Short reason for the "our suggestion" highlight. */
export const suggestionReason = (best: RankedOffer, all: RankedOffer[], tx: (bn: string, en: string) => string) => {
  const cheapest = all.every((o) => o.total >= best.total);
  const topShop = all.every((o) => (o.vendor?.score ?? 0) <= (best.vendor?.score ?? 0));
  if (cheapest && topShop) return tx("সবচেয়ে কম দাম, দোকানের রেটিংও সবচেয়ে ভালো", "Lowest price and the best-rated shop");
  if (cheapest) return tx("সবচেয়ে কম দাম, দোকানও ভালো", "Lowest price from a good shop");
  if (topShop) return tx("দাম ঠিক আছে আর দোকানের রেটিং সবচেয়ে ভালো", "Fair price from the best-rated shop");
  return tx("দাম ও দোকানের রেটিং দুটোই ভালো", "Good price and a well-rated shop");
};

// ---------- search ----------
// Bangla / English / Banglish spellings that mean the same thing.
const ALIASES: string[][] = [
  ["brake", "brek", "break", "brak", "ব্রেক", "ব্রেইক"],
  ["pad", "pads", "paid", "প্যাড"],
  ["headlight", "headlite", "hedlight", "headlait", "হেডলাইট", "হেড লাইট"],
  ["light", "lite", "lait", "bati", "batti", "লাইট", "বাতি"],
  ["tail", "backlight", "back light", "ব্যাকলাইট", "টেইল"],
  ["oil", "mobil", "mobile", "tel", "মবিল", "তেল", "ইঞ্জিন অয়েল"],
  ["filter", "filtar", "philter", "ফিল্টার"],
  ["shock", "shocker", "sokar", "shok", "শকার", "শক"],
  ["battery", "bettary", "bateri", "battary", "ব্যাটারি", "ব্যাটারী"],
  ["tyre", "tire", "tayer", "tyer", "chaka", "টায়ার", "চাকা"],
  ["plug", "spark", "প্লাগ", "স্পার্ক"],
  ["mirror", "ayna", "looking glass", "লুকিং গ্লাস", "আয়না", "মিরর"],
  ["bumper", "bampar", "bumpar", "বাম্পার"],
  ["engine", "injin", "ingine", "machine", "ইঞ্জিন", "মেশিন"],
  ["gearbox", "gear", "giyar", "গিয়ার", "গিয়ারবক্স"],
  ["wiper", "waiper", "ওয়াইপার"],
  ["belt", "বেল্ট"],
  ["coolant", "kulant", "কুল্যান্ট"],
  ["radiator", "rediator", "রেডিয়েটর", "রেডিয়েটার"],
  ["ecu", "computer", "কম্পিউটার"],
  ["bulb", "balb", "বাল্ব"],
  ["front", "samne", "samner", "সামনে", "সামনের"],
  ["rear", "pichon", "pechon", "pechoner", "পেছনে", "পেছনের", "পিছনের"],
  ["right", "dan", "ডান"],
  ["left", "bam", "বাম"],
  ["dashcam", "dash cam", "ড্যাশক্যাম"],
  ["ac", "এসি", "aircon"],
];

const lower = (s: string) => s.toLowerCase().trim();
export const compact = (s: string) => lower(s).replace(/[\s\-_./]/g, "");

const variantsOf = (token: string) => {
  const group = ALIASES.find((g) => g.some((a) => a === token || (token.length >= 3 && a.startsWith(token))));
  return group ? [token, ...group] : [token];
};

/** Every query word must match (via alias) somewhere in the haystack; part numbers match without hyphens. */
export const matchQuery = (q: string, haystack: string, partNumbers: string[]) => {
  const query = lower(q);
  if (!query) return true;
  const cq = compact(query);
  if (cq.length >= 4 && /\d/.test(cq) && partNumbers.some((p) => compact(p).includes(cq))) return true;
  const hay = ` ${lower(haystack).replace(/[(),/]/g, " ")} `;
  // Very short aliases ("ac") must match a whole word, longer ones may match inside words.
  const has = (v: string) => (v.length <= 2 ? hay.includes(` ${v} `) : hay.includes(v));
  return query.split(/\s+/).every((t) => variantsOf(t).some(has) || (t.length >= 4 && /\d/.test(t) && partNumbers.some((p) => compact(p).includes(compact(t)))));
};

const fitText = (fitments: CatalogProduct["fitments"]) =>
  fitments.map((f) => models.find((m) => m.id === f.model_id)).filter(Boolean).map((m) => `${m!.name} ${m!.name_bn}`).join(" ");

const catText = (categoryId: string) => categoryPath(categoryId).map((c) => `${c.name} ${c.name_bn} ${c.synonyms.join(" ")}`).join(" ");

export const productHaystack = (p: CatalogProduct) =>
  [p.name, p.name_bn, p.part_number ?? "", ...p.cross_ref_numbers, catText(p.category_id), getBrand(p.brand_id)?.name ?? "", fitText(p.fitments), sourceLabel[p.source].bn, sourceLabel[p.source].en].join(" ");
export const listingHaystack = (l: Listing) =>
  [l.title, l.title_bn, l.part_number ?? "", catText(l.category_id), getBrand(l.brand_id)?.name ?? "", fitText(l.fitments), sourceLabel[l.source].bn, sourceLabel[l.source].en, conditionLabel[l.condition].bn, conditionLabel[l.condition].en, l.description_bn ?? ""].join(" ");

// ---------- filters ----------
export type PriceBand = "u1k" | "1k5k" | "5k20k" | "o20k";
export const PRICE_BANDS: { id: PriceBand; min: number; max: number }[] = [
  { id: "u1k", min: 0, max: 1000 },
  { id: "1k5k", min: 1000, max: 5000 },
  { id: "5k20k", min: 5000, max: 20000 },
  { id: "o20k", min: 20000, max: Infinity },
];

export interface Filters {
  sources: Source[];
  conditions: Condition[];
  grades: Grade[];
  price: PriceBand | null;
  verifiedOnly: boolean;
  assuredOnly: boolean;
  warranty: boolean;
  shipsToday: boolean;
  markets: string[];
}
export const emptyFilters: Filters = { sources: [], conditions: [], grades: [], price: null, verifiedOnly: false, assuredOnly: false, warranty: false, shipsToday: false, markets: [] };
export const activeFilterCount = (f: Filters) =>
  f.sources.length + f.conditions.length + f.grades.length + f.markets.length + (f.price ? 1 : 0) + [f.verifiedOnly, f.assuredOnly, f.warranty, f.shipsToday].filter(Boolean).length;

export const passesFilters = (l: Listing, v: Vendor | null, f: Filters) => {
  if (f.sources.length && !f.sources.includes(l.source)) return false;
  if (f.conditions.length && !f.conditions.includes(l.condition)) return false;
  if (f.grades.length && (!l.grade || !f.grades.includes(l.grade))) return false;
  if (f.price) {
    const b = PRICE_BANDS.find((x) => x.id === f.price)!;
    if (l.price < b.min || l.price >= b.max) return false;
  }
  if (f.verifiedOnly && (v?.verification_level ?? 0) < 2) return false;
  if (f.assuredOnly && !l.is_assured_eligible) return false;
  if (f.warranty && !l.warranty_days) return false;
  if (f.shipsToday && l.dispatch_days !== 0) return false;
  if (f.markets.length && (!v || !f.markets.includes(v.market_area))) return false;
  return true;
};

// ---------- results (master products + single listings, mixed) ----------
export type SortKey = "best" | "cheapest" | "nearest" | "rating";

export type ResultItem =
  | { kind: "product"; key: string; product: CatalogProduct; offers: Listing[]; min: number; fit: boolean | null; score: number; rating: number; near: boolean }
  | { kind: "listing"; key: string; listing: Listing; vendor: Vendor; fit: boolean | null; score: number; rating: number; near: boolean };

export const buildResults = (
  s: DB,
  o: { q?: string; categoryIds?: string[]; generationId: string | null; myCarOnly: boolean; filters: Filters; sort: SortKey; vendorId?: string },
): ResultItem[] => {
  const district = homeDistrict(s);
  const cats = o.categoryIds ? new Set(o.categoryIds) : null;
  const pool = publicListings(s).filter((l) => (!cats || cats.has(l.category_id)) && (!o.vendorId || l.vendor_id === o.vendorId));
  const out: ResultItem[] = [];
  const byProduct = new Map<string, Listing[]>();
  for (const l of pool) {
    const v = vendorById(s, l.vendor_id)!;
    if (!passesFilters(l, v, o.filters)) continue;
    if (l.catalog_product_id) {
      byProduct.set(l.catalog_product_id, [...(byProduct.get(l.catalog_product_id) ?? []), l]);
      continue;
    }
    const fit = fitsVehicle(l.fitments, l.is_universal, o.generationId);
    if (o.myCarOnly && fit === false) continue;
    if (o.q && !matchQuery(o.q, listingHaystack(l), [l.part_number ?? ""])) continue;
    out.push({ kind: "listing", key: l.id, listing: l, vendor: v, fit, score: l.quality_score * 0.4 + v.score * 0.5 + (fit ? 15 : 0) + (l.is_assured_eligible ? 5 : 0), rating: v.rating_avg, near: v.district === district });
  }
  for (const [pid, offers] of byProduct) {
    const p = getProduct(pid);
    if (!p) continue;
    const fit = fitsVehicle(p.fitments, p.is_universal, o.generationId);
    if (o.myCarOnly && fit === false) continue;
    if (o.q && !matchQuery(o.q, productHaystack(p), [p.part_number ?? "", ...p.cross_ref_numbers])) continue;
    const vendors = offers.map((l) => vendorById(s, l.vendor_id)!);
    out.push({
      kind: "product", key: p.id, product: p, offers, min: Math.min(...offers.map((l) => l.price)), fit,
      score: Math.max(...offers.map((l) => l.quality_score)) * 0.4 + Math.max(...vendors.map((v) => v.score)) * 0.5 + (fit ? 15 : 0) + offers.length * 2,
      rating: Math.max(...vendors.map((v) => v.rating_avg)), near: vendors.some((v) => v.district === district),
    });
  }
  const price = (r: ResultItem) => (r.kind === "product" ? r.min : r.listing.price);
  const sorters: Record<SortKey, (a: ResultItem, b: ResultItem) => number> = {
    best: (a, b) => b.score - a.score,
    cheapest: (a, b) => price(a) - price(b),
    nearest: (a, b) => Number(b.near) - Number(a.near) || b.score - a.score,
    rating: (a, b) => b.rating - a.rating || b.score - a.score,
  };
  return out.sort(sorters[o.sort]);
};

/** Popular parts for a car (home "for your car"). */
export const popularForCar = (s: DB, generationId: string | null, limit = 6) =>
  buildResults(s, { generationId, myCarOnly: !!generationId, filters: emptyFilters, sort: "best" })
    .filter((r) => !generationId || r.fit)
    .slice(0, limit);

export const shopSearchText = (v: Vendor) => `${v.shop_name} ${v.shop_name_bn} ${v.market_area} ${v.owner_name}`;

export const vehicleLabel = (generationId: string | null, engineId: string | null, lang: "bn" | "en") => describeVehicle(generationId, engineId, lang);

export { isPublic };
