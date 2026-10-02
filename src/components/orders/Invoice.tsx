"use client";

import { Printer } from "lucide-react";
import { settings } from "@/lib/api";
import { qualityLabel } from "@/lib/i18n";
import type { Order } from "@/lib/types";
import { useT } from "../providers/LangProvider";
import { Button } from "../ui/primitives";
import { deliveryMethodLabel, paymentMethodLabel, paymentStatusLabel } from "./helpers";

// Printable invoice. Everything else on the order page carries `no-print`,
// so "Print / Save as PDF" outputs just this block (+ warranty cards).
export function Invoice({ order }: { order: Order }) {
  const { lang, tx, taka, d, date } = useT();
  const a = order.address;
  const due = order.total - order.advance_paid - order.discount;
  const row = "flex justify-between gap-3 py-1";

  return (
    <section aria-labelledby="invoice-title" className="rounded-2xl border border-line bg-card p-4 print:border-0 print:p-0">
      <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
        <div>
          <p className="text-lg font-extrabold tracking-tight">
            Parts<span className="text-accent">BD</span>
          </p>
          <p className="text-xs text-muted">{tx("হটলাইন", "Hotline")}: {settings.hotline_display}</p>
        </div>
        <div className="text-right">
          <h2 id="invoice-title" className="text-lg font-bold">
            {tx("ইনভয়েস", "Invoice")}
          </h2>
          <p className="text-sm font-semibold">{d(order.order_no)}</p>
          <p className="text-xs text-muted">{date(order.created_at)}</p>
        </div>
      </div>

      <div className="mt-3 text-sm">
        <p className="text-xs font-semibold text-muted">{tx("যার কাছে যাবে", "Deliver to")}</p>
        <p className="font-semibold">{a.recipient_name}</p>
        <p>{d(a.phone.replace("+88", ""))}</p>
        <p className="text-ink-2">
          {a.address_line}, {a.area}, {a.district}
        </p>
        <p className="mt-1 text-ink-2">{deliveryMethodLabel[order.delivery_method][lang]}</p>
      </div>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-muted">
            <th className="py-1.5 font-semibold">{tx("পার্ট", "Part")}</th>
            <th className="py-1.5 text-center font-semibold">{tx("পরিমাণ", "Qty")}</th>
            <th className="py-1.5 text-right font-semibold">{tx("দাম", "Amount")}</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((i) => (
            <tr key={i.id} className="border-b border-line/60 align-top">
              <td className="py-2 pr-2">
                <p className="font-medium">{i.title_snapshot}</p>
                <p className="text-xs text-muted">
                  {qualityLabel[i.quality_snapshot][lang]} · {tx("ওয়ারেন্টি", "Warranty")}:{" "}
                  {i.warranty_months_snapshot > 0 ? `${d(i.warranty_months_snapshot)} ${tx("মাস", "mo")}` : tx("নেই", "none")}
                </p>
              </td>
              <td className="py-2 text-center">
                {d(i.qty)} × {taka(i.unit_price)}
              </td>
              <td className="whitespace-nowrap py-2 text-right font-medium">{taka(i.unit_price * i.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 text-sm">
        <div className={row}>
          <span className="text-muted">{tx("পণ্যের দাম", "Items")}</span>
          <span>{taka(order.subtotal)}</span>
        </div>
        <div className={row}>
          <span className="text-muted">{tx("ডেলিভারি চার্জ", "Delivery")}</span>
          <span>{taka(order.delivery_charge)}</span>
        </div>
        {order.packing_charge > 0 && (
          <div className={row}>
            <span className="text-muted">{tx("বাড়তি প্যাকিং", "Extra packing")}</span>
            <span>{taka(order.packing_charge)}</span>
          </div>
        )}
        {order.discount > 0 && (
          <div className={row}>
            <span className="text-muted">{tx("ছাড়", "Discount")}</span>
            <span>− {taka(order.discount)}</span>
          </div>
        )}
        <div className={`${row} border-t border-line pt-2 text-base font-bold`}>
          <span>{tx("মোট", "Total")}</span>
          <span>{taka(order.total)}</span>
        </div>
        {order.advance_paid > 0 && (
          <div className={row}>
            <span className="text-muted">{tx("অগ্রিম দেওয়া হয়েছে", "Advance paid")}</span>
            <span>− {taka(order.advance_paid)}</span>
          </div>
        )}
        <div className={`${row} font-semibold`}>
          <span>{order.status === "delivered" ? tx("ডেলিভারিতে দেওয়া হয়েছে", "Paid on delivery") : tx("ডেলিভারিতে দিতে হবে", "Due on delivery")}</span>
          <span>{taka(Math.max(0, due))}</span>
        </div>
      </div>

      {order.payments.length > 0 && (
        <div className="mt-3 border-t border-line pt-2 text-xs text-muted">
          {order.payments.map((p) => (
            <p key={p.id}>
              {paymentMethodLabel[p.method][lang]} {taka(p.amount)}
              {p.transaction_id && ` · TrxID ${p.transaction_id}`} · {paymentStatusLabel[p.status][lang]}
            </p>
          ))}
        </div>
      )}

      <Button variant="outline" size="lg" full className="no-print mt-4" onClick={() => window.print()}>
        <Printer className="size-5" aria-hidden /> {tx("প্রিন্ট / PDF সেভ করুন", "Print / save as PDF")}
      </Button>
    </section>
  );
}
