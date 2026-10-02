"use client";

import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { type Column, DataTable, ReasonSheet } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { toast, useNow } from "@/components/shared/Misc";
import { Button, Notice, StatusPill } from "@/components/ui/primitives";
import { audit, verifyPayment } from "@/lib/db/actions";
import { useAdminSettings } from "@/lib/db/actions-admin-core";
import type { DB } from "@/lib/db/seed";
import { slaTone } from "@/lib/rules";
import type { Order, Payment } from "@/lib/types";
import { manualAdvanceCap, notifyPaymentResult } from "./overlay";
import { Money, OrderLink, useStaff } from "./shared";

export interface PayRow {
  order: Order;
  p: Payment;
  dups: { order: Order; p: Payment }[];
  cap: number;
  over: boolean;
}

const HOUR = 3_600_000;

/** All submitted manual bKash/Nagad payments with duplicate-TrxID and 10% cap checks. */
export const buildPayRows = (s: DB, percent: number): PayRow[] => {
  const all = s.orders.flatMap((order) => order.payments.map((p) => ({ order, p })));
  return all
    .filter(({ p }) => p.status === "submitted" && (p.method === "bkash_manual" || p.method === "nagad_manual"))
    .map(({ order, p }) => {
      const trx = p.transaction_id?.trim().toUpperCase();
      const dups = trx ? all.filter((x) => x.p.id !== p.id && x.p.transaction_id?.trim().toUpperCase() === trx) : [];
      const cap = manualAdvanceCap(order.grand_total, percent);
      return { order, p, dups, cap, over: p.amount > cap };
    })
    .sort((a, b) => a.p.created_at.localeCompare(b.p.created_at));
};

type SheetState = { kind: "reject" | "override"; row: PayRow } | null;

