"use client";

import { getMarket } from "@/lib/db/queries";
import { dispatchLabel, positionLabel } from "@/lib/labels";
import type { Listing, Vendor } from "@/lib/types";
import { useT } from "../../providers/LangProvider";
import { ConditionBadge, ReturnBadge, SourceBadge, VerifiedBadge, WarrantyBadge } from "../../shared/Badges";
import { MediaImage } from "../../ui/MediaImage";
import { Card } from "../../ui/primitives";
import { useFitText } from "../Bits";

/** How the customer will see the listing (file 02 §5.1 preview). */
export function ListingPreview({ l, vendor }: { l: Listing; vendor: Vendor }) {
  const { tx, taka, L, lang, d } = useT();
  const fit = useFitText();
  return (
    <Card className="overflow-hidden">
      <MediaImage src={l.media[0]?.url} alt={l.title_bn} className="aspect-[4/3] w-full" />
      {l.media.length > 1 && (
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto p-2">
          {l.media.slice(1).map((m, i) => <MediaImage key={i} src={m.url} alt="" className="size-14 shrink-0 rounded-lg" />)}
        </div>
      )}
      <div className="space-y-2 p-4">
        <p className="text-lg font-bold leading-snug">{lang === "bn" ? l.title_bn : l.title}</p>
        <p className="text-sm text-muted">🚗 {fit(l)}{l.position.length > 0 && ` · ${l.position.map((p) => L(positionLabel[p])).join(", ")}`}</p>
        <div className="flex flex-wrap gap-1.5">
          <SourceBadge source={l.source} />
          <ConditionBadge condition={l.condition} grade={l.grade} />
          <WarrantyBadge days={l.warranty_days} />
          <ReturnBadge returnable={l.is_returnable} days={l.return_window_days} />
        </div>
        <p className="text-3xl font-bold">{taka(l.price)}</p>
        <p className="text-sm text-ink-2">
          📦 {tx("স্টক", "Stock")}: {d(l.stock_qty)} · 🚚 {dispatchLabel(l.dispatch_days, lang)}
        </p>
        {l.description_bn && <p className="text-ink-2">{l.description_bn}</p>}
        <div className="flex items-center gap-2 border-t border-line pt-2 text-sm">
          <b>{lang === "bn" ? vendor.shop_name_bn : vendor.shop_name}</b>
          <VerifiedBadge vendor={vendor} withLabel={false} />
          <span className="text-muted">· {L(getMarket(vendor.market_area))}</span>
        </div>
      </div>
    </Card>
  );
}
