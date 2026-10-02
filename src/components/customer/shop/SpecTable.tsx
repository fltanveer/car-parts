"use client";

import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { attributesFor } from "@/lib/db/queries";
import type { AttributeTemplate } from "@/lib/types";
import { useT } from "@/components/providers/LangProvider";

/** Attribute values shown with their Bangla labels. */
export function useSpecRows(template: AttributeTemplate, attrs: Record<string, string | string[] | number>) {
  const { lang, d } = useT();
  const defs = attributesFor(template);
  return Object.entries(attrs).map(([key, raw]) => {
    const def = defs.find((x) => x.key === key);
    const vals = Array.isArray(raw) ? raw : [raw];
    const shown = vals
      .map((v) => {
        const opt = def?.options?.find((o) => o.value === String(v));
        return opt ? (lang === "bn" ? opt.bn : opt.en) : typeof v === "number" ? d(v.toLocaleString("en-IN")) : String(v);
      })
      .join(", ");
    return { key, label: def ? (lang === "bn" ? def.label_bn : def.label_en) : key, value: `${shown}${def?.unit ? ` ${def.unit}` : ""}` };
  });
}

/** Simple two-column info table with icons. */
export function InfoTable({ rows }: { rows: { icon?: ReactNode; label: ReactNode; value: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
      {rows.map((r, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3">
          <span className="mt-0.5 shrink-0 text-muted" aria-hidden>
            {r.icon ?? <Info className="size-4" />}
          </span>
          <dt className="w-32 shrink-0 text-sm text-muted sm:w-40">{r.label}</dt>
          <dd className="min-w-0 flex-1 font-semibold">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
