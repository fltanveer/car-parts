"use client";

import { Send } from "lucide-react";
import Link from "next/link";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { MediaImage } from "@/components/ui/MediaImage";
import { Button, Notice } from "@/components/ui/primitives";
import { offerAlternative } from "@/lib/db/actions-admin-core";
import { isPublic, publicListings } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import { conditionLabel, sourceLabel } from "@/lib/labels";
import type { DB } from "@/lib/db/seed";
import type { Listing, VendorOrder } from "@/lib/types";

/** Same master product from other sellers; else same category + overlapping fitment. */
export const alternativesFor = (s: DB, vo: VendorOrder): { listing: Listing; reason: "master" | "fitment"; forItem: string }[] => {
  const out: { listing: Listing; reason: "master" | "fitment"; forItem: string }[] = [];
  for (const it of vo.items) {
    const orig = s.listings.find((l) => l.id === it.listing_id);
    if (!orig) continue;
    const gens = new Set(orig.fitments.map((f) => f.generation_id).filter(Boolean));
    const cands = orig.catalog_product_id
      ? s.listings.filter((l) => l.catalog_product_id === orig.catalog_product_id && isPublic(s, l)).map((l) => ({ l, reason: "master" as const }))
      : publicListings(s)
          .filter((l) => l.category_id === orig.category_id && (orig.is_universal || l.is_universal || l.fitments.some((f) => gens.has(f.generation_id))))
          .map((l) => ({ l, reason: "fitment" as const }));
    cands.filter((c) => c.l.vendor_id !== vo.vendor_id && c.l.id !== orig.id).forEach((c) => out.push({ listing: c.l, reason: c.reason, forItem: it.snapshot.title }));
  }
  return out;
};

export function AlternativeSellers({ vo }: { vo: VendorOrder }) {
  const { tx, L, taka } = useT();
  const alts = useDb((s) => alternativesFor(s, vo));
  const vendors = useDb((s) => s.vendors);
  const price = vo.items[0]?.unit_price ?? 0;

  if (!alts.length)
    return <Notice tone="wait">{tx("একই পণ্যের অন্য কোনো দোকানের অফার পাওয়া যায়নি। রিকোয়েস্ট ডেস্ক থেকে দোকানে খোঁজ নিন বা কাস্টমারকে রিফান্ড দিন।", "No other seller offers this item. Source via the request desk or refund the customer.")}</Notice>;

  return (
    <ul className="space-y-2">
      {alts.slice(0, 6).map(({ listing: l, reason, forItem }) => {
        const v = vendors.find((x) => x.id === l.vendor_id);
        const diff = l.price - price;
        return (
          <li key={l.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-2">
            <MediaImage src={l.media[0]?.url} alt={l.title_bn} className="size-12 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 text-sm">
              <Link href={`/admin/catalog/listings?q=${l.id}`} className="font-semibold hover:underline">{l.title_bn}</Link>
              <p className="text-xs text-muted">
                {v?.shop_name_bn} · {L(sourceLabel[l.source])} · {L(conditionLabel[l.condition])}
                {l.grade ? ` ${l.grade}` : ""} · {reason === "master" ? tx("একই মাস্টার পণ্য", "Same master") : tx("একই ক্যাটাগরি ও গাড়ি", "Same category & car")} · {tx("যার বদলে:", "for:")} {forItem}
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="font-bold tabular-nums">{taka(l.price)}</p>
              <p className={diff > 0 ? "text-xs text-bad" : "text-xs text-ok"}>{diff === 0 ? tx("একই দাম", "Same price") : `${diff > 0 ? "+" : "−"}${taka(Math.abs(diff))}`}</p>
            </div>
            <Button
              size="sm"
              variant="brand"
              onClick={() => {
                offerAlternative(vo.id, l.id, diff > 0 ? tx(`দাম ${taka(diff)} বেশি`, `${taka(diff)} more`) : tx("একই বা কম দাম", "Same or lower price"));
                toast(tx("কাস্টমারকে প্রস্তাব পাঠানো হয়েছে", "Offer sent to customer"));
              }}
            >
              <Send className="size-4" /> {tx("কাস্টমারকে প্রস্তাব", "Offer to customer")}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
