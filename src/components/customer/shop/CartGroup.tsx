"use client";

import { Package, Trash2, Truck } from "lucide-react";
import Link from "next/link";
import { setCartQty } from "@/lib/db/actions";
import { dispatchLabel } from "@/lib/labels";
import { Stars, VerifiedBadge } from "@/components/shared/Badges";
import { ShopLogo, toast } from "@/components/shared/Misc";
import { useT } from "@/components/providers/LangProvider";
import { MediaImage } from "@/components/ui/MediaImage";
import { Notice, Stepper } from "@/components/ui/primitives";
import { FitLine, MarketLine } from "./Bits";
import type { CartGroupData } from "./cart";

/** One shop = one parcel, with its own delivery charge (file 01 6.1). */
export function CartGroup({ group, index, delivery, editable = true }: { group: CartGroupData; index: number; delivery: number; editable?: boolean }) {
  const { tx, lang, taka, d } = useT();
  const v = group.vendor;
  const name = lang === "bn" ? v.shop_name_bn : v.shop_name;
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-card" aria-label={name}>
      <header className="flex items-center gap-3 border-b border-line bg-surface/60 px-4 py-3">
        <ShopLogo name={name} color={v.logo_color} size="sm" />
        <div className="min-w-0 flex-1">
          <Link href={`/shop/${v.slug}`} className="block truncate font-bold hover:underline">
            {name}
          </Link>
          <div className="flex flex-wrap items-center gap-x-2">
            <Stars value={v.rating_avg} />
            <VerifiedBadge vendor={v} withLabel={false} />
            <MarketLine vendor={v} />
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-white">
          <Package className="size-3.5" aria-hidden /> {tx(`প্যাকেট ${d(index + 1)}`, `Parcel ${index + 1}`)}
        </span>
      </header>
      <ul className="divide-y divide-line">
        {group.rows.map((r) => (
          <li key={r.index} className="flex gap-3 p-4">
            <MediaImage src={r.image} alt={r.title} className="size-20 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-1.5">
              {r.listing ? (
                <Link href={`/l/${r.listing.id}`} className="block font-semibold leading-snug hover:underline">
                  {lang === "bn" ? r.listing.title_bn : r.listing.title}
                </Link>
              ) : (
                <p className="font-semibold leading-snug">
                  {r.title} <span className="text-xs font-normal text-muted">({tx("দাম চাওয়া থেকে", "from your request")})</span>
                </p>
              )}
              <p className="text-lg font-bold">{taka(r.price * r.qty)}</p>
              {r.qty > 1 && <p className="text-sm text-muted">{taka(r.price)} × {d(r.qty)}</p>}
              {!r.available && <Notice tone="bad">{tx("এটি এখন পাওয়া যাচ্ছে না, অর্ডারে যাবে না", "Not available now — won't be ordered")}</Notice>}
              {r.fit === false && (
                <div className="rounded-xl bg-wait-soft px-3 py-2">
                  <FitLine fit={false} />
                  <p className="text-xs text-wait">{tx("না লাগলে ফেরতের খরচ আপনার। নিশ্চিত না হলে দোকানকে জিজ্ঞেস করুন।", "If it doesn't fit, return costs are yours. Ask the shop if unsure.")}</p>
                </div>
              )}
              {editable && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <Stepper value={r.qty} min={1} max={r.maxQty} onChange={(q) => setCartQty(r.index, q)} />
                  <button
                    type="button"
                    onClick={() => {
                      setCartQty(r.index, 0);
                      toast(tx("কার্ট থেকে সরানো হয়েছে", "Removed from cart"), "info");
                    }}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-bad hover:bg-bad-soft"
                  >
                    <Trash2 className="size-4" aria-hidden /> {tx("সরান", "Remove")}
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      <footer className="space-y-2 border-t border-line px-4 py-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-ink-2">
            <Truck className="size-4" aria-hidden /> {dispatchLabel(group.dispatchDays, lang)}
          </span>
          <span>
            {tx("ডেলিভারি", "Delivery")} <b>{delivery ? taka(delivery) : tx("ফ্রি", "Free")}</b>
          </span>
        </div>
        {group.shortfall > 0 && (
          <Notice tone="wait">
            {tx(
              `এই দোকান থেকে আরও ${taka(group.shortfall)} এর জিনিস যোগ করুন, নইলে ছোট প্যাকেটে ডেলিভারি খরচ তুলনায় বেশি পড়বে।`,
              `Add ${taka(group.shortfall)} more from this shop, otherwise delivery costs more relative to a small parcel.`,
            )}
          </Notice>
        )}
      </footer>
    </section>
  );
}
