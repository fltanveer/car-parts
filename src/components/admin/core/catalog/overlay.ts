"use client";

// Catalog admin edits (file 03 §9). The static modules (taxonomy, catalog,
// vehicles, brands) are read-only, so every admin change lives in this
// localStorage overlay and is merged over the base data by the hooks below.
// Demo-only: customer/seller panels keep reading the static modules. Changes
// to real DB rows (listings) go through foundation `patchListing` + audit.
import { audit, patchListing } from "@/lib/db/actions";
import { createOverlay, notifyVendor } from "@/lib/db/actions-admin-core";
import { iso, uid } from "@/lib/db/seed";
import { getDb } from "@/lib/db/store";
import { catalogProducts as baseProducts } from "@/lib/mock/catalog";
import { brands as baseBrands } from "@/lib/mock/settings";
import { attributeDefinitions, categories as baseCategories } from "@/lib/mock/taxonomy";
import type { AttributeDefinition, Brand, CatalogProduct, Category, VehicleGeneration, VehicleTypeCode } from "@/lib/types";

export type SynonymSource = "category" | "request_review" | "admin" | "search";
export interface SynonymRow {
  id: string;
  term: string;
  category_id: string | null;
  keyword: string | null;
  region: string | null;
  source: SynonymSource;
  uses: number;
}

export interface ImportedVehicle {
  id: string;
  type: VehicleTypeCode;
  make: string;
  model: string;
  generation: string;
  year_from: number;
  year_to: number | null;
  chassis_codes: string[];
  facelift: VehicleGeneration["facelift"];
  engines: { code: string; cc: number | null; fuel: string | null }[];
  at: string;
}

interface CatalogState {
  categoryPatches: Record<string, Partial<Category>>;
  commission: Record<string, number | null>;
  newCategories: Category[];
  childOrder: Record<string, string[]>;
  attrEdits: Record<string, AttributeDefinition>;
  attrAdded: AttributeDefinition[];
  attrDeleted: string[];
  productPatches: Record<string, Partial<CatalogProduct>>;
  newProducts: CatalogProduct[];
  mergedInto: Record<string, string>;
  keepSeparate: string[];
  synonymsAdded: SynonymRow[];
  synonymsDeleted: string[];
  vehicleImports: ImportedVehicle[];
  brandsAdded: Brand[];
}

export const catalogOverlay = createOverlay<CatalogState>("catalog", () => ({
  categoryPatches: {},
  commission: {},
  newCategories: [],
  childOrder: {},
  attrEdits: {},
  attrAdded: [],
  attrDeleted: [],
  productPatches: {},
  newProducts: [],
  mergedInto: {},
  keepSeparate: [],
  synonymsAdded: [],
  synonymsDeleted: [],
  vehicleImports: [],
  brandsAdded: [],
}));
const set = catalogOverlay.set;
const get = catalogOverlay.get;

// ======================================================================
// categories
// ======================================================================
export type AdminCategory = Category & { commission_percent: number | null; is_new: boolean; edited: boolean };

const ROOT = "root";
const mergeCategories = (o: CatalogState): AdminCategory[] => {
  const all: AdminCategory[] = [
    ...baseCategories.map((c) => ({ ...c, ...o.categoryPatches[c.id], commission_percent: o.commission[c.id] ?? null, is_new: false, edited: !!o.categoryPatches[c.id] })),
    ...o.newCategories.map((c) => ({ ...c, commission_percent: o.commission[c.id] ?? null, is_new: true, edited: false })),
  ];
  const byParent = new Map<string, AdminCategory[]>();
  all.forEach((c) => {
    const k = c.parent_id ?? ROOT;
    byParent.set(k, [...(byParent.get(k) ?? []), c]);
  });
  const out: AdminCategory[] = [];
  const walk = (parent: string) => {
    const order = o.childOrder[parent] ?? [];
    const kids = (byParent.get(parent) ?? []).map((c, i) => ({ c, i, o: order.indexOf(c.id) }));
    kids.sort((a, b) => (a.o < 0 ? 1e6 + a.i : a.o) - (b.o < 0 ? 1e6 + b.i : b.o));
    kids.forEach(({ c }) => {
      out.push(c);
      walk(c.id);
    });
  };
  walk(ROOT);
  return out;
};
export const useCategories = () => catalogOverlay.useStore(mergeCategories);
export const getCategories = () => mergeCategories(get());

