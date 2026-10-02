import { categories } from "./taxonomy";
import { generations, models } from "./vehicles";
import type { CatalogProduct, Category, Condition, DonorVehicle, Fitment, Grade, Listing, PriceBenchmark, Source, Vendor } from "../types";

const DAY = 86_400_000;
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();

export const cat = (slug: string): Category => {
  const c = categories.find((x) => x.slug === slug || x.slug.endsWith(`--${slug}`));
  if (!c) throw new Error(`category ${slug}`);
  return c;
};

export const fit = (...genIds: string[]): Fitment[] =>
  genIds.map((gid) => {
    const g = generations.find((x) => x.id === gid)!;
    const m = models.find((x) => x.id === g.model_id)!;
    return { make_id: m.make_id, model_id: m.id, generation_id: gid, engine_id: null, notes: null };
  });

const TOYOTA_1NZ = ["gn-axio-e140", "gn-axio-e160", "gn-axio-e160f", "gn-premio-t260", "gn-allion-t260", "gn-fielder-e160", "gn-probox-50"];

// ---------- vendors (12.5) ----------
const hours = (open = 10, close = 20, days = [0, 1, 2, 3, 4, 6]) => ({ days, open, close });
const verif = (level: number) => {
  const docs = [
    { doc_type: "nid_front", lvl: 1 }, { doc_type: "nid_back", lvl: 1 }, { doc_type: "selfie", lvl: 1 },
    { doc_type: "trade_license", lvl: 2 }, { doc_type: "shop_photo", lvl: 2 }, { doc_type: "visit_report", lvl: 3 },
  ] as const;
  return docs.map((d, i) => ({
    id: `vv-${i}`,
    doc_type: d.doc_type,
    file_url: d.lvl <= level ? `ph:doc` : null,
    status: (d.lvl <= level ? "approved" : "missing") as "approved" | "missing",
    notes: null,
    submitted_at: d.lvl <= level ? ago(40) : null,
  }));
};

type VendorSeed = Pick<Vendor, "id" | "shop_name" | "shop_name_bn" | "owner_name" | "market_area" | "vendor_types" | "verification_level" | "score"> & Partial<Vendor>;

const vendor = (v: VendorSeed): Vendor => ({
  owner_phone: "+8801700000000",
  slug: v.id.replace(/^v-/, ""),
  logo_color: "#334155",
  address: "",
  district: "ঢাকা",
  lat: 23.7104,
  lng: 90.4074,
  specialty_makes: ["mk-toyota"],
  specialty_categories: [],
  opening_hours: hours(),
  holiday_mode: false,
  is_open: true,
  badges: v.verification_level >= 3 ? ["verified", "trusted"] : v.verification_level >= 2 ? ["verified"] : [],
  rating_avg: 4.4,
  rating_count: 40,
  sales_count: 120,
  on_time_rate: 0.92,
  response_minutes: 30,
  commission_percent: 0,
  subscription_tier: "free",
  accepts_requests: v.verification_level >= 2,
  request_daily_limit: 30,
  default_return_days: 3,
  default_warranty_days: 0,
  default_fulfillment: "platform_pickup",
  allows_store_pickup: true,
  status: "active",
  agreement_accepted_at: ago(60),
  joined_at: ago(90),
  onboarded_by: "st-field1",
  verifications: verif(v.verification_level),
  payout_methods: v.verification_level > 0 ? [{ id: `pm-${v.id}`, method: "bkash", account_name: v.owner_name, last4: "4521", is_default: true, verified: true }] : [],
  staff: [],
  description_bn: null,
  contact_attempts: 0,
  ...v,
});

