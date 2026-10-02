"use client";

import clsx from "clsx";
import { CircleCheck, Clock, ShieldCheck, Truck, Wallet } from "lucide-react";
import type { RequestQuote } from "@/lib/types";
import { QualityBadge } from "../part/QualityBadge";
import { useT } from "../providers/LangProvider";
import { Button } from "../ui/primitives";

const border: Record<RequestQuote["quality"], string> = {
  genuine: "border-q-genuine/40",
  oem_equivalent: "border-q-oem/40",
  aftermarket: "border-q-after/40",
  reconditioned: "border-q-recon/40",
};

// Spec 7.9 quote card: quality, brand, price, warranty, days, advance, validity.
export function QuoteCard({
  quote,
  now,
  onAccept,
  canAccept,
}: {
  quote: RequestQuote;
  now: number;
  onAccept?: () => void;
  canAccept: boolean;
}) {
  const { tx, lang, taka, d, range } = useT();
  const left = new Date(quote.valid_until).getTime() - now;
  const expired = quote.status === "expired" || left <= 0;
  const hours = Math.floor(left / 3_600_000);
  const mins = Math.floor((left % 3_600_000) / 60_000);
  const accepted = quote.status === "accepted";
  const rejected = quote.status === "rejected";

  return (
    <article
      className={clsx(
        "overflow-hidden rounded-2xl border-2 bg-card",
        accepted ? "border-ok" : border[quote.quality],
        (rejected || (expired && !accepted)) && "opacity-60",
      )}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <QualityBadge quality={quote.quality} lang={lang} size="lg" />
            <p className="font-semibold leading-snug">{quote.title}</p>
            <p className="text-sm text-muted">
              {tx("ব্র্যান্ড", "Brand")}: <b className="text-ink">{quote.brand}</b>
            </p>
          </div>
          <p className="shrink-0 text-right text-3xl font-bold">{taka(quote.price)}</p>
        </div>

        <ul className="mt-4 grid gap-2 text-sm">
          <li className="flex items-center gap-2">
            <ShieldCheck className={clsx("size-5 shrink-0", quote.warranty_months ? "text-q-genuine" : "text-muted")} aria-hidden />
            {tx("ওয়ারেন্টি", "Warranty")}:{" "}
            <b>{quote.warranty_months ? tx(`${d(quote.warranty_months)} মাস`, `${quote.warranty_months} months`) : tx("নেই", "None")}</b>
          </li>
          <li className="flex items-center gap-2">
            <Truck className="size-5 shrink-0 text-muted" aria-hidden />
            {tx("আনতে সময় লাগবে", "Sourcing time")}:{" "}
            <b>
              {range(quote.sourcing_days_min, quote.sourcing_days_max)} {tx("দিন", "days")}
            </b>
          </li>
          <li className="flex items-center gap-2 rounded-lg bg-accent-soft px-2 py-1.5 text-accent-ink">
            <Wallet className="size-5 shrink-0" aria-hidden />
            <span>
              {tx("অগ্রিম লাগবে", "Advance")}: <b>{taka(quote.advance_amount)}</b> ({d(quote.advance_percent)}%) ·{" "}
              {tx("বাকি", "Rest")} {taka(quote.price - quote.advance_amount)} {tx("পার্ট হাতে পেলে", "on delivery")}
            </span>
          </li>
          {!accepted && !rejected && (
            <li className={clsx("flex items-center gap-2", expired ? "font-semibold text-danger" : left < 6 * 3_600_000 ? "font-semibold text-accent-ink" : "text-muted")}>
              <Clock className="size-5 shrink-0" aria-hidden />
              {expired
                ? tx("এই দামের মেয়াদ শেষ", "This price has expired")
                : tx(`এই দাম আর ${d(hours)} ঘণ্টা ${d(mins)} মিনিট থাকবে`, `Price valid for ${hours}h ${mins}m more`)}
            </li>
          )}
        </ul>
      </div>

      {accepted ? (
        <p className="flex items-center gap-2 bg-ok px-4 py-3 font-semibold text-white">
          <CircleCheck className="size-5" aria-hidden /> {tx("আপনি এটা বেছে নিয়েছেন", "You chose this one")}
        </p>
      ) : (
        canAccept &&
        !expired &&
        onAccept && (
          <div className="border-t border-line p-3">
            <Button variant="accent" size="lg" full onClick={onAccept}>
              {tx("এটা নেবো", "I'll take this")}
            </Button>
          </div>
        )
      )}
    </article>
  );
}
