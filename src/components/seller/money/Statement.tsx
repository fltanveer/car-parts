"use client";

import { useState } from "react";
import type { LedgerEntry, Vendor } from "@/lib/types";
import { useT } from "../../providers/LangProvider";
import { Button, Card, Chip } from "../../ui/primitives";

const TYPE = {
  sale_credit: { bn: "বিক্রি", en: "Sale" },
  commission_debit: { bn: "কমিশন", en: "Commission" },
  delivery_debit: { bn: "ডেলিভারি", en: "Delivery" },
  refund_debit: { bn: "ফেরত", en: "Refund" },
  payout_debit: { bn: "পেআউট", en: "Payout" },
  adjustment: { bn: "সমন্বয়", en: "Adjustment" },
  penalty: { bn: "জরিমানা", en: "Penalty" },
};

/** Printable monthly statement ("PDF" via the browser's print → save as PDF). */
export function Statement({ vendor, ledger, now }: { vendor: Vendor; ledger: LedgerEntry[]; now: number }) {
  const { tx, taka, L, date, lang } = useT();
  const months = [0, 1, 2].map((i) => {
    const dt = new Date(now);
    dt.setDate(1);
    dt.setMonth(dt.getMonth() - i);
    return { y: dt.getFullYear(), m: dt.getMonth(), label: dt.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { month: "long", year: "numeric" }) };
  });
  const [sel, setSel] = useState(0);
  const mo = months[sel];
  const rows = ledger
    .filter((e) => {
      const d = new Date(e.created_at);
      return d.getFullYear() === mo.y && d.getMonth() === mo.m;
    })
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const total = rows.reduce((a, e) => a + e.amount, 0);
  return (
    <Card className="space-y-3 p-4 print:border-0">
      <div className="no-print flex flex-wrap gap-2">
        {months.map((m, i) => <Chip key={i} active={sel === i} onClick={() => setSel(i)}>{m.label}</Chip>)}
      </div>
      <div>
        <p className="text-xl font-bold">{tx("মাসিক স্টেটমেন্ট", "Monthly statement")} · {mo.label}</p>
        <p className="text-sm text-muted">{vendor.shop_name_bn} ({vendor.shop_name}) · {vendor.owner_name}</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            <th className="py-1">{tx("তারিখ", "Date")}</th>
            <th>{tx("ধরন", "Type")}</th>
            <th>{tx("বিবরণ", "Note")}</th>
            <th className="text-right">{tx("টাকা", "Amount")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.id} className={e.amount < 0 ? "border-b border-line text-bad" : "border-b border-line"}>
              <td className="py-1">{date(e.created_at)}</td>
              <td>{L(TYPE[e.entry_type])}</td>
              <td className="break-all">{e.note}</td>
              <td className="text-right font-semibold">{taka(e.amount)}</td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={4} className="py-3 text-center text-muted">{tx("এই মাসে কোনো লেনদেন নেই", "No entries this month")}</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="font-bold">
            <td colSpan={3} className="py-2">{tx("মোট", "Total")}</td>
            <td className="text-right">{taka(total)}</td>
          </tr>
        </tfoot>
      </table>
      <Button variant="primary" size="lg" full className="no-print" onClick={() => window.print()}>🖨️ {tx("প্রিন্ট / PDF সেভ", "Print / save PDF")}</Button>
    </Card>
  );
}
