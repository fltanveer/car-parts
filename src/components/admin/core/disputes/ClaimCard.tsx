"use client";

import Link from "next/link";
import { useT } from "@/components/providers/LangProvider";
import { Countdown } from "@/components/shared/Misc";
import { StatusPill } from "@/components/ui/primitives";
import { useDb } from "@/lib/db/store";
import { claimStatusLabel, claimTypeLabel } from "@/lib/labels";
import type { Claim } from "@/lib/types";

export const liabilityLabel = {
  vendor: { bn: "দায় দোকানের", en: "Seller liable", tone: "bad" as const },
  customer: { bn: "দায় ক্রেতার", en: "Buyer liable", tone: "info" as const },
  review: { bn: "প্রমাণ দেখে", en: "Needs review", tone: "wait" as const },
};

/** Mobile-friendly dispute queue card. */
export function ClaimCard({ claim }: { claim: Claim }) {
  const { tx, L, taka, ago } = useT();
  const vo = useDb((s) => s.vendorOrders.find((v) => v.id === claim.vendor_order_id) ?? null);
  const vendor = useDb((s) => s.vendors.find((v) => v.id === claim.vendor_id) ?? null);
  const item = vo?.items.find((i) => i.id === claim.order_item_id) ?? vo?.items[0];
  const t = claimTypeLabel[claim.type];
  const waitingSeller = claim.status === "vendor_review" || claim.status === "submitted";
  return (
    <Link href={`/admin/disputes/${claim.id}`} className="block rounded-2xl border border-line bg-card p-4 hover:border-ink/30 hover:shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-lg" aria-hidden>{t.icon}</span>
        <span className="font-bold">{claim.claim_no}</span>
        <StatusPill tone={claimStatusLabel[claim.status].tone}>{L(claimStatusLabel[claim.status])}</StatusPill>
        <StatusPill tone={liabilityLabel[claim.liability].tone}>{L(liabilityLabel[claim.liability])}</StatusPill>
        <span className="ml-auto text-xs text-muted">{ago(claim.created_at)}</span>
      </div>
      <p className="mt-1 font-semibold">{L(t)}</p>
      <p className="text-sm text-ink-2">
        {item?.snapshot.title} · {vo?.sub_order_no} · {vendor?.shop_name_bn}
      </p>
      {claim.description && <p className="mt-1 line-clamp-2 text-sm text-muted">“{claim.description}”</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        {item && <span className="font-semibold tabular-nums">{taka(item.line_total)}</span>}
        {waitingSeller && <Countdown to={claim.vendor_respond_by} warnHours={12} prefix={tx("দোকানের উত্তর: ", "Seller reply: ")} />}
        {claim.media.length > 0 && <span className="text-xs text-muted">📷 {claim.media.length}</span>}
        {claim.voice_notes.length > 0 && <span className="text-xs text-muted">🎤 {claim.voice_notes.length}</span>}
      </div>
    </Link>
  );
}
