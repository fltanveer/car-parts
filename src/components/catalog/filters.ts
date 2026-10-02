import type { PartFilters } from "@/lib/api";
import type { Part } from "@/lib/types";

// Client-side filter + sort over an already-fetched list, so the filter sheet
// can show live counts without re-querying. Mirrors applyFilters in lib/api.
export type ListFilters = Omit<PartFilters, "sort">;
export type SortKey = NonNullable<PartFilters["sort"]>;

export const emptyFilters: ListFilters = { qualities: [], availability: "any", warrantyOnly: false };

export const PRICE_PRESETS: { id: string; min?: number; max?: number }[] = [
  { id: "lt1000", max: 1000 },
  { id: "1000-3000", min: 1000, max: 3000 },
  { id: "3000-10000", min: 3000, max: 10000 },
  { id: "gt10000", min: 10000 },
];

export const activeFilterCount = (f: ListFilters) =>
  (f.qualities?.length ?? 0) +
  (f.availability && f.availability !== "any" ? 1 : 0) +
  (f.warrantyOnly ? 1 : 0) +
  (f.minPrice != null || f.maxPrice != null ? 1 : 0);

export const filterParts = (list: Part[], f: ListFilters, sort: SortKey = "relevance") => {
  const out = list.filter((p) => {
    if (f.qualities?.length && !f.qualities.includes(p.quality)) return false;
    if (f.availability && f.availability !== "any" && p.availability !== f.availability) return false;
    if (f.warrantyOnly && p.warranty_months === 0) return false;
    if (f.minPrice != null && (p.price == null || p.price < f.minPrice)) return false;
    if (f.maxPrice != null && (p.price == null || p.price > f.maxPrice)) return false;
    return true;
  });
  if (sort === "price_asc") return [...out].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  if (sort === "price_desc") return [...out].sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
  return out;
};
