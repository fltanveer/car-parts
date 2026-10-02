"use client";

import { ShieldCheck } from "lucide-react";
import type { Order, OrderItem } from "@/lib/types";
import { useT } from "../providers/LangProvider";
import { QualityBadge } from "../part/QualityBadge";
import { warrantyExpiry } from "./helpers";

export function WarrantyCard({ order, item, now }: { order: Order; item: OrderItem; now: number }) {
  const { lang, tx, d, date } = useT();
  const expires = warrantyExpiry(order, item);
  const expired = expires ? new Date(expires).getTime() < now : false;
  return (
    <div className="break-inside-avoid rounded-2xl border-2 border-q-genuine/40 bg-q-genuine-soft/50 p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-q-genuine text-white">
          <ShieldCheck className="size-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-q-genuine">{tx("ওয়ারেন্টি কার্ড", "Warranty card")}</p>
          <p className="font-bold">{item.title_snapshot}</p>
          <div className="mt-1">
            <QualityBadge quality={item.quality_snapshot} lang={lang} />
          </div>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <dt className="text-muted">{tx("অর্ডার", "Order")}</dt>
        <dd className="font-semibold">{d(order.order_no)}</dd>
        <dt className="text-muted">{tx("মেয়াদ", "Period")}</dt>
        <dd className="font-semibold">
          {d(item.warranty_months_snapshot)} {tx("মাস", "months")}
        </dd>
        <dt className="text-muted">{tx("শুরু", "Starts")}</dt>
        <dd className="font-semibold">{order.delivered_at ? date(order.delivered_at) : tx("ডেলিভারির দিন থেকে", "From delivery day")}</dd>
        <dt className="text-muted">{tx("শেষ হবে", "Valid until")}</dt>
        <dd className="font-semibold">{expires ? date(expires) : tx("ডেলিভারির পর জানা যাবে", "Known after delivery")}</dd>
      </dl>
      {expired && <p className="mt-2 text-sm font-semibold text-danger">{tx("মেয়াদ শেষ", "Expired")}</p>}
      <p className="mt-3 text-xs text-ink-2">
        {tx(
          "সিল/স্টিকার অক্ষত রাখুন। ভুল ইনস্টলেশন বা দুর্ঘটনা কাভার নয়। দাবি করতে অর্ডার পেজে “সমস্যা জানান” চাপুন।",
          "Keep seals/stickers intact. Bad installation and accidents aren't covered. To claim, tap “Report a problem” on the order page.",
        )}
      </p>
    </div>
  );
}
