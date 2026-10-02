"use client";

import clsx from "clsx";
import { Check, MessageCircle, ShoppingCart, Sparkles, Truck } from "lucide-react";
import Link from "next/link";
import { addToCart } from "@/lib/db/actions";
import { useDb } from "@/lib/db/store";
import { dispatchLabel, warrantyLabel } from "@/lib/labels";
import { spokenTaka } from "@/lib/format";
import { SpeakButton } from "@/components/layout/AudioGuide";
import { AssuredBadge, ConditionBadge, ReturnBadge, SourceBadge, Stars, VerifiedBadge, WarrantyBadge } from "@/components/shared/Badges";
import { ShopLogo, toast } from "@/components/shared/Misc";
import { useT } from "@/components/providers/LangProvider";
import { Button, ButtonLink } from "@/components/ui/primitives";
import { MarketLine } from "./Bits";
import type { RankedOffer } from "./data";
import { deliveryEstimate } from "./data";
import { useAskShop } from "./useAskShop";

/** Spoken summary of one offer (rule 5 / file 01 4.3). */
export const offerSpeech = (o: RankedOffer, n: number, lang: "bn" | "en") => {
  const v = o.vendor;
  const ord = lang === "bn" ? ["প্রথম", "দ্বিতীয়", "তৃতীয়", "চতুর্থ", "পঞ্চম"][n] ?? `${n + 1} নম্বর` : ["First", "Second", "Third", "Fourth", "Fifth"][n] ?? `Number ${n + 1}`;
  const stars = Math.round(v?.rating_avg ?? 0);
  return lang === "bn"
    ? `${ord} দোকান, ${v?.shop_name_bn ?? ""}, ${stars ? `${["", "এক", "দুই", "তিন", "চার", "পাঁচ"][stars]} তারকা` : "নতুন দোকান"}, দাম ${spokenTaka(o.listing.price, "bn")}, ${warrantyLabel(o.listing.warranty_days, "bn")}, ${dispatchLabel(o.listing.dispatch_days, "bn")}।`
    : `${ord} shop, ${v?.shop_name ?? ""}, ${stars ? `${stars} stars` : "new shop"}, price ${spokenTaka(o.listing.price, "en")}, ${warrantyLabel(o.listing.warranty_days, "en")}, ${dispatchLabel(o.listing.dispatch_days, "en")}.`;
};

export function OfferRow({ offer, index, suggested, reason, district }: { offer: RankedOffer; index: number; suggested?: boolean; reason?: string; district: string }) {
  const { tx, lang, taka } = useT();
  const ask = useAskShop();
  const l = offer.listing;
  const v = offer.vendor;
  const inCart = useDb((s) => s.cart.some((c) => c.listing_id === l.id));
  if (!v) return null;
  const name = lang === "bn" ? v.shop_name_bn : v.shop_name;
  const delivery = deliveryEstimate(district, l);
  return (
    <article className={clsx("rounded-2xl border-2 bg-card p-4", suggested ? "border-ok shadow-sm" : "border-line")}>
      {suggested && (
        <div className="-mx-4 -mt-4 mb-3 rounded-t-[14px] bg-ok px-4 py-2 text-white">
          <p className="flex items-center gap-1.5 font-bold">
            <Sparkles className="size-4" aria-hidden /> {tx("আমাদের পরামর্শ", "Our suggestion")}
          </p>
          {reason && <p className="text-sm opacity-90">{reason}</p>}
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <Link href={`/shop/${v.slug}`} className="flex min-w-0 items-center gap-2.5">
          <ShopLogo name={name} color={v.logo_color} size="md" />
          <span className="min-w-0">
            <span className="block truncate font-bold">{name}</span>
            <MarketLine vendor={v} />
          </span>
        </Link>
        <p className="shrink-0 text-right text-2xl font-bold">{taka(l.price)}</p>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Stars value={v.rating_avg} count={v.rating_count} />
        <VerifiedBadge vendor={v} />
        <SourceBadge source={l.source} />
        <ConditionBadge condition={l.condition} grade={l.grade} />
        {l.is_assured_eligible && <AssuredBadge />}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <WarrantyBadge days={l.warranty_days} />
        <ReturnBadge returnable={l.is_returnable} days={l.return_window_days} />
      </div>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-2">
        <span className={clsx("inline-flex items-center gap-1", l.dispatch_days === 0 && "font-semibold text-ok")}>
          <Truck className="size-4" aria-hidden /> {dispatchLabel(l.dispatch_days, lang)}
        </span>
        <span>
          {tx("ডেলিভারি", "Delivery")} {taka(delivery)}
        </span>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {inCart ? (
          <ButtonLink href="/cart" variant="ok" size="lg" className="flex-1">
            <Check className="size-5" aria-hidden /> {tx("কার্টে আছে · দেখুন", "In cart · view")}
          </ButtonLink>
        ) : (
          <Button
            variant={suggested ? "ok" : "brand"}
            size="lg"
            className="flex-1"
            onClick={() => {
              addToCart({ listing_id: l.id });
              toast(tx("কার্টে দেওয়া হয়েছে", "Added to cart"));
            }}
          >
            <ShoppingCart className="size-5" aria-hidden /> {tx("কার্টে দিন", "Add to cart")}
          </Button>
        )}
        <SpeakButton text={offerSpeech(offer, index, lang)} />
        <Button variant="outline" size="md" onClick={() => ask(v.id, "listing", l.id)} aria-label={tx("দোকানকে প্রশ্ন", "Ask shop")}>
          <MessageCircle className="size-4" aria-hidden />
          {tx("প্রশ্ন", "Ask")}
        </Button>
      </div>
      <Link href={`/l/${l.id}`} className="mt-2 inline-flex min-h-9 items-center text-sm font-semibold text-brand underline-offset-4 hover:underline">
        {tx("এই দোকানের জিনিসের বিস্তারিত", "Details of this offer")}
      </Link>
    </article>
  );
}
