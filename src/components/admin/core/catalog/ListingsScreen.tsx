"use client";

import { Link2, Link2Off } from "lucide-react";
import { useState } from "react";
import { AdminPage, type Column, DataTable, FilterChip, FilterSelect, KpiCard, KpiGrid } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { MediaImage } from "@/components/ui/MediaImage";
import { StatusPill } from "@/components/ui/primitives";
import type { DB } from "@/lib/db/seed";
import { useDb } from "@/lib/db/store";
import { listingStatusLabel } from "@/lib/labels";
import { listingQuality } from "@/lib/rules";
import type { Listing, ListingStatus } from "@/lib/types";
import { ListingEditSheet } from "./ListingEditSheet";
import { type AdminCategory, pathLabel, pathOf, useCategories } from "./overlay";

const selListings = (s: DB) => s.listings;
const selVendors = (s: DB) => s.vendors;

type Band = "all" | "high" | "mid" | "low";
const band = (score: number): Exclude<Band, "all"> => (score >= 70 ? "high" : score >= 40 ? "mid" : "low");
const photoCount = (l: Listing) => l.media.filter((m) => m.role !== "running_video").length;
const minPhotos = (cats: AdminCategory[], id: string) => cats.find((c) => c.id === id)?.min_photos ?? 2;

