"use client";

import clsx from "clsx";
import { Check, ImageIcon } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, StatusPill } from "@/components/ui/primitives";
import { KV, Panel } from "../Panel";
import { carDocLabel, docStateLabel, docStateTone, sampleCarAds, type CarDoc } from "./phaseSamples";
import { SampleTag } from "./SampleTag";

const CHECKS: [string, string][] = [
  ["ছবি আসল (ইন্টারনেট/অন্য বিজ্ঞাপনের নয়)", "Photos are original (not from internet/other ads)"],
  ["কমপক্ষে ৬টা ছবি: সামনে, পেছনে, দুই পাশ, ভেতর, মিটার", "At least 6 photos: front, back, sides, interior, meter"],
  ["দাম বাজারদরের কাছাকাছি", "Price close to market"],
  ["সাল, মডেল ও চেসিস কোড মিলছে", "Year, model and chassis code consistent"],
  ["ডুপ্লিকেট বিজ্ঞাপন নয়", "Not a duplicate ad"],
  ["বর্ণনায় ফোন নম্বর/লিংক নেই", "No phone/links in description"],
];
const ROLES = ["front", "back", "left", "right", "interior", "dashboard"] as const;
const roleLabel: Record<(typeof ROLES)[number], [string, string]> = {
  front: ["সামনে", "Front"], back: ["পেছনে", "Back"], left: ["বাম", "Left"], right: ["ডান", "Right"], interior: ["ভেতর", "Interior"], dashboard: ["মিটার", "Meter"],
};

/** Phase-2 ad review layout; any id shows a sample ad. */
export function CarReview({ id }: { id: string }) {
  const { tx, d, num, taka } = useT();
  const ad = sampleCarAds.find((a) => a.id === id) ?? sampleCarAds[0];
  const [checked, setChecked] = useState<boolean[]>(() => CHECKS.map(() => false));
  const [docs, setDocs] = useState(ad.docs);
  const done = checked.filter(Boolean).length;
  const gap = Math.round(((ad.price - ad.market_mid) / ad.market_mid) * 100);
  const phaseToast = () => toast(tx("নমুনা: সিদ্ধান্ত ফেজ ২-এ চালু হবে", "Sample: decisions go live in phase 2"), "info");

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-5">
        <Panel title={<>{ad.title}<SampleTag /></>}>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {ROLES.map((r, i) => (
              <div key={r} className={clsx("grid aspect-square place-items-center rounded-xl border-2 border-dashed text-center text-xs", i < ad.photos ? "border-line bg-surface" : "border-bad/40 bg-bad-soft text-bad")}>
                <span>
                  <ImageIcon className="mx-auto size-6 opacity-60" aria-hidden />
                  {tx(...roleLabel[r])}
                </span>
              </div>
            ))}
          </div>
          <KV
            className="mt-4"
            rows={[
              [tx("দাম", "Price"), <span key="p" className="font-bold">{taka(ad.price)}</span>],
              [tx("বাজারদর (মধ্যমা)", "Market median"), <span key="m">{taka(ad.market_mid)} <StatusPill tone={gap < -25 ? "bad" : Math.abs(gap) > 15 ? "wait" : "ok"}>{d(gap > 0 ? `+${gap}` : gap)}%</StatusPill></span>],
              [tx("সাল / কিমি", "Year / km"), `${d(ad.year)} · ${num(ad.km)} km`],
              [tx("বিক্রেতা", "Seller"), `${ad.seller} (${ad.seller_type === "dealer" ? tx("ডিলার", "Dealer") : tx("ব্যক্তি", "Individual")})`],
              [tx("এলাকা", "Area"), ad.area],
            ]}
          />
          {ad.flags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {ad.flags.map((f) => <StatusPill key={f.en} tone={f.tone}>⚠️ {tx(f.bn, f.en)}</StatusPill>)}
            </div>
          )}
        </Panel>

        <Panel title={<>{tx("কাগজ যাচাই → ব্যাজ", "Papers → badges")}<SampleTag /></>}>
          <p className="mb-3 text-sm text-muted">{tx("কাগজের ছবি শুধু টিম দেখে; কাস্টমার শুধু ✅ ব্যাজ দেখে। প্রতিবার দেখা অডিট লগে যাবে।", "Only the team sees papers; buyers see ✅ badges only. Each view will be audited.")}</p>
          <ul className="divide-y divide-line">
            {(Object.keys(docs) as CarDoc[]).map((k) => (
              <li key={k} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="font-semibold">{tx(...carDocLabel[k])}</span>
                <span className="flex items-center gap-2">
                  <StatusPill tone={docStateTone[docs[k]]}>{tx(...docStateLabel[docs[k]])}</StatusPill>
                  {docs[k] === "pending" && (
                    <Button size="sm" variant="ok" onClick={() => { setDocs({ ...docs, [k]: "ok" }); toast(tx("নমুনা: ব্যাজ দেওয়া হলো", "Sample: badge granted"), "info"); }}>
                      {tx("ঠিক আছে", "Valid")}
                    </Button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title={tx(`যাচাই চেকলিস্ট (${d(done)}/${d(CHECKS.length)})`, `Review checklist (${done}/${CHECKS.length})`)}>
        <ul className="space-y-2">
          {CHECKS.map((c, i) => (
            <li key={i}>
              <button
                type="button"
                aria-pressed={checked[i]}
                onClick={() => setChecked(checked.map((v, j) => (j === i ? !v : v)))}
                className={clsx("flex min-h-12 w-full items-start gap-2 rounded-xl border-2 p-2.5 text-left text-sm", checked[i] ? "border-ok bg-ok-soft" : "border-line hover:border-ink/30")}
              >
                <span className={clsx("mt-0.5 grid size-5 shrink-0 place-items-center rounded border-2", checked[i] ? "border-ok bg-ok text-white" : "border-line")}>{checked[i] && <Check className="size-3.5" />}</span>
                {tx(...c)}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid gap-2">
          <Button variant="ok" size="lg" disabled={done < CHECKS.length} onClick={phaseToast}>{tx("অনুমোদন", "Approve")}</Button>
          <Button variant="outline" onClick={phaseToast}>{tx("সংশোধন চাই", "Request changes")}</Button>
          <Button variant="danger" onClick={phaseToast}>{tx("বাতিল", "Reject")}</Button>
        </div>
      </Panel>
    </div>
  );
}
