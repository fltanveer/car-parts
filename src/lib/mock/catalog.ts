import type { Category, Fitment, Part, Quality, Review, SizeClass, Synonym } from "../types";

const c = (
  id: string,
  slug: string,
  name: string,
  name_bn: string,
  icon: string,
  parent_id: string | null = null,
  is_electrical = false,
): Category => ({ id, parent_id, slug, name, name_bn, icon, is_electrical });

export const categories: Category[] = [
  c("ct-engine", "engine", "Engine", "ইঞ্জিন", "engine"),
  c("ct-brake", "brake", "Brake", "ব্রেক", "brake"),
  c("ct-suspension", "suspension", "Suspension", "সাসপেনশন", "suspension"),
  c("ct-light", "light", "Lights", "লাইট", "light", null, true),
  c("ct-electrical", "electrical", "Electrical", "ইলেকট্রিক্যাল", "electrical", null, true),
  c("ct-filter", "filter-oil", "Filter & Oil", "ফিল্টার ও অয়েল", "filter"),
  c("ct-body", "body", "Body Parts", "বডি পার্টস", "body"),
  c("ct-ac", "ac", "AC", "এসি", "ac"),
  c("ct-steering", "steering", "Steering", "স্টিয়ারিং", "steering"),
  c("ct-transmission", "transmission", "Transmission", "ট্রান্সমিশন", "transmission"),
  c("ct-cooling", "cooling", "Cooling", "কুলিং", "cooling"),
  c("ct-mirror", "mirror-glass", "Mirror & Glass", "মিরর ও গ্লাস", "mirror"),

  c("ct-brake-pad", "brake-pad", "Brake Pad", "ব্রেক প্যাড", "brake", "ct-brake"),
  c("ct-brake-shoe", "brake-shoe", "Brake Shoe", "ব্রেক শু", "brake", "ct-brake"),
  c("ct-brake-disc", "brake-disc", "Brake Disc", "ব্রেক ডিস্ক", "brake", "ct-brake"),
  c("ct-brake-master", "master-cylinder", "Master Cylinder", "মাস্টার সিলিন্ডার", "brake", "ct-brake"),
  c("ct-eng-ignition", "ignition", "Plug & Coil", "প্লাগ ও কয়েল", "electrical", "ct-engine", true),
  c("ct-eng-belt", "belt", "Belts", "বেল্ট", "engine", "ct-engine"),
  c("ct-eng-mount", "engine-mount", "Engine Mount", "ইঞ্জিন মাউন্ট", "engine", "ct-engine"),
  c("ct-sus-shock", "shock-absorber", "Shock Absorber", "শক অ্যাবজর্বার", "suspension", "ct-suspension"),
  c("ct-sus-joint", "ball-joint", "Ball Joint & Link", "বল জয়েন্ট ও লিংক", "suspension", "ct-suspension"),
  c("ct-filter-oil", "oil-filter", "Oil Filter", "মবিল ফিল্টার", "filter", "ct-filter"),
  c("ct-filter-air", "air-filter", "Air Filter", "এয়ার ফিল্টার", "filter", "ct-filter"),
  c("ct-filter-engine-oil", "engine-oil", "Engine Oil", "ইঞ্জিন অয়েল (মবিল)", "filter", "ct-filter"),
  c("ct-elec-starter", "starter-alternator", "Starter & Alternator", "সেলফ ও ডায়নামো", "electrical", "ct-electrical", true),
  c("ct-elec-sensor", "sensor", "Sensors", "সেন্সর", "electrical", "ct-electrical", true),
];

type PartInput = {
  id: string;
  name: string;
  name_bn: string;
  part_number: string;
  category: string;
  brand: string;
  quality: Quality;
  price: number | null;
  compare_at_price?: number;
  stock?: number;
  sourcing?: [number, number];
  warranty?: number;
  electrical?: boolean;
  size?: SizeClass;
  fragile?: boolean;
  weight?: number;
  fit: (string | [string, string | null, string | null])[];
  desc_bn: string;
  desc: string;
  rating?: number;
  reviews?: number;
};

const toFit = (f: PartInput["fit"][number]): Fitment =>
  typeof f === "string" ? { generation_id: f, engine_id: null, notes: null } : { generation_id: f[0], engine_id: f[1], notes: f[2] };

