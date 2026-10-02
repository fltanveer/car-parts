"use client";

import clsx from "clsx";
import { ArrowDownUp, Car, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { getAllParts, getCategoryParts, getGenerations, getMakes, getModels, searchParts } from "@/lib/api";
import { normalizeQuery } from "@/lib/search/normalize";
import { useActiveVehicle, useHydrated } from "@/lib/store";
import type { Part, VehicleModel } from "@/lib/types";
import { PartGrid } from "../part/PartCard";
import { useT } from "../providers/LangProvider";
import { Button } from "../ui/primitives";
import { vehicleLabel } from "../vehicle/VehicleChip";
import { FilterSheet } from "./FilterSheet";
import { NotFoundCard } from "./NotFoundCard";
import { activeFilterCount, emptyFilters, filterParts, type ListFilters, type SortKey } from "./filters";


// A search like "Axio" or "Noah brake pad" names a car model; parts are matched
// on fitment instead of text for that part of the query.
const matchModel = (q: string): { model: VehicleModel; rest: string } | null => {
  const nq = ` ${normalizeQuery(q)} `;
  for (const model of getModels()) {
    for (const n of [model.name, model.name_bn].map(normalizeQuery)) {
      if (nq.includes(` ${n} `)) return { model, rest: nq.replace(` ${n} `, " ").trim() };
    }
  }
  return null;
};

interface Base {
  parts: Part[];
  keyword: string | null;
  partNumber: boolean;
  model: VehicleModel | null;
}

const fetchBase = (kind: "search" | "category", value: string, generationId: string | null): Base => {
  if (kind === "category") return { parts: getCategoryParts(value, generationId), keyword: null, partNumber: false, model: null };
  const m = matchModel(value);
  if (m) {
    const gens = new Set(getGenerations(m.model.id).map((g) => g.id));
    const fitsModel = (p: Part) => p.fitments.some((f) => gens.has(f.generation_id));
    const pool = m.rest ? searchParts(m.rest, null).results : getAllParts();
    return { parts: pool.filter(fitsModel), keyword: null, partNumber: false, model: m.model };
  }
  const r = searchParts(value, generationId);
  return { parts: r.results, keyword: r.matchedKeyword, partNumber: r.queryType === "part_number", model: null };
};

// Shared results body for /search and /category/[slug]. Pass exactly one of q / categorySlug.
export function PartListing({ q = "", categorySlug, notFoundQuery }: { q?: string; categorySlug?: string; notFoundQuery?: string }) {
  const kind = categorySlug ? "category" : "search";
  const value = categorySlug ?? q;
  const { t, tx, lang, d } = useT();
  const hydrated = useHydrated();
  const vehicle = useActiveVehicle();
  const myGen = vehicle?.generation_id ?? null;

  const [showAll, setShowAll] = useState(false);
  const [filters, setFilters] = useState<ListFilters>(emptyFilters);
  const [sort, setSort] = useState<SortKey>("relevance");
  const [sheetOpen, setSheetOpen] = useState(false);

  const genId = showAll ? null : myGen;
  const base = useMemo(() => fetchBase(kind, value, genId), [kind, value, genId]);
  // For the "nothing for your car, but N for other cars" hint.
  const allCarsCount = useMemo(() => (genId ? fetchBase(kind, value, null).parts.length : base.parts.length), [kind, value, genId, base]);
  const results = useMemo(() => filterParts(base.parts, filters, sort), [base, filters, sort]);
  const countFor = useCallback((f: ListFilters) => filterParts(base.parts, f).length, [base]);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const nFilters = activeFilterCount(filters);

  if (!hydrated) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-busy="true" aria-label={t("loading")}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-line/60" />
        ))}
      </div>
    );
  }

  const carText = (() => {
    if (base.model) {
      const make = getMakes().find((m) => m.id === base.model!.make_id);
      return `${make?.name ?? ""} ${base.model.name}`.trim();
    }
    return genId && vehicle ? vehicleLabel(vehicle, lang) : null;
  })();

  const n = results.length;
  const heading = carText
    ? tx(`${carText}-এর জন্য ${d(n)}টি ${kind === "search" ? "ফলাফল" : "পার্ট"}`, `${n} ${kind === "search" ? "results" : "parts"} for ${carText}`)
    : tx(`${d(n)}টি ${kind === "search" ? "ফলাফল" : "পার্ট"}`, `${n} ${kind === "search" ? "results" : "parts"}`);

  const sortOptions: { id: SortKey; label: string }[] = [
    { id: "relevance", label: t("sort_relevance") },
    { id: "price_asc", label: t("sort_price_asc") },
    { id: "price_desc", label: t("sort_price_desc") },
  ];

  return (
    <div>
      {/* summary */}
      <div className="mb-3">
        <h1 className="text-xl font-bold" aria-live="polite">
          {q && <span className="text-muted">“{q}” · </span>}
          {heading}
        </h1>
        {base.keyword && normalizeQuery(base.keyword) !== normalizeQuery(q) && (
          <p className="mt-0.5 text-sm text-muted">
            {tx("খোঁজা হয়েছে:", "Searched for:")} <span className="font-semibold text-ink-2">{base.keyword}</span>
          </p>
        )}
        {base.partNumber && <p className="mt-0.5 text-sm text-muted">{tx("পার্ট নম্বর মিলেছে", "Matched by part number")}</p>}
      </div>

      {/* my car vs all cars */}
      {!base.model &&
        (myGen ? (
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-line bg-card px-3 py-2">
            <Car className="size-5 shrink-0 text-muted" aria-hidden />
            <span className="min-w-0 flex-1 text-sm">
              {showAll ? tx("সব গাড়ির পার্ট দেখানো হচ্ছে", "Showing parts for all cars") : tx("শুধু আপনার গাড়ির পার্ট", "Only parts for your car")}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={showAll}
              onClick={() => setShowAll((v) => !v)}
              className="flex min-h-10 shrink-0 items-center gap-2 text-sm font-semibold"
            >
              {t("all_cars")}
              <span className={clsx("relative h-6 w-10 rounded-full transition-colors", showAll ? "bg-ink" : "bg-line")}>
                <span className={clsx("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", showAll ? "left-[18px]" : "left-0.5")} />
              </span>
            </button>
          </div>
        ) : (
          <Link
            href="/garage/add"
            className="mb-3 flex min-h-12 items-center gap-3 rounded-xl border border-dashed border-ink/25 bg-card px-3 py-2 text-sm hover:border-ink/50"
          >
            <Car className="size-5 shrink-0 text-muted" aria-hidden />
            <span className="flex-1">{tx("গাড়ি যোগ করুন, শুধু ফিট হওয়া পার্ট দেখাবো", "Add your car to see only parts that fit")}</span>
            <span className="font-semibold">{t("add_your_car")} →</span>
          </Link>
        ))}

      {/* toolbar */}
      {base.parts.length > 0 && (
        <div className="mb-4 flex gap-2">
          <Button variant="outline" onClick={() => setSheetOpen(true)} className="shrink-0">
            <SlidersHorizontal className="size-4.5" aria-hidden />
            {t("filter")}
            {nFilters > 0 && <span className="grid min-w-6 place-items-center rounded-full bg-ink px-1.5 text-xs leading-6 text-white">{d(nFilters)}</span>}
          </Button>
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{t("sort")}</span>
            <ArrowDownUp className="pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-muted" aria-hidden />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="min-h-12 w-full appearance-none truncate rounded-xl border-2 border-ink/15 bg-card pr-3 pl-9 text-base font-semibold outline-none focus:border-ink"
            >
              {sortOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* hints for empty states */}
      {n === 0 && base.parts.length > 0 && (
        <div className="mb-4 rounded-xl border border-line bg-card p-4">
          <p className="font-semibold">{tx("এই ফিল্টারে কিছু মিলছে না", "Nothing matches these filters")}</p>
          <Button variant="outline" className="mt-3" onClick={() => setFilters(emptyFilters)}>
            {tx("ফিল্টার মুছে দিন", "Clear filters")}
          </Button>
        </div>
      )}
      {base.parts.length === 0 && genId && allCarsCount > 0 && (
        <div className="mb-4 rounded-xl border border-line bg-card p-4">
          <p className="font-semibold">
            {tx(
              `আপনার গাড়ির জন্য মিলছে না, তবে অন্য গাড়ির জন্য ${d(allCarsCount)}টি আছে।`,
              `None listed for your car, but ${allCarsCount} for other cars.`,
            )}
          </p>
          <p className="mt-1 text-sm text-muted">{tx("কেনার আগে আমাদের জিজ্ঞেস করে নিন।", "Ask us before buying one of those.")}</p>
          <Button variant="outline" className="mt-3" onClick={() => setShowAll(true)}>
            {t("all_cars")}
          </Button>
        </div>
      )}

      {n > 0 && <PartGrid parts={results} />}

      <NotFoundCard q={kind === "search" ? q : notFoundQuery} compact={n > 0} className={n > 0 ? "mt-8" : "mt-2"} />

      {sheetOpen && <FilterSheet value={filters} onApply={setFilters} onClose={closeSheet} countFor={countFor} />}
    </div>
  );
}

