"use client";

import { useState } from "react";
import { AdminPage, KpiCard, KpiGrid } from "@/components/admin/core";
import { PaymentHistory, paymentRows } from "@/components/admin/core/finance/PaymentHistory";
import { buildPayRows, PaymentsQueue } from "@/components/admin/core/finance/PaymentsQueue";
import { selectAll } from "@/components/admin/core/finance/shared";
import { useT } from "@/components/providers/LangProvider";
import { Tabs } from "@/components/ui/primitives";
import { useAdminSettings } from "@/lib/db/actions-admin-core";
import { useDb } from "@/lib/db/store";

export default function PaymentsPage() {
  const { tx, d, taka, num } = useT();
  const set = useAdminSettings();
  const s = useDb(selectAll);
  const [tab, setTab] = useState<"queue" | "history">("queue");
  const queue = buildPayRows(s, set.manual_advance_max_percent);
  const all = paymentRows(s);
  const dup = queue.filter((r) => r.dups.length).length;
  const over = queue.filter((r) => r.over).length;

  return (
    <AdminPage
      title={tx("পেমেন্ট যাচাই", "Payment verification")}
      subtitle={tx("ম্যানুয়াল bKash/Nagad Send Money, Transaction ID মিলিয়ে", "Manual bKash/Nagad Send Money, matched by Transaction ID")}
      back="/admin/finance"
      guide={tx(
        `bKash বা Nagad অ্যাপের স্টেটমেন্টে Transaction ID ও টাকার পরিমাণ মিলিয়ে "যাচাই" চাপুন। লাল সারি মানে সমস্যা: একই TrxID আগে ব্যবহার হয়েছে, অথবা টাকা আইনি ${num(set.manual_advance_max_percent)}% সীমার বেশি। সীমার বেশি হলে সিস্টেম আটকে দেয়, শুধু সুপার অ্যাডমিন নোট লিখে ছাড় দিতে পারেন। না মিললে "বাতিল" চাপুন, কারণ বাছুন, কাস্টমার SMS পাবে।`,
        `Match the Transaction ID and amount in the bKash/Nagad statement, then press Verify. Red rows have a problem: the TrxID was used before, or the amount is over the legal ${set.manual_advance_max_percent}% cap. Over-cap payments are blocked; only a super admin can override with a note. If it doesn't match press Reject and pick a reason; the customer gets an SMS.`,
      )}
    >
      <KpiGrid>
        <KpiCard label={tx("যাচাই বাকি", "Waiting")} value={d(queue.length)} tone={queue.length ? "wait" : "ok"} icon="💳" />
        <KpiCard label={tx("মোট টাকা", "Total amount")} value={taka(queue.reduce((t, r) => t + r.p.amount, 0))} />
        <KpiCard label={tx("ডুপ্লিকেট TrxID", "Duplicate TrxID")} value={d(dup)} tone={dup ? "bad" : "ok"} icon="⚠️" />
        <KpiCard label={tx(`${num(set.manual_advance_max_percent)}% সীমার বেশি`, `Over ${set.manual_advance_max_percent}% cap`)} value={d(over)} tone={over ? "bad" : "ok"} icon="⚖️" />
      </KpiGrid>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "queue", label: tx("যাচাই কিউ", "Verification queue"), count: queue.length },
          { value: "history", label: tx("গেটওয়ে ও ইতিহাস", "Gateway & history") },
        ]}
      />
      {tab === "queue" ? <PaymentsQueue rows={queue} /> : <PaymentHistory rows={all} />}
    </AdminPage>
  );
}