export const normalizePartNumber = (s: string) => s.toLowerCase().replace(/[\s\-_.]/g, "");

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const p = (i: PartInput): Part => {
  const inStock = (i.stock ?? 0) > 0;
  const electrical = i.electrical ?? false;
  const noWarranty = i.quality === "aftermarket" || i.quality === "reconditioned";
  return {
    id: i.id,
    sku: `PB-${i.id.toUpperCase()}`,
    part_number: i.part_number,
    part_number_normalized: normalizePartNumber(i.part_number),
    name: i.name,
    name_bn: i.name_bn,
    slug: slugify(`${i.brand} ${i.name} ${i.part_number}`),
    description: i.desc,
    description_bn: i.desc_bn,
    category_id: i.category,
    brand: i.brand,
    quality: i.quality,
    price: i.price,
    compare_at_price: i.compare_at_price ?? null,
    stock_qty: i.stock ?? 0,
    availability: inStock ? "in_stock" : "sourcing",
    sourcing_days_min: i.sourcing?.[0] ?? 3,
    sourcing_days_max: i.sourcing?.[1] ?? 7,
    warranty_months: noWarranty ? 0 : (i.warranty ?? 0),
    warranty_terms: i.warranty ? "ভুল ইনস্টলেশন ও দুর্ঘটনা কাভার নয়। সিল/স্টিকার অক্ষত থাকতে হবে।" : null,
    is_returnable: !electrical,
    return_window_days: 3,
    is_electrical: electrical,
    size_class: i.size ?? "small",
    is_fragile: i.fragile ?? false,
    weight_kg: i.weight ?? 0.5,
    fitments: i.fit.map(toFit),
    rating: i.rating ?? null,
    review_count: i.reviews ?? 0,
  };
};

const AXIO_FAMILY = ["gn-axio-e140", "gn-fielder-e160", "gn-axio-e160"];
const PREMIO_FAMILY = ["gn-premio-t260", "gn-allion-t260"];
const NZ_ENGINE_CARS = [...AXIO_FAMILY, ...PREMIO_FAMILY, "gn-probox-50", "gn-probox-160"];

