"use client";

import { Car, Plus, Save, X } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { VehiclePicker } from "@/components/shared/VehiclePicker";
import { Sheet } from "@/components/ui/Sheet";
import { Button, Field, Input, Select, Textarea, Toggle } from "@/components/ui/primitives";
import { describeVehicle, getMake, getModel } from "@/lib/db/queries";
import { sourceLabel } from "@/lib/labels";
import type { CatalogProduct, Fitment, Source } from "@/lib/types";
import { AttrInput } from "./AttrInput";
import { SOURCES } from "./constants";
import { newProductId, pathLabel, saveProduct, useAttributes, useBrands, useCategories } from "./overlay";

export const fitmentText = (f: Fitment, lang: "bn" | "en") => {
  if (f.generation_id) return describeVehicle(f.generation_id, f.engine_id, lang)?.full ?? f.generation_id;
  const parts = [getMake(f.make_id)?.name, getModel(f.model_id)?.name].filter(Boolean);
  return parts.length ? `${parts.join(" ")} (${lang === "bn" ? "সব সাল" : "all years"})` : "—";
};

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Create / edit a master product (file 03 §9.3). Render only while open; key per product. */
export function ProductForm({ initial, prefill, onClose, onSaved }: { initial: CatalogProduct | null; prefill?: Partial<CatalogProduct>; onClose: () => void; onSaved?: (p: CatalogProduct) => void }) {
  const { tx, lang, L } = useT();
  const cats = useCategories();
  const attrs = useAttributes();
  const brands = useBrands();
  const [p, setP] = useState<CatalogProduct>(
    () =>
      initial ?? {
        id: "", category_id: "", name: "", name_bn: "", slug: "", brand_id: null, source: "genuine", part_number: null, cross_ref_numbers: [], attributes: {},
        description_bn: "", image: "part", is_universal: false, fitments: [], status: "active", ...prefill,
      },
  );
  const [xref, setXref] = useState("");
  const [picking, setPicking] = useState(false);
  const up = (x: Partial<CatalogProduct>) => setP((s) => ({ ...s, ...x }));

  const cat = cats.find((c) => c.id === p.category_id);
  const fields = cat ? attrs.filter((a) => a.template === cat.attribute_template) : [];
  const leafs = cats.filter((c) => c.level === 3);
  const valid = !!cat && p.name.trim() && p.name_bn.trim() && (p.is_universal || p.fitments.length > 0);

  const addXref = () => {
    const v = xref.trim().toUpperCase();
    if (v && !p.cross_ref_numbers.includes(v)) up({ cross_ref_numbers: [...p.cross_ref_numbers, v] });
    setXref("");
  };

  const save = () => {
    const id = p.id || newProductId();
    const out: CatalogProduct = { ...p, id, name: p.name.trim(), name_bn: p.name_bn.trim(), slug: p.slug || `${slugify(p.name)}-${id.slice(-4)}`, image: cat?.icon ?? p.image, fitments: p.is_universal ? [] : p.fitments };
    saveProduct(out);
    toast(tx("মাস্টার পণ্য সংরক্ষণ হয়েছে", "Master product saved"));
    onSaved?.(out);
    onClose();
  };

  return (
    <Sheet open onClose={onClose} title={initial ? tx("মাস্টার পণ্য সম্পাদনা", "Edit master product") : tx("নতুন মাস্টার পণ্য", "New master product")}>
      <div className="space-y-4 pb-2">
        <Field label={tx("ক্যাটাগরি", "Category")}>
          <Select value={p.category_id} onChange={(e) => up({ category_id: e.target.value, attributes: {} })}>
            <option value="">{tx("— বাছুন —", "— choose —")}</option>
            {leafs.map((c) => (
              <option key={c.id} value={c.id}>
                {pathLabel(cats, c.id, lang)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={tx("বাংলা নাম", "Bangla name")}>
          <Input value={p.name_bn} onChange={(e) => up({ name_bn: e.target.value })} />
        </Field>
        <Field label={tx("ইংরেজি নাম", "English name")}>
          <Input value={p.name} onChange={(e) => up({ name: e.target.value })} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={tx("ব্র্যান্ড", "Brand")}>
            <Select value={p.brand_id ?? ""} onChange={(e) => up({ brand_id: e.target.value || null })}>
              <option value="">{tx("— নেই —", "— none —")}</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={tx("উৎস", "Source")}>
            <Select value={p.source} onChange={(e) => up({ source: e.target.value as Source })}>
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {L(sourceLabel[s])}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={tx("পার্ট নম্বর", "Part number")}>
            <Input value={p.part_number ?? ""} onChange={(e) => up({ part_number: e.target.value.trim() || null })} className="font-mono" />
          </Field>
          <Field label={tx("অবস্থা", "Status")}>
            <Select value={p.status} onChange={(e) => up({ status: e.target.value as CatalogProduct["status"] })}>
              <option value="active">{tx("চালু", "Active")}</option>
              <option value="pending_review">{tx("পর্যালোচনায়", "Pending review")}</option>
              <option value="inactive">{tx("বন্ধ", "Inactive")}</option>
            </Select>
          </Field>
        </div>

        <div>
          <p className="mb-1.5 font-semibold">{tx("ক্রস-রেফারেন্স নম্বর", "Cross-reference numbers")}</p>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {p.cross_ref_numbers.map((x) => (
              <span key={x} className="inline-flex min-h-8 items-center gap-1 rounded-full border border-line bg-surface pl-3 pr-1 font-mono text-sm">
                {x}
                <button type="button" aria-label={tx("মুছুন", "Remove")} onClick={() => up({ cross_ref_numbers: p.cross_ref_numbers.filter((y) => y !== x) })} className="grid size-6 place-items-center rounded-full hover:bg-bad-soft hover:text-bad">
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={xref} onChange={(e) => setXref(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addXref()} className="min-h-10 font-mono" placeholder="D2299" />
            <Button variant="outline" onClick={addXref} disabled={!xref.trim()}>
              <Plus className="size-4" /> {tx("যোগ", "Add")}
            </Button>
          </div>
        </div>

        {fields.length > 0 && (
          <div className="space-y-3 rounded-xl border border-line p-3">
            <p className="font-semibold">{tx("বিশেষ তথ্য", "Specs")}</p>
            {fields.map((f) => (
              <div key={f.id}>
                <p className="mb-1 text-sm font-semibold">
                  {lang === "bn" ? f.label_bn : f.label_en}
                  {f.required && <span className="ml-1 text-bad">*</span>}
                </p>
                <AttrInput def={f} value={p.attributes[f.key]} onChange={(v) => up({ attributes: { ...p.attributes, [f.key]: v } })} />
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl border border-line p-3">
          <p className="mb-1 font-semibold">{tx("কোন গাড়িতে লাগে (ফিটমেন্ট)", "Fitment")}</p>
          <Toggle checked={p.is_universal} onChange={(v) => up({ is_universal: v })} label={tx("সব গাড়িতে লাগে / স্পেক দিয়ে মিলবে", "Universal / matched by spec")} />
          {!p.is_universal && (
            <>
              <ul className="mb-2 space-y-1">
                {p.fitments.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-1.5 text-sm">
                    <Car className="size-4 shrink-0 text-muted" />
                    <span className="min-w-0 flex-1">{fitmentText(f, lang)}</span>
                    <button type="button" aria-label={tx("মুছুন", "Remove")} onClick={() => up({ fitments: p.fitments.filter((_, j) => j !== i) })} className="grid size-8 place-items-center rounded-full hover:bg-bad-soft hover:text-bad">
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
                {p.fitments.length === 0 && <li className="text-sm text-bad">{tx("কমপক্ষে একটা গাড়ি যোগ করুন", "Add at least one vehicle")}</li>}
              </ul>
              {picking ? (
                <div className="rounded-xl border-2 border-brand/40 p-3">
                  <VehiclePicker
                    onDone={(v) => {
                      if (v.make_id || v.model_id) up({ fitments: [...p.fitments, { make_id: v.make_id, model_id: v.model_id, generation_id: v.generation_id, engine_id: v.engine_id, notes: null }] });
                      setPicking(false);
                    }}
                  />
                  <Button size="sm" variant="ghost" className="mt-2" onClick={() => setPicking(false)}>
                    {tx("বাতিল", "Cancel")}
                  </Button>
                </div>
              ) : (
                <Button size="md" variant="outline" onClick={() => setPicking(true)}>
                  <Plus className="size-4" /> {tx("গাড়ি যোগ করুন", "Add vehicle")}
                </Button>
              )}
            </>
          )}
        </div>

        <Field label={tx("বিবরণ (বাংলা)", "Description (Bangla)")}>
          <Textarea value={p.description_bn} onChange={(e) => up({ description_bn: e.target.value })} />
        </Field>

        <Button size="lg" variant="brand" full disabled={!valid} onClick={save}>
          <Save className="size-5" /> {tx("সংরক্ষণ করুন", "Save")}
        </Button>
      </div>
    </Sheet>
  );
}
