"use client";

import { ShieldCheck } from "lucide-react";
import { type Column, DataTable, Panel } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { EmptyState, StatusPill } from "@/components/ui/primitives";
import type { DB } from "@/lib/db/seed";
import type { Order, Payment } from "@/lib/types";
import { Money, OrderLink, useStaff } from "./shared";

type Row = { order: Order; p: Payment };

const methodName = (m: Payment["method"]) => ({ cod: "COD", bkash_manual: "bKash", nagad_manual: "Nagad", gateway: "Gateway" })[m];

export const paymentRows = (s: DB) => s.orders.flatMap((order) => order.payments.map((p) => ({ order, p })));

/** Gateway failures (only failed/suspicious come to the queue) + verified/rejected history. */
export function PaymentHistory({ rows }: { rows: Row[] }) {
  const { tx, dateTime } = useT();
  const { nameOf } = useStaff();
  const failures = rows.filter((r) => r.p.method === "gateway" && (r.p.status === "failed" || r.p.status === "rejected"));
  const history = rows.filter((r) => r.p.status === "verified" || r.p.status === "rejected" || r.p.status === "refunded").sort((a, b) => b.p.created_at.localeCompare(a.p.created_at));

  const cols: Column<Row>[] = [
    { key: "order", header: tx("অর্ডার", "Order"), sort: (r) => r.order.order_no, cell: (r) => <OrderLink id={r.order.id} no={r.order.order_no} /> },
    { key: "method", header: tx("মাধ্যম", "Method"), cell: (r) => methodName(r.p.method) },
    { key: "trx", header: "TrxID", cell: (r) => <span className="font-mono">{r.p.transaction_id ?? "—"}</span> },
    { key: "amount", header: tx("পরিমাণ", "Amount"), sort: (r) => r.p.amount, cell: (r) => <Money value={r.p.amount} /> },
    {
      key: "status", header: tx("অবস্থা", "Status"),
      cell: (r) => (
        <StatusPill tone={r.p.status === "verified" ? "ok" : r.p.status === "refunded" ? "info" : "bad"}>
          {{ verified: tx("যাচাই হয়েছে", "Verified"), rejected: tx("বাতিল", "Rejected"), failed: tx("ব্যর্থ", "Failed"), refunded: tx("ফেরত", "Refunded"), submitted: tx("জমা", "Submitted"), initiated: tx("শুরু", "Initiated") }[r.p.status]}
        </StatusPill>
      ),
    },
    { key: "by", header: tx("কে", "By"), cell: (r) => (r.p.method === "gateway" ? tx("স্বয়ংক্রিয়", "Automatic") : nameOf(r.p.verified_by)), hideOnMobile: true },
    { key: "at", header: tx("সময়", "Time"), sort: (r) => r.p.created_at, cell: (r) => dateTime(r.p.created_at), hideOnMobile: true },
  ];

  return (
    <div className="space-y-5">
      <Panel title={tx("গেটওয়ে: ব্যর্থ / সন্দেহজনক", "Gateway: failed / suspicious")}>
        {failures.length ? (
          <DataTable rows={failures} columns={cols} rowKey={(r) => r.p.id} />
        ) : (
          <EmptyState
            icon={<ShieldCheck className="size-7" />}
            title={tx("কোনো ব্যর্থ গেটওয়ে পেমেন্ট নেই", "No failed gateway payments")}
            body={tx(
              "গেটওয়ে (এসক্রো) পেমেন্ট স্বয়ংক্রিয়ভাবে যাচাই হয়। শুধু ব্যর্থ বা সন্দেহজনকগুলো এখানে আসবে। গেটওয়ে এখনো ফিচার ফ্ল্যাগে বন্ধ থাকলে এই তালিকা খালি থাকবে।",
              "Gateway (escrow) payments verify automatically. Only failed or suspicious ones land here. While the gateway feature flag is off this list stays empty.",
            )}
          />
        )}
      </Panel>
      <DataTable
        rows={history}
        columns={cols}
        rowKey={(r) => r.p.id}
        caption={tx("যাচাই/বাতিলের ইতিহাস", "Verified / rejected history")}
        search={(r) => `${r.order.order_no} ${r.p.transaction_id ?? ""}`}
        empty={tx("এখনো কিছু নেই", "Nothing yet")}
      />
    </div>
  );
}
