"use client";

import { AdminPage } from "@/components/admin/core";
import { AdjustmentPanel } from "@/components/admin/core/finance/AdjustmentPanel";
import { Balances } from "@/components/admin/core/finance/Balances";
import { LedgerTable } from "@/components/admin/core/finance/LedgerTable";
import { effectiveNow, selectAll } from "@/components/admin/core/finance/shared";
import { useT } from "@/components/providers/LangProvider";
import { useNow } from "@/components/shared/Misc";
import { useDb } from "@/lib/db/store";

export default function LedgerPage() {
  const { tx } = useT();
  const s = useDb(selectAll);
  const now = effectiveNow(s, useNow());

  return (
    <AdminPage
      title={tx("লেজার", "Ledger")}
      subtitle={tx("প্রতিটা টাকার চলাচল ও অ্যাকাউন্টের ব্যালেন্স", "Every money movement and account balances")}
      back="/admin/finance"
      guide={tx(
        "এখানে প্রতিটা টাকার চলাচল আছে: বিক্রি, কমিশন, রিফান্ড, পেআউট, জরিমানা, সমন্বয়। সবুজ মানে বিক্রেতার জমা, লাল মানে কাটা। ফিল্টার দিয়ে খুঁজুন, CSV নামাতে পারবেন। হাতে টাকা যোগ বা কাটতে হলে নিচের ফর্মে কারণ লিখে প্রস্তাব দিন; অন্য একজন সুপার অ্যাডমিন অনুমোদন দিলে তবেই লেজারে যাবে।",
        "Every money movement is here: sales, commission, refunds, payouts, penalties, adjustments. Green is a credit to the seller, red a deduction. Filter and export CSV. To add or deduct money manually, propose it below with a reason; it's posted only after a different super admin approves.",
      )}
    >
      <Balances s={s} now={now} />
      <AdjustmentPanel s={s} />
      <LedgerTable s={s} now={now} />
    </AdminPage>
  );
}
