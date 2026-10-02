"use client";

import { AdminPage, KpiCard, KpiGrid, Panel } from "@/components/admin/core";
import { financeOverlay } from "@/components/admin/core/finance/overlay";
import { PayoutBatchPanel } from "@/components/admin/core/finance/PayoutBatchPanel";
import { PayoutRequests } from "@/components/admin/core/finance/PayoutRequests";
import { effectiveNow, selectAll } from "@/components/admin/core/finance/shared";
import { useT } from "@/components/providers/LangProvider";
import { useNow } from "@/components/shared/Misc";
import { useAdminSettings } from "@/lib/db/actions-admin-core";
import { useDb } from "@/lib/db/store";

const DAY_NAMES = [
  ["রবিবার", "Sunday"], ["সোমবার", "Monday"], ["মঙ্গলবার", "Tuesday"], ["বুধবার", "Wednesday"], ["বৃহস্পতিবার", "Thursday"], ["শুক্রবার", "Friday"], ["শনিবার", "Saturday"],
];

export default function PayoutsPage() {
  const { tx, d, taka } = useT();
  const set = useAdminSettings();
  const s = useDb(selectAll);
  const now = effectiveNow(s, useNow());
  const batches = financeOverlay.useStore((o) => o.payoutBatches);
  const requests = s.payouts.filter((p) => p.status === "requested" || p.status === "processing");
  const paid30 = s.payouts.filter((p) => p.status === "paid" && p.paid_at && now - new Date(p.paid_at).getTime() < 30 * 86_400_000);
  const day = DAY_NAMES[set.payout_day] ?? DAY_NAMES[0];

  return (
    <AdminPage
      title={tx("বিক্রেতা পেআউট", "Seller payouts")}
      subtitle={tx(`সাপ্তাহিক ব্যাচ প্রতি ${day[0]}`, `Weekly batch every ${day[1]}`)}
      back="/admin/finance"
      guide={tx(
        "প্রতি সপ্তাহে একবার: তালিকা দেখুন, লাল সারির অ্যাকাউন্ট নম্বর ফোনে নিশ্চিত করুন, যাদের টাকা আটকাতে হবে তাদের 'আটকান' চাপুন। তারপর bKash বাল্ক ফাইল ডাউনলোড করে পাঠান, পাঠানো হলে রেফারেন্স লিখে 'পরিশোধ হয়েছে' চাপুন। বিক্রেতারা SMS পাবে, লেজারে এন্ট্রি হবে। নিচে বিক্রেতাদের আলাদা অনুরোধ আছে।",
        "Once a week: review the list, confirm red-row account numbers by phone, hold anyone who must wait. Download the bKash bulk file and send, then type the reference and press Mark paid. Sellers get an SMS and the ledger is updated. Individual seller requests are below.",
      )}
    >
      <KpiGrid>
        <KpiCard label={tx("অনুরোধ বাকি", "Requests waiting")} value={d(requests.length)} tone={requests.length ? "wait" : "ok"} icon="🙋" />
        <KpiCard label={tx("৩০ দিনে পরিশোধ", "Paid in 30 days")} value={taka(paid30.reduce((t, p) => t + p.amount, 0))} sub={tx(`${d(paid30.length)}টা পেআউট`, `${paid30.length} payouts`)} />
        <KpiCard label={tx("ন্যূনতম পেআউট", "Minimum payout")} value={taka(set.payout_min)} />
        <KpiCard label={tx("শেষ ব্যাচ", "Last batch")} value={batches[0] ? taka(batches[0].total) : "—"} sub={batches[0]?.reference} />
      </KpiGrid>
      <Panel title={tx("সাপ্তাহিক ব্যাচ", "Weekly batch")}>
        <PayoutBatchPanel s={s} now={now} />
      </Panel>
      <PayoutRequests s={s} now={now} />
    </AdminPage>
  );
}
