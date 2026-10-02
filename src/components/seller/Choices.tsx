"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { settings } from "@/lib/mock/settings";
import { conditionLabel, gradeLabel, sourceLabel, warrantyLabel } from "@/lib/labels";
import type { Condition, Grade, Source } from "@/lib/types";
import { useT } from "../providers/LangProvider";
import { Chip } from "../ui/primitives";

/** Big coloured option buttons in a grid (rule 3: tap, don't type). */
export function OptionGrid<T extends string | number>({
  value, onChange, options, cols = 2,
}: {
  value: T | null;
  onChange: (v: T) => void;
  options: { value: T; icon?: ReactNode; title: ReactNode; sub?: ReactNode; tone?: string }[];
  cols?: 2 | 3;
}) {
  return (
    <div className={clsx("grid gap-2", cols === 3 ? "grid-cols-3" : "grid-cols-2")}>
      {options.map((o) => {
        const sel = value === o.value;
        return (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={sel}
            onClick={() => onChange(o.value)}
            className={clsx(
              "flex min-h-16 flex-col items-start justify-center gap-0.5 rounded-2xl border-2 p-3 text-left transition-colors",
              sel ? "border-brand bg-brand-soft/50" : "border-line bg-card hover:border-ink/30",
            )}
          >
            <span className="flex items-center gap-2 font-bold">
              {o.icon && <span className={clsx("grid size-7 place-items-center rounded-lg text-base", o.tone)}>{o.icon}</span>}
              {o.title}
            </span>
            {o.sub && <span className="text-xs leading-snug text-muted">{o.sub}</span>}
          </button>
        );
      })}
    </div>
  );
}

const SRC_TONE: Record<Source, string> = {
  genuine: "bg-src-genuine-soft text-src-genuine",
  oem_brand: "bg-src-oem-soft text-src-oem",
  aftermarket: "bg-src-after-soft text-src-after",
  local_made: "bg-src-local-soft text-src-local",
  unknown: "bg-src-unknown-soft text-src-unknown",
};
const SRC_ICON: Record<Source, string> = { genuine: "🟢", oem_brand: "🔵", aftermarket: "🟠", local_made: "🟤", unknown: "⚪" };
const COND_ICON: Record<Condition, string> = { new: "🆕", used_import: "♻️", used_local: "🔁", refurbished: "🛠️", for_parts: "⚙️" };

export function SourcePicker({ value, onChange }: { value: Source | null; onChange: (s: Source) => void }) {
  const { L, lang } = useT();
  return (
    <OptionGrid
      value={value}
      onChange={onChange}
      options={(Object.keys(sourceLabel) as Source[]).map((s) => ({
        value: s, icon: SRC_ICON[s], tone: SRC_TONE[s], title: L(sourceLabel[s]), sub: lang === "bn" ? sourceLabel[s].desc_bn : sourceLabel[s].desc_en,
      }))}
    />
  );
}

export function ConditionPicker({ value, onChange, allowForParts = true }: { value: Condition | null; onChange: (c: Condition) => void; allowForParts?: boolean }) {
  const { L, lang } = useT();
  return (
    <OptionGrid
      value={value}
      onChange={onChange}
      options={(Object.keys(conditionLabel) as Condition[])
        .filter((c) => allowForParts || c !== "for_parts")
        .map((c) => ({ value: c, icon: COND_ICON[c], title: L(conditionLabel[c]), sub: lang === "bn" ? conditionLabel[c].desc_bn : conditionLabel[c].desc_en }))}
    />
  );
}

/** Grade A–D with example text (file 04 §3.3). */
export function GradePicker({ value, onChange }: { value: Grade | null; onChange: (g: Grade) => void }) {
  const { L, lang } = useT();
  const tones: Record<Grade, string> = { A: "bg-ok-soft text-ok", B: "bg-brand-soft text-brand-ink", C: "bg-wait-soft text-wait", D: "bg-bad-soft text-bad" };
  return (
    <OptionGrid
      value={value}
      onChange={onChange}
      options={(["A", "B", "C", "D"] as Grade[]).map((g) => ({ value: g, icon: g, tone: tones[g], title: L(gradeLabel[g]), sub: lang === "bn" ? gradeLabel[g].desc_bn : gradeLabel[g].desc_en }))}
    />
  );
}

export const isUsed = (c: Condition) => c === "used_import" || c === "used_local" || c === "refurbished";

/** Optional reason chips (single select, tap again to clear). */
export function ReasonChips({ reasons, value, onChange }: { reasons: string[]; value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {reasons.map((r) => (
        <Chip key={r} active={value === r} onClick={() => onChange(value === r ? null : r)} className="min-h-12 text-base">
          {r}
        </Chip>
      ))}
    </div>
  );
}

export function DispatchPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const { tx } = useT();
  return (
    <OptionGrid
      value={value}
      onChange={onChange}
      cols={2}
      options={[
        { value: 0, icon: "⚡", title: tx("আজই", "Today") },
        { value: 1, icon: "🌅", title: tx("কাল", "Tomorrow") },
        { value: 3, icon: "📅", title: tx("২-৩ দিন", "2–3 days") },
        { value: 5, icon: "⏳", title: tx("আরও বেশি (৫ দিন)", "Longer (5 days)") },
      ]}
    />
  );
}

export function WarrantyPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const { lang } = useT();
  return (
    <div className="flex flex-wrap gap-2">
      {[0, 7, 30, 90, 180, 365].map((dd) => (
        <Chip key={dd} active={value === dd} onClick={() => onChange(dd)} className="min-h-12 text-base">
          🛡️ {warrantyLabel(dd, lang)}
        </Chip>
      ))}
    </div>
  );
}

/** Returns yes/no + days; never below the platform minimum (file 00 §9). */
export function ReturnsPicker({ returnable, days, onChange }: { returnable: boolean; days: number; onChange: (r: boolean, days: number) => void }) {
  const { tx, d } = useT();
  const min = settings.return_window_days;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => onChange(true, Math.max(min, days))} className={clsx("min-h-14 rounded-2xl border-2 font-bold", returnable ? "border-ok bg-ok-soft text-ok" : "border-line bg-card")}>
          ↩️ {tx("ফেরত নেবো", "Returnable")}
        </button>
        <button type="button" onClick={() => onChange(false, days)} className={clsx("min-h-14 rounded-2xl border-2 font-bold", !returnable ? "border-bad bg-bad-soft text-bad" : "border-line bg-card")}>
          🚫 {tx("ফেরত নেই", "No returns")}
        </button>
      </div>
      {returnable && (
        <div className="flex flex-wrap gap-2">
          {[min, 7, 15].filter((x, i, a) => x >= min && a.indexOf(x) === i).map((x) => (
            <Chip key={x} active={days === x} onClick={() => onChange(true, x)} className="min-h-11">
              {d(x)} {tx("দিন", "days")}
            </Chip>
          ))}
        </div>
      )}
      <p className="text-xs text-muted">
        {tx(`ভুল জিনিস বা ভাঙা এলে কাস্টমার সবসময় ফেরত দিতে পারবে (প্ল্যাটফর্মের নিয়ম)। কমপক্ষে ${min} দিন।`, `Wrong or damaged items can always be returned (platform rule). Minimum ${min} days.`)}
      </p>
    </div>
  );
}
