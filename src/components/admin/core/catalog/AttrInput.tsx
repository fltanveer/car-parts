"use client";

import clsx from "clsx";
import { Check } from "lucide-react";
import { useT } from "@/components/providers/LangProvider";
import { Input } from "@/components/ui/primitives";
import type { AttributeDefinition } from "@/lib/types";

export type AttrValue = string | string[] | number;

const asList = (v: AttrValue | undefined) => (Array.isArray(v) ? v : v === undefined || v === "" ? [] : [String(v)]);

export const isFilled = (v: AttrValue | undefined) => (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== "");

/**
 * One attribute field the way the seller upload step "বিশেষ তথ্য" renders it:
 * chips are big tappable buttons, checklist is a tick list (file 04 §9.2).
 * Used by the live preview and by the master-product form.
 */
export function AttrInput({ def, value, onChange, big }: { def: AttributeDefinition; value: AttrValue | undefined; onChange: (v: AttrValue) => void; big?: boolean }) {
  const { lang, tx } = useT();
  const opts = def.options ?? [];
  const label = (o: { bn: string; en: string }) => (lang === "bn" ? o.bn : o.en);

  if (def.input_type === "chips" || def.input_type === "multi_chips") {
    const multi = def.input_type === "multi_chips";
    const cur = asList(value);
    return (
      <div className={clsx("flex flex-wrap", big ? "gap-2" : "gap-1.5")}>
        {opts.map((o) => {
          const on = cur.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(multi ? (on ? cur.filter((x) => x !== o.value) : [...cur, o.value]) : on ? "" : o.value)}
              className={clsx(
                "rounded-xl border-2 font-semibold transition-colors",
                big ? "min-h-14 min-w-20 px-4 text-base" : "min-h-9 px-3 text-sm",
                on ? "border-brand bg-brand text-white" : "border-line bg-card hover:border-ink/40",
              )}
            >
              {multi && on && <Check className="mr-1 inline size-4" aria-hidden />}
              {label(o)}
            </button>
          );
        })}
        {opts.length === 0 && <span className="text-sm text-muted">{tx("কোনো অপশন নেই", "No options yet")}</span>}
      </div>
    );
  }

  if (def.input_type === "checklist") {
    const cur = asList(value);
    return (
      <ul className="space-y-1.5">
        {opts.map((o) => {
          const on = cur.includes(o.value);
          return (
            <li key={o.value}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onChange(on ? cur.filter((x) => x !== o.value) : [...cur, o.value])}
                className={clsx("flex w-full items-center gap-3 rounded-xl border-2 px-3 text-left font-medium", big ? "min-h-12" : "min-h-9 text-sm", on ? "border-ok bg-ok-soft" : "border-line bg-card")}
              >
                <span className={clsx("grid size-6 shrink-0 place-items-center rounded-md border-2", on ? "border-ok bg-ok text-white" : "border-line")}>{on && <Check className="size-4" />}</span>
                {label(o)}
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  if (def.input_type === "number") {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          inputMode="numeric"
          value={value === undefined || value === "" ? "" : String(value)}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          className={clsx(big ? "text-lg" : "min-h-10 text-sm")}
        />
        {def.unit && <span className="shrink-0 font-semibold text-muted">{def.unit}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input type={def.input_type === "date" ? "date" : "text"} value={typeof value === "string" ? value : value === undefined ? "" : String(value)} onChange={(e) => onChange(e.target.value)} className={clsx(!big && "min-h-10 text-sm")} />
      {def.unit && <span className="shrink-0 font-semibold text-muted">{def.unit}</span>}
    </div>
  );
}