export const seedVendors: Vendor[] = [
  vendor({
    id: "v-rahman", shop_name: "Rahman Motors", shop_name_bn: "রহমান মোটরস", owner_name: "আব্দুর রহমান", owner_phone: "+8801711111111",
    market_area: "dholaikhal", address: "১৪ ধোলাইখাল রোড, পুরান ঢাকা", vendor_types: ["used_parts", "new_parts"], verification_level: 3, score: 88,
    rating_avg: 4.6, rating_count: 212, sales_count: 640, on_time_rate: 0.96, response_minutes: 18, logo_color: "#0f766e",
    specialty_makes: ["mk-toyota", "mk-honda"], specialty_categories: ["c-lighting", "c-body", "c-engine"], commission_percent: 0,
    description_bn: "২০ বছর ধরে জাপানি খোলা লাইট, বডি পার্টস আর ইঞ্জিন। প্রতিটা জিনিস চেক করে পাঠাই।",
    staff: [{ id: "vs-1", name: "রাকিব", phone: "+8801755555555", permissions: ["listings", "orders", "chat"], invited_at: ago(30), accepted: true }],
  }),
  vendor({
    id: "v-bismillah", shop_name: "Bismillah Auto Parts", shop_name_bn: "বিসমিল্লাহ অটো পার্টস", owner_name: "মো. করিম", owner_phone: "+8801722222222",
    market_area: "dholaikhal", address: "৭ নর্থসাউথ রোড, ধোলাইখাল", vendor_types: ["new_parts"], verification_level: 2, score: 79,
    rating_avg: 4.3, rating_count: 98, sales_count: 310, on_time_rate: 0.9, response_minutes: 42, logo_color: "#1d4ed8",
    specialty_categories: ["c-brakes", "c-service", "c-suspension"],
  }),
  vendor({
    id: "v-japanhalf", shop_name: "Japan Halfcut House", shop_name_bn: "জাপান হাফকাট হাউস", owner_name: "শফিকুল ইসলাম", owner_phone: "+8801733333333",
    market_area: "dholaikhal", vendor_types: ["halfcut", "used_parts"], verification_level: 2, score: 74,
    rating_avg: 4.1, rating_count: 57, sales_count: 150, on_time_rate: 0.88, response_minutes: 55, logo_color: "#7c2d12",
    specialty_categories: ["c-engine", "c-transmission", "c-body"],
  }),
  vendor({
    id: "v-tyrepoint", shop_name: "Tyre Point", shop_name_bn: "টায়ার পয়েন্ট", owner_name: "জাহিদ হাসান", owner_phone: "+8801744444444",
    market_area: "tejgaon", vendor_types: ["tyre_battery"], verification_level: 2, score: 82, logo_color: "#111827",
    specialty_makes: [], specialty_categories: ["c-wheels-tyres", "c-battery-charging"], rating_avg: 4.5, rating_count: 120,
  }),
  vendor({
    id: "v-lube", shop_name: "Nawabpur Lube Center", shop_name_bn: "নবাবপুর লুব সেন্টার", owner_name: "নাসির উদ্দিন",
    market_area: "nawabpur", vendor_types: ["lubricant"], verification_level: 1, score: 66, logo_color: "#a16207",
    specialty_makes: [], specialty_categories: ["c-service"], rating_avg: 4.0, rating_count: 22, sales_count: 48, accepts_requests: false,
  }),
  vendor({
    id: "v-shapla", shop_name: "Shapla Accessories", shop_name_bn: "শাপলা অ্যাক্সেসরিজ", owner_name: "তানভীর আহমেদ",
    market_area: "banglamotor", vendor_types: ["accessories"], verification_level: 1, score: 61, logo_color: "#9d174d",
    specialty_makes: [], specialty_categories: ["c-accessories"], rating_avg: 3.9, rating_count: 15, sales_count: 30, accepts_requests: false,
  }),
  vendor({
    id: "v-store", shop_name: "GaariHub Store", shop_name_bn: "গাড়িহাব স্টোর", owner_name: "GaariHub", market_area: "tejgaon",
    vendor_types: ["new_parts"], verification_level: 3, score: 92, logo_color: "#0e7490", badges: ["verified", "trusted", "assured_partner"],
    specialty_makes: ["mk-toyota", "mk-honda", "mk-nissan"], specialty_categories: ["c-service", "c-brakes", "c-engine"], rating_avg: 4.7, rating_count: 330,
  }),
  vendor({
    id: "v-karim", shop_name: "Karim Auto", shop_name_bn: "করিম অটো", owner_name: "আব্দুল করিম", owner_phone: "+8801766666666",
    market_area: "dholaikhal", vendor_types: ["used_parts"], verification_level: 0, score: 50, status: "pending_verification",
    rating_avg: 0, rating_count: 0, sales_count: 0, joined_at: ago(2), accepts_requests: false, logo_color: "#4338ca",
    verifications: [
      { id: "vv-k1", doc_type: "nid_front", file_url: "ph:doc", status: "submitted", notes: null, submitted_at: ago(1) },
      { id: "vv-k2", doc_type: "nid_back", file_url: "ph:doc", status: "submitted", notes: null, submitted_at: ago(1) },
      { id: "vv-k3", doc_type: "selfie", file_url: "ph:doc", status: "submitted", notes: null, submitted_at: ago(1) },
    ],
  }),
  vendor({
    id: "v-fast", shop_name: "Fast Parts BD", shop_name_bn: "ফাস্ট পার্টস বিডি", owner_name: "মামুন", market_area: "nawabpur",
    vendor_types: ["used_parts"], verification_level: 1, score: 28, status: "suspended", rating_avg: 2.6, rating_count: 18,
    on_time_rate: 0.6, contact_attempts: 5, logo_color: "#6b7280", accepts_requests: false,
  }),
];