export const parts: Part[] = [
  p({
    id: "bp01", name: "Front Brake Pad Set", name_bn: "সামনের ব্রেক প্যাড সেট", part_number: "04465-12592",
    category: "ct-brake-pad", brand: "Toyota", quality: "genuine", price: 4500, stock: 12, weight: 1.2,
    fit: [...AXIO_FAMILY, ...PREMIO_FAMILY], rating: 4.8, reviews: 23,
    desc_bn: "টয়োটার আসল সামনের ব্রেক প্যাড, ৪ পিসের সেট। বাক্সে টয়োটা হলোগ্রাম আছে।",
    desc: "Toyota genuine front brake pads, set of 4. Toyota hologram on box.",
  }),
  p({
    id: "bp02", name: "Front Brake Pad Set", name_bn: "সামনের ব্রেক প্যাড সেট", part_number: "AN-735WK",
    category: "ct-brake-pad", brand: "Akebono", quality: "oem_equivalent", price: 2800, compare_at_price: 3200, stock: 20, weight: 1.2,
    fit: [...AXIO_FAMILY, ...PREMIO_FAMILY], rating: 4.6, reviews: 41,
    desc_bn: "আকেবোনো টয়োটার কারখানায় যে প্যাড সাপ্লাই দেয়, সেই একই মানের। জাপানে তৈরি।",
    desc: "Akebono supplies Toyota factories; same grade, made in Japan.",
  }),
  p({
    id: "bp03", name: "Front Brake Pad Set", name_bn: "সামনের ব্রেক প্যাড সেট", part_number: "D2195",
    category: "ct-brake-pad", brand: "Bendix", quality: "aftermarket", price: 1650, stock: 30, weight: 1.1,
    fit: [...AXIO_FAMILY, ...PREMIO_FAMILY], rating: 4.1, reviews: 17,
    desc_bn: "কম দামে ভালো মানের আফটারমার্কেট প্যাড। শহরে সাধারণ চালানোর জন্য ঠিক আছে।",
    desc: "Budget aftermarket pad, fine for normal city driving.",
  }),
  p({
    id: "bs01", name: "Rear Brake Shoe Set", name_bn: "পেছনের ব্রেক শু সেট", part_number: "04495-52130",
    category: "ct-brake-shoe", brand: "Toyota", quality: "genuine", price: 3900, stock: 6, weight: 1.5,
    fit: [...AXIO_FAMILY, ...PREMIO_FAMILY, "gn-probox-50"], rating: 4.7, reviews: 9,
    desc_bn: "পেছনের ড্রাম ব্রেকের আসল শু। ৪ পিসের সেট।",
    desc: "Genuine rear drum brake shoes, set of 4.",
  }),
  p({
    id: "bs02", name: "Rear Brake Shoe Set", name_bn: "পেছনের ব্রেক শু সেট", part_number: "K2325",
    category: "ct-brake-shoe", brand: "Nisshinbo", quality: "oem_equivalent", price: 2200, stock: 14, weight: 1.5,
    fit: [...AXIO_FAMILY, ...PREMIO_FAMILY, "gn-probox-50"], rating: 4.5, reviews: 12,
    desc_bn: "নিশিনবো জাপানের OEM সাপ্লায়ার। টেকসই ও কম শব্দ।",
    desc: "Nisshinbo is a Japanese OEM supplier. Durable and quiet.",
  }),
  p({
    id: "bd01", name: "Front Brake Disc Rotor", name_bn: "সামনের ব্রেক ডিস্ক", part_number: "43512-12690",
    category: "ct-brake-disc", brand: "Toyota", quality: "genuine", price: 5200, sourcing: [3, 5], size: "medium", weight: 5,
    fit: AXIO_FAMILY,
    desc_bn: "আসল সামনের ব্রেক ডিস্ক (একটা)। জোড়ায় বদলানো ভালো।",
    desc: "Genuine front disc rotor (single). Replace in pairs.",
  }),
  p({
    id: "bm01", name: "Brake Master Cylinder", name_bn: "ব্রেক মাস্টার সিলিন্ডার", part_number: "47201-12B30",
    category: "ct-brake-master", brand: "Toyota", quality: "reconditioned", price: 6500, sourcing: [2, 4], size: "medium", weight: 2,
    fit: AXIO_FAMILY,
    desc_bn: "জাপান থেকে আসা রিকন্ডিশন মাস্টার সিলিন্ডার, লিক টেস্ট করা।",
    desc: "Japan reconditioned master cylinder, leak tested.",
  }),
  p({
    id: "sp01", name: "Iridium Spark Plug", name_bn: "ইরিডিয়াম স্পার্ক প্লাগ", part_number: "SK16R11",
    category: "ct-eng-ignition", brand: "Denso", quality: "oem_equivalent", price: 950, stock: 80, weight: 0.1,
    fit: NZ_ENGINE_CARS, rating: 4.9, reviews: 64,
    desc_bn: "ডেনসো ইরিডিয়াম প্লাগ, টয়োটা ফ্যাক্টরিতে লাগানো একই মডেল। প্রতি পিসের দাম।",
    desc: "Denso iridium plug, same as factory fit. Price per piece.",
  }),
  p({
    id: "sp02", name: "Laser Iridium Spark Plug", name_bn: "লেজার ইরিডিয়াম স্পার্ক প্লাগ", part_number: "DILKAR6A11",
    category: "ct-eng-ignition", brand: "NGK", quality: "oem_equivalent", price: 1050, stock: 40, weight: 0.1,
    fit: ["gn-noah-r70", "gn-noah-r80", "gn-voxy-r80"], rating: 4.8, reviews: 21,
    desc_bn: "NGK লেজার ইরিডিয়াম, ৩ZR ইঞ্জিনের জন্য। প্রতি পিসের দাম।",
    desc: "NGK laser iridium for 3ZR engines. Price per piece.",
  }),
  p({
    id: "ic01", name: "Ignition Coil", name_bn: "ইগনিশন কয়েল", part_number: "90919-02240",
    category: "ct-eng-ignition", brand: "Denso", quality: "genuine", price: 4800, stock: 8, warranty: 6, electrical: true, weight: 0.4,
    fit: NZ_ENGINE_CARS, rating: 4.7, reviews: 15,
    desc_bn: "আসল ইগনিশন কয়েল, ইঞ্জিন কাঁপা বা মিসফায়ার হলে সাধারণত এটা বদলাতে হয়।",
    desc: "Genuine ignition coil; usual fix for misfire and engine shake.",
  }),
  p({
    id: "of01", name: "Oil Filter", name_bn: "মবিল ফিল্টার", part_number: "90915-YZZE1",
    category: "ct-filter-oil", brand: "Toyota", quality: "genuine", price: 650, stock: 120, weight: 0.3,
    fit: [...NZ_ENGINE_CARS, "gn-noah-r70", "gn-noah-r80", "gn-voxy-r80", "gn-aqua-p10"], rating: 4.9, reviews: 88,
    desc_bn: "টয়োটার আসল মবিল ফিল্টার। প্রতিবার মবিল বদলানোর সময় বদলান।",
    desc: "Genuine Toyota oil filter. Change with every oil change.",
  }),
  p({
    id: "of02", name: "Oil Filter", name_bn: "মবিল ফিল্টার", part_number: "C-110",
    category: "ct-filter-oil", brand: "VIC", quality: "oem_equivalent", price: 380, stock: 150, weight: 0.3,
    fit: [...NZ_ENGINE_CARS, "gn-noah-r70", "gn-noah-r80", "gn-voxy-r80", "gn-aqua-p10"], rating: 4.6, reviews: 52,
    desc_bn: "জাপানি VIC ব্র্যান্ড, দাম কম কিন্তু মান ভালো।",
    desc: "Japanese VIC brand, good quality at a lower price.",
  }),
  p({
    id: "af01", name: "Engine Air Filter", name_bn: "এয়ার ফিল্টার", part_number: "17801-21050",
    category: "ct-filter-air", brand: "Toyota", quality: "genuine", price: 1100, stock: 45, size: "medium", weight: 0.4,
    fit: [...AXIO_FAMILY, ...PREMIO_FAMILY, "gn-probox-50"], rating: 4.8, reviews: 19,
    desc_bn: "আসল এয়ার ফিল্টার। ঢাকার ধুলায় প্রতি ১০,০০০ কিমি পরপর বদলানো ভালো।",
    desc: "Genuine air filter. In Dhaka dust, replace every 10,000 km.",
  }),
  p({
    id: "cf01", name: "Cabin AC Filter", name_bn: "এসি ফিল্টার (কেবিন)", part_number: "87139-52040",
    category: "ct-ac", brand: "Denso", quality: "oem_equivalent", price: 750, stock: 35, weight: 0.2,
    fit: [...AXIO_FAMILY, ...PREMIO_FAMILY, "gn-noah-r80", "gn-voxy-r80", "gn-aqua-p10"], rating: 4.5, reviews: 11,
    desc_bn: "এসির বাতাস পরিষ্কার রাখে, গন্ধ কমায়।",
    desc: "Keeps AC air clean and reduces smell.",
  }),
  p({
    id: "eo01", name: "Engine Oil 0W-20 SP (4L)", name_bn: "ইঞ্জিন অয়েল ০W-২০ (৪ লিটার)", part_number: "08880-13205",
    category: "ct-filter-engine-oil", brand: "Toyota", quality: "genuine", price: 5800, compare_at_price: 6200, stock: 40, size: "medium", weight: 4,
    fit: [...NZ_ENGINE_CARS, "gn-aqua-p10", "gn-noah-r80", "gn-voxy-r80"], rating: 4.9, reviews: 73,
    desc_bn: "টয়োটার আসল সিনথেটিক মবিল, হাইব্রিড ও ১NZ/২ZR ইঞ্জিনের জন্য।",
    desc: "Genuine Toyota synthetic oil for hybrid and 1NZ/2ZR engines.",
  }),
  p({
    id: "cvt01", name: "CVT Fluid TC (4L)", name_bn: "গিয়ার অয়েল CVT TC (৪ লিটার)", part_number: "08886-02105",
    category: "ct-transmission", brand: "Toyota", quality: "genuine", price: 6400, stock: 10, size: "medium", weight: 4,
    fit: ["gn-axio-e160", "gn-fielder-e160", "gn-premio-t260", "gn-allion-t260", "gn-noah-r70", "gn-noah-r80"],
    desc_bn: "CVT গিয়ারবক্সের আসল অয়েল। অন্য অয়েল দিলে গিয়ারবক্স নষ্ট হতে পারে।",
    desc: "Genuine CVT fluid. Wrong fluid can damage the gearbox.",
  }),
  p({
    id: "alt01", name: "Alternator (Dynamo)", name_bn: "ডায়নামো (অল্টারনেটর)", part_number: "27060-21060",
    category: "ct-elec-starter", brand: "Denso", quality: "reconditioned", price: 9500, sourcing: [2, 4], electrical: true, size: "medium", weight: 5,
    fit: [...AXIO_FAMILY, "gn-probox-50"],
    desc_bn: "জাপান থেকে আসা রিকন্ডিশন ডায়নামো, চার্জিং টেস্ট করা। লাগানোর পর ফেরত হয় না।",
    desc: "Japan reconditioned alternator, charge tested. Not returnable once fitted.",
  }),
  p({
    id: "st01", name: "Starter Motor (Self)", name_bn: "সেলফ মোটর (স্টার্টার)", part_number: "28100-21040",
    category: "ct-elec-starter", brand: "Denso", quality: "reconditioned", price: 7800, stock: 3, electrical: true, size: "medium", weight: 3.5,
    fit: [...AXIO_FAMILY, ...PREMIO_FAMILY],
    desc_bn: "রিকন্ডিশন সেলফ মোটর। গাড়ি স্টার্ট নিতে 'টিক টিক' শব্দ হলে সাধারণত এটা।",
    desc: "Reconditioned starter. Usually the cause of a clicking no-start.",
  }),
  p({
    id: "o2s01", name: "Oxygen Sensor (Front)", name_bn: "অক্সিজেন সেন্সর (সামনের)", part_number: "89465-52380",
    category: "ct-elec-sensor", brand: "Denso", quality: "genuine", price: 8900, sourcing: [3, 6], warranty: 6, electrical: true, weight: 0.3,
    fit: AXIO_FAMILY,
    desc_bn: "চেক ইঞ্জিন লাইট জ্বলে ও তেল বেশি খায় এমন সমস্যায় পরীক্ষা করুন।",
    desc: "Check when the engine light is on and fuel use is high.",
  }),
  p({
    id: "hl01", name: "Headlight Assembly (Left)", name_bn: "হেডলাইট (বাম পাশ)", part_number: "81170-12B60",
    category: "ct-light", brand: "DEPO", quality: "aftermarket", price: 7500, stock: 4, electrical: true, size: "medium", fragile: true, weight: 3,
    fit: ["gn-axio-e140"], rating: 4.2, reviews: 6,
    desc_bn: "তাইওয়ানের DEPO ব্র্যান্ড, ফিটিং আসলের মতো। বাল্ব সাথে নেই।",
    desc: "Taiwan DEPO brand, fits like original. Bulb not included.",
  }),
  p({
    id: "tl01", name: "Tail Light (Right)", name_bn: "ব্যাকলাইট (ডান পাশ)", part_number: "81550-12B40",
    category: "ct-light", brand: "Koito", quality: "reconditioned", price: 4200, sourcing: [2, 5], electrical: true, size: "medium", fragile: true, weight: 1.5,
    fit: ["gn-axio-e140"],
    desc_bn: "জাপানি কোইটো (আসল নির্মাতা), রিকন্ডিশন অবস্থায়। ছোট দাগ থাকতে পারে।",
    desc: "Koito (original maker), reconditioned. May have light marks.",
  }),
  p({
    id: "fl01", name: "LED Fog Light Pair", name_bn: "এলইডি ফগ লাইট (জোড়া)", part_number: "FL-TY-012",
    category: "ct-light", brand: "Generic", quality: "aftermarket", price: 2400, stock: 15, electrical: true, fragile: true, weight: 1,
    fit: [...AXIO_FAMILY, ...PREMIO_FAMILY],
    desc_bn: "সাধারণ মানের LED ফগ লাইট, ওয়্যারিং সাথে আছে।",
    desc: "Basic LED fog lights with wiring harness.",
  }),
  p({
    id: "sm01", name: "Side Mirror (Right, Power Fold)", name_bn: "লুকিং গ্লাস (ডান, অটো ফোল্ড)", part_number: "87910-12E10",
    category: "ct-mirror", brand: "Murakami", quality: "reconditioned", price: 6800, sourcing: [3, 6], size: "medium", fragile: true, weight: 1.8,
    fit: ["gn-axio-e160", "gn-fielder-e160"],
    desc_bn: "অটো ফোল্ড সাইড মিরর, রিকন্ডিশন। রঙ আলাদা হতে পারে।",
    desc: "Power-fold side mirror, reconditioned. Colour may differ.",
  }),
  p({
    id: "ws01", name: "Front Windshield", name_bn: "সামনের গ্লাস (উইন্ডশিল্ড)", part_number: "56101-12D40",
    category: "ct-mirror", brand: "AGC", quality: "oem_equivalent", price: 18500, sourcing: [5, 10], size: "large_heavy", fragile: true, weight: 14,
    fit: ["gn-axio-e140"],
    desc_bn: "AGC (টয়োটার গ্লাস নির্মাতা)। কুরিয়ার শাখা থেকে সংগ্রহ করতে হবে।",
    desc: "AGC (Toyota's glass maker). Courier branch pickup only.",
  }),
  p({
    id: "sa01", name: "Front Shock Absorber (Left)", name_bn: "সামনের শকার (বাম)", part_number: "339270",
    category: "ct-sus-shock", brand: "KYB", quality: "oem_equivalent", price: 5600, stock: 6, size: "medium", weight: 3.5,
    fit: AXIO_FAMILY, rating: 4.7, reviews: 14,
    desc_bn: "KYB জাপানি শক অ্যাবজর্বার। রাস্তার ঝাঁকুনি ও গাড়ি দোলা কমায়।",
    desc: "KYB Japanese shock absorber. Reduces bounce and body roll.",
  }),
  p({
    id: "bj01", name: "Lower Ball Joint", name_bn: "বল জয়েন্ট (নিচের)", part_number: "SB-3882",
    category: "ct-sus-joint", brand: "555", quality: "oem_equivalent", price: 1450, stock: 25, weight: 0.6,
    fit: [...AXIO_FAMILY, ...PREMIO_FAMILY], rating: 4.6, reviews: 20,
    desc_bn: "জাপানি ৫৫৫ ব্র্যান্ড। সামনের চাকায় 'ঠক ঠক' শব্দ হলে পরীক্ষা করুন।",
    desc: "Japanese 555 brand. Check when front wheel knocks.",
  }),
  p({
    id: "tr01", name: "Tie Rod End", name_bn: "টাই রড এন্ড", part_number: "SE-3861",
    category: "ct-steering", brand: "555", quality: "oem_equivalent", price: 1250, stock: 25, weight: 0.5,
    fit: [...AXIO_FAMILY, ...PREMIO_FAMILY],
    desc_bn: "স্টিয়ারিং ঢিলা লাগলে বা টায়ার একপাশে ক্ষয় হলে বদলান।",
    desc: "Replace when steering feels loose or tyres wear unevenly.",
  }),
  p({
    id: "ps01", name: "Power Steering Pump", name_bn: "পাওয়ার স্টিয়ারিং পাম্প", part_number: "44310-12470",
    category: "ct-steering", brand: "JTEKT", quality: "reconditioned", price: 8200, sourcing: [3, 6], size: "medium", weight: 3,
    fit: ["gn-premio-t240", "gn-corolla-e110"],
    desc_bn: "পুরনো মডেলের হাইড্রলিক পাওয়ার স্টিয়ারিং পাম্প, রিকন্ডিশন।",
    desc: "Hydraulic power steering pump for older models, reconditioned.",
  }),
  p({
    id: "db01", name: "Drive Belt (Fan Belt)", name_bn: "ফ্যানবেল্ট (ড্রাইভ বেল্ট)", part_number: "7PK1220",
    category: "ct-eng-belt", brand: "Bando", quality: "oem_equivalent", price: 1350, stock: 30, weight: 0.3,
    fit: [...AXIO_FAMILY, ...PREMIO_FAMILY], rating: 4.7, reviews: 18,
    desc_bn: "ইঞ্জিন চালু হলে 'চিঁ চিঁ' শব্দ হলে বেল্ট বদলানোর সময় হয়েছে।",
    desc: "Squealing at start-up means the belt is due.",
  }),
  p({
    id: "em01", name: "Engine Mount (Right)", name_bn: "ইঞ্জিন মাউন্ট (ডান)", part_number: "12305-21300",
    category: "ct-eng-mount", brand: "Toyota", quality: "genuine", price: 6900, sourcing: [3, 5], warranty: 3, size: "medium", weight: 2.2,
    fit: AXIO_FAMILY,
    desc_bn: "গাড়ি থামলে বেশি কাঁপলে মাউন্ট পরীক্ষা করুন।",
    desc: "Check mounts when the car shakes at idle.",
  }),
  p({
    id: "wp01", name: "Water Pump", name_bn: "ওয়াটার পাম্প", part_number: "WPT-117",
    category: "ct-cooling", brand: "Aisin", quality: "oem_equivalent", price: 4300, stock: 5, size: "medium", weight: 1.6,
    fit: NZ_ENGINE_CARS,
    desc_bn: "আইসিন টয়োটার গ্রুপ কোম্পানি। কুল্যান্ট লিক বা ইঞ্জিন গরম হলে।",
    desc: "Aisin is a Toyota group company. For coolant leaks and overheating.",
  }),
  p({
    id: "rd01", name: "Radiator", name_bn: "রেডিয়েটর", part_number: "16400-21260",
    category: "ct-cooling", brand: "Denso", quality: "oem_equivalent", price: 11500, sourcing: [3, 7], size: "large_heavy", fragile: true, weight: 6,
    fit: AXIO_FAMILY,
    desc_bn: "ডেনসো রেডিয়েটর। বড় পার্ট, কুরিয়ার শাখা থেকে সংগ্রহ।",
    desc: "Denso radiator. Large item, courier branch pickup.",
  }),
  p({
    id: "th01", name: "Thermostat", name_bn: "থার্মোস্ট্যাট", part_number: "90916-03129",
    category: "ct-cooling", brand: "Toyota", quality: "genuine", price: 2100, stock: 10, weight: 0.2,
    fit: NZ_ENGINE_CARS,
    desc_bn: "ইঞ্জিন সঠিক তাপমাত্রায় রাখে।",
    desc: "Keeps the engine at the right temperature.",
  }),
  p({
    id: "ac01", name: "AC Compressor", name_bn: "এসি কম্প্রেসার", part_number: "88310-52551",
    category: "ct-ac", brand: "Denso", quality: "reconditioned", price: 16500, sourcing: [3, 7], electrical: true, size: "large_heavy", weight: 7,
    fit: [...AXIO_FAMILY, ...PREMIO_FAMILY],
    desc_bn: "রিকন্ডিশন কম্প্রেসার, প্রেশার টেস্ট করা। এসি ঠান্ডা না হলে আগে গ্যাস চেক করুন।",
    desc: "Reconditioned compressor, pressure tested. Check refrigerant first.",
  }),
  p({
    id: "fb01", name: "Front Bumper", name_bn: "সামনের বাম্পার", part_number: "52119-12E60",
    category: "ct-body", brand: "Generic", quality: "aftermarket", price: 9800, sourcing: [4, 8], size: "large_heavy", weight: 5,
    fit: ["gn-axio-e160"],
    desc_bn: "রঙ ছাড়া বাম্পার (প্রাইমার করা)। রঙ করাতে হবে।",
    desc: "Unpainted (primed) bumper. Needs painting.",
  }),
  p({
    id: "hb01", name: "Hybrid Battery Pack", name_bn: "হাইব্রিড ব্যাটারি", part_number: "G9280-52030",
    category: "ct-electrical", brand: "Toyota", quality: "reconditioned", price: 68000, sourcing: [5, 10], electrical: true, size: "large_heavy", weight: 30,
    fit: ["gn-aqua-p10", "gn-axio-e160"],
    desc_bn: "সেল ব্যালান্স ও টেস্ট করা রিকন্ডিশন হাইব্রিড ব্যাটারি। ফিটিং আমাদের পার্টনার গ্যারেজে।",
    desc: "Cell-balanced, tested reconditioned hybrid battery.",
  }),
  p({
    id: "hn01", name: "Disc Horn Pair", name_bn: "হর্ন (জোড়া)", part_number: "0986AH0503",
    category: "ct-electrical", brand: "Bosch", quality: "aftermarket", price: 1800, stock: 22, electrical: true, weight: 0.8,
    fit: [...AXIO_FAMILY, ...PREMIO_FAMILY, "gn-noah-r80", "gn-vezel-ru"],
    desc_bn: "বশ ডিস্ক হর্ন, জোরালো আওয়াজ। রিলে লাগতে পারে।",
    desc: "Bosch disc horns, loud. May need a relay.",
  }),
  p({
    id: "vz01", name: "Front Brake Pad Set", name_bn: "সামনের ব্রেক প্যাড সেট", part_number: "45022-T7A-J01",
    category: "ct-brake-pad", brand: "Honda", quality: "genuine", price: 5200, stock: 5, weight: 1.2,
    fit: ["gn-vezel-ru", "gn-grace-gm", "gn-fit-gp5"], rating: 4.8, reviews: 7,
    desc_bn: "হোন্ডার আসল সামনের প্যাড, ভেজেল/গ্রেস/ফিট হাইব্রিডের জন্য।",
    desc: "Honda genuine front pads for Vezel/Grace/Fit hybrid.",
  }),
  p({
    id: "nh01", name: "Sliding Door Motor (Left)", name_bn: "স্লাইডিং দরজার মোটর (বাম)", part_number: "85620-28130",
    category: "ct-body", brand: "Aisin", quality: "reconditioned", price: 12500, sourcing: [4, 8], electrical: true, size: "medium", weight: 3,
    fit: ["gn-noah-r70"],
    desc_bn: "নোয়ার অটো স্লাইডিং দরজার মোটর, রিকন্ডিশন।",
    desc: "Noah power sliding door motor, reconditioned.",
  }),
  p({
    id: "ws02", name: "Wiper Blade Set", name_bn: "ওয়াইপার ব্লেড সেট", part_number: "WB-650-350",
    category: "ct-mirror", brand: "PIAA", quality: "aftermarket", price: 1500, stock: 18, weight: 0.4,
    fit: [...AXIO_FAMILY, ...PREMIO_FAMILY], rating: 4.4, reviews: 10,
    desc_bn: "২৬ ও ১৪ ইঞ্চির জোড়া। বর্ষার আগে বদলে নিন।",
    desc: "26\" + 14\" pair. Replace before monsoon.",
  }),
];