export function PaymentsQueue({ rows }: { rows: PayRow[] }) {
  const { tx, d, ago, taka, num } = useT();
  const set = useAdminSettings();
  const now = useNow();
  const { isSuper } = useStaff();
  const [sheet, setSheet] = useState<SheetState>(null);

  const verify = (r: PayRow, note?: string) => {
    verifyPayment(r.order.id, r.p.id, true);
    if (note) audit(r.over ? "১০% সীমা ওভাররাইড করে পেমেন্ট যাচাই" : "ডুপ্লিকেট TrxID সত্ত্বেও যাচাই", `${r.order.order_no} · ${r.p.transaction_id} · ${note}`);
    notifyPaymentResult(r.order.id, true);
    toast(tx("পেমেন্ট যাচাই হয়েছে", "Payment verified"));
  };

  const columns: Column<PayRow>[] = [
      {
        key: "order", header: tx("অর্ডার", "Order"), sort: (r) => r.order.order_no,
        cell: (r) => (
          <div>
            <OrderLink id={r.order.id} no={r.order.order_no} />
            <p className="text-xs text-muted">{r.order.customer_name}</p>
          </div>
        ),
      },
      { key: "method", header: tx("মাধ্যম", "Method"), cell: (r) => <StatusPill tone="info">{r.p.method === "bkash_manual" ? "bKash" : "Nagad"}</StatusPill> },
      {
        key: "trx", header: "TrxID", sort: (r) => r.p.transaction_id ?? "",
        cell: (r) => (
          <div>
            <span className="font-mono font-bold">{r.p.transaction_id ?? "—"}</span>
            {r.dups.length > 0 && (
              <p className="mt-1 flex items-center gap-1 text-xs font-bold text-bad">
                <AlertTriangle className="size-3.5" aria-hidden />
                {tx("ডুপ্লিকেট TrxID", "Duplicate TrxID")}: {r.dups.map((x) => `${x.order.order_no} (${x.p.status})`).join(", ")}
              </p>
            )}
          </div>
        ),
      },
      { key: "sender", header: tx("প্রেরক নম্বর", "Sender"), cell: (r) => <span className="font-mono">{r.p.sender_number ? d(r.p.sender_number) : "—"}</span>, hideOnMobile: true },
      {
        key: "amount", header: tx("পরিমাণ", "Amount"), sort: (r) => r.p.amount,
        cell: (r) => (
          <div>
            <Money value={r.p.amount} />
            <p className={r.over ? "text-xs font-bold text-bad" : "text-xs text-muted"}>
              {r.over
                ? tx(`${num(set.manual_advance_max_percent)}% সীমার বেশি! সর্বোচ্চ ${taka(r.cap)}`, `Over ${set.manual_advance_max_percent}% cap! Max ${taka(r.cap)}`)
                : tx(`সীমা ${taka(r.cap)} (মোট ${taka(r.order.grand_total)})`, `Cap ${taka(r.cap)} (total ${taka(r.order.grand_total)})`)}
            </p>
          </div>
        ),
      },
      {
        key: "age", header: tx("কতক্ষণ", "Age"), sort: (r) => r.p.created_at,
        cell: (r) => {
          const tone = slaTone(new Date(new Date(r.p.created_at).getTime() + 4 * HOUR).toISOString(), now, 2);
          return <StatusPill tone={tone === "late" ? "bad" : tone === "warn" ? "wait" : "ok"}>{ago(r.p.created_at)}</StatusPill>;
        },
      },
      {
        key: "act", header: tx("কাজ", "Action"),
        cell: (r) => {
          const needsOverride = r.over || r.dups.length > 0;
          const blocked = r.over && !isSuper;
          return (
            <div className="flex flex-wrap gap-1.5">
              <Button size="sm" variant="ok" disabled={blocked} onClick={() => (needsOverride ? setSheet({ kind: "override", row: r }) : verify(r))} title={blocked ? tx("সীমার বেশি: শুধু সুপার অ্যাডমিন নোট দিয়ে যাচাই করতে পারেন", "Over cap: only a super admin can override with a note") : undefined}>
                <CheckCircle2 className="size-4" /> {needsOverride ? tx("নোটসহ যাচাই", "Verify with note") : tx("যাচাই", "Verify")}
              </Button>
              <Button size="sm" variant="danger" onClick={() => setSheet({ kind: "reject", row: r })}>
                <XCircle className="size-4" /> {tx("বাতিল", "Reject")}
              </Button>
              {blocked && <p className="w-full text-xs font-semibold text-bad">{tx("সিস্টেম আটকেছে (আইনি ১০% সীমা)", "Blocked by system (legal cap)")}</p>}
            </div>
          );
        },
      },
  ];

  return (
    <>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.p.id}
        search={(r) => `${r.order.order_no} ${r.p.transaction_id ?? ""} ${r.p.sender_number ?? ""} ${r.order.customer_name}`}
        searchPlaceholder={tx("অর্ডার, TrxID বা নম্বর", "Order, TrxID or number")}
        rowClassName={(r) => (r.over || r.dups.length ? "bg-bad-soft/40" : undefined)}
        empty={tx("যাচাই বাকি কোনো পেমেন্ট নেই 🎉", "No payments waiting 🎉")}
        caption={tx("যাচাই বাকি bKash/Nagad পেমেন্ট", "Manual bKash/Nagad awaiting verification")}
      />
      <ReasonSheet
        open={sheet?.kind === "reject"}
        onClose={() => setSheet(null)}
        title={tx("পেমেন্ট বাতিল", "Reject payment")}
        presets={[tx("TrxID পাওয়া যায়নি", "TrxID not found"), tx("টাকার পরিমাণ মেলেনি", "Amount mismatch"), tx("ডুপ্লিকেট TrxID", "Duplicate TrxID"), tx("আইনি ১০% সীমার বেশি", "Over legal 10% cap")]}
        confirmLabel={tx("বাতিল করুন ও কাস্টমারকে জানান", "Reject and tell customer")}
        onSubmit={(reason) => {
          if (!sheet) return;
          verifyPayment(sheet.row.order.id, sheet.row.p.id, false);
          audit("পেমেন্ট বাতিলের কারণ", `${sheet.row.order.order_no} · ${sheet.row.p.transaction_id} · ${reason}`);
          notifyPaymentResult(sheet.row.order.id, false, reason);
          toast(tx("বাতিল হয়েছে, কাস্টমারকে জানানো হয়েছে", "Rejected, customer notified"), "info");
        }}
      >
        {sheet && (
          <p className="text-sm">
            {sheet.row.order.order_no} · <span className="font-mono">{sheet.row.p.transaction_id}</span> · {taka(sheet.row.p.amount)}
          </p>
        )}
      </ReasonSheet>
      <ReasonSheet
        open={sheet?.kind === "override"}
        onClose={() => setSheet(null)}
        tone="ok"
        title={tx("সতর্কতা সত্ত্বেও যাচাই", "Verify despite warning")}
        label={tx("নোট (কেন যাচাই করছেন, বাধ্যতামূলক)", "Note (why you verify, required)")}
        minLength={8}
        confirmLabel={tx("নোটসহ যাচাই করুন", "Verify with note")}
        onSubmit={(note) => sheet && verify(sheet.row, note)}
      >
        {sheet?.row.over && (
          <Notice tone="bad">
            {tx(
              `আইন অনুযায়ী ম্যানুয়াল অগ্রিম সর্বোচ্চ ${num(set.manual_advance_max_percent)}%। শুধু সুপার অ্যাডমিন ব্যতিক্রম অনুমোদন করতে পারেন; অডিট লগে থাকবে।`,
              `Manual advance is legally capped at ${set.manual_advance_max_percent}%. Only a super admin may override; this is audit-logged.`,
            )}
          </Notice>
        )}
        {sheet && sheet.row.dups.length > 0 && <Notice tone="bad">{tx("এই TrxID আগে অন্য পেমেন্টে ব্যবহার হয়েছে। bKash/Nagad স্টেটমেন্টে মিলিয়ে নিন।", "This TrxID was used in another payment. Check the wallet statement.")}</Notice>}
      </ReasonSheet>
    </>
  );
}
