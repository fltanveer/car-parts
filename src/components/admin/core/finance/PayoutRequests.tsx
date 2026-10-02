"use client";

import { CheckCircle2, ThumbsUp, XCircle } from "lucide-react";
import { useState } from "react";
import { type Column, DataTable, ReasonSheet } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, StatusPill } from "@/components/ui/primitives";
import { vendorBalance } from "@/lib/db/queries";
import type { DB } from "@/lib/db/seed";
import type { Payout } from "@/lib/types";
import { approvePayoutRequest, payPayoutRequest, rejectPayoutRequest } from "./overlay";
import { maskWallet, Money, VendorLink } from "./shared";

type Sheet = { kind: "pay" | "reject"; p: Payout } | null;

/** Manual payout requests from sellers + paid history (file 03 13.4). */
export function PayoutRequests({ s, now }: { s: DB; now: number }) {
  const { tx, dateTime, ago } = useT();
  const [sheet, setSheet] = useState<Sheet>(null);
  const vendor = (id: string) => s.vendors.find((v) => v.id === id);
  const method = (p: Payout) => vendor(p.vendor_id)?.payout_methods.find((m) => m.id === p.method_id) ?? null;
  const requests = s.payouts.filter((p) => p.status === "requested" || p.status === "processing");
  const history = s.payouts.filter((p) => p.status === "paid" || p.status === "failed");

  const base: Column<Payout>[] = [
    { key: "shop", header: tx("দোকান", "Shop"), sort: (p) => vendor(p.vendor_id)?.shop_name ?? "", cell: (p) => <VendorLink id={p.vendor_id} name={vendor(p.vendor_id)?.shop_name_bn ?? p.vendor_id} /> },
    { key: "amount", header: tx("পরিমাণ", "Amount"), sort: (p) => p.amount, cell: (p) => <Money value={p.amount} /> },
    {
      key: "method", header: tx("মাধ্যম", "Method"),
      cell: (p) => {
        const m = method(p);
        return m ? (
          <span className="text-xs">
            {m.method} {maskWallet(m.last4)} {!m.verified && <StatusPill tone="bad">{tx("অযাচাইকৃত", "Unverified")}</StatusPill>}
          </span>
        ) : "—";
      },
    },
  ];

  const reqCols: Column<Payout>[] = [
    ...base,
    { key: "bal", header: tx("এখন available", "Available now"), cell: (p) => <Money value={vendorBalance(s, p.vendor_id, now).available + p.amount} /> },
    { key: "age", header: tx("কবে", "When"), sort: (p) => p.created_at, cell: (p) => ago(p.created_at) },
    { key: "st", header: tx("অবস্থা", "Status"), cell: (p) => <StatusPill tone="wait">{p.status === "requested" ? tx("অনুরোধ", "Requested") : tx("প্রক্রিয়াধীন", "Processing")}</StatusPill> },
    {
      key: "act", header: tx("কাজ", "Action"),
      cell: (p) => (
        <div className="flex flex-wrap gap-1.5">
          {p.status === "requested" && (
            <Button size="sm" variant="outline" onClick={() => { approvePayoutRequest(p.id); toast(tx("অনুমোদিত", "Approved")); }}>
              <ThumbsUp className="size-4" /> {tx("অনুমোদন", "Approve")}
            </Button>
          )}
          <Button size="sm" variant="ok" onClick={() => setSheet({ kind: "pay", p })}>
            <CheckCircle2 className="size-4" /> {tx("পরিশোধ", "Pay")}
          </Button>
          <Button size="sm" variant="danger" onClick={() => setSheet({ kind: "reject", p })}>
            <XCircle className="size-4" /> {tx("বাতিল", "Reject")}
          </Button>
        </div>
      ),
    },
  ];

  const histCols: Column<Payout>[] = [
    ...base,
    { key: "ref", header: tx("রেফারেন্স", "Reference"), cell: (p) => <span className="font-mono text-xs">{p.reference ?? "—"}</span> },
    { key: "paid", header: tx("পরিশোধ", "Paid"), sort: (p) => p.paid_at ?? p.created_at, cell: (p) => (p.paid_at ? dateTime(p.paid_at) : "—") },
    { key: "st", header: tx("অবস্থা", "Status"), cell: (p) => <StatusPill tone={p.status === "paid" ? "ok" : "bad"}>{p.status === "paid" ? tx("পরিশোধিত", "Paid") : tx("বাতিল", "Rejected")}</StatusPill> },
  ];

  return (
    <div className="space-y-5">
      <DataTable rows={requests} columns={reqCols} rowKey={(p) => p.id} caption={tx("ম্যানুয়াল পেআউট অনুরোধ", "Manual payout requests")} empty={tx("কোনো অনুরোধ নেই", "No requests")} />
      <DataTable
        rows={history}
        columns={histCols}
        rowKey={(p) => p.id}
        initialSort={{ key: "paid", dir: "desc" }}
        caption={tx("পেআউটের ইতিহাস", "Payout history")}
        search={(p) => `${vendor(p.vendor_id)?.shop_name ?? ""} ${p.reference ?? ""}`}
      />
      <ReasonSheet
        open={sheet?.kind === "pay"}
        onClose={() => setSheet(null)}
        tone="ok"
        title={tx("পেআউট পরিশোধ", "Pay payout")}
        label={tx("bKash/ব্যাংক রেফারেন্স (বাধ্যতামূলক)", "bKash/bank reference (required)")}
        minLength={4}
        confirmLabel={tx("পরিশোধিত মার্ক করুন", "Mark paid")}
        onSubmit={(ref) => {
          if (sheet) payPayoutRequest(sheet.p.id, ref);
          toast(tx("পরিশোধ হয়েছে, বিক্রেতা SMS পেয়েছে", "Paid, seller notified"));
        }}
      />
      <ReasonSheet
        open={sheet?.kind === "reject"}
        onClose={() => setSheet(null)}
        title={tx("অনুরোধ বাতিল", "Reject request")}
        presets={[tx("অ্যাকাউন্ট নম্বর যাচাই হয়নি", "Account not verified"), tx("বিরোধ চলছে, টাকা আটকানো", "Dispute open, funds held"), tx("ব্যালেন্স যথেষ্ট নয়", "Insufficient balance")]}
        confirmLabel={tx("বাতিল করুন", "Reject")}
        onSubmit={(reason) => {
          if (sheet) rejectPayoutRequest(sheet.p.id, reason);
          toast(tx("বাতিল হয়েছে", "Rejected"), "info");
        }}
      />
    </div>
  );
}
