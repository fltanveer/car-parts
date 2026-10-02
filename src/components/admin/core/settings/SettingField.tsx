"use client";

import clsx from "clsx";
import { RotateCcw, Save } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { Button, Toggle } from "@/components/ui/primitives";
import { toast } from "@/components/shared/Misc";
import { setAdminSetting, useAdminSettings, type AppSettings } from "@/lib/db/actions-admin-core";
import { settings as defaults } from "@/lib/mock/settings";
import { resetAdminSetting } from "./overlay";

export type FieldKind = "number" | "text" | "bool" | "weekday";

export interface FieldDef {
  k: keyof AppSettings;
  bn: string;
  en: string;
  kind: FieldKind;
  unit_bn?: string;
  unit_en?: string;
  min?: number;
  max?: number;
  hint_bn?: string;
  hint_en?: string;
}

const WEEKDAYS: [string, string][] = [["রবিবার", "Sunday"], ["সোমবার", "Monday"], ["মঙ্গলবার", "Tuesday"], ["বুধবার", "Wednesday"], ["বৃহস্পতিবার", "Thursday"], ["শুক্রবার", "Friday"], ["শনিবার", "Saturday"]];

/** One setting row: input + save, "changed" marker, reset to default. */
export function SettingField({ def, canEdit }: { def: FieldDef; canEdit: boolean }) {
  const all = useAdminSettings();
  const value = all[def.k] as unknown;
  const dflt = defaults[def.k] as unknown;
  const changed = JSON.stringify(value) !== JSON.stringify(dflt);
  // Remount the editor when the stored value changes so the draft resets.
  return <FieldInner key={String(value)} def={def} canEdit={canEdit} value={value} dflt={dflt} changed={changed} />;
}

function FieldInner({ def, canEdit, value, dflt, changed }: { def: FieldDef; canEdit: boolean; value: unknown; dflt: unknown; changed: boolean }) {
  const { tx, d } = useT();
  const [draft, setDraft] = useState(String(value));
  const dirty = draft !== String(value);
  const label = tx(def.bn, def.en);
  const unit = def.unit_bn ? tx(def.unit_bn, def.unit_en ?? def.unit_bn) : "";
  const shown = (v: unknown) => (def.kind === "weekday" ? tx(...WEEKDAYS[Number(v)]) : typeof v === "boolean" ? (v ? tx("চালু", "On") : tx("বন্ধ", "Off")) : d(String(v)));

  const n = Number(draft);
  const invalid = def.kind === "number" && (draft.trim() === "" || Number.isNaN(n) || (def.min != null && n < def.min) || (def.max != null && n > def.max));

  const save = () => {
    if (invalid) return;
    const v = def.kind === "number" || def.kind === "weekday" ? Number(draft) : draft.trim();
    setAdminSetting(def.k, v as never);
    toast(tx(`${def.bn} সেভ হয়েছে`, `${def.en} saved`));
  };
  const reset = () => {
    resetAdminSetting(def.k);
    toast(tx("ডিফল্টে ফেরানো হয়েছে", "Reset to default"), "info");
  };

  return (
    <div className={clsx("rounded-xl border p-3", changed ? "border-wait-bg/60 bg-wait-soft/40" : "border-line")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">
          {label}
          {changed && <span className="ml-2 rounded-full bg-wait-soft px-2 py-0.5 text-xs font-bold text-wait">● {tx("বদলানো", "Changed")}</span>}
        </p>
        <span className="text-xs text-muted">
          {tx("ডিফল্ট", "Default")}: {shown(dflt)} {unit}
        </span>
      </div>
      {def.hint_bn && <p className="mt-0.5 text-xs text-muted">{tx(def.hint_bn, def.hint_en ?? def.hint_bn)}</p>}

      {def.kind === "bool" ? (
        <Toggle
          checked={Boolean(value)}
          label={shown(value)}
          onChange={(v) => {
            if (!canEdit) return;
            setAdminSetting(def.k, v as never);
            toast(tx(`${def.bn}: ${v ? "চালু" : "বন্ধ"}`, `${def.en}: ${v ? "on" : "off"}`));
          }}
        />
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {def.kind === "weekday" ? (
            <select disabled={!canEdit} value={draft} onChange={(e) => setDraft(e.target.value)} aria-label={label} className="min-h-11 rounded-xl border-2 border-line bg-card px-3">
              {WEEKDAYS.map((w, i) => (
                <option key={i} value={i}>{tx(...w)}</option>
              ))}
            </select>
          ) : (
            <input
              disabled={!canEdit}
              value={draft}
              inputMode={def.kind === "number" ? "decimal" : "text"}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && dirty && save()}
              aria-label={label}
              aria-invalid={invalid}
              className={clsx("min-h-11 w-40 rounded-xl border-2 bg-card px-3 tabular-nums outline-none focus:border-brand disabled:bg-surface", invalid ? "border-bad" : "border-line", def.kind === "text" && "w-56")}
            />
          )}
          {unit && <span className="text-sm text-muted">{unit}</span>}
          {canEdit && (
            <>
              <Button size="sm" variant="ok" onClick={save} disabled={!dirty || invalid}>
                <Save className="size-4" aria-hidden /> {tx("সেভ", "Save")}
              </Button>
              {changed && (
                <Button size="sm" variant="ghost" onClick={reset}>
                  <RotateCcw className="size-4" aria-hidden /> {tx("ডিফল্ট", "Default")}
                </Button>
              )}
            </>
          )}
          {invalid && <span className="text-xs font-semibold text-bad">{tx("সঠিক সংখ্যা দিন", "Enter a valid number")}{def.min != null && ` (${d(def.min)}–${d(def.max ?? "∞")})`}</span>}
        </div>
      )}
      {def.kind === "bool" && canEdit && changed && (
        <Button size="sm" variant="ghost" onClick={reset}>
          <RotateCcw className="size-4" aria-hidden /> {tx("ডিফল্টে ফেরান", "Reset to default")}
        </Button>
      )}
    </div>
  );
}
