// Quote comparison helpers for /request/[id] (file 01 §5.2, file 00 §7.3).
import { benchmarkFor, getMarket, quotesFor, vendorById } from "@/lib/db/queries";
import type { DB } from "@/lib/db/seed";
import { spokenTaka } from "@/lib/format";
import { conditionLabel, dispatchLabel, sourceLabel, warrantyLabel } from "@/lib/labels";
import { priceAnomaly, scoreQuotes, type QuoteSort } from "@/lib/rules";
import type { Lang, PartRequest, Quote, Source, Vendor } from "@/lib/types";

export interface QuoteView {
  q: Quote;
  vendor: Vendor | null;
  score: number;
  total: number;
  anomaly: "too_low" | "too_high" | null;
  /** Seller suspended/closed: shown for transparency, can't be taken. */
  blocked: boolean;
}

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export const buildQuoteViews = (s: DB, r: PartRequest): QuoteView[] => {
  const quotes = quotesFor(s, r.id).filter((q) => q.status !== "withdrawn");
  const scores = scoreQuotes(quotes, Object.fromEntries(s.vendors.map((v) => [v.id, v])));
  return quotes.map((q) => {
    const vendor = vendorById(s, q.vendor_id);
    const catId = r.items[q.item_index]?.category_id ?? r.items[0]?.category_id ?? null;
    const bench = catId ? benchmarkFor(catId, q.condition) : undefined;
    // Benchmark rule first; when there is no/loose benchmark, also flag a price
    // far below the other shops' quotes for the same part (file 00 §7.2).
    const peers = quotes.filter((x) => x.id !== q.id && x.item_index === q.item_index).map((x) => x.price);
    const peerLow = peers.length >= 2 && q.price < median(peers) * 0.5;
    return {
      q,
      vendor,
      score: scores.get(q.id) ?? q.quote_score,
      total: q.price + q.delivery_charge_estimate,
      anomaly: priceAnomaly(q.price, bench) ?? (peerLow ? "too_low" : null),
      blocked: !vendor || vendor.status !== "active",
    };
  });
};

const SRC_RANK: Record<Source, number> = { genuine: 5, oem_brand: 4, aftermarket: 3, local_made: 2, unknown: 1 };
export const sourceRank = (s: Source) => SRC_RANK[s];

export const sortQuotes = (views: QuoteView[], sort: QuoteSort, district: string): QuoteView[] => {
  let list = [...views];
  if (sort === "genuine_only") list = list.filter((v) => v.q.source === "genuine");
  if (sort === "new_only") list = list.filter((v) => v.q.condition === "new");
  const cmp: Record<QuoteSort, (a: QuoteView, b: QuoteView) => number> = {
    best: (a, b) => b.score - a.score,
    genuine_only: (a, b) => b.score - a.score,
    new_only: (a, b) => b.score - a.score,
    cheapest: (a, b) => a.total - b.total,
    fastest: (a, b) => a.q.dispatch_days - b.q.dispatch_days || a.total - b.total,
    nearest: (a, b) => Number(b.vendor?.district === district) - Number(a.vendor?.district === district) || b.score - a.score,
  };
  // Blocked sellers and suspicious prices never sit on top.
  return list.sort((a, b) => Number(a.blocked) - Number(b.blocked) || Number(!!a.anomaly) - Number(!!b.anomaly) || cmp[sort](a, b));
};

export const shopName = (v: Vendor | null, lang: Lang) => (v ? (lang === "bn" ? v.shop_name_bn : v.shop_name) : "—");

/** One quote read aloud (file 01 §4.3 / §11.2). */
export const quoteSpeech = (v: QuoteView, lang: Lang, rank?: number) => {
  const bn = lang === "bn";
  const ord = bn ? ["প্রথম", "দ্বিতীয়", "তৃতীয়", "চতুর্থ", "পঞ্চম"] : ["First", "Second", "Third", "Fourth", "Fifth"];
  const head = rank != null ? `${ord[rank] ?? ""} ${bn ? "দোকান" : "shop"}, ` : "";
  const stars = v.vendor?.rating_avg ? (bn ? `${v.vendor.rating_avg.toFixed(1)} তারকা, ` : `${v.vendor.rating_avg.toFixed(1)} stars, `) : "";
  const parts = [
    `${head}${shopName(v.vendor, lang)}, ${stars}`,
    `${bn ? "দাম" : "price"} ${spokenTaka(v.q.price, lang)}`,
    bn ? sourceLabel[v.q.source].bn : sourceLabel[v.q.source].en,
    bn ? conditionLabel[v.q.condition].bn : conditionLabel[v.q.condition].en,
    warrantyLabel(v.q.warranty_days, lang),
    dispatchLabel(v.q.dispatch_days, lang),
    `${bn ? "ডেলিভারি" : "delivery"} ${spokenTaka(v.q.delivery_charge_estimate, lang)}`,
  ];
  return parts.join(", ") + (bn ? "।" : ".");
};

export const allQuotesSpeech = (views: QuoteView[], lang: Lang) => {
  const top = views.filter((v) => !v.blocked).slice(0, 3);
  if (!top.length) return lang === "bn" ? "এখনো কোনো দাম আসেনি।" : "No quotes yet.";
  const body = top.map((v, i) => quoteSpeech(v, lang, i)).join(" ");
  return `${body} ${lang === "bn" ? "প্রথমটা নিতে চাইলে সবুজ বাটন চাপুন।" : "To take the first one, press the green button."}`;
};

export const marketName = (v: Vendor | null, lang: Lang) => {
  if (!v) return "";
  const m = getMarket(v.market_area);
  return lang === "bn" ? m.bn : m.en;
};
