"use client";

import { useState } from "react";
import { AdminPage, KpiCard, KpiGrid } from "@/components/admin/core";
import { buildRefundRows, RefundQueue } from "@/components/admin/core/finance/RefundQueue";
import { pct, selectAll } from "@/components/admin/core/finance/shared";
import { useT } from "@/components/providers/LangProvider";
import { useNow } from "@/components/shared/Misc";
import { Tabs } from "@/components/ui/primitives";
import { useAdminSettings } from "@/lib/db/actions-admin-core";
import { useDb } from "@/lib/db/store";

export default function RefundsPage() {
  const { tx, d, taka, num } = useT();
  const set = useAdminSettings();
  const s = useDb(selectAll);
  const now = useNow();
  const [tab, setTab] = useState<"pending" | "done">("pending");
  const rows = buildRefundRows(s, set);
  const pending = rows.filter((x) => x.r.status !== "done");
  const done = rows.filter((x) => x.r.status === "done");
  const overdue = pending.filter((x) => new Date(x.r.due_by).getTime() < now).length;
  const onTime = done.filter((x) => x.onTime).length;

  return (
    <AdminPage
      title={tx("রিফান্ড", "Refunds")}
      subtitle={tx("আইনি সময়সীমার টাইমারসহ", "With legal deadline timers")}
      back="/admin/finance"
      guide={tx(
        `প্রতিটা রিফান্ডে আইনি সময়সীমা আছে: সরবরাহ সম্ভব না হলে ${num(set.refund_hours_unfulfillable)} ঘণ্টা, দেরিতে ডেলিভারিতে ${num(set.refund_days_late)} দিন। টাইমার লাল হলে আগে সেটা করুন। যে মাধ্যমে টাকা এসেছিল সেই মাধ্যমেই ফেরত দিন: গেটওয়ে হলে এক চাপে স্বয়ংক্রিয়; bKash/Nagad হলে কাস্টমারের নম্বরে পাঠিয়ে Transaction ID লিখুন। COD অর্ডারে টাকা নেওয়া না হলে রিফান্ড নেই, শুধু বাতিল করে বন্ধ করুন।`,
        `Every refund has a legal deadline: ${set.refund_hours_unfulfillable} hours if unfulfillable, ${set.refund_days_late} days for late delivery. Do red timers first. Refund through the same channel: gateway is one tap; for bKash/Nagad send to the customer's number and type the Transaction ID. COD orders where no cash was collected get no refund, just close them.`,
      )}
    >
      <KpiGrid>
        <KpiCard label={tx("বাকি রিফান্ড", "Pending")} value={d(pending.length)} tone={pending.length ? "wait" : "ok"} icon="💸" sub={taka(pending.reduce((t, x) => t + x.r.amount, 0))} />
        <KpiCard label={tx("সময় পার", "Overdue")} value={d(overdue)} tone={overdue ? "bad" : "ok"} icon="⏰" />
        <KpiCard label={tx("সম্পন্ন", "Processed")} value={d(done.length)} />
        <KpiCard label={tx("সময়সীমার মধ্যে", "Within deadline")} value={done.length ? `${d(pct(onTime, done.length))}%` : "—"} tone={done.length && onTime < done.length ? "bad" : "ok"} />
      </KpiGrid>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "pending", label: tx("বাকি", "Pending"), count: pending.length },
          { value: "done", label: tx("সম্পন্ন", "Done") },
        ]}
      />
      {tab === "pending" ? <RefundQueue key="p" rows={pending} done={false} /> : <RefundQueue key="d" rows={done} done />}
    </AdminPage>
  );
}
