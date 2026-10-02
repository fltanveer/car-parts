"use client";

import { AdminPage } from "@/components/admin/core";
import { CodBatches } from "@/components/admin/core/finance/CodBatches";
import { CodReconcile } from "@/components/admin/core/finance/CodReconcile";
import { selectAll } from "@/components/admin/core/finance/shared";
import { useT } from "@/components/providers/LangProvider";
import { useNow } from "@/components/shared/Misc";
import { useDb } from "@/lib/db/store";

const DAY = 86_400_000;

export default function CodPage() {
  const { tx, date } = useT();
  const s = useDb(selectAll);
  const now = useNow();
  const period = `${date(new Date(now - 7 * DAY).toISOString())} – ${date(new Date(now).toISOString())}`;

  return (
    <AdminPage
      title={tx("COD মেলানো", "COD reconciliation")}
      subtitle={tx("কুরিয়ারের টাকা বনাম সাব-অর্ডারের COD", "Courier remittance vs sub-order COD amounts")}
      back="/admin/finance"
      guide={tx(
        "কুরিয়ার (Pathao, Steadfast…) সপ্তাহে যে টাকার হিসাবের ফাইল পাঠায় সেটা এখানে দিন। সিস্টেম নিজে প্রতিটা পার্সেল মিলিয়ে দেখাবে: সবুজ মানে ঠিক আছে, লাল মানে কম টাকা, ফাইলে নেই, বা অজানা পার্সেল; হলুদ মানে পার্সেল ফেরত এসেছে। শেষে সময়কাল লিখে ব্যাচ সংরক্ষণ করুন।",
        "Upload the weekly remittance file from the courier (Pathao, Steadfast…). The system matches every parcel: green is fine, red means short, missing from the file or unknown; yellow means the parcel came back. Then enter the period and save the batch.",
      )}
    >
      <CodReconcile s={s} defaultPeriod={period} />
      <CodBatches />
    </AdminPage>
  );
}
