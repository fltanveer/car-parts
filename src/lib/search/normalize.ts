import { toEnDigits } from "../format";

// Spec 7.3 step 1: lowercase, drop hyphen/space, Bangla digits -> ASCII.
export const normalizeQuery = (q: string) => toEnDigits(q).toLowerCase().trim().replace(/\s+/g, " ");

export const compact = (q: string) => normalizeQuery(q).replace(/[\s\-_.]/g, "");

// A query that is mostly digits looks like a part number.
export const looksLikePartNumber = (q: string) => {
  const c = compact(q);
  return c.length >= 5 && (c.match(/\d/g)?.length ?? 0) / c.length >= 0.5;
};

// Cheap bigram similarity, stand-in for pg_trgm in the mock.
export const similarity = (a: string, b: string) => {
  const grams = (s: string) => {
    const t = ` ${s} `;
    const set = new Set<string>();
    for (let i = 0; i < t.length - 1; i++) set.add(t.slice(i, i + 2));
    return set;
  };
  const A = grams(a);
  const B = grams(b);
  let hit = 0;
  A.forEach((g) => B.has(g) && hit++);
  return (2 * hit) / (A.size + B.size || 1);
};