export const childrenOf = (list: AdminCategory[], parentId: string | null) => list.filter((c) => c.parent_id === parentId);
export const pathOf = (list: AdminCategory[], id: string | null): AdminCategory[] => {
  const out: AdminCategory[] = [];
  let c = list.find((x) => x.id === id);
  while (c) {
    out.unshift(c);
    const pid = c.parent_id;
    c = list.find((x) => x.id === pid);
  }
  return out;
};
export const pathLabel = (list: AdminCategory[], id: string | null, lang: "bn" | "en") =>
  pathOf(list, id).map((c) => (lang === "bn" ? c.name_bn : c.name)).join(" › ");

export const saveCategory = (id: string, patch: Partial<Category>, commission: number | null) => {
  set((o) => {
    const isNew = o.newCategories.some((c) => c.id === id);
    return {
      newCategories: isNew ? o.newCategories.map((c) => (c.id === id ? { ...c, ...patch } : c)) : o.newCategories,
      categoryPatches: isNew ? o.categoryPatches : { ...o.categoryPatches, [id]: { ...o.categoryPatches[id], ...patch } },
      commission: { ...o.commission, [id]: commission },
    };
  });
  const c = getCategories().find((x) => x.id === id);
  audit("ক্যাটাগরি সম্পাদনা", `${c?.name_bn ?? id} (${id})`);
};

export const addChildCategory = (parentId: string): string | null => {
  const parent = getCategories().find((c) => c.id === parentId);
  if (!parent || parent.level >= 3) return null;
  const short = uid().slice(0, 5);
  const child: Category = {
    ...parent,
    id: `c-new-${short}`,
    parent_id: parent.id,
    level: (parent.level + 1) as 2 | 3,
    name: "New category",
    name_bn: "নতুন ক্যাটাগরি",
    slug: `${parent.slug}--new-${short}`,
    synonyms: [],
  };
  set((o) => ({ newCategories: [...o.newCategories, child] }));
  audit("ক্যাটাগরি যোগ", `${parent.name_bn} › ${child.id}`);
  return child.id;
};

