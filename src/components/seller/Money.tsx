"use client";

import clsx from "clsx";
import { speak } from "../layout/AudioGuide";
import { commissionFor } from "@/lib/rules";
import { spokenTaka } from "@/lib/format";
import { benchmarkFor } from "@/lib/db/queries";
import type { Vendor } from "@/lib/types";
import { useT } from "../providers/LangProvider";
import { Volume2 } from "lucide-react";

/** "আপনি পাবেন ৳ X" after commission, with the commission shown separately (file 02 §1.3). */
export function YouGet({ vendor, price, qty = 1, className, size = "md" }: { vendor: Pick<Vendor, "commission_percent">; price: number; qty?: number; className?: string; size?: "sm" | "md" | "lg" }) {
  const { tx, taka, d, lang } = useT();
  const subtotal = price * qty;
  const { commission, payable } = commissionFor(vendor, subtotal);
  const text = lang === "bn" ? `আপনি পাবেন ${spokenTaka(payable, "bn")}। কমিশন ${spokenTaka(commission, "bn")}।` : `You get ${payable} taka. Commission ${commission} taka.`;
  return (
    <div className={clsx("flex items-center justify-between gap-3 rounded-2xl bg-ok-soft px-4 py-3 text-ok", className)}>
      <div className="min-w-0">
        <p className={clsx("font-bold", size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl")}>
          {tx("আপনি পাবেন", "You get")} {taka(payable)}
        </p>
        <p className="text-xs font-medium text-ok/80">
          {tx("কমিশন", "Commission")} ({d(vendor.commission_percent)}%) {taka(commission)}
          {vendor.commission_percent === 0 && ` · ${tx("এখন কমিশন নেই", "no commission now")}`}
        </p>
      </div>
      <button type="button" onClick={() => speak(text, lang)} aria-label={tx("শুনুন", "Listen")} className="grid size-11 shrink-0 place-items-center rounded-full bg-white/70 text-ok">
        <Volume2 className="size-5" />
      </button>
    </div>
  );
}

/** "Market price is usually ৳ a to b" hint from platform benchmarks. */
export function MarketHint({ categoryId, condition, price }: { categoryId: string | null; condition: string; price?: number }) {
  const { tx, taka } = useT();
  const b = categoryId ? benchmarkFor(categoryId, condition) : undefined;
  if (!b) return <p className="text-sm text-muted">📊 {tx("এই জিনিসের বাজারদর এখনো জানা নেই", "No market price data yet")}</p>;
  const low = price != null && price > 0 && price < b.p25 * 0.6;
  const high = price != null && price > b.p75 * 1.8;
  return (
    <div className={clsx("rounded-xl px-3 py-2 text-sm", low || high ? "bg-wait-soft text-wait" : "bg-surface text-ink-2")}>
      📊 {tx("বাজারদর সাধারণত", "Market price usually")} <b>{taka(b.p25)}</b> {tx("থেকে", "to")} <b>{taka(b.p75)}</b>
      {low && <p className="mt-1 font-semibold">⚠️ {tx("দাম অনেক কম। ভুল হলে ঠিক করুন, কাস্টমার সন্দেহ করতে পারে।", "Price looks very low. Check it, customers may get suspicious.")}</p>}
      {high && <p className="mt-1 font-semibold">⚠️ {tx("দাম বাজারের চেয়ে অনেক বেশি।", "Price is far above market.")}</p>}
    </div>
  );
}
