"use client";

import { Link2, PlusCircle, Split } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useMemo, useState } from "react";
import { FilterSelect, KV, Panel } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, EmptyState, StatusPill } from "@/components/ui/primitives";
import type { DB } from "@/lib/db/seed";
import { useDb } from "@/lib/db/store";
import { conditionLabel, sourceLabel } from "@/lib/labels";
import type { CatalogProduct, Listing } from "@/lib/types";
import { matchQueue } from "./match";
import { keepSeparate, linkListing, pathLabel, useBrands, useCategories, useKeepSeparate, useProducts } from "./overlay";
import { fitmentText } from "./ProductForm";

const selListings = (s: DB) => s.listings;
const selVendors = (s: DB) => s.vendors;

/** Seller listings without a master that probably match one (file 03 §9.3). */
export function MatchQueue({ onNewMaster }: { onNewMaster: (l: Listing) => void }) {
  const { tx, lang, d, taka, L } = useT();
  const listings = useDb(selListings);
  const vendors = useDb(selVendors);
  const products = useProducts();
  const cats = useCategories();
  const brands = useBrands();
  const separate = useKeepSeparate();
  const [threshold, setThreshold] = useState("0.3");

  const queue = useMemo(() => matchQueue(listings, products, cats, separate, Number(threshold)), [listings, products, cats, separate, threshold]);
  const unlinked = listings.filter((l) => !l.catalog_product_id && !separate.includes(l.id) && l.status !== "removed").length;
  const brandName = (id: string | null) => brands.find((b) => b.id === id)?.name ?? "—";
  const fits = (f: { fitments: Listing["fitments"]; is_universal: boolean }) =>
    f.is_universal ? tx("সব গাড়িতে", "Universal") : f.fitments.slice(0, 2).map((x) => fitmentText(x, lang)).join("; ") + (f.fitments.length > 2 ? ` +${d(f.fitments.length - 2)}` : "") || "—";

  const listingRows = (l: Listing): [string, ReactNode][] => [
    [tx("দোকান", "Shop"), <Link key="v" href={`/admin/vendors/${l.vendor_id}`} className="text-brand hover:underline">{vendors.find((v) => v.id === l.vendor_id)?.shop_name_bn ?? l.vendor_id}</Link>],
    [tx("ক্যাটাগরি", "Category"), pathLabel(cats, l.category_id, lang)],
    [tx("পার্ট নম্বর", "Part no."), l.part_number ?? "—"],
    [tx("উৎস / অবস্থা", "Source / condition"), `${L(sourceLabel[l.source])} · ${L(conditionLabel[l.condition])}${l.grade ? ` · ${l.grade}` : ""}`],
    [tx("দাম", "Price"), taka(l.price)],
    [tx("গাড়ি", "Fits"), fits(l)],
  ];
  const productRows = (p: CatalogProduct): [string, ReactNode][] => [
    [tx("ব্র্যান্ড", "Brand"), brandName(p.brand_id)],
    [tx("ক্যাটাগরি", "Category"), pathLabel(cats, p.category_id, lang)],
    [tx("পার্ট নম্বর", "Part no."), p.part_number ?? "—"],
    [tx("ক্রস-রেফ", "Cross-ref"), p.cross_ref_numbers.join(", ") || "—"],
    [tx("উৎস", "Source"), L(sourceLabel[p.source])],
    [tx("গাড়ি", "Fits"), fits(p)],
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span>{tx(`মাস্টার ছাড়া লিস্টিং: ${d(unlinked)} · সম্ভাব্য মিল: ${d(queue.length)}`, `Unlinked listings: ${unlinked} · likely matches: ${queue.length}`)}</span>
        <FilterSelect
          label={tx("মিলের ন্যূনতম মান", "Minimum match")}
          value={threshold}
          onChange={setThreshold}
          options={["0.2", "0.3", "0.4", "0.5", "0.7"].map((v) => ({ value: v, label: tx(`মিল ≥ ${d(Math.round(Number(v) * 100))}%`, `Match ≥ ${Math.round(Number(v) * 100)}%`) }))}
        />
      </div>
      {queue.length === 0 && <EmptyState title={tx("কিউ খালি", "Queue is empty")} body={tx("এই মানে কোনো লিস্টিং কোনো মাস্টারের সাথে মেলেনি। মান কমিয়ে দেখুন বা নতুন মাস্টার বানান।", "No listing matches a master at this level. Lower the threshold or create masters.")} />}
      {queue.map(({ listing: l, product: p, score, reasons }) => (
        <Panel
          key={l.id}
          title={
            <span className="flex flex-wrap items-center gap-2">
              <StatusPill tone={score >= 0.7 ? "ok" : score >= 0.45 ? "wait" : "info"}>{tx(`মিল ${d(Math.round(score * 100))}%`, `${Math.round(score * 100)}% match`)}</StatusPill>
              <span className="text-sm font-normal text-muted">{reasons.map((r) => L(r)).join(" · ")}</span>
            </span>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-line p-3">
              <p className="text-xs font-semibold uppercase text-muted">{tx("বিক্রেতার লিস্টিং", "Seller listing")} · {l.id}</p>
              <p className="mb-2 font-bold">{lang === "bn" ? l.title_bn : l.title}</p>
              <KV rows={listingRows(l)} />
            </div>
            <div className="rounded-xl border-2 border-brand/30 bg-brand-soft/20 p-3">
              <p className="text-xs font-semibold uppercase text-muted">{tx("প্রস্তাবিত মাস্টার", "Suggested master")} · {p.id}</p>
              <p className="mb-2 font-bold">{lang === "bn" ? p.name_bn : p.name}</p>
              <KV rows={productRows(p)} />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="lg" variant="ok" onClick={() => { linkListing(l.id, p.id); toast(tx("জোড়া দেওয়া হয়েছে, বিক্রেতাকে জানানো হয়েছে", "Linked, seller notified")); }}>
              <Link2 className="size-5" /> {tx("জোড়া দিন", "Link")}
            </Button>
            <Button size="lg" variant="outline" onClick={() => onNewMaster(l)}>
              <PlusCircle className="size-5" /> {tx("নতুন মাস্টার বানান", "Make new master")}
            </Button>
            <Button size="lg" variant="ghost" onClick={() => { keepSeparate(l.id); toast(tx("আলাদা রাখা হলো", "Kept separate")); }}>
              <Split className="size-5" /> {tx("আলাদা থাকুক", "Keep separate")}
            </Button>
          </div>
        </Panel>
      ))}
    </div>
  );
}