export const moveCategory = (id: string, dir: -1 | 1) => {
  const list = getCategories();
  const c = list.find((x) => x.id === id);
  if (!c) return;
  const ids = childrenOf(list, c.parent_id).map((x) => x.id);
  const i = ids.indexOf(id);
  const j = i + dir;
  if (j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  set((o) => ({ childOrder: { ...o.childOrder, [c.parent_id ?? ROOT]: ids } }));
  audit("ক্যাটাগরির ক্রম পরিবর্তন", `${c.name_bn} ${dir < 0 ? "↑" : "↓"}`);
};

// ======================================================================
// attribute templates
// ======================================================================
export type AdminAttribute = AttributeDefinition & { id: string; added: boolean };
const attrId = (a: Pick<AttributeDefinition, "template" | "key">) => `${a.template}:${a.key}`;

const mergeAttributes = (o: CatalogState): AdminAttribute[] => [
  ...attributeDefinitions
    .filter((a) => !o.attrDeleted.includes(attrId(a)))
    .map((a) => ({ ...(o.attrEdits[attrId(a)] ?? a), id: attrId(a), added: false })),
  ...o.attrAdded.map((a) => ({ ...a, id: `+${attrId(a)}`, added: true })),
];
export const useAttributes = () => catalogOverlay.useStore(mergeAttributes);
export const getAttributes = () => mergeAttributes(get());

/** Save a field. `id` is the AdminAttribute id when editing, null when adding. */
export const saveAttribute = (id: string | null, def: AttributeDefinition) => {
  set((o) => {
    if (!id) return { attrAdded: [...o.attrAdded, def] };
    if (id.startsWith("+")) return { attrAdded: o.attrAdded.map((a) => (`+${attrId(a)}` === id ? def : a)) };
    return { attrEdits: { ...o.attrEdits, [id]: def } };
  });
  audit(id ? "অ্যাট্রিবিউট ফিল্ড সম্পাদনা" : "অ্যাট্রিবিউট ফিল্ড যোগ", `${def.template}.${def.key}`);
};

export const deleteAttribute = (a: AdminAttribute) => {
  set((o) => (a.added ? { attrAdded: o.attrAdded.filter((x) => `+${attrId(x)}` !== a.id) } : { attrDeleted: [...o.attrDeleted, a.id] }));
  audit("অ্যাট্রিবিউট ফিল্ড মুছে ফেলা", `${a.template}.${a.key}`);
};

// ======================================================================
// master products
// ======================================================================
const mergeProducts = (o: CatalogState): CatalogProduct[] =>
  [...baseProducts, ...o.newProducts]
    .map((p) => ({ ...p, ...o.productPatches[p.id] }))
    .map((p) => (o.mergedInto[p.id] ? { ...p, status: "merged" as const } : p));
export const useProducts = () => catalogOverlay.useStore(mergeProducts);
export const getProducts = () => mergeProducts(get());
export const useMergedInto = () => catalogOverlay.useStore((o: CatalogState) => o.mergedInto);

const selectKeepSeparate = (o: CatalogState) => o.keepSeparate;
export const useKeepSeparate = () => catalogOverlay.useStore(selectKeepSeparate);

export const newProductId = () => `cp-new-${uid()}`;

export const saveProduct = (p: CatalogProduct) => {
  const exists = getProducts().some((x) => x.id === p.id);
  set((o) => {
    if (o.newProducts.some((x) => x.id === p.id)) return { newProducts: o.newProducts.map((x) => (x.id === p.id ? p : x)) };
    if (exists) return { productPatches: { ...o.productPatches, [p.id]: p } };
    return { newProducts: [...o.newProducts, p] };
  });
  audit(exists ? "মাস্টার পণ্য সম্পাদনা" : "মাস্টার পণ্য তৈরি", `${p.name_bn} (${p.id})`);
};

export const linkListing = (listingId: string, productId: string) => {
  const l = getDb().listings.find((x) => x.id === listingId);
  const p = getProducts().find((x) => x.id === productId);
  if (!l || !p) return;
  patchListing(listingId, { catalog_product_id: productId });
  set((o) => ({ keepSeparate: o.keepSeparate.filter((x) => x !== listingId) }));
  audit("লিস্টিং মাস্টারের সাথে জোড়া", `${listingId} → ${productId}`);
  notifyVendor(l.vendor_id, "আপনার পণ্য ক্যাটালগের সাথে জোড়া হয়েছে", `${l.title_bn} → ${p.name_bn}`, `/seller/products/${listingId}`);
};

export const keepSeparate = (listingId: string) => {
  set((o) => ({ keepSeparate: [...new Set([...o.keepSeparate, listingId])] }));
  audit("লিস্টিং আলাদা রাখা (মাস্টার নয়)", listingId);
};

/** Merge `dropId` into `keepId`: every offer moves to the kept master. */
export const mergeMasters = (keepId: string, dropId: string) => {
  const offers = getDb().listings.filter((l) => l.catalog_product_id === dropId);
  offers.forEach((l) => patchListing(l.id, { catalog_product_id: keepId }));
  set((o) => ({ mergedInto: { ...o.mergedInto, [dropId]: keepId } }));
  audit("ডুপ্লিকেট মাস্টার একত্র", `${dropId} → ${keepId} (${offers.length} অফার)`);
  return offers.length;
};

export const importProducts = (rows: CatalogProduct[]) => {
  set((o) => ({ newProducts: [...o.newProducts, ...rows] }));
  audit("মাস্টার পণ্য CSV ইমপোর্ট", `${rows.length}টা`);
};

// ======================================================================
// dictionary (part_synonyms)
// ======================================================================
const SEED_SYNONYMS: Omit<SynonymRow, "id" | "uses">[] = [
  { term: "শকার", category_id: "c-suspension-parts--shock-absorber", keyword: null, region: "ঢাকা", source: "search" },
  { term: "মবিল", category_id: "c-fluids--engine-oil", keyword: null, region: null, source: "search" },
  { term: "লুকিং গ্লাস", category_id: "c-mirrors--side-mirror", keyword: null, region: null, source: "request_review" },
  { term: "বাতি", category_id: "c-lamps--headlight", keyword: null, region: "চট্টগ্রাম", source: "request_review" },
  { term: "ডাইনামো", category_id: null, keyword: "alternator", region: null, source: "request_review" },
  { term: "সাইলেঞ্চার", category_id: null, keyword: "silencer muffler", region: "সিলেট", source: "search" },
];

/** Stable pseudo usage count for rows that have no real counter in the mock. */
const usesOf = (term: string) => 3 + ([...term].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 997, 7) % 140);

