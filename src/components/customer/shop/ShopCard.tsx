"use client";

import clsx from "clsx";
import { Clock, MessageCircle, Package } from "lucide-react";
import Link from "next/link";
import { getMake, getCategory, isVendorOpenNow } from "@/lib/db/queries";
import { vendorTypeLabel } from "@/lib/labels";
import type { Vendor } from "@/lib/types";
import { Stars, VerifiedBadge } from "@/components/shared/Badges";
import { ShopLogo, useNow } from "@/components/shared/Misc";
import { useT } from "@/components/providers/LangProvider";
import { MarketLine } from "./Bits";

export const responseText = (minutes: number, tx: (bn: string, en: string) => string, d: (n: number | string) => string) =>
  minutes < 60 ? tx(`সাধারণত ${d(minutes)} মিনিটে উত্তর দেয়`, `Usually replies in ${minutes} min`) : tx(`সাধারণত ${d(Math.round(minutes / 60))} ঘণ্টায় উত্তর দেয়`, `Usually replies in ${Math.round(minutes / 60)} h`);

/** Specialty chips: makes, categories and shop types. */
export const specialtiesOf = (v: Vendor, lang: "bn" | "en") => [
  ...v.specialty_makes.map((id) => getMake(id)).filter(Boolean).map((m) => (lang === "bn" ? m!.name_bn : m!.name)),
  ...v.specialty_categories.map((id) => getCategory(id)).filter(Boolean).map((c) => (lang === "bn" ? c!.name_bn : c!.name)),
  ...v.vendor_types.filter((t) => t === "halfcut" || t === "tyre_battery" || t === "lubricant" || t === "accessories").map((t) => `${vendorTypeLabel[t].icon} ${lang === "bn" ? vendorTypeLabel[t].bn : vendorTypeLabel[t].en}`),
];

export function OpenPill({ vendor }: { vendor: Vendor }) {
  const { tx } = useT();
  useNow();
  const open = isVendorOpenNow(vendor);
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold", open ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad")}>
      <Clock className="size-3" aria-hidden /> {open ? tx("এখন খোলা", "Open now") : tx("এখন বন্ধ", "Closed now")}
    </span>
  );
}

export function ShopCard({ vendor, productCount, compact }: { vendor: Vendor; productCount: number; compact?: boolean }) {
  const { tx, lang, d } = useT();
  const name = lang === "bn" ? vendor.shop_name_bn : vendor.shop_name;
  const specs = specialtiesOf(vendor, lang);
  return (
    <article className={clsx("relative rounded-2xl border border-line bg-card p-4 hover:border-ink/30", compact && "w-64 shrink-0")}>
      <div className="flex items-start gap-3">
        <ShopLogo name={name} color={vendor.logo_color} size="lg" />
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="text-lg font-bold leading-snug">
            <Link href={`/shop/${vendor.slug}`} className="after:absolute after:inset-0 after:rounded-2xl">
              {name}
            </Link>
          </h3>
          <div className="relative z-10 flex flex-wrap items-center gap-x-2 gap-y-1">
            <Stars value={vendor.rating_avg} count={vendor.rating_count} />
            <VerifiedBadge vendor={vendor} />
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <MarketLine vendor={vendor} />
            <OpenPill vendor={vendor} />
          </div>
        </div>
      </div>
      {!compact && specs.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {specs.slice(0, 5).map((t) => (
            <span key={t} className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-semibold text-ink-2">
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
        <span className="inline-flex items-center gap-1">
          <Package className="size-4" aria-hidden /> {tx(`${d(productCount)}টা পণ্য`, `${productCount} products`)}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageCircle className="size-4" aria-hidden /> {responseText(vendor.response_minutes, tx, d)}
        </span>
      </div>
    </article>
  );
}