// ---------- master products (file 04 section 8) ----------
type ProductSeed = Omit<CatalogProduct, "slug" | "status" | "cross_ref_numbers" | "is_universal" | "attributes" | "description_bn"> &
  Partial<Pick<CatalogProduct, "cross_ref_numbers" | "is_universal" | "attributes" | "description_bn">>;

const product = (p: ProductSeed): CatalogProduct => ({
  slug: p.id.replace(/^cp-/, ""),
  status: "active",
  cross_ref_numbers: [],
  is_universal: false,
  attributes: {},
  description_bn: "",
  ...p,
});

export const catalogProducts: CatalogProduct[] = [
  product({ id: "cp-toyota-pad-front", category_id: cat("brake-parts--brake-pad").id, name: "Toyota Front Brake Pad 04465-12592", name_bn: "টয়োটা সামনের ব্রেক প্যাড", brand_id: "br-toyota", source: "genuine", part_number: "04465-12592", cross_ref_numbers: ["D2299", "AN-697WK"], image: "brake", fitments: fit(...TOYOTA_1NZ), attributes: { sensor_wire: "no", material: "semi_metallic" }, description_bn: "এক এক্সেলের ৪টা প্যাডের সেট। Axio, Premio, Allion, Fielder (1NZ) সামনের চাকায় লাগে।" }),
  product({ id: "cp-toyota-oil-filter", category_id: cat("filters--oil-filter").id, name: "Toyota Oil Filter 90915-YZZE1", name_bn: "টয়োটা মবিল ফিল্টার", brand_id: "br-toyota", source: "genuine", part_number: "90915-YZZE1", cross_ref_numbers: ["C-110", "90915-10003"], image: "filter", fitments: fit(...TOYOTA_1NZ, "gn-noah-r70", "gn-noah-r80"), description_bn: "প্রতি মবিল বদলের সাথে বদলানো উচিত।" }),
  product({ id: "cp-axio-air-filter", category_id: cat("filters--air-filter").id, name: "Air Filter 17801-21050", name_bn: "এয়ার ফিল্টার (Axio/Fielder)", brand_id: "br-denso", source: "oem_brand", part_number: "17801-21050", image: "filter", fitments: fit("gn-axio-e160", "gn-axio-e160f", "gn-fielder-e160", "gn-premio-t260", "gn-allion-t260") }),
  product({ id: "cp-ngk-iridium", category_id: cat("ignition--spark-plug").id, name: "Denso Iridium Spark Plug SK16R11", name_bn: "ডেনসো ইরিডিয়াম স্পার্ক প্লাগ", brand_id: "br-denso", source: "oem_brand", part_number: "SK16R11", image: "engine", fitments: fit(...TOYOTA_1NZ, "gn-aqua-p10"), attributes: { plug_type: "iridium" } }),
  product({ id: "cp-kyb-shock-front", category_id: cat("suspension-parts--shock-absorber").id, name: "KYB Front Shock Absorber 339064", name_bn: "KYB সামনের শক অ্যাবজর্বার", brand_id: "br-kyb", source: "oem_brand", part_number: "339064", image: "suspension", fitments: fit("gn-axio-e140", "gn-premio-t260", "gn-allion-t260"), attributes: { shock_type: "gas", assembly: "shock_only" } }),
  product({ id: "cp-mobil-5w30", category_id: cat("fluids--engine-oil").id, name: "Mobil Super 5W-30 4L", name_bn: "মবিল সুপার 5W-30 (৪ লিটার)", brand_id: "br-mobil", source: "aftermarket", part_number: null, image: "fluid", is_universal: true, fitments: [], attributes: { viscosity: "5W-30", litre: "4" } }),
  product({ id: "cp-hamko-ns40", category_id: cat("battery--battery").id, name: "Hamko NS40ZL Battery", name_bn: "হামকো NS40ZL ব্যাটারি", brand_id: "br-hamko", source: "local_made", part_number: "NS40ZL", image: "battery", is_universal: true, fitments: [], attributes: { size_code: "NS40ZL", terminal: "L", type: "mf" } }),
  product({ id: "cp-bosch-wiper-24", category_id: cat("wipers--wiper-blade").id, name: "Bosch Aerotwin Wiper 24\"", name_bn: "বস ওয়াইপার ব্লেড ২৪ ইঞ্চি", brand_id: "br-bosch", source: "oem_brand", part_number: "3397008536", image: "wiper", is_universal: true, fitments: [], attributes: { length: "22" } }),
  product({ id: "cp-honda-pad-vezel", category_id: cat("brake-parts--brake-pad").id, name: "Honda Front Brake Pad 45022-T5A-J01", name_bn: "হোন্ডা সামনের ব্রেক প্যাড (Vezel/Fit/Grace)", brand_id: "br-honda", source: "genuine", part_number: "45022-T5A-J01", image: "brake", fitments: fit("gn-vezel-ru", "gn-fit-gp5", "gn-grace-gm") }),
  product({ id: "cp-dunlop-185-65-15", category_id: cat("tyres--new-tyre").id, name: "Dunlop EC300 185/65R15", name_bn: "ডানলপ টায়ার 185/65R15", brand_id: "br-dunlop", source: "aftermarket", part_number: null, image: "tyre", is_universal: true, fitments: [], attributes: { width: "185", ratio: "65", rim: "15" } }),
  product({ id: "cp-h4-bulb", category_id: cat("bulbs--headlight-bulb").id, name: "Philips H4 Halogen Bulb 60/55W", name_bn: "ফিলিপস H4 হেডলাইট বাল্ব", brand_id: null, source: "aftermarket", part_number: "12342PR", image: "light", is_universal: true, fitments: [], attributes: { base: "H4" } }),
  product({ id: "cp-fan-belt-1nz", category_id: cat("belt-parts--fan-belt").id, name: "Fan Belt 7PK1220", name_bn: "ফ্যান বেল্ট 7PK1220", brand_id: "br-bosch", source: "oem_brand", part_number: "7PK1220", image: "belt", fitments: fit("gn-axio-e140", "gn-premio-t260", "gn-allion-t260", "gn-fielder-e160"), attributes: { code: "7PK1220" } }),
  product({ id: "cp-toyota-coolant", category_id: cat("fluids--coolant").id, name: "Toyota Super Long Life Coolant 2L", name_bn: "টয়োটা কুল্যান্ট (২ লিটার)", brand_id: "br-toyota", source: "genuine", part_number: "08889-80070", image: "fluid", is_universal: true, fitments: [] }),
  product({ id: "cp-cabin-filter", category_id: cat("filters--cabin-filter").id, name: "Denso Cabin Filter 87139-30040", name_bn: "ডেনসো এসি ফিল্টার", brand_id: "br-denso", source: "oem_brand", part_number: "87139-30040", image: "filter", fitments: fit(...TOYOTA_1NZ, "gn-noah-r80", "gn-aqua-p10") }),
];

