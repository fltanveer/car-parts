"use client";

import clsx from "clsx";
import { CheckCircle2, MessageCircle, Square, SquareCheck, Truck } from "lucide-react";
import { dispatchLabel } from "@/lib/labels";
import { ConditionBadge, ReturnBadge, SourceBadge, Stars, VerifiedBadge, WarrantyBadge } from "../../shared/Badges";
import { SpeakButton } from "../../layout/AudioGuide";
import { useT } from "../../providers/LangProvider";
import { MediaImage } from "../../ui/MediaImage";
import { Button } from "../../ui/primitives";
import { marketName, quoteSpeech, shopName, type QuoteView } from "./quoteUtils";
import { settings } from "@/lib/mock/settings";

/** One quote, laid out like the file 01 §5.2 mock-up. */
export function QuoteCard({
  view, recommended, selected, canTake, onOpen, onTake, onAsk, onToggleCompare,
}: {
  view: QuoteView;
  recommended?: boolean;
  selected?: boolean;
  canTake: boolean;
  onOpen: () => void;
  onTake: () => void;
  onAsk: () => void;
  onToggleCompare: () => void;
}) {
  const { tx, taka, lang, d } = useT();
  const { q, vendor, blocked, anomaly } = view;
  const taken = q.status === "accepted";

  return (
    <article
      className={clsx(
        "overflow-hidden rounded-2xl border-2 bg-card",
        taken ? "border-ok" : recommended ? "border-ok/60" : blocked ? "border-bad/30 opacity-80" : "border-line",
      )}
    >
      {recommended && !blocked && (
        <p className="flex items-center gap-1.5 bg-ok-soft px-4 py-1.5 text-sm font-bold text-ok">⭐ {tx("আমাদের পরামর্শ", "Our pick")}</p>
      )}
      {taken && <p className="bg-ok px-4 py-1.5 text-sm font-bold text-white">✅ {tx("আপনি এটা নিয়েছেন", "You took this one")}</p>}

      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen()}
        className="block w-full cursor-pointer text-left"
        aria-label={tx("বিস্তারিত দেখুন", "See details")}
      >
        <div className="relative">
          <MediaImage src={q.media[0]} alt={q.title} className="h-40 w-full" />
          {q.media.length > 1 && (
            <span className="absolute bottom-2 right-2 rounded-full bg-ink/75 px-2.5 py-0.5 text-xs font-semibold text-white">
              📷 {d(q.media.length)}
            </span>
          )}
          <span className="absolute left-2 top-2 rounded-full bg-card/90 px-2.5 py-0.5 text-xs font-semibold">{tx("দোকানের তোলা ছবি", "Seller's own photo")}</span>
        </div>
        <div className="space-y-2 p-4 pb-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-2xl font-extrabold tabular-nums">{taka(q.price)}</p>
            <div className="flex flex-wrap gap-1">
              <SourceBadge source={q.source} />
              <ConditionBadge condition={q.condition} grade={q.grade} />
            </div>
          </div>
          <p className="font-semibold">{q.title}</p>
          {vendor && (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="font-bold">{shopName(vendor, lang)}</span>
              <VerifiedBadge vendor={vendor} withLabel={false} />
              <Stars value={vendor.rating_avg} count={vendor.rating_count} />
              <span className="text-muted">· {marketName(vendor, lang)}</span>
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {q.warranty_days > 0 ? <WarrantyBadge days={q.warranty_days} /> : <span className="rounded-md bg-surface px-2 py-0.5 text-xs font-bold text-muted">🛡️ {tx("ওয়ারেন্টি নেই", "No warranty")}</span>}
            <ReturnBadge returnable={q.is_returnable} days={settings.return_window_days} />
          </div>
          <p className="flex items-center gap-1.5 text-sm text-ink-2">
            <Truck className="size-4" aria-hidden /> {dispatchLabel(q.dispatch_days, lang)} · {tx("ডেলিভারি", "Delivery")} {taka(q.delivery_charge_estimate)}
          </p>
        </div>
      </div>

      <div className="space-y-2 px-4 pb-4">
        {anomaly === "too_low" && (
          <p className="rounded-xl bg-wait-soft px-3 py-2 text-sm font-medium text-wait">
            ⚠️ {tx("এই দাম বাজারদরের চেয়ে অনেক কম, ছবি ভালো করে দেখুন বা প্রশ্ন করুন।", "This price is far below the market rate. Check the photos carefully or ask a question.")}
          </p>
        )}
        {anomaly === "too_high" && (
          <p className="rounded-xl bg-wait-soft px-3 py-2 text-sm font-medium text-wait">⚠️ {tx("এই দাম বাজারদরের চেয়ে অনেক বেশি।", "This price is well above the market rate.")}</p>
        )}
        {blocked && (
          <p className="rounded-xl bg-bad-soft px-3 py-2 text-sm font-medium text-bad">
            ⛔ {tx("এই দোকান এখন গাড়িহাবে স্থগিত। নিরাপত্তার জন্য এটা নেওয়া যাবে না।", "This shop is currently suspended on GaariHub. For your safety it can't be taken.")}
          </p>
        )}
        <div className="grid grid-cols-3 gap-2">
          <SpeakButton text={quoteSpeech(view, lang)} className="min-h-12 justify-center" />
          <Button variant="outline" onClick={onAsk} disabled={blocked} className="min-h-12 px-2">
            <MessageCircle className="size-4" aria-hidden /> {tx("প্রশ্ন", "Ask")}
          </Button>
          <Button variant="ok" onClick={onTake} disabled={!canTake || blocked || q.status !== "submitted"} className="min-h-12 px-2">
            <CheckCircle2 className="size-4" aria-hidden /> {tx("এটা নেবো", "Take it")}
          </Button>
        </div>
        {!blocked && (
          <button type="button" onClick={onToggleCompare} aria-pressed={selected} className="flex min-h-10 items-center gap-2 text-sm font-semibold text-ink-2">
            {selected ? <SquareCheck className="size-5 text-brand" aria-hidden /> : <Square className="size-5" aria-hidden />}
            {tx("তুলনার জন্য বাছুন", "Select to compare")}
          </button>
        )}
      </div>
    </article>
  );
}
