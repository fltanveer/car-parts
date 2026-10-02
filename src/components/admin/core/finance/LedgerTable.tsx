"use client";

import { Download } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { type Column, DataTable, downloadCsv, FilterChip, FilterSelect } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { Button, StatusPill } from "@/components/ui/primitives";
import type { DB } from "@/lib/db/seed";
import type { LedgerEntry, LedgerEntryType } from "@/lib/types";
import { Money, VendorLink } from "./shared";

export const entryTypeLabel: Record<LedgerEntryType, { bn: string; en: string }> = {
  sale_credit: { bn: "বিক্রির টাকা", en: "Sale credit" },
  commission_debit: { bn: "কমিশন", en: "Commission" },
  delivery_debit: { bn: "ডেলিভারি খরচ", en: "Delivery debit" },
  refund_debit: { bn: "রিফান্ড কাটা", en: "Refund debit" },
  payout_debit: { bn: "পেআউট", en: "Payout" },
  adjustment: { bn: "সমন্বয়", en: "Adjustment" },
  penalty: { bn: "জরিমানা", en: "Penalty" },
};

const DAY = 86_400_000;
type Range = "all" | "7" | "30" | "90";
type Sign = "all" | "credit" | "debit";

export function LedgerTable({ s, now }: { s: DB; now: number }) {
  const { tx, L, dateTime } = useT();
  const [vendor, setVendor] = useState("all");
  const [type, setType] = useState<LedgerEntryType | "all">("all");
  const [range, setRange] = useState<Range>("all");
  const [sign, setSign] = useState<Sign>("all");
  const vName = (id: string) => s.vendors.find((v) => v.id === id)?.shop_name_bn ?? id;
  const vo = (id: string | null) => s.vendorOrders.find((v) => v.id === id) ?? null;

  const rows = s.ledger
    .filter((e) => vendor === "all" || e.vendor_id === vendor)
    .filter((e) => type === "all" || e.entry_type === type)
    .filter((e) => range === "all" || now - new Date(e.created_at).getTime() <= Number(range) * DAY)
    .filter((e) => sign === "all" || (sign === "credit" ? e.amount > 0 : e.amount < 0))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const cols: Column<LedgerEntry>[] = [
    { key: "at", header: tx("সময়", "Time"), sort: (e) => e.created_at, cell: (e) => dateTime(e.created_at) },
    { key: "vendor", header: tx("অ্যাকাউন্ট", "Account"), sort: (e) => vName(e.vendor_id), cell: (e) => <VendorLink id={e.vendor_id} name={vName(e.vendor_id)} /> },
    { key: "type", header: tx("ধরন", "Type"), cell: (e) => <StatusPill tone={e.amount < 0 ? "bad" : "ok"}>{L(entryTypeLabel[e.entry_type])}</StatusPill> },
    { key: "amount", header: tx("টাকা", "Amount"), sort: (e) => e.amount, cell: (e) => <Money value={e.amount} signed /> },
    {
      key: "avail", header: tx("কবে থেকে তোলা যাবে", "Available from"), sort: (e) => e.available_at, hideOnMobile: true,
      cell: (e) => (new Date(e.available_at).getTime() > now ? <StatusPill tone="wait">{dateTime(e.available_at)}</StatusPill> : <span className="text-muted">{dateTime(e.available_at)}</span>),
    },
    {
      key: "note", header: tx("বিবরণ", "Note"),
      cell: (e) => {
        const v = vo(e.vendor_order_id);
        return (
          <span className="text-xs">
            {e.note}
            {v && (
              <>
                {" · "}
                <Link href={`/admin/orders/${v.order_id}`} className="font-semibold text-brand hover:underline">
                  {v.sub_order_no}
                </Link>
              </>
            )}
          </span>
        );
      },
    },
  ];

  const exportCsv = () =>
    downloadCsv("ledger.csv", [
      ["created_at", "vendor_id", "vendor", "entry_type", "amount", "available_at", "sub_order", "note"],
      ...rows.map((e) => [e.created_at, e.vendor_id, vName(e.vendor_id), e.entry_type, e.amount, e.available_at, vo(e.vendor_order_id)?.sub_order_no ?? "", e.note]),
    ]);

  const net = rows.reduce((t, e) => t + e.amount, 0);

  return (
    <DataTable
      rows={rows}
      columns={cols}
      rowKey={(e) => e.id}
      search={(e) => `${e.note} ${vName(e.vendor_id)} ${vo(e.vendor_order_id)?.sub_order_no ?? ""}`}
      caption={
        <span>
          {tx("সব টাকার চলাচল", "All money movements")} · {tx("নিট", "Net")} <Money value={net} signed />
        </span>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterSelect label={tx("বিক্রেতা", "Seller")} value={vendor} onChange={setVendor} options={[{ value: "all", label: tx("সব বিক্রেতা", "All sellers") }, ...s.vendors.map((v) => ({ value: v.id, label: v.shop_name_bn }))]} />
          <FilterSelect<LedgerEntryType | "all">
            label={tx("ধরন", "Type")}
            value={type}
            onChange={setType}
            options={[{ value: "all", label: tx("সব ধরন", "All types") }, ...(Object.keys(entryTypeLabel) as LedgerEntryType[]).map((k) => ({ value: k, label: L(entryTypeLabel[k]) }))]}
          />
          {(["all", "7", "30", "90"] as Range[]).map((r) => (
            <FilterChip key={r} active={range === r} onClick={() => setRange(r)}>
              {r === "all" ? tx("সব সময়", "All time") : tx(`${r} দিন`, `${r}d`)}
            </FilterChip>
          ))}
          <FilterSelect<Sign>
            label={tx("চিহ্ন", "Sign")}
            value={sign}
            onChange={setSign}
            options={[
              { value: "all", label: tx("জমা ও খরচ", "Credit & debit") },
              { value: "credit", label: tx("শুধু জমা (+)", "Credits (+)") },
              { value: "debit", label: tx("শুধু খরচ (−)", "Debits (−)") },
            ]}
          />
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={!rows.length}>
            <Download className="size-4" /> CSV
          </Button>
        </div>
      }
    />
  );
}