export const synonyms: Synonym[] = [
  { term: "শু", maps_to_keyword: "brake shoe", maps_to_category_slug: "brake-shoe" },
  { term: "ব্রেক শু", maps_to_keyword: "brake shoe", maps_to_category_slug: "brake-shoe" },
  { term: "brek su", maps_to_keyword: "brake shoe", maps_to_category_slug: "brake-shoe" },
  { term: "break shoe", maps_to_keyword: "brake shoe", maps_to_category_slug: "brake-shoe" },
  { term: "প্যাড", maps_to_keyword: "brake pad", maps_to_category_slug: "brake-pad" },
  { term: "ব্রেক প্যাড", maps_to_keyword: "brake pad", maps_to_category_slug: "brake-pad" },
  { term: "brek pad", maps_to_keyword: "brake pad", maps_to_category_slug: "brake-pad" },
  { term: "সাইলেন্সার", maps_to_keyword: "exhaust", maps_to_category_slug: null },
  { term: "রেডিয়েটর", maps_to_keyword: "radiator", maps_to_category_slug: "cooling" },
  { term: "ডায়নামো", maps_to_keyword: "alternator", maps_to_category_slug: "starter-alternator" },
  { term: "dynamo", maps_to_keyword: "alternator", maps_to_category_slug: "starter-alternator" },
  { term: "সেলফ", maps_to_keyword: "starter", maps_to_category_slug: "starter-alternator" },
  { term: "self", maps_to_keyword: "starter", maps_to_category_slug: "starter-alternator" },
  { term: "শকার", maps_to_keyword: "shock absorber", maps_to_category_slug: "shock-absorber" },
  { term: "শক অ্যাবজর্বার", maps_to_keyword: "shock absorber", maps_to_category_slug: "shock-absorber" },
  { term: "shocker", maps_to_keyword: "shock absorber", maps_to_category_slug: "shock-absorber" },
  { term: "বল জয়েন্ট", maps_to_keyword: "ball joint", maps_to_category_slug: "ball-joint" },
  { term: "টাই রড", maps_to_keyword: "tie rod", maps_to_category_slug: "steering" },
  { term: "প্লাগ", maps_to_keyword: "spark plug", maps_to_category_slug: "ignition" },
  { term: "plug", maps_to_keyword: "spark plug", maps_to_category_slug: "ignition" },
  { term: "বেল্ট", maps_to_keyword: "belt", maps_to_category_slug: "belt" },
  { term: "ফ্যানবেল্ট", maps_to_keyword: "belt", maps_to_category_slug: "belt" },
  { term: "হেডলাইট", maps_to_keyword: "headlight", maps_to_category_slug: "light" },
  { term: "ব্যাকলাইট", maps_to_keyword: "tail light", maps_to_category_slug: "light" },
  { term: "লুকিং গ্লাস", maps_to_keyword: "side mirror", maps_to_category_slug: "mirror-glass" },
  { term: "সামনের গ্লাস", maps_to_keyword: "windshield", maps_to_category_slug: "mirror-glass" },
  { term: "এসির গ্যাস", maps_to_keyword: "ac", maps_to_category_slug: "ac" },
  { term: "কম্প্রেসার", maps_to_keyword: "compressor", maps_to_category_slug: "ac" },
  { term: "মবিল", maps_to_keyword: "engine oil", maps_to_category_slug: "engine-oil" },
  { term: "mobil", maps_to_keyword: "engine oil", maps_to_category_slug: "engine-oil" },
  { term: "মবিল ফিল্টার", maps_to_keyword: "oil filter", maps_to_category_slug: "oil-filter" },
  { term: "হর্ন", maps_to_keyword: "horn", maps_to_category_slug: null },
  { term: "ওয়াইপার", maps_to_keyword: "wiper", maps_to_category_slug: null },
  { term: "কয়েল", maps_to_keyword: "ignition coil", maps_to_category_slug: "ignition" },
  { term: "বাম্পার", maps_to_keyword: "bumper", maps_to_category_slug: "body" },
];

