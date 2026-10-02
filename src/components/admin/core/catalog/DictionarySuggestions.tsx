"use client";

import { Plus } from "lucide-react";
import { Panel } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button } from "@/components/ui/primitives";
import type { DB } from "@/lib/db/seed";
import { useDb } from "@/lib/db/store";
import { type AdminCategory, type SynonymRow, type SynonymSource, addSynonym, pathLabel } from "./overlay";

// Mock search log: what customers typed that returned nothing (file 03 §9.5).
const ZERO_RESULTS: { term: string; count: number; category_id: string | null; keyword?: string; region?: string }[] = [
  { term: "ডাইনামো", count: 34, category_id: null, keyword: "alternator" },
  { term: "শকার", count: 27, category_id: "c-suspension-parts--shock-absorber", region: "ঢাকা" },
  { term: "মবিল ফিল্টার", count: 25, category_id: "c-filters--oil-filter" },
  { term: "সাইলেন্সার পাইপ", count: 21, category_id: null, keyword: "exhaust silencer pipe" },
  { term: "হেডলাইট গ্লাস", count: 18, category_id: "c-lamps--headlight" },
  { term: "lukin glass", count: 12, category_id: "c-mirrors--side-mirror" },
  { term: "চাকার বেয়ারিং", count: 11, category_id: null, keyword: "wheel bearing" },
  { term: "ব্রেক সু", count: 9, category_id: null, keyword: "brake shoe" },
  { term: "dynamo axio", count: 8, category_id: null, keyword: "alternator" },
  { term: "এসি গ্যাস", count: 7, category_id: null, keyword: "ac gas refrigerant" },
  { term: "গিয়ার বক্স", count: 6, category_id: null, keyword: "gearbox", region: "চট্টগ্রাম" },
];

const STOP = new Set(["লাগবে", "হলেও", "চলবে", "পুরো", "সেট", "গেছে", "পাশের", "সামনের", "পেছনের", "ছাড়া", "ভেঙে", "আছে", "একটা", "দরকার", "ভালো", "এর", "এবং", "জন্য", "কিনতে", "চাই"]);

/** Words from request descriptions where the desk mapped items to a category. */
const selRequestWords = (s: DB) => {
  const map = new Map<string, { count: number; category_id: string | null }>();
  s.requests.forEach((r) => {
    if (!r.items.length || !r.description_text) return;
    const words = r.description_text
      .replace(/[০-৯0-9,.।!?()"'/-]+/g, " ")
      .split(/\s+/)
      .map((w) => w.trim().replace(/(ের|এর|টা|টি|গুলো)$/, ""))
      .filter((w) => [...w].length >= 3 && !STOP.has(w));
    new Set(words).forEach((w) => {
      const cur = map.get(w);
      map.set(w, { count: (cur?.count ?? 0) + 1, category_id: cur?.category_id ?? r.items[0].category_id });
    });
  });
  return [...map.entries()].map(([term, v]) => ({ term, ...v })).sort((a, b) => b.count - a.count);
};

export function DictionarySuggestions({ rows, cats }: { rows: SynonymRow[]; cats: AdminCategory[] }) {
  const { tx, d, lang } = useT();
  const reqWords = useDb(selRequestWords);
  const known = new Set([...rows.map((r) => r.term.toLowerCase()), ...cats.flatMap((c) => [c.name_bn, c.name.toLowerCase()])]);
  const zero = ZERO_RESULTS.filter((z) => !known.has(z.term.toLowerCase()));
  const fromReq = reqWords.filter((w) => !known.has(w.term.toLowerCase())).slice(0, 12);

  const add = (term: string, category_id: string | null, keyword: string | null, region: string | null, source: SynonymSource) => {
    addSynonym({ term, category_id, keyword, region, source });
    toast(tx(`"${term}" synonym হিসেবে যোগ হয়েছে`, `"${term}" added as synonym`));
  };
  const target = (category_id: string | null, keyword?: string | null) => (category_id ? pathLabel(cats, category_id, lang) : keyword ? `🔑 ${keyword}` : tx("ঠিক করা নেই", "not mapped"));

  const list = (items: { term: string; count: number; category_id: string | null; keyword?: string | null; region?: string | null }[], source: SynonymSource, unit: (n: number) => string) =>
    items.length === 0 ? (
      <p className="text-sm text-muted">{tx("এখন কোনো সাজেশন নেই", "No suggestions right now")}</p>
    ) : (
      <ul className="divide-y divide-line">
        {items.map((z) => (
          <li key={z.term} className="flex flex-wrap items-center gap-2 py-2">
            <span className="min-w-0 flex-1">
              <span className="font-semibold">{z.term}</span>
              <span className="ml-2 text-xs text-muted">{unit(z.count)}</span>
              <span className="block text-xs text-muted">→ {target(z.category_id, z.keyword)}</span>
            </span>
            <Button size="sm" variant="outline" disabled={!z.category_id && !z.keyword} onClick={() => add(z.term, z.category_id, z.keyword ?? null, z.region ?? null, source)}>
              <Plus className="size-4" /> {tx("synonym যোগ", "Add as synonym")}
            </Button>
          </li>
        ))}
      </ul>
    );

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title={tx("শূন্য ফলাফলের সার্চ (গত ৩০ দিন)", "Zero-result searches (last 30 days)")}>
        {list(zero, "search", (n) => tx(`${d(n)} বার`, `${n} times`))}
      </Panel>
      <Panel title={tx("রিকোয়েস্ট রিভিউ থেকে", "From request reviews")}>
        {list(fromReq, "request_review", (n) => tx(`${d(n)} রিকোয়েস্টে`, `in ${n} requests`))}
      </Panel>
    </div>
  );
}
