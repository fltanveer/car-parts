"use client";

import { Car } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { DB } from "@/lib/db/seed";
import { useDb } from "@/lib/db/store";
import { useT } from "@/components/providers/LangProvider";
import { Button, Chip, Toggle } from "@/components/ui/primitives";
import { buildResults, emptyFilters, type Filters, type SortKey } from "./data";
import { FilterSheet } from "./FilterSheet";
import { useMyCar } from "./hooks";
import { ListingCard } from "./ListingCard";
import { ProductCard } from "./ProductCard";
import { RequestPromptCard } from "./RequestPromptCard";

const whole = (s: DB) => s;

/** Mixed master-product + single-listing results with my-car toggle, sort and filters. */
export function ResultsView({ q, categoryIds, vendorId, requestText, hideRequestCard }: { q?: string; categoryIds?: string[]; vendorId?: string; requestText?: string; hideRequestCard?: boolean }) {
  const { tx, d } = useT();
  const s = useDb(whole);
  const { vehicle, generationId, label } = useMyCar();
  const [myCarOnly, setMyCarOnly] = useState(true);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [sort, setSort] = useState<SortKey>("best");
  const onlyMine = myCarOnly && !!generationId;

  const results = useMemo(
    () => buildResults(s, { q, categoryIds, vendorId, generationId, myCarOnly: onlyMine, filters, sort }),
    [s, q, categoryIds, vendorId, generationId, onlyMine, filters, sort],
  );

  const sorts: { id: SortKey; label: string }[] = [
    { id: "best", label: tx("⭐ সেরা পছন্দ", "⭐ Best match") },
    { id: "cheapest", label: tx("৳ কম দাম", "৳ Cheapest") },
    { id: "nearest", label: tx("📍 কাছে", "📍 Nearest") },
    { id: "rating", label: tx("👍 রেটিং বেশি", "👍 Top rated") },
  ];

  return (
    <div className="space-y-3">
      {generationId ? (
        <div className="rounded-2xl border border-line bg-card px-4">
          <Toggle
            checked={myCarOnly}
            onChange={setMyCarOnly}
            label={
              <span className="flex items-center gap-2">
                <Car className="size-5 text-brand" aria-hidden />
                {myCarOnly ? tx(`শুধু ${label}-এর জন্য`, `Only for ${label}`) : tx("সব গাড়ির জন্য দেখাচ্ছে", "Showing for all cars")}
              </span>
            }
          />
        </div>
      ) : (
        !vehicle && (
          <Link href="/garage/add" className="flex min-h-12 items-center gap-2 rounded-2xl border border-dashed border-brand/50 bg-card px-4 text-sm font-semibold text-brand-ink">
            <Car className="size-5" aria-hidden /> {tx("আপনার গাড়ি সেট করুন, শুধু মিলে যাওয়া পার্টস দেখাবো", "Set your car to see only parts that fit")}
          </Link>
        )
      )}

      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 no-scrollbar" role="group" aria-label={tx("সাজানো", "Sort")}>
          {sorts.map((x) => (
            <Chip key={x.id} active={sort === x.id} onClick={() => setSort(x.id)}>
              {x.label}
            </Chip>
          ))}
        </div>
        <FilterSheet value={filters} onChange={setFilters} resultCount={results.length} />
      </div>

      <p className="text-sm text-muted" aria-live="polite">
        {tx(`${d(results.length)}টা ফলাফল`, `${results.length} results`)}
      </p>

      {results.length > 0 ? (
        <ul className="space-y-3">
          {results.map((r) => (
            <li key={r.key}>
              {r.kind === "product" ? <ProductCard product={r.product} offers={r.offers} min={r.min} fit={r.fit} /> : <ListingCard listing={r.listing} vendor={r.vendor} fit={r.fit} />}
            </li>
          ))}
        </ul>
      ) : (
        onlyMine && (
          <Button variant="outline" size="lg" full onClick={() => setMyCarOnly(false)}>
            {tx("সব গাড়ির জন্য খুঁজে দেখুন", "Search for all cars")}
          </Button>
        )
      )}

      {!hideRequestCard && <RequestPromptCard text={requestText ?? q} big={results.length === 0} />}
    </div>
  );
}
