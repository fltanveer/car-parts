"use client";

import clsx from "clsx";
import { CheckCircle2, MapPin, Truck, TriangleAlert } from "lucide-react";
import { getMarket } from "@/lib/db/queries";
import { dispatchLabel } from "@/lib/labels";
import type { Vendor } from "@/lib/types";
import { useT } from "@/components/providers/LangProvider";

/** ✓ fits / ⚠️ doesn't match "my car" (null = no car set → nothing shown). */
export function FitLine({ fit, carLabel, className }: { fit: boolean | null; carLabel?: string | null; className?: string }) {
  const { tx } = useT();
  if (fit === null) return null;
  return fit ? (
    <span className={clsx("inline-flex items-center gap-1 text-sm font-semibold text-ok", className)}>
      <CheckCircle2 className="size-4" aria-hidden />
      {carLabel ? tx(`${carLabel}-এ লাগবে`, `Fits ${carLabel}`) : tx("আপনার গাড়িতে লাগবে", "Fits your car")}
    </span>
  ) : (
    <span className={clsx("inline-flex items-center gap-1 text-sm font-semibold text-wait", className)}>
      <TriangleAlert className="size-4" aria-hidden />
      {tx("আপনার গাড়ির সাথে মেলেনি", "Not listed for your car")}
    </span>
  );
}

export function DispatchLine({ days, className }: { days: number; className?: string }) {
  const { lang } = useT();
  return (
    <span className={clsx("inline-flex items-center gap-1 text-sm", days === 0 ? "font-semibold text-ok" : "text-ink-2", className)}>
      <Truck className="size-4" aria-hidden />
      {dispatchLabel(days, lang)}
    </span>
  );
}

export function MarketLine({ vendor, className }: { vendor: Pick<Vendor, "market_area">; className?: string }) {
  const { L } = useT();
  return (
    <span className={clsx("inline-flex items-center gap-1 text-sm text-muted", className)}>
      <MapPin className="size-3.5" aria-hidden />
      {L(getMarket(vendor.market_area))}
    </span>
  );
}

/** Horizontal chip row that scrolls inside the page gutter (no page-level horizontal scroll). */
export function ChipRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar", className)}>{children}</div>;
}