// ---------- listings (vendor offers) ----------
type ListingSeed = Pick<Listing, "id" | "vendor_id" | "price"> & Partial<Listing> & { product?: string; category?: string };

const listing = (l: ListingSeed): Listing => {
  const p = l.product ? catalogProducts.find((x) => x.id === l.product)! : null;
  const c = l.category ? cat(l.category) : categories.find((x) => x.id === p?.category_id)!;
  const condition: Condition = l.condition ?? "new";
  const base: Listing = {
    id: l.id,
    vendor_id: l.vendor_id,
    catalog_product_id: p?.id ?? null,
    category_id: c.id,
    title: p?.name ?? l.title ?? c.name,
    title_bn: p?.name_bn ?? l.title_bn ?? c.name_bn,
    source: p?.source ?? l.source ?? "unknown",
    condition,
    grade: null,
    brand_id: p?.brand_id ?? null,
    part_number: p?.part_number ?? null,
    origin_country: null,
    attributes: p?.attributes ?? {},
    position: [],
    price: l.price,
    compare_at_price: null,
    stock_qty: 5,
    unit: "piece",
    pack_size: 1,
    warranty_days: 0,
    is_returnable: true,
    return_window_days: 3,
    is_electrical: c.is_electrical,
    size_class: c.default_size_class,
    is_fragile: false,
    dispatch_days: 0,
    is_universal: p?.is_universal ?? false,
    is_assured_eligible: false,
    donor_vehicle_id: null,
    fitments: p?.fitments ?? [],
    description_bn: null,
    media: [{ url: `ph:${p?.image ?? c.icon}`, role: "main" }, { url: `ph:${p?.image ?? c.icon}`, role: "other" }],
    quality_score: 70,
    status: "active",
    rejection_reason: null,
    views: 120,
    sold: 8,
    created_at: ago(20),
    updated_at: ago(2),
  };
  const { product: _p, category: _c, ...rest } = l;
  void _p;
  void _c;
  return { ...base, ...rest };
};