export function ListingsScreen({ initialQuery }: { initialQuery: string }) {
  const { tx, lang, L, d, taka } = useT();
  const listings = useDb(selListings);
  const vendors = useDb(selVendors);
  const cats = useCategories();
  const [vendor, setVendor] = useState("all");
  const [division, setDivision] = useState("all");
  const [status, setStatus] = useState<"all" | ListingStatus>("all");
  const [quality, setQuality] = useState<Band>("all");
  const [unlinked, setUnlinked] = useState(false);
  const [fewPhotos, setFewPhotos] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const scored = listings.map((l) => ({ l, q: listingQuality(l).score, div: pathOf(cats, l.category_id)[0]?.id ?? null }));
  const rows = scored.filter(
    ({ l, q, div }) =>
      (vendor === "all" || l.vendor_id === vendor) &&
      (division === "all" || div === division) &&
      (status === "all" || l.status === status) &&
      (quality === "all" || band(q) === quality) &&
      (!unlinked || !l.catalog_product_id) &&
      (!fewPhotos || photoCount(l) < minPhotos(cats, l.category_id)),
  );
  const shop = (id: string) => vendors.find((v) => v.id === id)?.shop_name_bn ?? id;
  const editing = listings.find((l) => l.id === editId) ?? null;

  type R = (typeof scored)[number];
  const cols: Column<R>[] = [
    {
      key: "title",
      header: tx("লিস্টিং", "Listing"),
      sort: ({ l }) => l.title_bn,
      cell: ({ l }) => (
        <div className="flex min-w-56 items-center gap-2">
          <MediaImage src={l.media[0]?.url ?? "ph:part"} alt="" className="size-10 shrink-0 rounded-lg" />
          <div className="min-w-0">
            <p className="font-semibold">{lang === "bn" ? l.title_bn : l.title}</p>
            <p className="text-xs text-muted">
              <code>{l.id}</code>
              {l.part_number ? ` · ${l.part_number}` : ""}
            </p>
          </div>
        </div>
      ),
    },
    { key: "vendor", header: tx("বিক্রেতা", "Seller"), sort: ({ l }) => shop(l.vendor_id), cell: ({ l }) => shop(l.vendor_id) },
    { key: "cat", header: tx("ক্যাটাগরি", "Category"), hideOnMobile: true, cell: ({ l }) => <span className="text-xs">{pathLabel(cats, l.category_id, lang)}</span> },
    { key: "price", header: tx("দাম", "Price"), sort: ({ l }) => l.price, cell: ({ l }) => <span className="whitespace-nowrap font-semibold">{taka(l.price)}</span> },
    { key: "stock", header: tx("স্টক", "Stock"), sort: ({ l }) => l.stock_qty, cell: ({ l }) => d(l.stock_qty) },
    { key: "status", header: tx("অবস্থা", "Status"), sort: ({ l }) => l.status, cell: ({ l }) => <StatusPill tone={listingStatusLabel[l.status].tone}>{L(listingStatusLabel[l.status])}</StatusPill> },
    {
      key: "q",
      header: tx("মান", "Quality"),
      sort: ({ q }) => q,
      cell: ({ q }) => <StatusPill tone={band(q) === "high" ? "ok" : band(q) === "mid" ? "wait" : "bad"}>{d(q)}</StatusPill>,
    },
    {
      key: "photos",
      header: tx("ছবি", "Photos"),
      hideOnMobile: true,
      sort: ({ l }) => photoCount(l),
      cell: ({ l }) => {
        const n = photoCount(l);
        const min = minPhotos(cats, l.category_id);
        return <span className={n < min ? "font-bold text-bad" : ""}>{d(n)}/{d(min)}</span>;
      },
    },
    {
      key: "master",
      header: tx("মাস্টার", "Master"),
      hideOnMobile: true,
      cell: ({ l }) => (l.catalog_product_id ? <Link2 className="size-4 text-ok" aria-label={l.catalog_product_id} /> : <Link2Off className="size-4 text-muted" aria-label={tx("মাস্টার নেই", "No master")} />),
    },
  ];

  const lowQ = scored.filter((s) => band(s.q) === "low").length;
  const few = listings.filter((l) => photoCount(l) < minPhotos(cats, l.category_id)).length;

  return (
    <AdminPage
      back="/admin/catalog"
      title={tx("সব লিস্টিং", "All listings")}
      subtitle={tx("সব বিক্রেতার সব পণ্য", "Every seller's listings")}
      guide={tx(
        "উপরের ফিল্টার দিয়ে বিক্রেতা, বিভাগ, অবস্থা বা মান অনুযায়ী খুঁজুন। কোনো সারিতে চাপ দিলে সংশোধনের ঘর খুলবে। দাম, স্টক, অবস্থা বা নাম বদলালে কারণ লিখতে হবে, বিক্রেতা সেটা নোটিফিকেশনে পাবে, আর অডিট লগে থাকবে।",
        "Use the filters to narrow by seller, division, status or quality. Tap a row to edit. Changing price, stock, status or title needs a reason; the seller is notified and the change is audited.",
      )}
    >
      <KpiGrid>
        <KpiCard label={tx("মোট লিস্টিং", "Total listings")} value={d(listings.length)} />
        <KpiCard label={tx("অনুমোদনের অপেক্ষায়", "Pending review")} value={d(listings.filter((l) => l.status === "pending_review").length)} tone="wait" onClick={() => setStatus("pending_review")} active={status === "pending_review"} />
        <KpiCard label={tx("কম মান (<৪০)", "Low quality (<40)")} value={d(lowQ)} tone={lowQ ? "bad" : "ok"} onClick={() => setQuality("low")} active={quality === "low"} />
        <KpiCard label={tx("ছবি কম", "Too few photos")} value={d(few)} tone={few ? "bad" : "ok"} onClick={() => setFewPhotos(true)} active={fewPhotos} />
      </KpiGrid>
      <DataTable
        rows={rows}
        columns={cols}
        rowKey={({ l }) => l.id}
        initialQuery={initialQuery}
        onRowClick={({ l }) => setEditId(l.id)}
        search={({ l }) => `${l.id} ${l.title} ${l.title_bn} ${l.part_number ?? ""} ${shop(l.vendor_id)}`}
        searchPlaceholder={tx("আইডি, নাম, পার্ট নম্বর, দোকান…", "ID, title, part no., shop…")}
        initialSort={{ key: "q", dir: "asc" }}
        toolbar={
          <>
            <FilterSelect label={tx("বিক্রেতা", "Seller")} value={vendor} onChange={setVendor} options={[{ value: "all", label: tx("সব বিক্রেতা", "All sellers") }, ...vendors.map((v) => ({ value: v.id, label: v.shop_name_bn }))]} />
            <FilterSelect
              label={tx("বিভাগ", "Division")}
              value={division}
              onChange={setDivision}
              options={[{ value: "all", label: tx("সব বিভাগ", "All divisions") }, ...cats.filter((c) => c.level === 1).map((c) => ({ value: c.id, label: lang === "bn" ? c.name_bn : c.name }))]}
            />
            <FilterSelect
              label={tx("অবস্থা", "Status")}
              value={status}
              onChange={setStatus}
              options={[{ value: "all", label: tx("সব অবস্থা", "All statuses") }, ...(Object.keys(listingStatusLabel) as ListingStatus[]).map((s) => ({ value: s, label: L(listingStatusLabel[s]) }))]}
            />
            <FilterSelect
              label={tx("মান স্কোর", "Quality")}
              value={quality}
              onChange={setQuality}
              options={[
                { value: "all", label: tx("সব মান", "Any quality") },
                { value: "high", label: tx("ভালো (৭০+)", "Good (70+)") },
                { value: "mid", label: tx("মাঝারি (৪০–৬৯)", "Fair (40–69)") },
                { value: "low", label: tx("কম (<৪০)", "Low (<40)") },
              ]}
            />
            <FilterChip active={unlinked} onClick={() => setUnlinked((v) => !v)}>
              {tx("মাস্টার ছাড়া", "No master")}
            </FilterChip>
            <FilterChip active={fewPhotos} onClick={() => setFewPhotos((v) => !v)}>
              {tx("ছবি কম", "Few photos")}
            </FilterChip>
          </>
        }
      />
      {editing && <ListingEditSheet key={editing.id + editing.updated_at} l={editing} onClose={() => setEditId(null)} />}
    </AdminPage>
  );
}
