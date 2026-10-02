"use client";

import clsx from "clsx";
import { CheckCircle2 } from "lucide-react";
import { getBrand } from "@/lib/db/queries";
import { settings } from "@/lib/mock/settings";
import { conditionLabel, dispatchLabel, gradeLabel, sourceLabel, warrantyLabel } from "@/lib/labels";
import { ConditionBadge, ReturnBadge, SourceBadge, Stars, VerifiedBadge, WarrantyBadge } from "../../shared/Badges";
import { SpeakButton } from "../../layout/AudioGuide";
import { useT } from "../../providers/LangProvider";
import { MediaImage } from "../../ui/MediaImage";
import { Button } from "../../ui/primitives";
import { Sheet } from "../../ui/Sheet";
import { marketName, quoteSpeech, shopName, sourceRank, type QuoteView } from "./quoteUtils";

/** Tap on a quote: every photo, the seller's note, specs (file 01 §5.2). */
export function QuoteDetailSheet({ view, onClose, onTake, canTake }: { view: QuoteView | null; onClose: () => void; onTake: () => void; canTake: boolean }) {
  const { tx, taka, lang, L, dateTime } = useT();
  if (!view) return null;
  const { q, vendor } = view;
  const brand = getBrand(q.brand_id);
  return (
    <Sheet open onClose={onClose} title={q.title}>
      <div className="space-y-4 pb-2">
        <div className="no-scrollbar -mx-5 flex snap-x gap-2 overflow-x-auto px-5">
          {q.media.map((m, i) => (
            <MediaImage key={i} src={m} alt={`${q.title} ${i + 1}`} className="h-56 w-[85%] shrink-0 snap-center rounded-2xl" />
          ))}
        </div>
        <p className="text-3xl font-extrabold tabular-nums">{taka(q.price)}</p>
        <div className="flex flex-wrap gap-1.5">
          <SourceBadge source={q.source} />
          <ConditionBadge condition={q.condition} grade={q.grade} />
          <WarrantyBadge days={q.warranty_days} />
          <ReturnBadge returnable={q.is_returnable} days={settings.return_window_days} />
        </div>
        {q.note_bn && (
          <div className="rounded-xl bg-surface p-3">
            <p className="text-sm font-semibold text-muted">{tx("দোকানের কথা", "Seller's note")}</p>
            <p className="mt-1">“{q.note_bn}”</p>
          </div>
        )}
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          {brand && (
            <>
              <dt className="text-muted">{tx("ব্র্যান্ড", "Brand")}</dt>
              <dd className="font-semibold">{brand.name}</dd>
            </>
          )}
          {q.part_number && (
            <>
              <dt className="text-muted">{tx("পার্ট নম্বর", "Part number")}</dt>
              <dd className="font-semibold">{q.part_number}</dd>
            </>
          )}
          {q.grade && (
            <>
              <dt className="text-muted">{tx("গ্রেড", "Grade")}</dt>
              <dd className="font-semibold">
                {q.grade} · {L(gradeLabel[q.grade])}
              </dd>
            </>
          )}
          <dt className="text-muted">{tx("পাঠানো", "Dispatch")}</dt>
          <dd className="font-semibold">{dispatchLabel(q.dispatch_days, lang)}</dd>
          <dt className="text-muted">{tx("ডেলিভারি চার্জ", "Delivery charge")}</dt>
          <dd className="font-semibold">{taka(q.delivery_charge_estimate)}</dd>
          <dt className="text-muted">{tx("দাম বাঁধা থাকবে", "Price held until")}</dt>
          <dd className="font-semibold">{dateTime(q.valid_until)}</dd>
        </dl>
        {vendor && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line p-3 text-sm">
            <span className="font-bold">{shopName(vendor, lang)}</span>
            <VerifiedBadge vendor={vendor} />
            <Stars value={vendor.rating_avg} count={vendor.rating_count} />
            <span className="text-muted">{marketName(vendor, lang)}</span>
          </div>
        )}
        <p className="text-sm text-muted">{tx("দাম বাঁধা: নেওয়ার পর দোকান দাম বাড়াতে পারবে না।", "Price is locked: the shop can't raise it after you accept.")}</p>
        <div className="grid grid-cols-2 gap-2">
          <SpeakButton text={quoteSpeech(view, lang)} className="min-h-14 justify-center" />
          <Button variant="ok" size="lg" onClick={onTake} disabled={!canTake || view.blocked || q.status !== "submitted"}>
            <CheckCircle2 className="size-5" aria-hidden /> {tx("এটা নেবো", "Take it")}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

type Row = { key: string; bn: string; en: string; cell: (v: QuoteView) => string; score: (v: QuoteView) => number };

/** Side-by-side table; the best value in each row is green (file 01 §5.2). */
export function QuoteCompareSheet({ views, open, onClose, onTake }: { views: QuoteView[]; open: boolean; onClose: () => void; onTake: (v: QuoteView) => void }) {
  const { tx, taka, lang, L, d } = useT();
  const rows: Row[] = [
    { key: "price", bn: "মোট দাম (ডেলিভারিসহ)", en: "Total (incl. delivery)", cell: (v) => taka(v.total), score: (v) => -v.total },
    { key: "source", bn: "উৎস", en: "Source", cell: (v) => L(sourceLabel[v.q.source]), score: (v) => sourceRank(v.q.source) },
    { key: "condition", bn: "অবস্থা", en: "Condition", cell: (v) => L(conditionLabel[v.q.condition]), score: (v) => (v.q.condition === "new" ? 2 : v.q.condition === "used_import" ? 1 : 0) },
    { key: "grade", bn: "গ্রেড", en: "Grade", cell: (v) => (v.q.grade ? `${v.q.grade} · ${L(gradeLabel[v.q.grade])}` : "—"), score: (v) => (v.q.grade ? 4 - "ABCD".indexOf(v.q.grade) : 5) },
    { key: "warranty", bn: "ওয়ারেন্টি", en: "Warranty", cell: (v) => warrantyLabel(v.q.warranty_days, lang), score: (v) => v.q.warranty_days },
    { key: "returns", bn: "ফেরত", en: "Returns", cell: (v) => (v.q.is_returnable ? tx("✓ যাবে", "✓ Yes") : tx("✗ না", "✗ No")), score: (v) => Number(v.q.is_returnable) },
    { key: "dispatch", bn: "সময়", en: "Dispatch", cell: (v) => dispatchLabel(v.q.dispatch_days, lang), score: (v) => -v.q.dispatch_days },
    { key: "rating", bn: "দোকানের রেটিং", en: "Shop rating", cell: (v) => (v.vendor?.rating_avg ? `⭐ ${d(v.vendor.rating_avg.toFixed(1))}` : "—"), score: (v) => v.vendor?.rating_avg ?? 0 },
  ];
  return (
    <Sheet open={open} onClose={onClose} title={tx("পাশাপাশি তুলনা", "Side-by-side")}>
      <div className="-mx-5 overflow-x-auto px-5 pb-2">
        <table className="w-full min-w-[320px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 bg-card p-2 text-left text-xs text-muted" />
              {views.map((v) => (
                <th key={v.q.id} className="p-2 text-left align-bottom font-bold">
                  {shopName(v.vendor, lang)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const best = Math.max(...views.map(r.score));
              const allSame = views.every((v) => r.score(v) === best);
              return (
                <tr key={r.key}>
                  <th className="sticky left-0 border-t border-line bg-card p-2 text-left text-xs font-semibold text-muted">{lang === "bn" ? r.bn : r.en}</th>
                  {views.map((v) => (
                    <td key={v.q.id} className={clsx("border-t border-line p-2 font-semibold", !allSame && r.score(v) === best && "bg-ok-soft text-ok")}>
                      {r.cell(v)}
                    </td>
                  ))}
                </tr>
              );
            })}
            <tr>
              <td className="sticky left-0 bg-card" />
              {views.map((v) => (
                <td key={v.q.id} className="p-2 pt-3">
                  <Button variant="ok" size="sm" full onClick={() => onTake(v)} disabled={v.blocked || v.q.status !== "submitted"}>
                    {tx("এটা নেবো", "Take")}
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="pb-2 text-sm text-muted">🟩 {tx("সবুজ ঘর = ওই বিষয়ে সবচেয়ে ভালো", "Green cell = best on that row")}</p>
    </Sheet>
  );
}
