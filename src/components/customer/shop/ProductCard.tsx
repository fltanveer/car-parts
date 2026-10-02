"use client";

import { Store } from "lucide-react";
import Link from "next/link";
import { useDb } from "@/lib/db/store";
import type { CatalogProduct, Listing } from "@/lib/types";
import { AssuredBadge, ConditionBadge, SourceBadge, Stars, VerifiedBadge } from "@/components/shared/Badges";
import { useT } from "@/components/providers/LangProvider";
import { MediaImage } from "@/components/ui/MediaImage";
import { DispatchLine, FitLine } from "./Bits";

/** Master product card: "৫টা দোকানে · ৳ ১,৮০০ থেকে" (file 01 4.1). */
export function ProductCard({ product, offers, min, fit }: { product: CatalogProduct; offers: Listing[]; min: number; fit: boolean | null }) {
  const { tx, lang, taka, d } = useT();
  const vendors = useDb((s) => s.vendors);
  const fastest = Math.min(...offers.map((o) => o.dispatch_days));
  const anyAssured = offers.some((o) => o.is_assured_eligible);
  const conditions = [...new Set(offers.map((o) => o.condition))];
  const bestShop = offers
    .map((o) => vendors.find((v) => v.id === o.vendor_id)!)
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)[0];
  return (
    <article className="relative flex gap-3 rounded-2xl border border-line bg-card p-3 hover:border-ink/30">
      <MediaImage src={`ph:${product.image}`} alt={lang === "bn" ? product.name_bn : product.name} className="size-24 shrink-0 rounded-xl sm:size-28" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <h3 className="font-bold leading-snug">
          <Link href={`/p/${product.slug}`} className="after:absolute after:inset-0 after:rounded-2xl">
            {lang === "bn" ? product.name_bn : product.name}
          </Link>
        </h3>
        <div className="relative z-10 flex flex-wrap gap-1">
          <SourceBadge source={product.source} />
          {conditions.length === 1 && <ConditionBadge condition={conditions[0]} grade={null} />}
          {anyAssured && <AssuredBadge />}
        </div>
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-xl font-bold">{taka(min)}</span>
          <span className="text-sm text-muted">{tx("থেকে", "from")}</span>
        </p>
        <p className="inline-flex items-center gap-1.5 rounded-lg bg-brand-soft/50 px-2 py-0.5 text-sm font-semibold text-brand-ink">
          <Store className="size-4" aria-hidden />
          {tx(`${d(offers.length)}টা দোকানে`, `${offers.length} shop${offers.length > 1 ? "s" : ""}`)}
        </p>
        {bestShop && (
          <p className="relative z-10 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="truncate font-medium">{lang === "bn" ? bestShop.shop_name_bn : bestShop.shop_name}</span>
            <Stars value={bestShop.rating_avg} />
            <VerifiedBadge vendor={bestShop} withLabel={false} />
          </p>
        )}
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <FitLine fit={fit} />
          <DispatchLine days={fastest} />
        </div>
      </div>
    </article>
  );
}