const used = (source: Source, grade: Grade) => ({ source, condition: "used_import" as Condition, grade });

export const seedListings: Listing[] = [
  // brake pad offers
  listing({ id: "ls-1", vendor_id: "v-bismillah", product: "cp-toyota-pad-front", price: 2350, stock_qty: 12, warranty_days: 0, quality_score: 85, sold: 64 }),
  listing({ id: "ls-2", vendor_id: "v-store", product: "cp-toyota-pad-front", price: 2450, stock_qty: 20, is_assured_eligible: true, quality_score: 92, sold: 120 }),
  listing({ id: "ls-3", vendor_id: "v-rahman", product: "cp-toyota-pad-front", price: 2280, stock_qty: 3, dispatch_days: 1, quality_score: 74 }),
  // oil filter
  listing({ id: "ls-4", vendor_id: "v-bismillah", product: "cp-toyota-oil-filter", price: 420, stock_qty: 40, quality_score: 80, sold: 210 }),
  listing({ id: "ls-5", vendor_id: "v-store", product: "cp-toyota-oil-filter", price: 450, stock_qty: 100, is_assured_eligible: true, quality_score: 90, sold: 400 }),
  listing({ id: "ls-6", vendor_id: "v-lube", product: "cp-toyota-oil-filter", price: 390, stock_qty: 25, quality_score: 62 }),
  listing({ id: "ls-7", vendor_id: "v-bismillah", product: "cp-axio-air-filter", price: 650, stock_qty: 15 }),
  listing({ id: "ls-8", vendor_id: "v-store", product: "cp-ngk-iridium", price: 1150, stock_qty: 32, unit: "piece", warranty_days: 0, sold: 90 }),
  listing({ id: "ls-9", vendor_id: "v-bismillah", product: "cp-kyb-shock-front", price: 5200, stock_qty: 4, warranty_days: 180, position: ["front"] }),
  listing({ id: "ls-10", vendor_id: "v-lube", product: "cp-mobil-5w30", price: 3950, stock_qty: 30, is_returnable: false, sold: 75 }),
  listing({ id: "ls-11", vendor_id: "v-store", product: "cp-mobil-5w30", price: 4100, stock_qty: 50, is_returnable: false }),
  listing({ id: "ls-12", vendor_id: "v-tyrepoint", product: "cp-hamko-ns40", price: 6200, stock_qty: 10, warranty_days: 365, sold: 55 }),
  listing({ id: "ls-13", vendor_id: "v-shapla", product: "cp-bosch-wiper-24", price: 950, stock_qty: 18 }),
  listing({ id: "ls-14", vendor_id: "v-store", product: "cp-honda-pad-vezel", price: 3100, stock_qty: 8 }),
  listing({ id: "ls-15", vendor_id: "v-tyrepoint", product: "cp-dunlop-185-65-15", price: 7800, stock_qty: 16, warranty_days: 365, attributes: { width: "185", ratio: "65", rim: "15", dot: "1226" } }),
  listing({ id: "ls-16", vendor_id: "v-shapla", product: "cp-h4-bulb", price: 650, stock_qty: 40, unit: "pair" }),
  listing({ id: "ls-17", vendor_id: "v-bismillah", product: "cp-fan-belt-1nz", price: 980, stock_qty: 9 }),
  listing({ id: "ls-18", vendor_id: "v-store", product: "cp-toyota-coolant", price: 1650, stock_qty: 25, is_returnable: false }),
  listing({ id: "ls-19", vendor_id: "v-bismillah", product: "cp-cabin-filter", price: 750, stock_qty: 0, status: "sold_out" }),
  // single used items (no master)
  listing({
    id: "ls-20", vendor_id: "v-rahman", category: "lamps--headlight", ...used("genuine", "A"), price: 14500, stock_qty: 1, warranty_days: 30,
    title: "Axio E140 Headlight Right (Koito)", title_bn: "Axio E140 ডান হেডলাইট (Koito)", brand_id: "br-koito", fitments: fit("gn-axio-e140"),
    position: ["front", "driver"], attributes: { tech: "hid", defects: ["none"] }, is_fragile: true, is_assured_eligible: true, quality_score: 88,
    description_bn: "জাপান থেকে খোলা, HID ব্যালাস্টসহ। গ্লাস একদম পরিষ্কার, কোনো কান ভাঙা নেই।",
    media: [{ url: "ph:light", role: "main" }, { url: "ph:light", role: "other" }, { url: "ph:light", role: "defect" }],
  }),
  listing({
    id: "ls-21", vendor_id: "v-rahman", category: "lamps--headlight", ...used("genuine", "B"), price: 11800, stock_qty: 1, warranty_days: 7,
    title: "Axio E140 Headlight Left (Koito)", title_bn: "Axio E140 বাম হেডলাইট (Koito)", brand_id: "br-koito", fitments: fit("gn-axio-e140"),
    position: ["front", "passenger"], attributes: { tech: "halogen", defects: ["tab"] }, is_fragile: true, quality_score: 76,
  }),
  listing({
    id: "ls-22", vendor_id: "v-japanhalf", category: "engine-assembly--full-engine", ...used("genuine", "B"), price: 85000, stock_qty: 1,
    title: "1NZ-FE Complete Engine", title_bn: "1NZ-FE সম্পূর্ণ ইঞ্জিন", fitments: fit(...TOYOTA_1NZ), warranty_days: 30,
    attributes: { engine_code: "1NZ-FE", included: ["ecu", "wiring", "alternator", "starter"], tested: "video", km: 78000 }, dispatch_days: 1,
    is_assured_eligible: true, donor_vehicle_id: "dv-1", quality_score: 81,
    media: [{ url: "ph:engine", role: "main" }, { url: "ph:engine", role: "label" }, { url: "ph:engine", role: "other" }, { url: "ph:engine", role: "running_video" }],
  }),
  listing({
    id: "ls-23", vendor_id: "v-japanhalf", category: "gearbox--cvt-gearbox", ...used("genuine", "B"), price: 42000, stock_qty: 1,
    title: "Axio E160 CVT Gearbox K310", title_bn: "Axio E160 CVT গিয়ারবক্স K310", fitments: fit("gn-axio-e160", "gn-fielder-e160"), donor_vehicle_id: "dv-1",
    attributes: { type: "cvt", drive: "2wd" }, warranty_days: 15,
  }),
  listing({
    id: "ls-24", vendor_id: "v-japanhalf", category: "mirrors--side-mirror", ...used("genuine", "A"), price: 6500, stock_qty: 1,
    title: "Axio E160 Side Mirror Right", title_bn: "Axio E160 ডান সাইড মিরর", fitments: fit("gn-axio-e160"), position: ["driver"], donor_vehicle_id: "dv-1",
    attributes: { features: ["fold", "signal"] },
  }),
  listing({
    id: "ls-25", vendor_id: "v-rahman", category: "panels--front-bumper", ...used("genuine", "C"), price: 9000, stock_qty: 1,
    title: "Noah R80 Front Bumper", title_bn: "Noah R80 সামনের বাম্পার", fitments: fit("gn-noah-r80"), position: ["front"], attributes: { paint: "painted", damage: "yes" },
  }),
  listing({
    id: "ls-26", vendor_id: "v-japanhalf", category: "modules--engine-ecu", ...used("genuine", "A"), price: 18000, stock_qty: 1,
    title: "Premio T260 Engine ECU 89661-20", title_bn: "Premio T260 ইঞ্জিন ECU", part_number: "89661-20F41", fitments: fit("gn-premio-t260", "gn-allion-t260"),
    is_returnable: false, attributes: { part_number_photo: "yes", tested: "yes" },
  }),
  listing({
    id: "ls-27", vendor_id: "v-tyrepoint", category: "tyres--used-japanese-tyre", source: "aftermarket", condition: "used_import", grade: "B", price: 3200,
    stock_qty: 4, title: "Bridgestone 185/65R15 (Japanese used)", title_bn: "ব্রিজস্টোন 185/65R15 (জাপানি)", is_universal: true,
    attributes: { width: "185", ratio: "65", rim: "15", tread: "half", dot: "4421" },
  }),
  listing({
    id: "ls-28", vendor_id: "v-shapla", category: "accessory-items--dashcam", source: "aftermarket", price: 4500, stock_qty: 6, is_universal: true,
    title: "70mai Dashcam M300", title_bn: "70mai ড্যাশক্যাম", warranty_days: 180,
  }),
  listing({
    id: "ls-29", vendor_id: "v-rahman", category: "lamps--tail-light", ...used("genuine", "A"), price: 5500, stock_qty: 2,
    title: "Premio T260 Tail Light Right", title_bn: "Premio T260 ডান ব্যাকলাইট", fitments: fit("gn-premio-t260"), position: ["rear", "driver"],
  }),
  listing({
    id: "ls-30", vendor_id: "v-fast", category: "mirrors--side-mirror", ...used("unknown", "B"), price: 1500, stock_qty: 6,
    title: "Side Mirror (various)", title_bn: "সাইড মিরর", fitments: fit("gn-axio-e140"), status: "paused",
  }),
  listing({
    id: "ls-31", vendor_id: "v-karim", category: "lamps--fog-light", ...used("genuine", "B"), price: 2200, stock_qty: 2,
    title: "Fielder Fog Light Pair", title_bn: "ফিল্ডার ফগ লাইট জোড়া", fitments: fit("gn-fielder-e160"), status: "pending_review", unit: "pair",
  }),
];

