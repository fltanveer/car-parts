"use client";

import { BarList, type Column, DataTable, KpiCard, KpiGrid } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { describeVehicle, generations, getCategory } from "@/lib/db/queries";
import type { DB } from "@/lib/db/seed";
import { listingQuality } from "@/lib/rules";
import type { Listing } from "@/lib/types";
import { avg, Grid2, pct, ReportBlock } from "./util";

interface FewRow {
  l: Listing;
  photos: number;
  need: number;
  quality: number;
}

/** Catalog quality (file 03 §20): master link %, quality score, few photos, fitment gaps. */
export function CatalogReport({ s }: { s: DB }) {
  const { tx, d } = useT();
  const listings = s.listings.filter((l) => l.status !== "removed" && l.status !== "draft");
  const vName = (id: string) => s.vendors.find((v) => v.id === id)?.shop_name_bn ?? id;
  const scored = listings.map((l) => ({ l, quality: listingQuality(l).score, photos: l.media.filter((m) => m.role !== "running_video").length, need: Math.max(3, getCategory(l.category_id)?.min_photos ?? 3) }));
  const linked = listings.filter((l) => l.catalog_product_id).length;
  const few: FewRow[] = scored.filter((x) => x.photos < x.need);
  const buckets = [
    { label: "0–39", min: -1, max: 40, tone: "bad" as const },
    { label: "40–69", min: 39, max: 70, tone: "wait" as const },
    { label: "70–100", min: 69, max: 101, tone: "ok" as const },
  ].map((b) => ({ label: d(b.label), tone: b.tone, value: scored.filter((x) => x.quality > b.min && x.quality < b.max).length }));

  const gens = generations.map((g) => {
    const n = listings.filter((l) => !l.is_universal && l.fitments.some((f) => f.generation_id === g.id || (f.generation_id === null && f.model_id === g.model_id))).length;
    return { g, name: describeVehicle(g.id)?.full ?? g.label, n };
  });
  const empty = gens.filter((x) => x.n === 0);

  const cols: Column<FewRow>[] = [
    { key: "title", header: tx("লিস্টিং", "Listing"), sort: (r) => r.l.title_bn, cell: (r) => <span className="font-semibold">{r.l.title_bn}</span> },
    { key: "shop", header: tx("দোকান", "Shop"), sort: (r) => vName(r.l.vendor_id), cell: (r) => vName(r.l.vendor_id) },
    { key: "ph", header: tx("ছবি", "Photos"), sort: (r) => r.photos, cell: (r) => <span className="font-bold text-bad">{d(r.photos)} / {d(r.need)}</span> },
    { key: "q", header: tx("মান স্কোর", "Quality"), sort: (r) => r.quality, cell: (r) => d(r.quality) },
    { key: "m", header: tx("মাস্টারে জোড়া", "Linked"), cell: (r) => (r.l.catalog_product_id ? "✅" : "—"), hideOnMobile: true },
  ];

  return (
    <div className="space-y-5">
      <KpiGrid>
        <KpiCard label={tx("মাস্টারের সাথে জোড়া", "Linked to master")} value={`${d(pct(linked, listings.length))}%`} sub={tx(`${d(linked)} / ${d(listings.length)}`, `${linked} of ${listings.length}`)} />
        <KpiCard label={tx("গড় মান স্কোর", "Avg quality score")} value={d(Math.round(avg(scored.map((x) => x.quality))))} />
        <KpiCard label={tx("ছবি কম", "Too few photos")} value={d(few.length)} tone={few.length ? "wait" : "ok"} />
        <KpiCard label={tx("লিস্টিং নেই এমন প্রজন্ম", "Generations with no listings")} value={d(empty.length)} tone={empty.length ? "wait" : "ok"} sub={tx(`${d(generations.length)}টার মধ্যে`, `of ${generations.length}`)} />
      </KpiGrid>
      <Grid2>
        <ReportBlock title={tx("মান স্কোর বণ্টন", "Quality score distribution")}>
          <BarList data={buckets} />
        </ReportBlock>
        <ReportBlock
          title={tx("ফিটমেন্ট ঘাটতি: লিস্টিং নেই এমন গাড়ি", "Fitment gaps: cars with no listings")}
          csvName="fitment-gaps.csv"
          csv={[["generation_id", "vehicle", "listings"], ...gens.map((x) => [x.g.id, x.name, x.n])]}
        >
          <ul className="max-h-72 space-y-1 overflow-y-auto text-sm">
            {empty.map((x) => (
              <li key={x.g.id} className="rounded-lg bg-wait-soft px-2 py-1 text-wait">
                {x.name}
              </li>
            ))}
            {!empty.length && <li className="text-muted">{tx("সব প্রজন্মে লিস্টিং আছে", "Every generation has listings")}</li>}
          </ul>
        </ReportBlock>
      </Grid2>
      <ReportBlock
        title={tx("ছবি কম লিস্টিং", "Listings with too few photos")}
        csvName="few-photo-listings.csv"
        csv={[["listing_id", "title", "vendor", "photos", "required", "quality"], ...few.map((r) => [r.l.id, r.l.title_bn, vName(r.l.vendor_id), r.photos, r.need, r.quality])]}
      >
        <DataTable rows={few} columns={cols} rowKey={(r) => r.l.id} search={(r) => `${r.l.title_bn} ${r.l.title} ${vName(r.l.vendor_id)}`} empty={tx("সব লিস্টিংয়ে যথেষ্ট ছবি আছে", "All listings have enough photos")} />
      </ReportBlock>
    </div>
  );
}
