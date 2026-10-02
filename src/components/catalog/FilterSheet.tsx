"use client";

import clsx from "clsx";
import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { qualityLabel } from "@/lib/i18n";
import type { Availability, Quality } from "@/lib/types";
import { qualityDot } from "../part/QualityBadge";
import { useT } from "../providers/LangProvider";
import { Button } from "../ui/primitives";
import { PRICE_PRESETS, emptyFilters, type ListFilters } from "./filters";

const QUALITIES: Quality[] = ["genuine", "oem_equivalent", "aftermarket", "reconditioned"];

// Spec 7.3 filter bottom sheet. Mount only while open so the draft resets.
export function FilterSheet({
  value,
  onApply,
  onClose,
  countFor,
}: {
  value: ListFilters;
  onApply: (f: ListFilters) => void;
  onClose: () => void;
  countFor: (f: ListFilters) => number;
}) {
  const { t, tx, lang, d, taka } = useT();
  const [draft, setDraft] = useState<ListFilters>(value);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const toggleQuality = (q: Quality) =>
    setDraft((f) => {
      const cur = f.qualities ?? [];
      return { ...f, qualities: cur.includes(q) ? cur.filter((x) => x !== q) : [...cur, q] };
    });

  const priceId = PRICE_PRESETS.find((p) => p.min === draft.minPrice && p.max === draft.maxPrice)?.id ?? null;
  const priceLabel = (p: (typeof PRICE_PRESETS)[number]) =>
    p.min == null ? tx(`${taka(p.max!)}-এর নিচে`, `Under ${taka(p.max!)}`)
    : p.max == null ? tx(`${taka(p.min)}-এর বেশি`, `Over ${taka(p.min)}`)
    : `${taka(p.min)} – ${taka(p.max)}`;

  const avail: { id: Availability | "any"; label: string }[] = [
    { id: "any", label: tx("সব", "All") },
    { id: "in_stock", label: t("in_stock") },
    { id: "sourcing", label: t("sourcing") },
  ];

  const count = countFor(draft);
  const optionBtn = (on: boolean) =>
    clsx(
      "flex min-h-12 items-center gap-2.5 rounded-xl border-2 px-3 text-left text-sm font-semibold transition-colors",
      on ? "border-ink bg-ink/[0.04]" : "border-line bg-card hover:border-ink/30",
    );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="filter-title">
      <button type="button" aria-label={t("close")} onClick={onClose} className="absolute inset-0 bg-ink/40" />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="sheet-up relative flex max-h-[88dvh] w-full max-w-3xl flex-col rounded-t-3xl bg-card outline-none"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 id="filter-title" className="text-lg font-bold">
            {t("filter")}
          </h2>
          <button type="button" onClick={onClose} aria-label={t("close")} className="grid size-11 place-items-center rounded-xl hover:bg-ink/5">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
          <fieldset>
            <legend className="mb-2 font-bold">{t("quality")}</legend>
            <div className="grid grid-cols-2 gap-2">
              {QUALITIES.map((q) => {
                const on = draft.qualities?.includes(q) ?? false;
                return (
                  <button key={q} type="button" aria-pressed={on} onClick={() => toggleQuality(q)} className={optionBtn(on)}>
                    <span className={clsx("size-3 shrink-0 rounded-full", qualityDot[q])} aria-hidden />
                    <span className="flex-1">{qualityLabel[q][lang]}</span>
                    {on && <Check className="size-4" aria-hidden />}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 font-bold">{t("price")}</legend>
            <div className="grid grid-cols-2 gap-2">
              {PRICE_PRESETS.map((p) => {
                const on = priceId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setDraft((f) => (on ? { ...f, minPrice: undefined, maxPrice: undefined } : { ...f, minPrice: p.min, maxPrice: p.max }))}
                    className={optionBtn(on)}
                  >
                    <span className="flex-1">{priceLabel(p)}</span>
                    {on && <Check className="size-4" aria-hidden />}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 font-bold">{t("status")}</legend>
            <div className="grid grid-cols-3 gap-2">
              {avail.map((a) => {
                const on = (draft.availability ?? "any") === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setDraft((f) => ({ ...f, availability: a.id }))}
                    className={clsx(optionBtn(on), "justify-center text-center")}
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <button
            type="button"
            role="switch"
            aria-checked={!!draft.warrantyOnly}
            onClick={() => setDraft((f) => ({ ...f, warrantyOnly: !f.warrantyOnly }))}
            className="flex min-h-14 w-full items-center gap-3 rounded-xl border-2 border-line px-3 text-left font-semibold"
          >
            <span className="flex-1">
              {tx("শুধু ওয়ারেন্টি আছে এমন", "Only with warranty")}
              <span className="block text-sm font-normal text-muted">{tx("জেনুইন পার্টে ওয়ারেন্টি থাকে", "Genuine parts may carry warranty")}</span>
            </span>
            <span className={clsx("relative h-7 w-12 shrink-0 rounded-full transition-colors", draft.warrantyOnly ? "bg-ok" : "bg-line")}>
              <span className={clsx("absolute top-1 size-5 rounded-full bg-white shadow transition-all", draft.warrantyOnly ? "left-6" : "left-1")} />
            </span>
          </button>
        </div>

        <div className="flex gap-2 border-t border-line px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button variant="outline" size="lg" onClick={() => setDraft(emptyFilters)}>
            {t("reset")}
          </Button>
          <Button
            size="lg"
            full
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            {tx(`${d(count)}টি দেখুন`, `Show ${count}`)}
          </Button>
        </div>
      </div>
    </div>
  );
}
