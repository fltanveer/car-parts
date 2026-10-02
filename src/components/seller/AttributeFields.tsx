"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { attributesFor } from "@/lib/db/queries";
import type { AttributeDefinition, Category } from "@/lib/types";
import { useT } from "../providers/LangProvider";
import { Chip, Input } from "../ui/primitives";
import { VoiceInput } from "./Dictate";

type Attrs = Record<string, string | string[] | number>;

function OneField({ a, value, onChange }: { a: AttributeDefinition; value: Attrs[string] | undefined; onChange: (v: Attrs[string] | undefined) => void }) {
  const { lang } = useT();
  const opt = (o: { bn: string; en: string }) => (lang === "bn" ? o.bn : o.en);
  if (a.input_type === "chips" && a.options) {
    return (
      <div className="flex flex-wrap gap-2">
        {a.options.map((o) => (
          <Chip key={o.value} active={value === o.value} onClick={() => onChange(value === o.value ? undefined : o.value)} className="min-h-12 text-base">
            {opt(o)}
          </Chip>
        ))}
      </div>
    );
  }
  if ((a.input_type === "multi_chips" || a.input_type === "checklist") && a.options) {
    const arr = Array.isArray(value) ? value : [];
    return (
      <div className="flex flex-wrap gap-2">
        {a.options.map((o) => {
          const on = arr.includes(o.value);
          return (
            <Chip key={o.value} active={on} onClick={() => onChange(on ? arr.filter((x) => x !== o.value) : [...arr, o.value])} className="min-h-12 text-base">
              {on ? "☑" : "☐"} {opt(o)}
            </Chip>
          );
        })}
      </div>
    );
  }
  if (a.input_type === "number") {
    return <Input type="number" inputMode="numeric" value={value == null ? "" : String(value)} onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))} placeholder={a.unit ?? ""} />;
  }
  if (a.input_type === "date") {
    return <Input type="date" value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value || undefined)} />;
  }
  return <VoiceInput value={typeof value === "string" ? value : ""} onChange={(v) => onChange(v || undefined)} />;
}

/** Category questions: required first, optional folded (file 02 §5.1, file 04 §6). */
export function AttributeFields({ category, value, onChange, locked }: { category: Category; value: Attrs; onChange: (v: Attrs) => void; locked?: boolean }) {
  const { tx, lang } = useT();
  const [more, setMore] = useState(false);
  const defs = attributesFor(category.attribute_template);
  const req = defs.filter((a) => a.required);
  const opt = defs.filter((a) => !a.required);
  const set = (k: string, v: Attrs[string] | undefined) => {
    const next = { ...value };
    if (v === undefined || (Array.isArray(v) && !v.length)) delete next[k];
    else next[k] = v;
    onChange(next);
  };
  if (!defs.length) return <p className="text-muted">{tx("এই জিনিসে বিশেষ প্রশ্ন নেই। পরের ধাপে যান।", "No special questions for this item.")}</p>;
  const field = (a: AttributeDefinition) => (
    <div key={a.key} className="space-y-2">
      <p className="font-semibold">
        {lang === "bn" ? a.label_bn : a.label_en}
        {a.required && <span className="text-bad"> *</span>}
      </p>
      {locked ? <p className="rounded-xl bg-surface px-3 py-2">{String(value[a.key] ?? "—")}</p> : <OneField a={a} value={value[a.key]} onChange={(v) => set(a.key, v)} />}
    </div>
  );
  return (
    <div className="space-y-4">
      {req.map(field)}
      {opt.length > 0 && (
        <div className="rounded-2xl border border-line">
          <button type="button" onClick={() => setMore(!more)} className="flex min-h-14 w-full items-center justify-between px-4 font-semibold">
            {tx("আরও তথ্য দিন (ঐচ্ছিক)", "More details (optional)")}
            <ChevronDown className={more ? "size-5 rotate-180" : "size-5"} />
          </button>
          {more && <div className="space-y-4 px-4 pb-4">{opt.map(field)}</div>}
        </div>
      )}
    </div>
  );
}

export const missingRequired = (category: Category, value: Attrs) => attributesFor(category.attribute_template).filter((a) => a.required && (value[a.key] == null || value[a.key] === ""));
