"use client";

import clsx from "clsx";
import { BadgeCheck, Medal, RotateCcw, ShieldCheck, ShieldPlus, Star } from "lucide-react";
import { useState } from "react";
import { conditionLabel, gradeLabel, sourceLabel, warrantyLabel } from "@/lib/labels";
import type { Condition, Grade, Source, Vendor } from "@/lib/types";
import { speak } from "../layout/AudioGuide";
import { useT } from "../providers/LangProvider";
import { Sheet } from "../ui/Sheet";

const SRC: Record<Source, string> = {
  genuine: "bg-src-genuine-soft text-src-genuine",
  oem_brand: "bg-src-oem-soft text-src-oem",
  aftermarket: "bg-src-after-soft text-src-after",
  local_made: "bg-src-local-soft text-src-local",
  unknown: "bg-src-unknown-soft text-src-unknown",
};
const SRC_DOT: Record<Source, string> = {
  genuine: "bg-src-genuine",
  oem_brand: "bg-src-oem",
  aftermarket: "bg-src-after",
  local_made: "bg-src-local",
  unknown: "bg-src-unknown",
};

/** Every badge is tappable: short explanation + 🔊 (file 01 §11.6). */
function Explain({ className, children, title, body }: { className: string; children: React.ReactNode; title: string; body: string }) {
  const [open, setOpen] = useState(false);
  const { tx, lang } = useT();
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={clsx("inline-flex min-h-6 items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold", className)}
      >
        {children}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={title}>
        <p className="text-lg">{body}</p>
        <button type="button" onClick={() => speak(`${title}। ${body}`, lang)} className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-soft px-4 font-semibold text-brand-ink">
          🔊 {tx("শুনুন", "Listen")}
        </button>
      </Sheet>
    </>
  );
}

export function SourceBadge({ source }: { source: Source }) {
  const { L, lang } = useT();
  const l = sourceLabel[source];
  return (
    <Explain className={SRC[source]} title={L(l)} body={(lang === "bn" ? l.desc_bn : l.desc_en) ?? ""}>
      <span className={clsx("size-2 rounded-full", SRC_DOT[source])} aria-hidden />
      {L(l)}
    </Explain>
  );
}

export function ConditionBadge({ condition, grade }: { condition: Condition; grade: Grade | null }) {
  const { L, lang, tx } = useT();
  const c = conditionLabel[condition];
  const g = grade ? gradeLabel[grade] : null;
  const body = [lang === "bn" ? c.desc_bn : c.desc_en, g ? `${tx("গ্রেড", "Grade")} ${grade}: ${L(g)}। ${lang === "bn" ? g.desc_bn : g.desc_en}` : ""].filter(Boolean).join(" ");
  return (
    <Explain className={condition === "new" ? "bg-ok-soft text-ok" : "bg-surface text-ink-2 ring-1 ring-line"} title={L(c)} body={body}>
      {condition === "new" ? "🆕" : "♻️"} {L(c)}
      {grade && <span className="font-black">· {grade}</span>}
    </Explain>
  );
}

export function VerifiedBadge({ vendor, withLabel = true }: { vendor: Pick<Vendor, "verification_level" | "badges">; withLabel?: boolean }) {
  const { tx } = useT();
  if (vendor.verification_level >= 3)
    return (
      <Explain className="bg-ok-soft text-ok" title={tx("বিশ্বস্ত বিক্রেতা", "Trusted seller")} body={tx("জাতীয় পরিচয়পত্র, ট্রেড লাইসেন্স যাচাই হয়েছে, আমাদের টিম দোকান দেখে এসেছে।", "ID and trade licence checked, and our team visited the shop.")}>
        <Medal className="size-3.5" aria-hidden /> {withLabel && tx("বিশ্বস্ত", "Trusted")}
      </Explain>
    );
  if (vendor.verification_level >= 2)
    return (
      <Explain className="bg-ok-soft text-ok" title={tx("যাচাইকৃত দোকান", "Verified shop")} body={tx("জাতীয় পরিচয়পত্র ও ট্রেড লাইসেন্স যাচাই হয়েছে, টিম ফোনে কথা বলেছে।", "ID and trade licence checked, and our team called the shop.")}>
        <BadgeCheck className="size-3.5" aria-hidden /> {withLabel && tx("যাচাইকৃত", "Verified")}
      </Explain>
    );
  return null;
}

export function AssuredBadge() {
  const { tx } = useT();
  return (
    <Explain className="bg-brand-soft text-brand-ink" title="GaariHub Assured" body={tx("পাঠানোর আগে আমাদের হাবে পার্ট নম্বর, অবস্থা ও গ্রেড মিলিয়ে দেখা হয়।", "Checked at our hub (part number, condition, grade) before it's sent.")}>
      <ShieldPlus className="size-3.5" aria-hidden /> Assured
    </Explain>
  );
}

export function WarrantyBadge({ days }: { days: number }) {
  const { lang, tx } = useT();
  if (!days) return null;
  return (
    <Explain className="bg-surface text-ink-2 ring-1 ring-line" title={warrantyLabel(days, lang)} body={tx("দোকানের দেওয়া ওয়ারেন্টি। সমস্যা হলে গাড়িহাব মধ্যস্থতা করবে।", "Warranty from the shop. GaariHub mediates if there's a problem.")}>
      <ShieldCheck className="size-3.5" aria-hidden /> {warrantyLabel(days, lang)}
    </Explain>
  );
}

export function ReturnBadge({ returnable, days }: { returnable: boolean; days: number }) {
  const { tx, d } = useT();
  return (
    <Explain
      className={returnable ? "bg-surface text-ink-2 ring-1 ring-line" : "bg-bad-soft text-bad"}
      title={returnable ? tx("ফেরত দেওয়া যাবে", "Returnable") : tx("ফেরত হয় না", "Not returnable")}
      body={returnable ? tx(`${d(days)} দিনের মধ্যে, না লাগানো অবস্থায় ফেরত দেওয়া যাবে।`, `Return within ${days} days, unfitted.`) : tx("মন বদলালে ফেরত হয় না। ভুল বা ভাঙা জিনিস হলে অবশ্যই টাকা ফেরত পাবেন।", "No change-of-mind returns. Wrong or broken items are still refunded.")}
    >
      <RotateCcw className="size-3.5" aria-hidden /> {returnable ? tx("ফেরত যাবে", "Returnable") : tx("ফেরত নেই", "No returns")}
    </Explain>
  );
}

export function Stars({ value, count, size = "sm" }: { value: number; count?: number; size?: "sm" | "md" }) {
  const { d } = useT();
  return (
    <span className={clsx("inline-flex items-center gap-1 font-semibold", size === "md" ? "text-base" : "text-sm")}>
      <Star className={clsx("fill-wait-bg text-wait-bg", size === "md" ? "size-5" : "size-4")} aria-hidden />
      {value ? d(value.toFixed(1)) : "—"}
      {count != null && <span className="font-normal text-muted">({d(count)})</span>}
    </span>
  );
}

export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1" role="radiogroup">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" role="radio" aria-checked={value === i} onClick={() => onChange(i)} className="grid size-12 place-items-center rounded-xl hover:bg-wait-soft">
          <Star className={clsx("size-9", i <= value ? "fill-wait-bg text-wait-bg" : "text-line")} />
        </button>
      ))}
    </div>
  );
}
