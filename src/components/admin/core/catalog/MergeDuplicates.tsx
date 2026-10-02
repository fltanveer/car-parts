"use client";

import { ArrowRight, Merge } from "lucide-react";
import { useMemo, useState } from "react";
import { Panel } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, Field, Notice, Select } from "@/components/ui/primitives";
import type { DB } from "@/lib/db/seed";
import { useDb } from "@/lib/db/store";
import type { CatalogProduct } from "@/lib/types";
import { jaccard, normalizePart, tokens } from "./match";
import { mergeMasters, useProducts } from "./overlay";

const selListings = (s: DB) => s.listings;
const selVendors = (s: DB) => s.vendors;

/** Likely duplicate pairs: same normalized part number or very similar names in one category. */
const dupPairs = (ps: CatalogProduct[]) => {
  const out: { a: CatalogProduct; b: CatalogProduct; why: "pn" | "name" }[] = [];
  for (let i = 0; i < ps.length; i++)
    for (let j = i + 1; j < ps.length; j++) {
      const a = ps[i];
      const b = ps[j];
      const pa = [a.part_number, ...a.cross_ref_numbers].map(normalizePart).filter(Boolean);
      const pb = [b.part_number, ...b.cross_ref_numbers].map(normalizePart).filter(Boolean);
      if (pa.some((x) => pb.includes(x))) out.push({ a, b, why: "pn" });
      else if (a.category_id === b.category_id && jaccard(tokens(`${a.name} ${a.name_bn}`), tokens(`${b.name} ${b.name_bn}`)) >= 0.5) out.push({ a, b, why: "name" });
    }
  return out;
};

export function MergeDuplicates() {
  const { tx, lang, d, taka } = useT();
  const all = useProducts();
  const products = useMemo(() => all.filter((p) => p.status !== "merged"), [all]);
  const listings = useDb(selListings);
  const vendors = useDb(selVendors);
  const [keep, setKeep] = useState("");
  const [drop, setDrop] = useState("");
  const [sure, setSure] = useState(false);
  const pairs = useMemo(() => dupPairs(products), [products]);

  const name = (p: CatalogProduct | undefined) => (p ? `${lang === "bn" ? p.name_bn : p.name}${p.part_number ? ` · ${p.part_number}` : ""}` : "");
  const kp = products.find((p) => p.id === keep);
  const dp = products.find((p) => p.id === drop);
  const moving = listings.filter((l) => l.catalog_product_id === drop);
  const ready = kp && dp && kp.id !== dp.id;

  const pick = (k: string, dr: string) => {
    setKeep(k);
    setDrop(dr);
    setSure(false);
  };

  return (
    <div className="space-y-4">
      <Panel title={tx("সম্ভাব্য ডুপ্লিকেট", "Likely duplicates")}>
        {pairs.length === 0 ? (
          <p className="text-sm text-muted">{tx("কোনো সম্ভাব্য ডুপ্লিকেট পাওয়া যায়নি। নিচে নিজে দুটো বাছাই করতে পারেন।", "No likely duplicates found. You can still pick two below.")}</p>
        ) : (
          <ul className="space-y-2">
            {pairs.map(({ a, b, why }) => (
              <li key={`${a.id}-${b.id}`} className="flex flex-wrap items-center gap-2 rounded-xl border border-line p-2 text-sm">
                <span className="font-semibold">{name(a)}</span>
                <span className="text-muted">↔</span>
                <span className="font-semibold">{name(b)}</span>
                <span className="text-xs text-muted">({why === "pn" ? tx("একই পার্ট নম্বর", "same part no.") : tx("নাম প্রায় এক", "similar name")})</span>
                <Button size="sm" variant="outline" className="ml-auto" onClick={() => pick(a.id, b.id)}>
                  {tx("বাছাই", "Select")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title={tx("দুটো মাস্টার এক করুন", "Merge two masters")}>
        <div className="grid items-end gap-3 md:grid-cols-[1fr_auto_1fr]">
          <Field label={tx("যেটা বাদ যাবে (অফার সরবে)", "Remove (offers move)")}>
            <Select value={drop} onChange={(e) => { setDrop(e.target.value); setSure(false); }}>
              <option value="">{tx("— বাছুন —", "— choose —")}</option>
              {products.map((p) => <option key={p.id} value={p.id}>{name(p)}</option>)}
            </Select>
          </Field>
          <ArrowRight className="mx-auto mb-3 hidden size-6 text-muted md:block" />
          <Field label={tx("যেটা থাকবে", "Keep")}>
            <Select value={keep} onChange={(e) => { setKeep(e.target.value); setSure(false); }}>
              <option value="">{tx("— বাছুন —", "— choose —")}</option>
              {products.map((p) => <option key={p.id} value={p.id}>{name(p)}</option>)}
            </Select>
          </Field>
        </div>
        {kp && dp && kp.id === dp.id && <Notice tone="bad" className="mt-3">{tx("একই পণ্য দুই দিকে বাছাই করা হয়েছে", "Same product picked twice")}</Notice>}
        {ready && (
          <div className="mt-4 space-y-3">
            <Notice tone="wait">
              {tx(`"${name(dp)}" এর ${d(moving.length)}টা অফার "${name(kp)}" এ সরানো হবে। পুরনো মাস্টার "একত্র করা" অবস্থায় যাবে।`, `${moving.length} offers of "${name(dp)}" will move to "${name(kp)}". The old master becomes "merged".`)}
            </Notice>
            {moving.length > 0 && (
              <ul className="divide-y divide-line rounded-xl border border-line text-sm">
                {moving.map((l) => (
                  <li key={l.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                    <span className="font-mono text-xs text-muted">{l.id}</span>
                    <span className="font-semibold">{vendors.find((v) => v.id === l.vendor_id)?.shop_name_bn ?? l.vendor_id}</span>
                    <span className="ml-auto">{taka(l.price)}</span>
                  </li>
                ))}
              </ul>
            )}
            <Button
              size="lg"
              variant={sure ? "danger" : "brand"}
              onClick={() => {
                if (!sure) return setSure(true);
                const n = mergeMasters(kp.id, dp.id);
                toast(tx(`একত্র হয়েছে, ${d(n)}টা অফার সরানো হয়েছে`, `Merged, ${n} offers moved`));
                pick("", "");
              }}
            >
              <Merge className="size-5" /> {sure ? tx("নিশ্চিত, একত্র করুন", "Yes, merge now") : tx("একত্র করুন", "Merge")}
            </Button>
          </div>
        )}
      </Panel>
    </div>
  );
}
