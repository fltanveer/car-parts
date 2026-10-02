"use client";

import Link from "next/link";
import { describeVehicle, getCategory } from "@/lib/db/queries";
import type { DB } from "@/lib/db/seed";
import { conditionPrefLabel, neededByLabel, sourcePrefLabel } from "@/lib/labels";
import type { PartRequest } from "@/lib/types";
import { useT } from "../../providers/LangProvider";
import { Countdown, MakeLogo } from "../../shared/Misc";
import { CategoryIcon } from "../../ui/CategoryIcon";
import { MediaImage } from "../../ui/MediaImage";

export type ReqTab = "new" | "quoted" | "won" | "lost";

/** Which tab a request belongs to for this seller (null = not for this seller). */
export const requestTab = (s: DB, r: PartRequest, vid: string): ReqTab | null => {
  const mine = s.quotes.filter((q) => q.request_id === r.id && q.vendor_id === vid);
  if (mine.some((q) => q.status === "accepted")) return "won";
  const live = mine.find((q) => q.status === "submitted");
  if (live) return ["open", "quotes_received"].includes(r.status) ? "quoted" : "lost";
  if (mine.length) return "lost";
  const m = r.matches.find((x) => x.vendor_id === vid);
  if (!m) return null;
  if (m.declined) return "lost";
  return ["open", "quotes_received"].includes(r.status) ? "new" : "lost";
};

/** Other shops' quote count (never their prices, file 02 §7.2). */
export const otherQuoteCount = (s: DB, requestId: string, vid: string) =>
  s.quotes.filter((q) => q.request_id === requestId && q.vendor_id !== vid && (q.status === "submitted" || q.status === "accepted")).length;

export function VehicleLine({ r }: { r: PartRequest }) {
  const { tx } = useT();
  const v = describeVehicle(r.generation_id, r.engine_id);
  return (
    <span className="flex min-w-0 items-center gap-2">
      {v ? <MakeLogo make={v.make} size="sm" /> : <span className="grid size-8 place-items-center rounded-xl bg-surface">🚗</span>}
      <span className="min-w-0">
        <span className="block truncate font-bold">{v ? `${v.short} ${v.years}` : r.vehicle_text ?? tx("গাড়ি জানা নেই", "Car unknown")}</span>
        {v?.engine && <span className="block text-xs text-muted">{v.engine.code}</span>}
      </span>
    </span>
  );
}

export function RequestCard({ r, others, tab }: { r: PartRequest; others: number; tab: ReqTab }) {
  const { tx, L, d } = useT();
  const item = r.items[0];
  const cat = getCategory(item?.category_id ?? null);
  return (
    <Link href={`/seller/requests/${r.id}`} className="block space-y-3 rounded-2xl border-2 border-line bg-card p-4 hover:border-ink/30">
      <div className="flex items-start justify-between gap-2">
        <VehicleLine r={r} />
        {tab === "new" || tab === "quoted" ? <Countdown to={r.expires_at} /> : null}
      </div>
      <div className="flex items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-ink">
          <CategoryIcon icon={cat?.icon ?? "part"} className="size-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold leading-tight">{item?.name ?? tx("পার্ট", "Part")}</span>
          {r.items.length > 1 && <span className="text-sm text-muted">+{d(r.items.length - 1)} {tx("আরও", "more")}</span>}
        </span>
        {r.photos[0] && <MediaImage src={r.photos[0].url} alt="" className="size-14 shrink-0 rounded-xl" />}
      </div>
      <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
        <span className="rounded-full bg-surface px-2.5 py-1">🏷️ {L(sourcePrefLabel[r.preferred_source])}</span>
        <span className="rounded-full bg-surface px-2.5 py-1">♻️ {L(conditionPrefLabel[r.preferred_condition])}</span>
        <span className="rounded-full bg-surface px-2.5 py-1">📍 {r.district}, {r.area}</span>
        <span className="rounded-full bg-surface px-2.5 py-1">⏰ {L(neededByLabel[r.needed_by])}</span>
      </div>
      <p className="text-sm font-semibold text-ink-2">
        🏪 {others ? tx(`${d(others)}টা দোকান দাম দিয়েছে`, `${others} shops quoted`) : tx("এখনো কেউ দাম দেয়নি, আগে দিন!", "No quotes yet, be first!")}
      </p>
    </Link>
  );
}
