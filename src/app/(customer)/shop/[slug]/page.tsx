"use client";

import { Search } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { categoryPath, categoryTreeIds, describeVehicle, fitsVehicle, publicListings, vendorBySlug } from "@/lib/db/queries";
import type { DB } from "@/lib/db/seed";
import { useDb } from "@/lib/db/store";
import { reviewTags } from "@/lib/mock/catalog";
import { Stars } from "@/components/shared/Badges";
import { BackButton, HelpCall } from "@/components/shared/Misc";
import { useT } from "@/components/providers/LangProvider";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { ButtonLink, Chip, Container, EmptyState, Input, SectionTitle, Stat } from "@/components/ui/primitives";
import { ChipRow } from "@/components/customer/shop/Bits";
import { ListingCard } from "@/components/customer/shop/ListingCard";
import { ReportSheet } from "@/components/customer/shop/ReportSheet";
import { ResultsView } from "@/components/customer/shop/ResultsView";
import { ShopHeader } from "@/components/customer/shop/ShopHeader";
import { useMyCar } from "@/components/customer/shop/hooks";

const whole = (s: DB) => s;

/** Shop page (file 01 4.5). */
export default function ShopPage() {
  const { slug } = useParams<{ slug: string }>();
  const { tx, lang, d, date } = useT();
  const s = useDb(whole);
  const { generationId } = useMyCar();
  const v = vendorBySlug(s, decodeURIComponent(slug));
  const [division, setDivision] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const listings = useMemo(() => (v ? publicListings(s).filter((l) => l.vendor_id === v.id) : []), [s, v]);
  // Only divisions this shop actually has products in.
  const divisions = useMemo(() => {
    const m = new Map<string, { id: string; slug: string; name: string; name_bn: string; icon: string; count: number }>();
    listings.forEach((l) => {
      const top = categoryPath(l.category_id)[0];
      if (!top) return;
      const cur = m.get(top.id);
      m.set(top.id, { id: top.id, slug: top.slug, name: top.name, name_bn: top.name_bn, icon: top.icon, count: (cur?.count ?? 0) + 1 });
    });
    return [...m.values()].sort((a, b) => b.count - a.count);
  }, [listings]);
  const catIds = useMemo(() => (division ? categoryTreeIds(division) : undefined), [division]);

  if (!v || v.status !== "active") {
    return (
      <Container className="space-y-4">
        <BackButton href="/shops" />
        <EmptyState icon="🏪" title={tx("দোকানটি এখন পাওয়া যাচ্ছে না", "This shop isn't available")} action={<ButtonLink href="/shops" variant="brand" size="lg">{tx("অন্য দোকান খুঁজুন", "Find other shops")}</ButtonLink>} />
      </Container>
    );
  }

  const reviews = s.reviews.filter((r) => r.vendor_id === v.id);
  const tagCounts = reviewTags.map((t) => ({ ...t, n: reviews.filter((r) => r.tags.includes(t.id)).length })).filter((t) => t.n > 0);
  const donors = s.donors.filter((x) => x.vendor_id === v.id);

  return (
    <Container className="space-y-5">
      <BackButton href="/shops" />
      <ShopHeader vendor={v} />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label={tx("রেটিং", "Rating")} value={v.rating_avg ? d(v.rating_avg.toFixed(1)) : "—"} sub={tx(`${d(v.rating_count)} রিভিউ`, `${v.rating_count} reviews`)} />
        <Stat label={tx("বিক্রি", "Sales")} value={d(v.sales_count)} />
        <Stat label={tx("সময়মতো পাঠায়", "On-time")} value={`${d(Math.round(v.on_time_rate * 100))}%`} tone={v.on_time_rate >= 0.9 ? "ok" : v.on_time_rate >= 0.75 ? "wait" : "bad"} />
        <Stat label={tx("যোগ দিয়েছে", "Joined")} value={<span className="text-base">{date(v.joined_at)}</span>} />
      </div>

      {donors.length > 0 && (
        <section>
          <SectionTitle>{tx("আমাদের গাড়িগুলো", "Our cars")}</SectionTitle>
          <ul className="space-y-3">
            {donors.map((dv) => {
              const parts = listings.filter((l) => l.donor_vehicle_id === dv.id);
              return (
                <li key={dv.id} className="rounded-2xl border border-line bg-card p-4">
                  <p className="font-bold">🚗 {describeVehicle(dv.generation_id, dv.engine_id, lang)?.full}</p>
                  <p className="text-sm text-ink-2">
                    {dv.color}
                    {dv.odometer_km ? ` · ${d(dv.odometer_km.toLocaleString("en-IN"))} ${tx("কিমি", "km")}` : ""} · {tx(`${d(parts.length)}টা পার্ট তালিকায়`, `${parts.length} parts listed`)}
                  </p>
                  {dv.notes && <p className="mt-1 text-sm text-muted">{dv.notes}</p>}
                  {parts.length > 0 && (
                    <div className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar">
                      {parts.map((l) => (
                        <ListingCard key={l.id} listing={l} vendor={v} fit={fitsVehicle(l.fitments, l.is_universal, generationId)} compact />
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <SectionTitle>{tx(`পণ্য (${d(listings.length)})`, `Products (${listings.length})`)}</SectionTitle>
        {divisions.length > 1 && (
          <ChipRow>
            <Chip active={!division} onClick={() => setDivision(null)}>
              {tx("সব", "All")}
            </Chip>
            {divisions.map((c) => (
              <Chip key={c.id} active={division === c.id} onClick={() => setDivision(division === c.id ? null : c.id)}>
                <CategoryIcon icon={c.icon} className="size-4" />
                {lang === "bn" ? c.name_bn : c.name} <span className="opacity-70">{d(c.count)}</span>
              </Chip>
            ))}
          </ChipRow>
        )}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tx("এই দোকানে খুঁজুন", "Search this shop")} className="pl-12" aria-label={tx("এই দোকানে খুঁজুন", "Search this shop")} />
        </div>
        <ResultsView vendorId={v.id} categoryIds={catIds} q={q} />
      </section>

      <section>
        <SectionTitle>{tx("রিভিউ", "Reviews")}</SectionTitle>
        {tagCounts.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {tagCounts.map((t) => (
              <span key={t.id} className="rounded-full bg-ok-soft px-3 py-1 text-sm font-semibold text-ok">
                {lang === "bn" ? t.bn : t.en} ({d(t.n)})
              </span>
            ))}
          </div>
        )}
        {reviews.length ? (
          <ul className="space-y-2">
            {reviews.slice(0, 5).map((r) => (
              <li key={r.id} className="rounded-2xl border border-line bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{r.user_name}</span>
                  <Stars value={r.rating} />
                </div>
                {r.comment && <p className="mt-1 text-ink-2">{r.comment}</p>}
                {r.vendor_reply && <p className="mt-2 rounded-xl bg-surface px-3 py-2 text-sm">🏪 {r.vendor_reply}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">{tx("এখনো লেখা রিভিউ নেই", "No written reviews yet")}</p>
        )}
      </section>

      <div className="flex justify-end">
        <ReportSheet targetType="vendor" targetId={v.id} />
      </div>
      <HelpCall />
    </Container>
  );
}
