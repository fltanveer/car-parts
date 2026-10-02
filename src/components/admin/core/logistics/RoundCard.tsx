"use client";

import { Bike, X } from "lucide-react";
import Link from "next/link";
import { useT } from "@/components/providers/LangProvider";
import { Select, StatusPill } from "@/components/ui/primitives";
import { audit } from "@/lib/db/actions";
import { parcelCode, patchRound } from "@/lib/db/actions-admin-core";
import { useDb } from "@/lib/db/store";
import { vendorOrderStatusLabel } from "@/lib/labels";
import type { PickupRound } from "@/lib/types";

const roundTone = { planned: "wait", in_progress: "wait", done: "ok" } as const;
export const roundLabel = { planned: { bn: "পরিকল্পিত", en: "Planned" }, in_progress: { bn: "চলছে", en: "In progress" }, done: { bn: "শেষ", en: "Done" } };

/** One pickup round: rider assignment and the shops/parcels on it. */
export function RoundCard({ round }: { round: PickupRound }) {
  const { tx, L, d } = useT();
  const riders = useDb((s) => s.riders.filter((r) => r.active));
  const vos = useDb((s) => s.vendorOrders.filter((v) => round.vendor_order_ids.includes(v.id)));
  const vendors = useDb((s) => s.vendors);
  const picked = vos.filter((v) => v.status !== "ready_to_ship").length;

  return (
    <div className="rounded-xl border border-line p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-bold">
          {round.slot} <StatusPill tone={roundTone[round.status]}>{L(roundLabel[round.status])}</StatusPill>
        </p>
        <span className="text-sm text-muted">{tx(`${d(picked)}/${d(vos.length)} তোলা`, `${picked}/${vos.length} picked`)}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Bike className="size-4 text-muted" aria-hidden />
        <Select
          value={round.rider_id ?? ""}
          onChange={(e) => {
            patchRound(round.id, { rider_id: e.target.value || null });
            audit("রাইডার অ্যাসাইন", `${round.market_area} ${round.slot} → ${e.target.value || "—"}`);
          }}
          className="min-h-10 w-auto flex-1 text-sm"
          aria-label={tx("রাইডার", "Rider")}
        >
          <option value="">{tx("রাইডার বাছুন", "Choose rider")}</option>
          {riders.map((r) => (
            <option key={r.id} value={r.id}>{r.name} · {r.area}</option>
          ))}
        </Select>
        {round.rider_id && (
          <Link href={`/admin/logistics/rider?rider=${round.rider_id}`} className="text-sm font-semibold text-brand hover:underline">
            {tx("রাইডার ভিউ", "Rider view")} →
          </Link>
        )}
      </div>
      <ul className="mt-2 divide-y divide-line text-sm">
        {vos.map((v) => {
          const shop = vendors.find((x) => x.id === v.vendor_id);
          return (
            <li key={v.id} className="flex flex-wrap items-center gap-2 py-1.5">
              <Link href={`/admin/orders/${v.order_id}#${v.id}`} className="font-semibold hover:underline">{v.sub_order_no}</Link>
              <span className="text-ink-2">{shop?.shop_name_bn}</span>
              <span className="font-mono text-xs text-muted">#{parcelCode(v)}</span>
              <StatusPill tone={vendorOrderStatusLabel[v.status].tone}>{L(vendorOrderStatusLabel[v.status])}</StatusPill>
              {v.status === "ready_to_ship" && round.status !== "done" && (
                <button
                  type="button"
                  className="ml-auto grid size-9 place-items-center rounded-lg text-muted hover:bg-bad-soft hover:text-bad"
                  aria-label={tx("রাউন্ড থেকে সরান", "Remove from round")}
                  onClick={() => patchRound(round.id, { vendor_order_ids: round.vendor_order_ids.filter((x) => x !== v.id) })}
                >
                  <X className="size-4" />
                </button>
              )}
            </li>
          );
        })}
        {!vos.length && <li className="py-2 text-muted">{tx("কোনো পার্সেল নেই", "No parcels")}</li>}
      </ul>
    </div>
  );
}
