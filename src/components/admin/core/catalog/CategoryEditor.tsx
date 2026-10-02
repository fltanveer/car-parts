"use client";

import { ArrowDown, ArrowUp, Plus, Save, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Panel } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Button, Field, Input, Select, Toggle } from "@/components/ui/primitives";
import { useAdminSettings } from "@/lib/db/actions-admin-core";
import type { AttributeTemplate, SizeClass } from "@/lib/types";
import { ICON_KEYS, SIZE_CLASSES, TEMPLATES } from "./constants";
import { type AdminCategory, addChildCategory, childrenOf, moveCategory, pathLabel, saveCategory, useAttributes } from "./overlay";

/** Edit panel for one category node. Mount with key={id} so the form resets per node. */
export function CategoryEditor({ c, list, onSelect }: { c: AdminCategory; list: AdminCategory[]; onSelect: (id: string) => void }) {
  const { tx, lang, d, L } = useT();
  const cfg = useAdminSettings();
  const attrs = useAttributes();
  const [f, setF] = useState(() => ({
    name_bn: c.name_bn,
    name: c.name,
    icon: c.icon,
    synonyms: c.synonyms,
    attribute_template: c.attribute_template,
    min_photos: c.min_photos,
    requires_video: c.requires_video,
    default_size_class: c.default_size_class,
    is_electrical: c.is_electrical,
    is_restricted: c.is_restricted,
    needs_position: c.needs_position,
    commission: c.commission_percent === null ? "" : String(c.commission_percent),
  }));
  const [syn, setSyn] = useState("");
  const up = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));

  const siblings = childrenOf(list, c.parent_id);
  const idx = siblings.findIndex((s) => s.id === c.id);
  const fieldCount = attrs.filter((a) => a.template === f.attribute_template).length;
  const commissionNum = f.commission.trim() === "" ? null : Number(f.commission);
  const commissionBad = commissionNum !== null && (Number.isNaN(commissionNum) || commissionNum < 0 || commissionNum > 50);
  const valid = f.name_bn.trim() && f.name.trim() && !commissionBad && f.min_photos >= 1;

  const addSyn = () => {
    const t = syn.trim();
    if (t && !f.synonyms.includes(t)) up({ synonyms: [...f.synonyms, t] });
    setSyn("");
  };

  const save = () => {
    const { commission: _c, ...patch } = f;
    void _c;
    saveCategory(c.id, { ...patch, name_bn: f.name_bn.trim(), name: f.name.trim() }, commissionNum);
    toast(tx("ক্যাটাগরি সংরক্ষণ হয়েছে", "Category saved"));
  };

  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          <CategoryIcon icon={f.icon} className="size-5" /> {lang === "bn" ? c.name_bn : c.name}
          <span className="text-xs font-normal text-muted">· {tx(`স্তর ${d(c.level)}`, `Level ${c.level}`)}</span>
        </span>
      }
      actions={
        <>
          <Button size="sm" variant="outline" disabled={idx <= 0} onClick={() => moveCategory(c.id, -1)} aria-label={tx("উপরে", "Move up")}>
            <ArrowUp className="size-4" /> {tx("উপরে", "Up")}
          </Button>
          <Button size="sm" variant="outline" disabled={idx < 0 || idx >= siblings.length - 1} onClick={() => moveCategory(c.id, 1)} aria-label={tx("নিচে", "Move down")}>
            <ArrowDown className="size-4" /> {tx("নিচে", "Down")}
          </Button>
          {c.level < 3 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const id = addChildCategory(c.id);
                if (id) {
                  toast(tx("নতুন উপ-ক্যাটাগরি যোগ হয়েছে, নাম দিন", "Child added, give it a name"));
                  onSelect(id);
                }
              }}
            >
              <Plus className="size-4" /> {tx("উপ-ক্যাটাগরি যোগ", "Add child")}
            </Button>
          )}
        </>
      }
    >
      <p className="mb-4 text-sm text-muted">{pathLabel(list, c.id, lang)} · <code className="text-xs">{c.slug}</code></p>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={tx("বাংলা নাম", "Bangla name")}>
          <Input value={f.name_bn} onChange={(e) => up({ name_bn: e.target.value })} />
        </Field>
        <Field label={tx("ইংরেজি নাম", "English name")}>
          <Input value={f.name} onChange={(e) => up({ name: e.target.value })} />
        </Field>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 font-semibold">{tx("আইকন", "Icon")}</p>
        <div className="flex flex-wrap gap-1.5">
          {ICON_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              title={k}
              aria-pressed={f.icon === k}
              onClick={() => up({ icon: k })}
              className={`grid size-10 place-items-center rounded-lg border-2 ${f.icon === k ? "border-brand bg-brand-soft/50" : "border-line hover:border-ink/30"}`}
            >
              <CategoryIcon icon={k} className="size-5" />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 font-semibold">{tx("ডাকনাম / synonym", "Nicknames / synonyms")}</p>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {f.synonyms.map((s) => (
            <span key={s} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-line bg-surface pl-3 pr-1 text-sm">
              {s}
              <button type="button" aria-label={tx("মুছুন", "Remove")} onClick={() => up({ synonyms: f.synonyms.filter((x) => x !== s) })} className="grid size-7 place-items-center rounded-full hover:bg-bad-soft hover:text-bad">
                <X className="size-3.5" />
              </button>
            </span>
          ))}
          {f.synonyms.length === 0 && <span className="text-sm text-muted">{tx("কোনো ডাকনাম নেই", "No synonyms yet")}</span>}
        </div>
        <div className="flex gap-2">
          <Input value={syn} onChange={(e) => setSyn(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSyn()} placeholder={tx("যেমন: শকার, লুকিং গ্লাস", "e.g. shocker, looking glass")} className="min-h-10" />
          <Button size="md" variant="outline" onClick={addSyn} disabled={!syn.trim()}>
            <Plus className="size-4" /> {tx("যোগ", "Add")}
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field
          label={tx("অ্যাট্রিবিউট টেমপ্লেট", "Attribute template")}
          hint={
            <Link href={`/admin/catalog/attributes?t=${f.attribute_template}`} className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
              <SlidersHorizontal className="size-3.5" /> {tx(`${d(fieldCount)}টা ফিল্ড · এডিটরে খুলুন`, `${fieldCount} fields · open editor`)}
            </Link>
          }
        >
          <Select value={f.attribute_template} onChange={(e) => up({ attribute_template: e.target.value as AttributeTemplate })}>
            {TEMPLATES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.value} · {L(t)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={tx("ডিফল্ট সাইজ শ্রেণি", "Default size class")} hint={tx("ডেলিভারি চার্জ হিসাবে লাগে", "Used for delivery charges")}>
          <Select value={f.default_size_class} onChange={(e) => up({ default_size_class: e.target.value as SizeClass })}>
            {SIZE_CLASSES.map((s) => (
              <option key={s.value} value={s.value}>
                {L(s)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={tx("ন্যূনতম ছবি", "Minimum photos")}>
          <Input type="number" min={1} max={10} value={f.min_photos} onChange={(e) => up({ min_photos: Math.max(1, Number(e.target.value) || 1) })} />
        </Field>
        <Field
          label={tx("কমিশন % (প্ল্যান ওভাররাইড)", "Commission % (plan override)")}
          hint={tx(`খালি রাখলে প্ল্যানের ডিফল্ট ${d(cfg.default_commission_percent)}%`, `Empty = plan default ${cfg.default_commission_percent}%`)}
          error={commissionBad ? tx("০ থেকে ৫০ এর মধ্যে দিন", "Enter 0 to 50") : undefined}
        >
          <Input inputMode="decimal" value={f.commission} placeholder={String(cfg.default_commission_percent)} onChange={(e) => up({ commission: e.target.value })} />
        </Field>
      </div>

      <div className="mt-4 grid gap-x-6 md:grid-cols-2">
        <Toggle checked={f.requires_video} onChange={(v) => up({ requires_video: v })} label={tx("ভিডিও লাগবে", "Video required")} />
        <Toggle checked={f.is_electrical} onChange={(v) => up({ is_electrical: v })} label={tx("ইলেকট্রিক্যাল (লাগানোর পর ফেরত নয়)", "Electrical (no return once fitted)")} />
        <Toggle checked={f.is_restricted} onChange={(v) => up({ is_restricted: v })} label={tx("সীমিত (অনুমোদন লাগবে)", "Restricted (needs review)")} />
        <Toggle checked={f.needs_position} onChange={(v) => up({ needs_position: v })} label={tx("অবস্থান (দিক) লাগবে", "Needs position")} />
      </div>

      <Button size="lg" variant="brand" full className="mt-5" disabled={!valid} onClick={save}>
        <Save className="size-5" /> {tx("সংরক্ষণ করুন", "Save")}
      </Button>
    </Panel>
  );
}
