"use client";

import Link from "next/link";
import { fulfillmentLabel, vendorOrderStatusLabel } from "@/lib/labels";
import type { VendorOrder, VendorOrderStatus } from "@/lib/types";
import { SpeakButton } from "../../layout/AudioGuide";
import { useT } from "../../providers/LangProvider";
import { Countdown } from "../../shared/Misc";
import { MediaImage } from "../../ui/MediaImage";
import { StatusPill } from "../../ui/primitives";

export type OrderTab = "new" | "ship" | "way" | "done" | "problem" | "cancel";

export const TAB_STATUSES: Record<OrderTab, VendorOrderStatus[]> = {
  new: ["pending_vendor"],
  ship: ["accepted", "ready_to_ship"],
  way: ["picked_up", "at_hub_qc", "shipped"],
  done: ["delivered", "completed"],
  problem: ["return_requested", "returned", "qc_failed"],
  cancel: ["cancelled", "rejected_by_vendor"],
};

export const FULFIL_ICON = { vendor_ship: "📮", platform_pickup: "🛵", assured_hub: "✔️", store_pickup: "🏪" } as const;

/** The deadline that matters for the current step. */
export const orderDeadline = (o: VendorOrder): { at: string; bn: string; en: string } | null => {
  if (o.status === "pending_vendor") return { at: o.accept_by, bn: "গ্রহণ করুন", en: "Accept in" };
  if ((o.status === "accepted" || o.status === "ready_to_ship") && o.handover_by) return { at: o.handover_by, bn: "হস্তান্তর", en: "Hand over" };
  if (["picked_up", "at_hub_qc", "shipped"].includes(o.status) && o.deliver_by) return { at: o.deliver_by, bn: "পৌঁছাতে হবে", en: "Deliver by" };
  if (o.status === "delivered" && o.return_window_ends_at) return { at: o.return_window_ends_at, bn: "টাকা আসবে", en: "Money in" };
  return null;
};

/** Spell the code so it can be read aloud and written on the parcel. */
export const spokenCode = (code: string) => code.split("").join(" ");

export function OrderCard({ o }: { o: VendorOrder }) {
  const { tx, taka, d, L, lang } = useT();
  const dl = orderDeadline(o);
  const f = fulfillmentLabel[o.fulfillment];
  const qty = o.items.reduce((a, i) => a + i.qty, 0);
  return (
    <Link href={`/seller/orders/${o.id}`} className="block space-y-3 rounded-2xl border-2 border-line bg-card p-4 hover:border-ink/30">
      <div className="flex items-start justify-between gap-2">
        <p className="font-mono text-2xl font-black tracking-wide">{o.sub_order_no}</p>
        <StatusPill tone={vendorOrderStatusLabel[o.status].tone}>{L(vendorOrderStatusLabel[o.status])}</StatusPill>
      </div>
      <div className="flex items-center gap-3">
        <MediaImage src={o.items[0]?.snapshot.image} alt={o.items[0]?.snapshot.title ?? ""} className="size-16 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="font-bold leading-tight">{o.items[0]?.snapshot.title}</p>
          {o.items.length > 1 && <p className="text-sm text-muted">+{d(o.items.length - 1)} {tx("আরও", "more")}</p>}
          <p className="text-sm text-ink-2">{tx("পরিমাণ", "Qty")}: {d(qty)}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="rounded-xl bg-ok-soft px-3 py-1.5 font-bold text-ok">{tx("আপনি পাবেন", "You get")} {taka(o.vendor_payable)}</p>
        <p className="text-sm font-semibold">{FULFIL_ICON[o.fulfillment]} {lang === "bn" ? f.seller_bn : f.seller_en}</p>
      </div>
      {dl && <Countdown to={dl.at} prefix={`${tx(dl.bn, dl.en)}: `} warnHours={o.status === "pending_vendor" ? 2 : 12} />}
    </Link>
  );
}

export function CodeBox({ code, label }: { code: string; label: string }) {
  return (
    <div className="space-y-2 rounded-2xl border-4 border-dashed border-ink bg-white p-4 text-center">
      <p className="text-sm font-semibold text-ink-2">{label}</p>
      <p className="font-mono text-4xl font-black tracking-widest">{code}</p>
      <SpeakButton text={spokenCode(code)} className="no-print mx-auto" />
    </div>
  );
}
