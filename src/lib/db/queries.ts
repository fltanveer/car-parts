// Pure read helpers over the DB snapshot + static catalog. Safe in server and
// client components (static parts) and inside useDb selectors (dynamic parts).
import { attributeDefinitions, categories } from "../mock/taxonomy";
import { catalogProducts, priceBenchmarks } from "../mock/catalog";
import { brands, markets } from "../mock/settings";
import { engines, generationEngines, generations, makes, models } from "../mock/vehicles";
import type { Category, Fitment, Lang, Listing, Vendor } from "../types";
import type { DB } from "./seed";

// ---------- vehicles ----------
export const getMake = (id: string | null) => makes.find((m) => m.id === id) ?? null;
export const getModel = (id: string | null) => models.find((m) => m.id === id) ?? null;
export const getGeneration = (id: string | null) => generations.find((g) => g.id === id) ?? null;
export const getEngine = (id: string | null) => engines.find((e) => e.id === id) ?? null;
export const modelsOf = (makeId: string) => models.filter((m) => m.make_id === makeId);
export const generationsOf = (modelId: string) => generations.filter((g) => g.model_id === modelId);
export const enginesOf = (generationId: string) =>
  generationEngines.filter(([g]) => g === generationId).map(([, e]) => engines.find((x) => x.id === e)!);

export const findGenerationsByChassis = (input: string) => {
  const code = input.toUpperCase().trim().split(/[-\s]/)[0];
  if (code.length < 2) return [];
  return generations.filter((g) => g.chassis_codes.includes(code));
};

export const describeVehicle = (generationId: string | null, engineId: string | null = null, lang: Lang = "bn") => {
  const g = getGeneration(generationId);
  if (!g) return null;
  const model = getModel(g.model_id)!;
  const make = getMake(model.make_id)!;
  const engine = getEngine(engineId);
  const years = `${g.year_from}–${g.year_to ?? (lang === "bn" ? "এখন" : "now")}`;
  return {
    make,
    model,
    generation: g,
    engine,
    short: `${make.name} ${model.name}`,
    withYear: `${make.name} ${model.name} ${g.year_from}`,
    full: `${make.name} ${model.name} ${years} (${g.chassis_codes.slice(0, 2).join("/")})${engine ? ` · ${engine.code}` : ""}`,
    years,
  };
};

// ---------- catalog ----------
export const getCategory = (id: string | null) => categories.find((c) => c.id === id) ?? null;
export const getCategoryBySlug = (slug: string) => categories.find((c) => c.slug === slug) ?? null;
export const topCategories = () => categories.filter((c) => c.level === 1);
export const childCategories = (parentId: string) => categories.filter((c) => c.parent_id === parentId);
export const categoryPath = (id: string | null): Category[] => {
  const out: Category[] = [];
  let c = getCategory(id);
  while (c) {
    out.unshift(c);
    c = getCategory(c.parent_id);
  }
  return out;
};
/** All descendant ids including itself. */
export const categoryTreeIds = (id: string): string[] => [id, ...childCategories(id).flatMap((c) => categoryTreeIds(c.id))];
export const attributesFor = (template: Category["attribute_template"]) => attributeDefinitions.filter((a) => a.template === template);
export const getProduct = (id: string | null) => catalogProducts.find((p) => p.id === id) ?? null;
export const getProductBySlug = (slug: string) => catalogProducts.find((p) => p.slug === slug) ?? null;
export const getBrand = (id: string | null) => brands.find((b) => b.id === id) ?? null;
export const getMarket = (id: string) => markets.find((m) => m.id === id) ?? markets[markets.length - 1];
export const benchmarkFor = (categoryId: string, condition: string) =>
  priceBenchmarks.find((b) => b.category_id === categoryId && b.condition === condition);

export const fitsVehicle = (fitments: Fitment[], isUniversal: boolean, generationId: string | null): boolean | null => {
  if (!generationId) return null;
  if (isUniversal) return true;
  return fitments.some((f) => f.generation_id === generationId || (f.generation_id === null && f.model_id === getGeneration(generationId)?.model_id));
};

