import { cookies } from "next/headers";
import { digits, range, taka } from "./format";
import type { Lang } from "./types";

// Server-component counterpart of useT(). Bangla digits are always on here;
// the per-user toggle only applies in client components.
export async function getT() {
  const c = await cookies();
  const lang: Lang = c.get("lang")?.value === "en" ? "en" : "bn";
  return {
    lang,
    tx: (bn: string, en: string) => (lang === "bn" ? bn : en),
    taka: (n: number) => taka(n, lang),
    d: (s: string | number) => digits(s, lang),
    range: (a: number, b: number) => range(a, b, lang),
  };
}