export const reviews: Review[] = [
  { id: "rv1", part_id: "bp02", name: "রফিকুল ই.", rating: 5, comment: "দাম সবার আগে জানিয়ে দিল, আকেবোনো নাকি টয়োটা নেবো বুঝিয়ে বলল। প্যাড একদম ঠিক।", vehicle: "Axio 2011" },
  { id: "rv2", part_id: null, name: "Tanjila H.", rating: 5, comment: "Sent a voice note in the morning, had a quote by lunch. Genuine box with hologram.", vehicle: "Premio 2016" },
  { id: "rv3", part_id: "sp01", name: "মোঃ কামাল (ড্রাইভার)", rating: 5, comment: "আমি লিখতে পারি না, ভয়েসে বললাম। ওরা কল করে সব বুঝে নিল।", vehicle: "Noah 2010" },
  { id: "rv4", part_id: null, name: "Sakib Motors (গ্যারেজ)", rating: 4, comment: "পার্ট নম্বর দিয়ে সার্চ করলেই পাওয়া যায়। রিকন্ডিশন লেখা থাকে, লুকায় না।", vehicle: "মেকানিক" },
  { id: "rv5", part_id: "of01", name: "নুসরাত জ.", rating: 5, comment: "ভুল গাড়ির তথ্য দিয়েছিলাম, ওরা নিজেরাই ধরে ফেলে ঠিক পার্ট পাঠাল।", vehicle: "Aqua 2014" },
];
