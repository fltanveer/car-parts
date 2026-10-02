"use client";

import Link from "next/link";
import type { Listing, Vendor } from "@/lib/types";
import { AssuredBadge, ConditionBadge, SourceBadge, Stars, VerifiedBadge } from "@/components/shared/Badges";
import { useT } from "@/components/providers/LangProvider";
import { MediaImage } from "@/components/ui/MediaImage";
import { DispatchLine, FitLine } from "./Bits";

/** Single listing card (used / one-off items) with the seller (file 01 4.2). */
export function ListingCard({ listing, vendor, fit, compact }: { listing: Listing; vendor: Vendor; fit: boolean | null; compact?: boolean }) {
  const { lang, taka } = useT();
  const title = lang === "bn" ? listing.title_bn : listing.title;
  if (compact) {
    return (
      <article className="relative w-40 shrink-0 overflow-hidden rounded-2xl border border-line bg-card hover:border-ink/30">
        <MediaImage src={listing.media[0]?.url} alt={title} className="aspect-square w-full" />
        <div className="space-y-1 p-2.5">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
            <Link href={`/l/${listing.id}`} className="after:absolute after:inset-0">
              {title}
            </Link>
          </h3>
          <p className="font-bold">{taka(listing.price)}</p>
        </div>
      </article>
    );
  }
  return (
    <article className="relative flex gap-3 rounded-2xl border border-line bg-card p-3 hover:border-ink/30">
      <MediaImage src={listing.media[0]?.url} alt={title} className="size-24 shrink-0 rounded-xl sm:size-28" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <h3 className="font-bold leading-snug">
          <Link href={`/l/${listing.id}`} className="after:absolute after:inset-0 after:rounded-2xl">
            {title}
          </Link>
        </h3>
        <div className="relative z-10 flex flex-wrap gap-1">
          <SourceBadge source={listing.source} />
          <ConditionBadge condition={listing.condition} grade={listing.grade} />
          {listing.is_assured_eligible && <AssuredBadge />}
        </div>
        <p className="flex items-baseline gap-2">
          <span className="text-xl font-bold">{taka(listing.price)}</span>
          {listing.compare_at_price && listing.compare_at_price > listing.price && <s className="text-sm text-muted">{taka(listing.compare_at_price)}</s>}
        </p>
        <p className="relative z-10 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="truncate font-medium">{lang === "bn" ? vendor.shop_name_bn : vendor.shop_name}</span>
          <Stars value={vendor.rating_avg} />
          <VerifiedBadge vendor={vendor} withLabel={false} />
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <FitLine fit={fit} />
          <DispatchLine days={listing.dispatch_days} />
        </div>
      </div>
    </article>
  );
}
