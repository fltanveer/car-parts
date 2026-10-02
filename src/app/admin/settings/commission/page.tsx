"use client";

import { AdminPage } from "@/components/admin/core";
import { CommissionAssign } from "@/components/admin/core/settings/CommissionAssign";
import { CommissionPlans } from "@/components/admin/core/settings/CommissionPlans";
import { ReadOnlyNotice, SettingsNav, useSettingsAccess } from "@/components/admin/core/settings/SettingsNav";
import { useT } from "@/components/providers/LangProvider";

export default function CommissionPage() {
  const { tx } = useT();
  const { canEdit } = useSettingsAccess();
  return (
    <AdminPage
      title={tx("কমিশন প্ল্যান", "Commission plans")}
      subtitle={tx("ডিফল্ট, ক্যাটাগরি অনুযায়ী ও নতুন বিক্রেতার প্রচারমূলক কমিশন", "Default, per-category and new-seller promo commission")}
      guide={tx(
        "ডিফল্ট কমিশন সব বিক্রেতার জন্য। নতুন বিক্রেতারা প্রথম কয়েক মাস প্রচারমূলক কমিশন পায়। নিচে বিক্রেতা আর প্ল্যান বেছে 'প্ল্যান দিন' চাপুন; বিক্রেতা নোটিফিকেশন পাবে।",
        "Default commission applies to all sellers. New sellers get the promo rate for the first months. Pick a seller and plan below and press Assign; the seller is notified.",
      )}
    >
      <SettingsNav />
      <ReadOnlyNotice show={!canEdit} />
      <CommissionPlans canEdit={canEdit} />
      <CommissionAssign canEdit={canEdit} />
    </AdminPage>
  );
}