export const seedDonorVehicles: DonorVehicle[] = [
  { id: "dv-1", vendor_id: "v-japanhalf", generation_id: "gn-axio-e160", engine_id: "en-1nzfe", color: "সাদা", odometer_km: 78000, notes: "সামনের দিক ভালো, পেছনে ধাক্কা।", created_at: ago(10) },
];

export const priceBenchmarks: PriceBenchmark[] = [
  { category_id: cat("lamps--headlight").id, condition: "used_import", p25: 9500, median: 12500, p75: 15500 },
  { category_id: cat("brake-parts--brake-pad").id, condition: "new", p25: 1800, median: 2300, p75: 2800 },
  { category_id: cat("engine-assembly--full-engine").id, condition: "used_import", p25: 70000, median: 85000, p75: 105000 },
  { category_id: cat("mirrors--side-mirror").id, condition: "used_import", p25: 4000, median: 5800, p75: 7500 },
  { category_id: cat("panels--front-bumper").id, condition: "used_import", p25: 6500, median: 8500, p75: 11000 },
];

// Customer review tags (chips, no typing).
export const reviewTags = [
  { id: "as_described", bn: "যেমন বলেছে তেমন", en: "As described" },
  { id: "fast", bn: "দ্রুত পাঠিয়েছে", en: "Fast dispatch" },
  { id: "packing", bn: "ভালো প্যাকিং", en: "Good packing" },
  { id: "fair_price", bn: "দাম ঠিক", en: "Fair price" },
  { id: "helpful", bn: "ভালো ব্যবহার", en: "Helpful" },
];