const mergeSynonyms = (o: CatalogState): SynonymRow[] => {
  const fromCats = mergeCategories(o).flatMap((c) =>
    c.synonyms.map((term) => ({ id: `cat:${c.id}:${term}`, term, category_id: c.id, keyword: null, region: null, source: "category" as const, uses: usesOf(term) })),
  );
  const seeded = SEED_SYNONYMS.map((s) => ({ ...s, id: `seed:${s.term}`, uses: usesOf(s.term) })).filter((s) => !o.synonymsDeleted.includes(s.id));
  return [...fromCats, ...seeded, ...o.synonymsAdded];
};
export const useSynonyms = () => catalogOverlay.useStore(mergeSynonyms);

export const addSynonym = (row: Omit<SynonymRow, "id" | "uses">) => {
  set((o) => ({ synonymsAdded: [{ ...row, id: `adm:${uid()}`, uses: 0 }, ...o.synonymsAdded] }));
  audit("synonym যোগ", `${row.term} → ${row.category_id ?? row.keyword ?? ""}`);
};

export const deleteSynonym = (row: SynonymRow) => {
  if (row.source === "category" && row.category_id) {
    const c = getCategories().find((x) => x.id === row.category_id);
    if (c) set((o) => ({ categoryPatches: { ...o.categoryPatches, [c.id]: { ...o.categoryPatches[c.id], synonyms: c.synonyms.filter((t) => t !== row.term) } } }));
  } else if (row.id.startsWith("adm:")) {
    set((o) => ({ synonymsAdded: o.synonymsAdded.filter((s) => s.id !== row.id) }));
  } else {
    set((o) => ({ synonymsDeleted: [...o.synonymsDeleted, row.id] }));
  }
  audit("synonym মুছে ফেলা", row.term);
};

// ======================================================================
// vehicles & brands
// ======================================================================
const selectImports = (o: CatalogState) => o.vehicleImports;
export const useVehicleImports = () => catalogOverlay.useStore(selectImports);

export const importVehicles = (rows: Omit<ImportedVehicle, "id" | "at">[]) => {
  set((o) => ({ vehicleImports: [...o.vehicleImports, ...rows.map((r) => ({ ...r, id: `imp-${uid()}`, at: iso() }))] }));
  audit("গাড়ির ডেটা CSV ইমপোর্ট", `${rows.length}টা প্রজন্ম`);
};

const mergeBrands = (o: CatalogState): Brand[] => [...(baseBrands as readonly Brand[]), ...o.brandsAdded];
export const useBrands = () => catalogOverlay.useStore(mergeBrands);

export const addBrand = (b: Omit<Brand, "id">) => {
  const id = `br-new-${uid()}`;
  set((o) => ({ brandsAdded: [...o.brandsAdded, { ...b, id }] }));
  audit("ব্র্যান্ড যোগ", b.name);
  return id;
};
