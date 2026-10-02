"use client";

import clsx from "clsx";
import { Camera, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, Input } from "@/components/ui/primitives";
import { audit } from "@/lib/db/actions";
import { uid } from "@/lib/db/seed";
import { Panel } from "../Panel";
import { checklistOverlay, saveChecklist } from "../settings/overlay";
import type { ChecklistSection } from "../settings/checklistDefaults";
import { SampleTag } from "./SampleTag";

const RATINGS = [
  { k: "g", bn: "ঠিক আছে", en: "Good", cls: "bg-ok text-white" },
  { k: "y", bn: "নজর দরকার", en: "Attention", cls: "bg-wait-bg text-ink" },
  { k: "r", bn: "সমস্যা", en: "Problem", cls: "bg-bad text-white" },
];

/** Inspection checklist TEMPLATE editor (file 03 §18), stored in an overlay. */
export function ChecklistEditor({ canEdit }: { canEdit: boolean }) {
  const { tx, d } = useT();
  const sections = checklistOverlay.useStore((o) => o.sections);
  const [secId, setSecId] = useState<string | null>(null);
  const sec = sections.find((s) => s.id === secId) ?? sections[0];
  const total = sections.reduce((a, s) => a + s.points.length, 0);

  const patch = (fn: (s: ChecklistSection) => ChecklistSection, what: string) => saveChecklist(sections.map((s) => (s.id === sec.id ? fn(s) : s)), `${sec.bn}: ${what}`);

  return (
    <Panel
      title={<>{tx("চেকলিস্ট টেমপ্লেট এডিটর", "Checklist template editor")}<SampleTag /></>}
      actions={
        <span className="flex items-center gap-2 text-sm text-muted">
          {tx(`${d(sections.length)} বিভাগ · ${d(total)} পয়েন্ট`, `${sections.length} sections · ${total} points`)}
          {canEdit && (
            <Button size="sm" variant="ghost" onClick={() => { checklistOverlay.reset(); audit("ইন্সপেকশন চেকলিস্ট টেমপ্লেট", "ডিফল্টে ফেরানো"); toast(tx("ডিফল্টে ফেরানো হয়েছে", "Reset"), "info"); }}>
              <RotateCcw className="size-4" aria-hidden /> {tx("ডিফল্ট", "Default")}
            </Button>
          )}
        </span>
      }
    >
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {sections.map((s) => (
          <button key={s.id} type="button" onClick={() => setSecId(s.id)} aria-pressed={sec.id === s.id} className={clsx("min-h-10 shrink-0 rounded-xl px-3 text-sm font-semibold", sec.id === s.id ? "bg-ink text-white" : "bg-surface hover:bg-line")}>
            {tx(s.bn, s.en)} <span className="opacity-70">({d(s.points.length)})</span>
          </button>
        ))}
      </div>
      <ul className="space-y-2">
        {sec.points.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-line p-2.5">
            <span className="min-w-40 flex-1 font-semibold">{p.bn}</span>
            <span className="flex gap-1" aria-label={tx("ইন্সপেক্টর যা বাছবেন", "Inspector options")}>
              {RATINGS.map((r) => (
                <span key={r.k} className={clsx("rounded-lg px-2 py-1 text-xs font-bold", r.cls)}>{tx(r.bn, r.en)}</span>
              ))}
            </span>
            <button
              type="button"
              disabled={!canEdit}
              aria-pressed={p.photo}
              onClick={() => patch((s) => ({ ...s, points: s.points.map((x) => (x.id === p.id ? { ...x, photo: !x.photo } : x)) }), `${p.bn} ছবি ${p.photo ? "ঐচ্ছিক" : "বাধ্যতামূলক"}`)}
              className={clsx("inline-flex min-h-9 items-center gap-1 rounded-lg border px-2 text-xs font-semibold disabled:opacity-60", p.photo ? "border-brand bg-brand-soft text-brand-ink" : "border-line")}
            >
              <Camera className="size-3.5" aria-hidden /> {p.photo ? tx("ছবি লাগবে", "Photo required") : tx("ছবি ঐচ্ছিক", "Photo optional")}
            </button>
            {canEdit && (
              <Button size="sm" variant="danger" aria-label={tx("মুছুন", "Delete")} onClick={() => { patch((s) => ({ ...s, points: s.points.filter((x) => x.id !== p.id) }), `${p.bn} মুছে ফেলা`); toast(tx("পয়েন্ট মুছে ফেলা হয়েছে", "Point removed"), "info"); }}>
                <Trash2 className="size-4" />
              </Button>
            )}
          </li>
        ))}
      </ul>
      {canEdit && <AddPoint onAdd={(bn, photo) => patch((s) => ({ ...s, points: [...s.points, { id: `${s.id}-${uid()}`, bn, photo }] }), `${bn} যোগ`)} />}
    </Panel>
  );
}

function AddPoint({ onAdd }: { onAdd: (bn: string, photo: boolean) => void }) {
  const { tx } = useT();
  const [bn, setBn] = useState("");
  const [photo, setPhoto] = useState(false);
  const add = () => {
    if (!bn.trim()) return toast(tx("পয়েন্টের নাম লিখুন", "Enter a point"), "bad");
    onAdd(bn.trim(), photo);
    setBn("");
    toast(tx("পয়েন্ট যোগ হয়েছে", "Point added"));
  };
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
      <Input value={bn} onChange={(e) => setBn(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder={tx("নতুন পয়েন্ট (যেমন: হর্ন কাজ করে)", "New point (e.g. horn works)")} className="max-w-sm" />
      <label className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={photo} onChange={(e) => setPhoto(e.target.checked)} className="size-5" />
        {tx("ছবি লাগবে", "Photo required")}
      </label>
      <Button variant="brand" onClick={add}><Plus className="size-4" aria-hidden /> {tx("যোগ", "Add")}</Button>
    </div>
  );
}
