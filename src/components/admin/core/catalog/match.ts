// Pure helpers for the master-product match queue (file 03 §9.3).
import type { CatalogProduct, Listing } from "@/lib/types";
import type { AdminCategory } from "./overlay";

export const normalizePart = (s: string | null | undefined) => (s ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

const STOP = new Set(["the", "and", "for", "with", "of", "set", "pcs", "এর", "ও", "সেট"]);
export const tokens = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .split(/[\s,()/+"'।:;.\-]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2 && !STOP.has(t)),
  );

export const jaccard = (a: Set<string>, b: Set<string>) => {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  a.forEach((t) => b.has(t) && inter++);
  return inter / (a.size + b.size - inter);
};

export interface MatchReason {
  bn: string;
  en: string;
}
export interface MatchSuggestion {
  listing: Listing;
  product: CatalogProduct;
  score: number;
  reasons: MatchReason[];
}

const divisionOf = (cats: AdminCategory[], id: string) => {
  let c = cats.find((x) => x.id === id);
  while (c?.parent_id) {
    const pid = c.parent_id;
    c = cats.find((x) => x.id === pid);
  }
  return c?.id ?? null;
};

/** Best master for one listing, or null. Score 0..1 (part number match = 1). */
export const bestMatch = (l: Listing, products: CatalogProduct[], cats: AdminCategory[]): Omit<MatchSuggestion, "listing"> | null => {
  const lpn = normalizePart(l.part_number);
  const lt = tokens(`${l.title} ${l.title_bn}`);
  const ldiv = divisionOf(cats, l.category_id);
  let best: Omit<MatchSuggestion, "listing"> | null = null;
  for (const p of products) {
    if (p.status === "merged" || p.status === "inactive") continue;
    const reasons: MatchReason[] = [];
    let score = 0;
    const pns = [p.part_number, ...p.cross_ref_numbers].map(normalizePart).filter(Boolean);
    if (lpn && pns.includes(lpn)) {
      score = 1;
      reasons.push({ bn: `পার্ট নম্বর মিলেছে (${l.part_number})`, en: `Same part number (${l.part_number})` });
    } else {
      const sim = jaccard(lt, tokens(`${p.name} ${p.name_bn}`));
      score = sim;
      if (sim > 0) reasons.push({ bn: `নামের মিল ${Math.round(sim * 100)}%`, en: `Title similarity ${Math.round(sim * 100)}%` });
      const keys = Object.keys(p.attributes);
      const same = keys.filter((k) => String(p.attributes[k]) === String(l.attributes[k] ?? "")).length;
      if (keys.length && same) {
        score += 0.2 * (same / keys.length);
        reasons.push({ bn: `বিশেষ তথ্য মিলেছে (${same}/${keys.length})`, en: `Specs match (${same}/${keys.length})` });
      }
    }
    if (p.category_id === l.category_id) {
      score += 0.15;
      reasons.push({ bn: "একই ক্যাটাগরি", en: "Same category" });
    } else if (ldiv && ldiv === divisionOf(cats, p.category_id)) {
      score += 0.05;
      reasons.push({ bn: "একই বিভাগ", en: "Same division" });
    }
    if (l.brand_id && l.brand_id === p.brand_id) {
      score += 0.05;
      reasons.push({ bn: "একই ব্র্যান্ড", en: "Same brand" });
    }
    score = Math.min(1, score);
    if (!best || score > best.score) best = { product: p, score, reasons };
  }
  return best;
};

export const matchQueue = (listings: Listing[], products: CatalogProduct[], cats: AdminCategory[], separate: string[], threshold: number): MatchSuggestion[] =>
  listings
    .filter((l) => !l.catalog_product_id && !separate.includes(l.id) && l.status !== "removed")
    .map((l) => {
      const m = bestMatch(l, products, cats);
      return m ? { listing: l, ...m } : null;
    })
    .filter((m): m is MatchSuggestion => !!m && m.score >= threshold)
    .sort((a, b) => b.score - a.score);
