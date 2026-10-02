"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { patchListing } from "@/lib/db/actions";
import { adjustPrices, logActivity, setListingsStatus } from "@/lib/db/actions-seller";
import { useDb } from "@/lib/db/store";
import { listingQuality } from "@/lib/rules";
import type { Listing, Vendor } from "@/lib/types";
import { useT } from "../../providers/LangProvider";
import { toast } from "../../shared/Misc";
import { Sheet } from "../../ui/Sheet";
import { Button, ButtonLink, Chip, EmptyState, Input, Notice } from "../../ui/primitives";
import { ConfirmSheet } from "../Bits";
import { DictateButton } from "../Dictate";
import { PriceSheet } from "../PriceSheet";
import { SellerPage } from "../SellerPage";
import { ProductRow } from "./ProductRow";

type Filter = "all" | "live" | "sold_out" | "paused" | "pending" | "rejected" | "low" | "draft";

export function ProductsList({ vendor }: { vendor: Vendor }) {
  const { tx, d } = useT();
  const all = useDb((s) => s.listings.filter((l) => l.vendor_id === vendor.id && l.status !== "removed"));
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string[]>([]);
  const [priceFor, setPriceFor] = useState<Listing | null>(null);
  const [pct, setPct] = useState(false);
  const [del, setDel] = useState(false);

  const low = (l: Listing) => listingQuality(l).score < 60;
  const match: Record<Filter, (l: Listing) => boolean> = {
    all: () => true,
    live: (l) => l.status === "active",
    sold_out: (l) => l.status === "sold_out" || l.stock_qty === 0,
    paused: (l) => l.status === "paused",
    pending: (l) => l.status === "pending_review",
    rejected: (l) => l.status === "rejected",
    low,
    draft: (l) => l.status === "draft",
  };
  const term = q.trim().toLowerCase();
  const list = all
    .filter(match[filter])
    .filter((l) => !term || [l.title, l.title_bn, l.part_number ?? ""].some((x) => x.toLowerCase().includes(term)))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  const noPartNo = all.filter((l) => l.status === "active" && !l.part_number && !l.media.some((m) => m.role === "label")).length;
  const chips: { v: Filter; bn: string; en: string }[] = [
    { v: "all", bn: "সব", en: "All" },
    { v: "live", bn: "চলছে", en: "Live" },
    { v: "sold_out", bn: "স্টক শেষ", en: "Sold out" },
    { v: "paused", bn: "বন্ধ", en: "Paused" },
    { v: "pending", bn: "অনুমোদন বাকি", en: "Pending" },
    { v: "rejected", bn: "বাতিল", en: "Rejected" },
    { v: "low", bn: "মান কম", en: "Low quality" },
    ...(all.some(match.draft) ? [{ v: "draft" as Filter, bn: "ড্রাফট", en: "Drafts" }] : []),
  ];
  const toggle = (id: string) => setSel((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));
  const bulk = (status: Listing["status"], msg: string) => {
    const ids = sel.filter((id) => all.find((l) => l.id === id && ["active", "paused", "sold_out"].includes(l.status)));
    setListingsStatus(ids, status);
    logActivity(vendor.id, msg);
    setSel([]);
    toast(msg, "info");
  };

  return (
    <SellerPage
      title={tx("📦 আমার পণ্য", "📦 My products")}
      subtitle={tx(`মোট ${d(all.length)}টা`, `${all.length} total`)}
      guide={tx("প্রতিটা পণ্যে − + চেপে স্টক বদলান, দামে চাপ দিয়ে দাম বদলান, বন্ধ বাটনে সাময়িক লুকান। বাম পাশের ঘরে টিক দিয়ে একসাথে অনেকগুলো বদলাতে পারেন।", "Use − + for stock, tap the price to change it, Pause to hide for now. Tick the boxes to change many at once.")}
      action={<ButtonLink href="/seller/add" variant="brand">＋ {tx("যোগ", "Add")}</ButtonLink>}
    >
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tx("খুঁজুন", "Search")} className="pl-12" />
        </div>
        <DictateButton onText={setQ} />
      </div>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {chips.map((c) => (
          <Chip key={c.v} active={filter === c.v} onClick={() => setFilter(c.v)}>
            {tx(c.bn, c.en)} <span className="opacity-70">{d(all.filter(match[c.v]).length)}</span>
          </Chip>
        ))}
      </div>
      {noPartNo > 0 && filter === "all" && (
        <button type="button" onClick={() => setFilter("low")} className="w-full text-left">
          <Notice tone="wait">💡 {tx(`এই ${d(noPartNo)}টা পণ্যে পার্ট নম্বর বা লেবেলের ছবি নেই। দিলে বেশি মানুষ দেখবে।`, `${noPartNo} products have no part number or label photo. Add one to get more views.`)}</Notice>
        </button>
      )}
      {list.length ? (
        <ul className="space-y-3">
          {list.map((l) => (
            <ProductRow key={l.id} l={l} selected={sel.includes(l.id)} onSelect={() => toggle(l.id)} onPrice={() => setPriceFor(l)} />
          ))}
        </ul>
      ) : (
        <EmptyState icon="📦" title={tx("কোনো পণ্য নেই", "No products")} action={<Link href="/seller/add" className="font-bold text-brand underline">📷 {tx("পণ্য যোগ করুন", "Add a product")}</Link>} />
      )}

      {sel.length > 0 && (
        <div className="sticky bottom-24 z-30 space-y-2 rounded-2xl bg-ink p-3 text-white shadow-xl">
          <p className="font-bold">{tx(`${d(sel.length)}টা বাছাই করা`, `${sel.length} selected`)} · <button type="button" className="underline" onClick={() => setSel([])}>{tx("বাদ", "Clear")}</button></p>
          <div className="grid grid-cols-4 gap-2 text-sm font-semibold">
            <button type="button" className="min-h-12 rounded-xl bg-white/15" onClick={() => setPct(true)}>％ {tx("দাম", "Price")}</button>
            <button type="button" className="min-h-12 rounded-xl bg-white/15" onClick={() => bulk("paused", tx("বন্ধ করা হয়েছে", "Paused"))}>⏸️ {tx("বন্ধ", "Pause")}</button>
            <button type="button" className="min-h-12 rounded-xl bg-white/15" onClick={() => bulk("active", tx("চালু করা হয়েছে", "Resumed"))}>▶️ {tx("চালু", "Resume")}</button>
            <button type="button" className="min-h-12 rounded-xl bg-bad" onClick={() => setDel(true)}>🗑️ {tx("ডিলিট", "Delete")}</button>
          </div>
        </div>
      )}

      {priceFor && (
        <PriceSheet
          open
          onClose={() => setPriceFor(null)}
          vendor={vendor}
          initial={priceFor.price}
          categoryId={priceFor.category_id}
          condition={priceFor.condition}
          onSave={(price) => { patchListing(priceFor.id, { price }); toast(tx("দাম বদলানো হয়েছে", "Price updated")); }}
        />
      )}
      <Sheet open={pct} onClose={() => setPct(false)} title={tx("দাম শতাংশে বদলান", "Change price by %")}>
        <div className="grid grid-cols-2 gap-2 pb-2">
          {[-10, -5, 5, 10].map((p) => (
            <Button key={p} variant={p < 0 ? "outline" : "brand"} size="lg" onClick={() => { adjustPrices(sel, p); logActivity(vendor.id, `${sel.length}টা পণ্যের দাম ${p}%`); setPct(false); setSel([]); toast(tx("দাম বদলানো হয়েছে", "Prices updated")); }}>
              {p > 0 ? "▲" : "▼"} {d(Math.abs(p))}% {p > 0 ? tx("বাড়ান", "up") : tx("কমান", "down")}
            </Button>
          ))}
        </div>
      </Sheet>
      <ConfirmSheet
        open={del}
        onClose={() => setDel(false)}
        title={tx("ডিলিট করবেন?", "Delete?")}
        body={tx(`${d(sel.length)}টা পণ্য সরিয়ে ফেলা হবে।`, `${sel.length} products will be removed.`)}
        confirmLabel={tx("🗑️ হ্যাঁ, ডিলিট", "🗑️ Yes, delete")}
        tone="danger"
        onConfirm={() => { setListingsStatus(sel, "removed"); logActivity(vendor.id, `${sel.length}টা পণ্য ডিলিট`); setSel([]); setDel(false); toast(tx("ডিলিট হয়েছে", "Deleted"), "info"); }}
      />
    </SellerPage>
  );
}
