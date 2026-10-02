"use client";

import { type Column, DataTable, KpiCard, KpiGrid } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { vendorBalance } from "@/lib/db/queries";
import type { DB } from "@/lib/db/seed";
import type { Vendor } from "@/lib/types";
import { Money, VendorLink } from "./shared";

interface Row {
  v: Vendor;
  available: number;
  pending: number;
  requested: number;
}

/** Platform totals derived from the ledger (commission, refunds, payouts). */
export const ledgerTotals = (s: DB) => {
  const sum = (t: string) => s.ledger.filter((e) => e.entry_type === t).reduce((a, e) => a + e.amount, 0);
  return {
    commission: -sum("commission_debit"),
    refunds: -sum("refund_debit"),
    payouts: -sum("payout_debit"),
    penalties: -sum("penalty"),
    adjustments: sum("adjustment"),
    sales: sum("sale_credit"),
  };
};

export function Balances({ s, now }: { s: DB; now: number }) {
  const { tx, taka } = useT();
  const t = ledgerTotals(s);
  const rows: Row[] = s.vendors
    .map((v) => {
      const b = vendorBalance(s, v.id, now);
      const requested = s.payouts.filter((p) => p.vendor_id === v.id && (p.status === "requested" || p.status === "processing")).reduce((a, p) => a + p.amount, 0);
      return { v, available: b.available, pending: b.pending, requested };
    })
    .filter((r) => r.available || r.pending || r.requested || s.ledger.some((e) => e.vendor_id === r.v.id));

  const cols: Column<Row>[] = [
    { key: "shop", header: tx("বিক্রেতা অ্যাকাউন্ট", "Seller account"), sort: (r) => r.v.shop_name, cell: (r) => <VendorLink id={r.v.id} name={r.v.shop_name_bn} /> },
    { key: "avail", header: tx("তোলা যাবে", "Available"), sort: (r) => r.available, cell: (r) => <Money value={r.available} /> },
    { key: "pend", header: tx("আটকে আছে (রিটার্ন উইন্ডো)", "Pending (return window)"), sort: (r) => r.pending, cell: (r) => <Money value={r.pending} /> },
    { key: "req", header: tx("পেআউট অনুরোধে", "In payout requests"), sort: (r) => r.requested, cell: (r) => <Money value={r.requested} /> },
    { key: "total", header: tx("মোট", "Total"), sort: (r) => r.available + r.pending + r.requested, cell: (r) => <Money value={r.available + r.pending + r.requested} /> },
  ];

  return (
    <div className="space-y-3">
      <KpiGrid>
        <KpiCard label={tx("প্ল্যাটফর্ম কমিশন (মোট)", "Platform commission (total)")} value={taka(t.commission)} tone="ok" icon="🏦" />
        <KpiCard label={tx("রিফান্ড কাটা (মোট)", "Refund debits (total)")} value={taka(t.refunds)} icon="↩️" />
        <KpiCard label={tx("পেআউট (মোট)", "Payouts (total)")} value={taka(t.payouts)} icon="📤" />
        <KpiCard label={tx("জরিমানা (মোট)", "Penalties (total)")} value={taka(t.penalties)} icon="⚠️" />
      </KpiGrid>
      <DataTable rows={rows} columns={cols} rowKey={(r) => r.v.id} caption={tx("অ্যাকাউন্ট অনুযায়ী ব্যালেন্স", "Balance per account")} initialSort={{ key: "total", dir: "desc" }} />
    </div>
  );
}