// ---------- dynamic (pass the DB snapshot) ----------
export const vendorById = (s: DB, id: string | null) => s.vendors.find((v) => v.id === id) ?? null;
export const vendorBySlug = (s: DB, slug: string) => s.vendors.find((v) => v.slug === slug) ?? null;
export const listingById = (s: DB, id: string | null) => s.listings.find((l) => l.id === id) ?? null;

/** Listings customers can see: active, in stock, vendor active and not on holiday. */
export const isPublic = (s: DB, l: Listing) => {
  const v = vendorById(s, l.vendor_id);
  return l.status === "active" && l.stock_qty > 0 && !!v && v.status === "active" && !v.holiday_mode;
};
export const publicListings = (s: DB) => s.listings.filter((l) => isPublic(s, l));
export const offersForProduct = (s: DB, productId: string) => publicListings(s).filter((l) => l.catalog_product_id === productId);

export const vendorListings = (s: DB, vendorId: string) => s.listings.filter((l) => l.vendor_id === vendorId);
export const vendorOrdersOf = (s: DB, vendorId: string) => s.vendorOrders.filter((o) => o.vendor_id === vendorId);
export const orderById = (s: DB, id: string | null) => s.orders.find((o) => o.id === id) ?? null;
export const vendorOrderById = (s: DB, id: string | null) => s.vendorOrders.find((o) => o.id === id) ?? null;
export const requestById = (s: DB, id: string | null) => s.requests.find((r) => r.id === id) ?? null;
export const quotesFor = (s: DB, requestId: string) => s.quotes.filter((q) => q.request_id === requestId);

export const vendorBalance = (s: DB, vendorId: string, now = Date.now()) => {
  const entries = s.ledger.filter((e) => e.vendor_id === vendorId);
  const available = entries.filter((e) => new Date(e.available_at).getTime() <= now).reduce((a, e) => a + e.amount, 0);
  const pending = entries.filter((e) => new Date(e.available_at).getTime() > now).reduce((a, e) => a + e.amount, 0);
  const monthStart = new Date();
  monthStart.setDate(1);
  const paidThisMonth = s.payouts.filter((p) => p.vendor_id === vendorId && p.status === "paid" && p.paid_at && new Date(p.paid_at) >= monthStart).reduce((a, p) => a + p.amount, 0);
  const requested = s.payouts.filter((p) => p.vendor_id === vendorId && (p.status === "requested" || p.status === "processing")).reduce((a, p) => a + p.amount, 0);
  return { available: Math.max(0, available - requested), pending, paidThisMonth };
};

/** Vendors matching a request: category, make specialty, accepts requests, active (file 00 7.1 step 3). */
export const matchVendors = (s: DB, categoryIds: string[], generationId: string | null) => {
  const makeId = generationId ? describeVehicle(generationId)?.make.id : null;
  const divisions = new Set(categoryIds.map((id) => categoryPath(id)[0]?.id).filter(Boolean));
  return s.vendors
    .filter((v) => v.status === "active" && v.accepts_requests && v.is_open && !v.holiday_mode)
    .map((v) => {
      let score = v.score;
      if (makeId && v.specialty_makes.includes(makeId)) score += 30;
      if (v.specialty_categories.some((c) => divisions.has(c))) score += 40;
      return { vendor: v, score };
    })
    .filter((m) => m.score > 100 || divisions.size === 0)
    .sort((a, b) => b.score - a.score)
    .map((m) => m.vendor);
};

export const isVendorOpenNow = (v: Vendor, d = new Date()) => {
  if (!v.is_open || v.holiday_mode) return false;
  const parts = new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, weekday: "short", timeZone: "Asia/Dhaka" }).formatToParts(d);
  const h = Number(parts.find((p) => p.type === "hour")?.value);
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.find((p) => p.type === "weekday")?.value ?? "");
  return v.opening_hours.days.includes(wd) && h >= v.opening_hours.open && h < v.opening_hours.close;
};

export { categories, catalogProducts, makes, models, generations, engines, brands, markets };
