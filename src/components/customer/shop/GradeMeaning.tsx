"use client";

import clsx from "clsx";
import { conditionLabel, gradeLabel, sourceLabel } from "@/lib/labels";
import type { Condition, Grade, Source } from "@/lib/types";
import { SpeakButton } from "@/components/layout/AudioGuide";
import { useT } from "@/components/providers/LangProvider";

// Visual example per grade: how much wear to expect (stand-in for example photos).
const WEAR: Record<Grade, { emoji: string; bar: number }> = { A: { emoji: "✨", bar: 95 }, B: { emoji: "👍", bar: 75 }, C: { emoji: "🙂", bar: 50 }, D: { emoji: "🔧", bar: 25 } };

/** What source / condition / grade mean, with the grade scale (file 01 4.4). */
export function GradeMeaning({ source, condition, grade }: { source: Source; condition: Condition; grade: Grade | null }) {
  const { tx, L, lang } = useT();
  const s = sourceLabel[source];
  const c = conditionLabel[condition];
  const desc = (x: { desc_bn?: string; desc_en?: string }) => (lang === "bn" ? x.desc_bn : x.desc_en) ?? "";
  const speech = [`${L(s)}: ${desc(s)}`, `${L(c)}: ${desc(c)}`, grade ? `${tx("গ্রেড", "Grade")} ${grade}, ${L(gradeLabel[grade])}: ${desc(gradeLabel[grade])}` : ""].filter(Boolean).join("। ");
  return (
    <section className="space-y-3 rounded-2xl border border-line bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-bold">{tx("এর মানে কী?", "What does this mean?")}</h2>
        <SpeakButton text={speech} />
      </div>
      <dl className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl bg-surface p-3">
          <dt className="text-sm text-muted">{tx("উৎস", "Source")}</dt>
          <dd className="font-bold">{L(s)}</dd>
          <dd className="text-sm text-ink-2">{desc(s)}</dd>
        </div>
        <div className="rounded-xl bg-surface p-3">
          <dt className="text-sm text-muted">{tx("অবস্থা", "Condition")}</dt>
          <dd className="font-bold">{L(c)}</dd>
          <dd className="text-sm text-ink-2">{desc(c)}</dd>
        </div>
      </dl>
      {grade && (
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label={tx("গ্রেডের মান", "Grade scale")}>
          {(Object.keys(gradeLabel) as Grade[]).map((g) => (
            <li key={g} className={clsx("rounded-xl border-2 p-2.5", g === grade ? "border-brand bg-brand-soft/40" : "border-line opacity-70")} aria-current={g === grade ? "true" : undefined}>
              <p className="flex items-center justify-between font-black">
                <span>
                  {g} <span className="font-semibold">{L(gradeLabel[g])}</span>
                </span>
                <span aria-hidden>{WEAR[g].emoji}</span>
              </p>
              <div className="mt-1.5 h-1.5 rounded-full bg-line" aria-hidden>
                <div className="h-full rounded-full bg-ok" style={{ width: `${WEAR[g].bar}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-ink-2">{desc(gradeLabel[g])}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
