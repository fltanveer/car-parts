"use client";

import { Printer } from "lucide-react";
import { DAY } from "@/lib/db/seed";
import { conditionLabel, fulfillmentLabel, paymentMethodLabel, sourceLabel, warrantyLabel } from "@/lib/labels";
import { settings } from "@/lib/mock/settings";
import type { Order, Vendor, VendorOrder } from "@/lib/types";
import { useT } from "../../providers/LangProvider";
import { Button } from "../../ui/primitives";
import { Sheet } from "../../ui/Sheet";

// Only the invoice is printed while this sheet is open.
const PRINT_CSS = `@media print { body * { visibility: hidden !important; } .print-area, .print-area * { visibility: visible !important; } .print-area { position: absolute; inset: 0 auto auto 0; width: 100%; } }`;

/** Invoice + warranty card for one parcel, printable (file 01 §7.1). */
export function InvoiceSheet({ open, onClose, order, vo, vendor }: { open: boolean; onClose: () => void; order: Order; vo: VendorOrder; vendor: Vendor | null }) {
  const { tx, taka, L, d, date, lang } = useT();
  const shop = vendor ? (lang === "bn" ? vendor.shop_name_bn : vendor.shop_name) : "—";
  return (
    <Sheet open={open} onClose={onClose} title={tx("ইনভয়েস ও ওয়ারেন্টি", "Invoice & warranty")}>
      <style>{PRINT_CSS}</style>
      <div className="print-area space-y-4 pb-3 text-sm">
        <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
          <div>
            <p className="text-lg font-extrabold">
              Gaari<span className="text-brand">Hub</span>
            </p>
            <p className="text-muted">{tx("হটলাইন", "Hotline")}: {lang === "bn" ? settings.hotline_display : settings.hotline}</p>
          </div>
          <div className="text-right">
            <p className="font-bold">{tx("ইনভয়েস", "Invoice")} {d(vo.sub_order_no)}</p>
            <p className="text-muted">{date(order.created_at)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted">{tx("ক্রেতা", "Buyer")}</p>
            <p className="font-semibold">{order.customer_name}</p>
            <p>
              {order.address.area}, {order.address.district}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">{tx("বিক্রেতা", "Seller")}</p>
            <p className="font-semibold">{shop}</p>
            <p>{L(fulfillmentLabel[vo.fulfillment])}</p>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="py-1">{tx("জিনিস", "Item")}</th>
              <th className="py-1 text-right">{tx("পরিমাণ", "Qty")}</th>
              <th className="py-1 text-right">{tx("দাম", "Amount")}</th>
            </tr>
          </thead>
          <tbody>
            {vo.items.map((it) => (
              <tr key={it.id} className="border-b border-line align-top">
                <td className="py-2">
                  <p className="font-semibold">{it.snapshot.title}</p>
                  <p className="text-xs text-muted">
                    {L(sourceLabel[it.snapshot.source])} · {L(conditionLabel[it.snapshot.condition])}
                    {it.snapshot.grade ? ` · ${it.snapshot.grade}` : ""}
                  </p>
                </td>
                <td className="py-2 text-right">{d(it.qty)}</td>
                <td className="py-2 text-right font-semibold">{taka(it.line_total)}</td>
              </tr>
            ))}
            <tr>
              <td className="py-1" colSpan={2}>
                {tx("ডেলিভারি চার্জ", "Delivery")}
              </td>
              <td className="py-1 text-right">{taka(vo.delivery_charge)}</td>
            </tr>
            <tr className="text-base font-bold">
              <td className="py-1" colSpan={2}>
                {tx("মোট", "Total")}
              </td>
              <td className="py-1 text-right">{taka(vo.subtotal + vo.delivery_charge)}</td>
            </tr>
          </tbody>
        </table>
        <p>
          {tx("পেমেন্ট", "Payment")}: {L(paymentMethodLabel[order.payment_method])}
        </p>

        <div className="rounded-xl border-2 border-dashed border-ok/50 p-3">
          <p className="font-bold">🛡️ {tx("ওয়ারেন্টি কার্ড", "Warranty card")}</p>
          <ul className="mt-2 space-y-1">
            {vo.items.map((it) => (
              <li key={it.id} className="flex flex-wrap justify-between gap-2">
                <span>{it.snapshot.title}</span>
                <span className="font-semibold">
                  {warrantyLabel(it.snapshot.warranty_days, lang)}
                  {it.snapshot.warranty_days > 0 && vo.delivered_at && ` · ${tx("শেষ", "until")} ${date(new Date(new Date(vo.delivered_at).getTime() + it.snapshot.warranty_days * DAY).toISOString())}`}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">
            {tx(
              `ফেরত: ${d(settings.return_window_days)} দিনের মধ্যে (ফেরতযোগ্য জিনিস)। ভাঙা এলে ${d(settings.damage_claim_hours)} ঘণ্টার মধ্যে জানান। সমস্যা হলে অ্যাপে "সমস্যা জানান" চাপুন।`,
              `Returns within ${settings.return_window_days} days (returnable items). Report damage within ${settings.damage_claim_hours} hours. Use "Report a problem" in the app.`,
            )}
          </p>
        </div>
      </div>
      <Button variant="primary" size="lg" full onClick={() => window.print()} className="no-print mb-2">
        <Printer className="size-5" aria-hidden /> {tx("প্রিন্ট / PDF", "Print / PDF")}
      </Button>
    </Sheet>
  );
}
