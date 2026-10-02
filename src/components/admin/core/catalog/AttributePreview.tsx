"use client";

import { ArrowLeft, ArrowRight, Volume2 } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import type { AttributeDefinition } from "@/lib/types";
import { type AttrValue, AttrInput, isFilled } from "./AttrInput";

/**
 * Live preview of seller upload step 6 "বিশেষ তথ্য" (file 04 §9.2) for one
 * template, inside a phone-sized frame. Interactive with local state only.
 * Remount with key={template} to clear answers.
 */
export function AttributePreview({ fields, templateLabel }: { fields: AttributeDefinition[]; templateLabel: string }) {
  const { tx, lang, d } = useT();
  const [vals, setVals] = useState<Record<string, AttrValue>>({});
  const missing = fields.filter((f) => f.required && !isFilled(vals[f.key]));
  const [tried, setTried] = useState(false);

  return (
    <div className="mx-auto w-full max-w-sm rounded-[2.5rem] border-[10px] border-ink bg-ink shadow-xl">
      <div className="overflow-hidden rounded-[1.8rem] bg-surface">
        <div className="flex items-center justify-between bg-card px-4 py-2 text-[11px] text-muted">
          <span>9:41</span>
          <span className="h-4 w-20 rounded-full bg-ink" aria-hidden />
          <span>4G ▮▮▮</span>
        </div>
        <div className="flex items-center gap-2 border-b border-line bg-card px-3 py-2">
          <span className="grid size-10 place-items-center rounded-full bg-surface" aria-hidden>
            <ArrowLeft className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted">{tx(`ধাপ ${d(6)} / ${d(8)}`, "Step 6 of 8")}</p>
            <p className="truncate font-bold">{tx("বিশেষ তথ্য", "Details")} · {templateLabel}</p>
          </div>
        </div>
        <div className="h-1.5 bg-line">
          <div className="h-full w-3/4 bg-brand" />
        </div>
        <div className="max-h-[32rem] space-y-4 overflow-y-auto p-4">
          <div className="flex items-start gap-2 rounded-xl bg-brand-soft/50 p-3 text-sm">
            <Volume2 className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
            <span>{tx("নিচের প্রশ্নগুলোর উত্তর বাটনে চেপে দিন। লাল তারা (*) মানে দিতেই হবে।", "Answer by tapping the buttons. A red star (*) means required.")}</span>
          </div>
          {fields.length === 0 && <p className="py-8 text-center text-muted">{tx("এই টেমপ্লেটে বাড়তি প্রশ্ন নেই, বিক্রেতা সরাসরি দামের ধাপে যাবে", "No extra questions: the seller goes straight to price")}</p>}
          {fields.map((f) => {
            const bad = tried && f.required && !isFilled(vals[f.key]);
            return (
              <div key={f.key}>
                <p className="mb-2 text-lg font-bold">
                  {lang === "bn" ? f.label_bn : f.label_en}
                  {f.required && <span className="ml-1 text-bad">*</span>}
                  {!f.required && <span className="ml-2 text-xs font-normal text-muted">({tx("ঐচ্ছিক", "optional")})</span>}
                </p>
                <AttrInput big def={f} value={vals[f.key]} onChange={(v) => setVals((s) => ({ ...s, [f.key]: v }))} />
                {bad && <p className="mt-1 text-sm font-medium text-bad">{tx("এটা দিতে হবে", "This is required")}</p>}
              </div>
            );
          })}
        </div>
        <div className="border-t border-line bg-card p-3">
          <button
            type="button"
            onClick={() => setTried(true)}
            className={`flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl text-lg font-bold text-white ${missing.length ? "bg-muted" : "bg-ok"}`}
          >
            {missing.length ? tx(`আরও ${d(missing.length)}টা উত্তর দিন`, `${missing.length} more to answer`) : tx("পরের ধাপ", "Next")} <ArrowRight className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
