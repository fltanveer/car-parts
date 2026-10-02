"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { markets } from "@/lib/mock/settings";
import { conditionLabel, gradeLabel, sourceLabel } from "@/lib/labels";
import type { Condition, Grade, Source } from "@/lib/types";
import { useT } from "@/components/providers/LangProvider";
import { Button, Chip, Toggle } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/Sheet";
import { activeFilterCount, emptyFilters, PRICE_BANDS, type Filters, type PriceBand } from "./data";

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

/** All-chip filter bottom sheet (file 01 4.1). */
export function FilterSheet({ value, onChange, resultCount }: { value: Filters; onChange: (f: Filters) => void; resultCount?: number }) {
  const { tx, L, taka, d } = useT();
  const [open, setOpen] = useState(false);
  const count = activeFilterCount(value);
  const set = (p: Partial<Filters>) => onChange({ ...value, ...p });

  const bandLabel = (id: PriceBand) => {
    const b = PRICE_BANDS.find((x) => x.id === id)!;
    if (b.min === 0) return tx(`${taka(b.max)} এর নিচে`, `Under ${taka(b.max)}`);
    if (b.max === Infinity) return tx(`${taka(b.min)} এর বেশি`, `Over ${taka(b.min)}`);
    return `${taka(b.min)} – ${taka(b.max)}`;
  };

  const group = (title: string, children: React.ReactNode) => (
    <section className="mb-5">
      <h3 className="mb-2 font-bold">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );

  return (
    <>
      <Button variant="outline" size="md" onClick={() => setOpen(true)} className="shrink-0">
        <SlidersHorizontal className="size-5" aria-hidden />
        {tx("ফিল্টার", "Filter")}
        {count > 0 && <span className="grid min-w-6 place-items-center rounded-full bg-brand px-1.5 text-xs leading-6 text-white">{d(count)}</span>}
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title={tx("ফিল্টার", "Filters")}>
        {group(
          tx("উৎস", "Source"),
          (Object.keys(sourceLabel) as Source[]).map((s) => (
            <Chip key={s} active={value.sources.includes(s)} onClick={() => set({ sources: toggle(value.sources, s) })}>
              {L(sourceLabel[s])}
            </Chip>
          )),
        )}
        {group(
          tx("অবস্থা", "Condition"),
          (Object.keys(conditionLabel) as Condition[]).map((c) => (
            <Chip key={c} active={value.conditions.includes(c)} onClick={() => set({ conditions: toggle(value.conditions, c) })}>
              {c === "new" ? "🆕" : "♻️"} {L(conditionLabel[c])}
            </Chip>
          )),
        )}
        {group(
          tx("গ্রেড (পুরনো জিনিস)", "Grade (used items)"),
          (Object.keys(gradeLabel) as Grade[]).map((g) => (
            <Chip key={g} active={value.grades.includes(g)} onClick={() => set({ grades: toggle(value.grades, g) })}>
              <b>{g}</b> {L(gradeLabel[g])}
            </Chip>
          )),
        )}
        {group(
          tx("দাম", "Price"),
          PRICE_BANDS.map((b) => (
            <Chip key={b.id} active={value.price === b.id} onClick={() => set({ price: value.price === b.id ? null : b.id })}>
              {bandLabel(b.id)}
            </Chip>
          )),
        )}
        {group(
          tx("বাজার / এলাকা", "Market / area"),
          markets.map((m) => (
            <Chip key={m.id} active={value.markets.includes(m.id)} onClick={() => set({ markets: toggle(value.markets, m.id) })}>
              📍 {L(m)}
            </Chip>
          )),
        )}
        <section className="mb-5 divide-y divide-line rounded-2xl border border-line px-4">
          <Toggle checked={value.verifiedOnly} onChange={(v) => set({ verifiedOnly: v })} label={tx("✅ শুধু যাচাইকৃত দোকান", "✅ Verified shops only")} />
          <Toggle checked={value.assuredOnly} onChange={(v) => set({ assuredOnly: v })} label={tx("✔️ শুধু Assured", "✔️ Assured only")} />
          <Toggle checked={value.warranty} onChange={(v) => set({ warranty: v })} label={tx("🛡️ ওয়ারেন্টি আছে", "🛡️ Has warranty")} />
          <Toggle checked={value.shipsToday} onChange={(v) => set({ shipsToday: v })} label={tx("🚚 আজই পাঠাবে", "🚚 Ships today")} />
        </section>
        <div className="sticky bottom-0 -mx-5 flex gap-2 border-t border-line bg-card px-5 py-3">
          <Button variant="ghost" size="lg" onClick={() => onChange(emptyFilters)} disabled={!count}>
            {tx("সব মুছুন", "Clear")}
          </Button>
          <Button variant="brand" size="lg" full onClick={() => setOpen(false)}>
            {resultCount != null ? tx(`${d(resultCount)}টা ফলাফল দেখুন`, `Show ${resultCount} results`) : tx("দেখুন", "Show")}
          </Button>
        </div>
      </Sheet>
    </>
  );
}
