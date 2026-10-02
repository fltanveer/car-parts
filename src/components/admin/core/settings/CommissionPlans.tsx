"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, Input } from "@/components/ui/primitives";
import { useAdminSettings } from "@/lib/db/actions-admin-core";
import { topCategories } from "@/lib/db/queries";
import { uid } from "@/lib/db/seed";
import { Panel } from "../Panel";
import { addCommissionPlan, commissionOverlay, removeCommissionPlan, setCategoryCommission, setPromoMonths, type CommissionPlan } from "./overlay";
import { SettingField } from "./SettingField";

/** All plans as one list (default + promo from settings, custom from overlay). */
export function usePlans(): CommissionPlan[] {
  const s = useAdminSettings();
  const custom = commissionOverlay.useStore((o) => o.customPlans);
  return [
    { id: "default", name_bn: "ডিফল্ট", name_en: "Default", percent: s.default_commission_percent, kind: "default" },
    { id: "promo", name_bn: "প্রচারমূলক (নতুন বিক্রেতা)", name_en: "Promo (new sellers)", percent: s.promo_commission_percent, kind: "promo" },
    ...custom,
  ];
}

export function CommissionPlans({ canEdit }: { canEdit: boolean }) {
  const { tx, d } = useT();
  const s = useAdminSettings();
  const promoMonths = commissionOverlay.useStore((o) => o.promo_months);
  const overrides = commissionOverlay.useStore((o) => o.categoryOverrides);
  const custom = commissionOverlay.useStore((o) => o.customPlans);
  const [name, setName] = useState("");
  const [pct, setPct] = useState("");

  const create = () => {
    const p = Number(pct);
    if (!name.trim() || pct === "" || Number.isNaN(p) || p < 0 || p > 30) return toast(tx("নাম ও ০–৩০% দিন", "Enter a name and 0–30%"), "bad");
    addCommissionPlan({ id: `pl-${uid()}`, name_bn: name.trim(), name_en: name.trim(), percent: p, kind: "custom" });
    setName("");
    setPct("");
    toast(tx("প্ল্যান তৈরি হয়েছে", "Plan created"));
  };

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={tx("ডিফল্ট প্ল্যান", "Default plan")}>
          <SettingField canEdit={canEdit} def={{ k: "default_commission_percent", bn: "সব বিক্রেতার ডিফল্ট কমিশন", en: "Default commission for all sellers", kind: "number", min: 0, max: 30, unit_bn: "%", unit_en: "%" }} />
        </Panel>
        <Panel title={tx("প্রচারমূলক প্ল্যান", "Promo plan")}>
          <SettingField canEdit={canEdit} def={{ k: "promo_commission_percent", bn: "নতুন বিক্রেতার কমিশন", en: "New seller commission", kind: "number", min: 0, max: 30, unit_bn: "%", unit_en: "%" }} />
          <PromoMonths key={promoMonths} current={promoMonths} canEdit={canEdit} />
          <p className="mt-2 text-sm text-muted">
            {tx(`যোগদানের প্রথম ${d(promoMonths)} মাস ${d(s.promo_commission_percent)}% কমিশন, তারপর ডিফল্ট।`, `${s.promo_commission_percent}% for the first ${promoMonths} months after joining, then default.`)}
          </p>
        </Panel>
      </div>

      <Panel title={tx("ক্যাটাগরি অনুযায়ী কমিশন (ওভাররাইড)", "Category overrides")}>
        <p className="mb-3 text-sm text-muted">{tx("খালি রাখলে ডিফল্ট কমিশন লাগবে।", "Leave empty to use the default commission.")}</p>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {topCategories().map((c) => (
            <CategoryRow key={`${c.id}:${overrides[c.id] ?? ""}`} id={c.id} name={tx(c.name_bn, c.name)} value={overrides[c.id] ?? null} dflt={s.default_commission_percent} canEdit={canEdit} />
          ))}
        </div>
      </Panel>

      <Panel title={tx("অন্য প্ল্যান", "Custom plans")}>
        {custom.length === 0 && <p className="text-sm text-muted">{tx("এখনো কোনো আলাদা প্ল্যান নেই।", "No custom plans yet.")}</p>}
        <ul className="divide-y divide-line">
          {custom.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 py-2">
              <span className="font-semibold">{p.name_bn}</span>
              <span className="flex items-center gap-2">
                <span className="font-bold tabular-nums">{d(p.percent)}%</span>
                {canEdit && (
                  <Button size="sm" variant="danger" aria-label={tx("মুছুন", "Delete")} onClick={() => { removeCommissionPlan(p.id); toast(tx("মুছে ফেলা হয়েছে", "Deleted"), "info"); }}>
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </span>
            </li>
          ))}
        </ul>
        {canEdit && (
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={tx("প্ল্যানের নাম (যেমন: বড় ডিলার)", "Plan name (e.g. Big dealer)")} className="max-w-xs" />
            <Input value={pct} onChange={(e) => setPct(e.target.value)} inputMode="decimal" placeholder="%" className="w-24" />
            <Button variant="brand" onClick={create}>
              <Plus className="size-4" aria-hidden /> {tx("প্ল্যান তৈরি", "Create plan")}
            </Button>
          </div>
        )}
      </Panel>
    </>
  );
}

function CategoryRow({ id, name, value, dflt, canEdit }: { id: string; name: string; value: number | null; dflt: number; canEdit: boolean }) {
  const { tx, d } = useT();
  const [draft, setDraft] = useState(value == null ? "" : String(value));
  const save = () => {
    if (draft.trim() === "") {
      setCategoryCommission(id, null);
      return toast(tx(`${name}: ডিফল্ট`, `${name}: default`), "info");
    }
    const n = Number(draft);
    if (Number.isNaN(n) || n < 0 || n > 30) return toast(tx("০–৩০% দিন", "Enter 0–30%"), "bad");
    setCategoryCommission(id, n);
    toast(tx(`${name}: ${n}%`, `${name}: ${n}%`));
  };
  const dirty = draft !== (value == null ? "" : String(value));
  return (
    <div className="flex items-center gap-2 rounded-xl border border-line p-2">
      <span className="min-w-0 flex-1 truncate text-sm font-semibold" title={name}>{name}</span>
      <input
        disabled={!canEdit}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && dirty && save()}
        placeholder={`${d(dflt)}`}
        inputMode="decimal"
        aria-label={`${name} %`}
        className="min-h-10 w-16 rounded-lg border-2 border-line bg-card px-2 text-right tabular-nums disabled:bg-surface"
      />
      <span className="text-sm">%</span>
      {canEdit && dirty && <Button size="sm" variant="ok" onClick={save}>{tx("সেভ", "Save")}</Button>}
    </div>
  );
}

function PromoMonths({ current, canEdit }: { current: number; canEdit: boolean }) {
  const { tx } = useT();
  const [months, setMonths] = useState(String(current));
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold">{tx("প্রথম কত মাস", "For the first months")}</span>
      <input disabled={!canEdit} value={months} onChange={(e) => setMonths(e.target.value)} inputMode="numeric" aria-label={tx("মাস", "Months")} className="min-h-11 w-20 rounded-xl border-2 border-line bg-card px-3 disabled:bg-surface" />
      {canEdit && (
        <Button size="sm" variant="ok" disabled={months === String(current) || !(Number(months) >= 0)} onClick={() => { setPromoMonths(Number(months)); toast(tx("সেভ হয়েছে", "Saved")); }}>
          {tx("সেভ", "Save")}
        </Button>
      )}
    </div>
  );
}
