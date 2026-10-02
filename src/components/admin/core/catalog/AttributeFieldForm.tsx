"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { Button, Field, Input, Select, Toggle } from "@/components/ui/primitives";
import type { AttributeDefinition, AttributeInput, AttributeTemplate } from "@/lib/types";
import { INPUT_TYPES, hasOptions } from "./constants";
import type { AdminAttribute } from "./overlay";

type Opt = { value: string; bn: string; en: string };

/** Add/edit one attribute field, incl. the options editor (value / bn / en rows). */
export function AttributeFieldForm({
  template, field, existingKeys, onSave, onCancel,
}: {
  template: AttributeTemplate;
  field: AdminAttribute | null;
  existingKeys: string[];
  onSave: (def: AttributeDefinition) => void;
  onCancel: () => void;
}) {
  const { tx, L } = useT();
  const [key, setKey] = useState(field?.key ?? "");
  const [labelBn, setLabelBn] = useState(field?.label_bn ?? "");
  const [labelEn, setLabelEn] = useState(field?.label_en ?? "");
  const [type, setType] = useState<AttributeInput>(field?.input_type ?? "chips");
  const [unit, setUnit] = useState(field?.unit ?? "");
  const [required, setRequired] = useState(field?.required ?? false);
  const [opts, setOpts] = useState<Opt[]>(field?.options ?? [{ value: "", bn: "", en: "" }]);

  const keyOk = /^[a-z][a-z0-9_]*$/.test(key);
  const dup = key !== field?.key && existingKeys.includes(key);
  const cleanOpts = opts.map((o) => ({ value: o.value.trim(), bn: o.bn.trim(), en: o.en.trim() || o.bn.trim() })).filter((o) => o.value && o.bn);
  const optDup = new Set(cleanOpts.map((o) => o.value)).size !== cleanOpts.length;
  const needsOpts = hasOptions(type);
  const valid = keyOk && !dup && labelBn.trim() && labelEn.trim() && (!needsOpts || (cleanOpts.length >= 1 && !optDup));

  const setOpt = (i: number, p: Partial<Opt>) => setOpts((xs) => xs.map((o, j) => (j === i ? { ...o, ...p } : o)));

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={tx("কী (key)", "Key")} hint={tx("ছোট হাতের ইংরেজি, যেমন: sensor_wire", "lower-case, e.g. sensor_wire")} error={key && !keyOk ? tx("শুধু a-z, 0-9, _", "Only a-z, 0-9, _") : dup ? tx("এই key আগেই আছে", "Key already used") : undefined}>
          <Input value={key} onChange={(e) => setKey(e.target.value.trim())} className="font-mono" />
        </Field>
        <Field label={tx("ইনপুট ধরন", "Input type")}>
          <Select value={type} onChange={(e) => setType(e.target.value as AttributeInput)}>
            {INPUT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {L(t)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={tx("বাংলা লেবেল", "Bangla label")}>
          <Input value={labelBn} onChange={(e) => setLabelBn(e.target.value)} />
        </Field>
        <Field label={tx("ইংরেজি লেবেল", "English label")}>
          <Input value={labelEn} onChange={(e) => setLabelEn(e.target.value)} />
        </Field>
        <Field label={tx("একক (ঐচ্ছিক)", "Unit (optional)")} hint={tx("যেমন: km, A, mm", "e.g. km, A, mm")}>
          <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
        </Field>
        <div className="flex items-end">
          <Toggle checked={required} onChange={setRequired} label={tx("বাধ্যতামূলক", "Required")} />
        </div>
      </div>

      {needsOpts && (
        <div className="rounded-xl border border-line p-3">
          <p className="mb-2 font-semibold">{tx("অপশন", "Options")}</p>
          <div className="mb-1 grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs font-semibold text-muted">
            <span>value</span>
            <span>{tx("বাংলা", "Bangla")}</span>
            <span>{tx("ইংরেজি", "English")}</span>
            <span className="w-9" />
          </div>
          <ul className="space-y-1.5">
            {opts.map((o, i) => (
              <li key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                <input aria-label="value" value={o.value} onChange={(e) => setOpt(i, { value: e.target.value })} className="min-h-9 min-w-0 rounded-lg border border-line px-2 font-mono text-sm" />
                <input aria-label={tx("বাংলা", "Bangla")} value={o.bn} onChange={(e) => setOpt(i, { bn: e.target.value })} className="min-h-9 min-w-0 rounded-lg border border-line px-2 text-sm" />
                <input aria-label={tx("ইংরেজি", "English")} value={o.en} onChange={(e) => setOpt(i, { en: e.target.value })} className="min-h-9 min-w-0 rounded-lg border border-line px-2 text-sm" />
                <button type="button" aria-label={tx("অপশন মুছুন", "Remove option")} onClick={() => setOpts((xs) => xs.filter((_, j) => j !== i))} className="grid size-9 place-items-center rounded-lg text-bad hover:bg-bad-soft">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          <Button size="sm" variant="ghost" className="mt-2" onClick={() => setOpts((xs) => [...xs, { value: "", bn: "", en: "" }])}>
            <Plus className="size-4" /> {tx("অপশন যোগ", "Add option")}
          </Button>
          {optDup && <p className="mt-1 text-sm font-medium text-bad">{tx("একই value দুইবার আছে", "Duplicate option value")}</p>}
          {cleanOpts.length === 0 && <p className="mt-1 text-sm text-muted">{tx("কমপক্ষে একটা অপশন দিন (value + বাংলা)", "Add at least one option (value + Bangla)")}</p>}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          size="lg"
          variant="brand"
          disabled={!valid}
          onClick={() =>
            onSave({
              template, key, label_bn: labelBn.trim(), label_en: labelEn.trim(), input_type: type, required,
              ...(unit.trim() ? { unit: unit.trim() } : {}),
              ...(needsOpts ? { options: cleanOpts } : {}),
            })
          }
        >
          <Save className="size-5" /> {field ? tx("ফিল্ড সংরক্ষণ", "Save field") : tx("ফিল্ড যোগ করুন", "Add field")}
        </Button>
        <Button size="lg" variant="ghost" onClick={onCancel}>
          {tx("বাতিল", "Cancel")}
        </Button>
      </div>
    </div>
  );
}
