// Read-only catalog access. Mock implementation over in-memory data; the
// function signatures are what the Supabase version must keep.
import { categories, parts, reviews, synonyms } from "./mock/catalog";
import { engines, generations, makes, models } from "./mock/vehicles";
import { compact, looksLikePartNumber, normalizeQuery, similarity } from "./search/normalize";
import type { Availability, Category, Part, Quality, VehicleGeneration } from "./types";

export { settings } from "./mock/settings";

// ---------- vehicles ----------
export const getMakes = () => makes;
export const getModels = (makeId?: string) => (makeId ? models.filter((m) => m.make_id === makeId) : models);
export const getPopularModels = () => models.filter((m) => m.is_popular);
export const getGenerations = (modelId: string) => generations.filter((g) => g.model_id === modelId);
export const getEngines = (generationId: string) => engines.filter((e) => e.generation_id === generationId);
export const getGeneration = (id: string) => generations.find((g) => g.id === id) ?? null;
export const getEngine = (id: string) => engines.find((e) => e.id === id) ?? null;

export const findGenerationsByChassis = (input: string): VehicleGeneration[] => {
  const code = input.toUpperCase().trim().split(/[-\s]/)[0];
  if (code.length < 2) return [];
  return generations.filter((g) => g.chassis_codes.includes(code));
};

export const describeGeneration = (generationId: string | null, lang: "bn" | "en" = "en") => {
  if (!generationId) return null;
  const g = getGeneration(generationId);
  if (!g) return null;
  const model = models.find((m) => m.id === g.model_id)!;
  const make = makes.find((m) => m.id === model.make_id)!;
  const years = `${g.year_from}–${g.year_to ?? (lang === "bn" ? "বর্তমান" : "now")}`;
  return {
    make,
    model,
    generation: g,
    short: `${make.name} ${model.name}`,
    full: `${make.name} ${model.name} ${years} (${g.chassis_codes.join("/")})`,
    years,
  };
};

// ---------- categories ----------
export const getTopCategories = () => categories.filter((c) => !c.parent_id);
export const getSubcategories = (parentId: string) => categories.filter((c) => c.parent_id === parentId);
export const getCategory = (slug: string) => categories.find((c) => c.slug === slug) ?? null;
export const getCategoryById = (id: string) => categories.find((c) => c.id === id) ?? null;

const categoryTree = (cat: Category) => [cat.id, ...getSubcategories(cat.id).map((c) => c.id)];

// ---------- parts ----------
export const getPart = (slug: string) => parts.find((p) => p.slug === slug) ?? null;
export const getPartById = (id: string) => parts.find((p) => p.id === id) ?? null;
export const getAllParts = () => parts;

export const partFits = (part: Part, generationId: string | null) =>
  generationId ? part.fitments.some((f) => f.generation_id === generationId) : null;

export const getRelatedParts = (part: Part, limit = 4) => {
  const cat = getCategoryById(part.category_id);
  const gens = new Set(part.fitments.map((f) => f.generation_id));
  return parts
    .filter((p) => p.id !== part.id && p.fitments.some((f) => gens.has(f.generation_id)))
    .sort((a, b) => Number(b.category_id === cat?.parent_id) - Number(a.category_id === cat?.parent_id))
    .slice(0, limit);
};

export const getAlternatives = (part: Part) =>
  parts.filter(
    (p) =>
      p.id !== part.id &&
      p.category_id === part.category_id &&
      p.fitments.some((f) => part.fitments.some((pf) => pf.generation_id === f.generation_id)),
  );

export const getReviews = (partId?: string) => (partId ? reviews.filter((r) => r.part_id === partId) : reviews);

export interface PartFilters {
  qualities?: Quality[];
  availability?: Availability | "any";
  warrantyOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: "relevance" | "price_asc" | "price_desc";
}

const applyFilters = (list: { part: Part; score: number }[], f: PartFilters) => {
  let out = list.filter(({ part }) => {
    if (f.qualities?.length && !f.qualities.includes(part.quality)) return false;
    if (f.availability && f.availability !== "any" && part.availability !== f.availability) return false;
    if (f.warrantyOnly && part.warranty_months === 0) return false;
    if (f.minPrice != null && (part.price ?? 0) < f.minPrice) return false;
    if (f.maxPrice != null && (part.price ?? Infinity) > f.maxPrice) return false;
    return true;
  });
  if (f.sort === "price_asc") out = [...out].sort((a, b) => (a.part.price ?? Infinity) - (b.part.price ?? Infinity));
  else if (f.sort === "price_desc") out = [...out].sort((a, b) => (b.part.price ?? 0) - (a.part.price ?? 0));
  else out = [...out].sort((a, b) => b.score - a.score);
  return out.map((x) => x.part);
};

export const getCategoryParts = (slug: string, generationId: string | null, f: PartFilters = {}) => {
  const cat = getCategory(slug);
  if (!cat) return [];
  const ids = new Set(categoryTree(cat));
  const list = parts
    .filter((p) => ids.has(p.category_id))
    .filter((p) => !generationId || partFits(p, generationId))
    .map((part) => ({ part, score: part.availability === "in_stock" ? 1 : 0 }));
  return applyFilters(list, f);
};

// Spec 7.3: normalise -> synonyms -> text/trigram match -> fitment filter.
export const searchParts = (q: string, generationId: string | null, f: PartFilters = {}) => {
  const nq = normalizeQuery(q);
  if (!nq) return { results: [] as Part[], matchedKeyword: null as string | null, queryType: "text" as const };

  if (looksLikePartNumber(nq)) {
    const c = compact(nq);
    const hits = parts.filter((p) => p.part_number_normalized.includes(c));
    if (hits.length)
      return {
        results: applyFilters(
          hits.filter((p) => !generationId || partFits(p, generationId)).map((part) => ({ part, score: 10 })),
          f,
        ),
        matchedKeyword: null,
        queryType: "part_number" as const,
      };
  }

  const syns = synonyms.filter((s) => {
    const t = normalizeQuery(s.term);
    return t === nq || nq.includes(t) || similarity(t, nq) > 0.62;
  });
  // Prefer the longest matching term ("ব্রেক শু" over "শু").
  syns.sort((a, b) => b.term.length - a.term.length);
  const syn = syns[0];
  const keyword = syn?.maps_to_keyword ?? null;
  const catIds = syn?.maps_to_category_slug
    ? new Set(categoryTree(getCategory(syn.maps_to_category_slug)!))
    : null;

  const tokens = [nq, ...(keyword ? [keyword] : [])];
  const scored = parts
    .map((part) => {
      const hay = normalizeQuery(`${part.name} ${part.name_bn} ${part.brand} ${part.part_number} ${getCategoryById(part.category_id)?.name ?? ""}`);
      let score = 0;
      for (const t of tokens) {
        if (hay.includes(t)) score += 5;
        score += t.split(" ").filter((w) => w.length > 1 && hay.includes(w)).length;
        score += similarity(t, normalizeQuery(part.name)) * 2;
      }
      if (catIds?.has(part.category_id)) score += 6;
      return { part, score };
    })
    .filter((x) => x.score >= 3)
    .filter(({ part }) => !generationId || partFits(part, generationId));

  return { results: applyFilters(scored, f), matchedKeyword: keyword, queryType: "text" as const };
};
