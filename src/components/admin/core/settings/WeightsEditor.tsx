"use client";

import clsx from "clsx";
import { RotateCcw, Save } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, Notice } from "@/components/ui/primitives";
import { quoteWeights, vendorScoreWeights } from "@/lib/mock/settings";
import { Panel } from "../Panel";
import { saveWeights, weightsOverlay } from "./overlay";

const QUOTE_LABELS: Record<string, [string, string]> = {
  price: ["দাম", "Price"], vendor: ["বিক্রেতার স্কোর", "Seller score"], quality: ["উৎস/অবস্থা/গ্রেড", "Source/condition/grade"],
  speed: ["ডেলিভারির গতি", "Delivery speed"], warranty: ["ওয়ারেন্টি", "Warranty"], distance: ["দূরত্ব", "Distance"],
};
const VENDOR_LABELS: Record<string, [string, string]> = {
  rating: ["কাস্টমার রেটিং", "Customer rating"], not_as_described: ["\"যেমন বলা তেমন না\" দাবির হার", "Not-as-described rate"], on_time: ["সময়মতো পাঠানো", "On-time dispatch"],
  cancel: ["বাতিলের হার", "Cancellation rate"], response: ["রিকোয়েস্টে সাড়ার গতি", "Request response speed"], verification: ["যাচাইয়ের স্তর", "Verification level"],
};

export function WeightsEditor({ canEdit }: { canEdit: boolean }) {
  const { tx } = useT();
  const q = weightsOverlay.useStore((o) => o.quote);
  const v = weightsOverlay.useStore((o) => o.vendor);
  return (
    <>
      <Notice tone="info">{tx("প্রতিটা তালিকার মোট ঠিক ১০০ হতে হবে, নইলে সেভ হবে না।", "Each list must add up to exactly 100 before it can be saved.")}</Notice>
      <div className="grid gap-4 lg:grid-cols-2">
        <WeightForm key={JSON.stringify(q)} which="quote" title={tx("\"সেরা পছন্দ\" স্কোরের ওজন", "\"Best choice\" quote weights")} value={q} dflt={quoteWeights} labels={QUOTE_LABELS} canEdit={canEdit} />
        <WeightForm key={JSON.stringify(v)} which="vendor" title={tx("বিক্রেতা স্কোরের ওজন", "Seller score weights")} value={v} dflt={vendorScoreWeights} labels={VENDOR_LABELS} canEdit={canEdit} />
      </div>
    </>
  );
}

function WeightForm({ which, title, value, dflt, labels, canEdit }: { which: "quote" | "vendor"; title: string; value: Record<string, number>; dflt: Record<string, number>; labels: Record<string, [string, string]>; canEdit: boolean }) {
  const { tx, d } = useT();
  const [draft, setDraft] = useState<Record<string, string>>(() => Object.fromEntries(Object.entries(value).map(([k, n]) => [k, String(n)])));
  const nums = Object.fromEntries(Object.entries(draft).map(([k, s]) => [k, Number(s)]));
  const valid = Object.values(nums).every((n) => Number.isFinite(n) && n >= 0);
  const sum = Object.values(nums).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
  const ok = valid && sum === 100;
  const dirty = Object.keys(value).some((k) => nums[k] !== value[k]);
  const isDefault = Object.keys(dflt).every((k) => value[k] === dflt[k]);

  return (
    <Panel title={title}>
      <div className="space-y-2">
        {Object.keys(value).map((k) => {
          const n = nums[k];
          return (
            <div key={k} className="flex items-center gap-3">
              <span className="w-44 shrink-0 text-sm font-semibold">{tx(...(labels[k] ?? [k, k]))}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface" aria-hidden>
                <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, Math.max(0, Number.isFinite(n) ? n : 0))}%` }} />
              </div>
              <input
                disabled={!canEdit}
                value={draft[k]}
                inputMode="numeric"
                aria-label={tx(...(labels[k] ?? [k, k]))}
                onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                className="min-h-10 w-16 rounded-lg border-2 border-line bg-card px-2 text-right tabular-nums disabled:bg-surface"
              />
              <span className="text-sm">%</span>
              {value[k] !== dflt[k] && <span className="text-xs font-bold text-wait" title={tx("ডিফল্ট থেকে বদলানো", "Changed from default")}>●</span>}
            </div>
          );
        })}
      </div>
      <p className={clsx("mt-3 rounded-xl px-3 py-2 text-sm font-bold", ok ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad")}>
        {tx("মোট", "Total")}: {d(sum)} / {d(100)} {ok ? "✓" : tx(`(${d(Math.abs(100 - sum))} ${sum > 100 ? "বেশি" : "কম"})`, `(${Math.abs(100 - sum)} ${sum > 100 ? "over" : "short"})`)}
      </p>
      {canEdit && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="ok"
            disabled={!ok || !dirty}
            onClick={() => {
              saveWeights(which, nums);
              toast(tx("ওজন সেভ হয়েছে", "Weights saved"));
            }}
          >
            <Save className="size-4" aria-hidden /> {tx("সেভ", "Save")}
          </Button>
          {!isDefault && (
            <Button
              variant="ghost"
              onClick={() => {
                saveWeights(which, { ...dflt });
                toast(tx("ডিফল্টে ফেরানো হয়েছে", "Reset to default"), "info");
              }}
            >
              <RotateCcw className="size-4" aria-hidden /> {tx("ডিফল্ট", "Default")}
            </Button>
          )}
        </div>
      )}
    </Panel>
  );
}
