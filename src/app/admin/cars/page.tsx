"use client";

import { AdminPage, PhaseNotice } from "@/components/admin/core";
import { CarsPreview } from "@/components/admin/core/system/CarsPreview";
import { InterestButton } from "@/components/admin/core/system/InterestButton";
import { useT } from "@/components/providers/LangProvider";
import { StatusPill } from "@/components/ui/primitives";
import { useAdminSettings } from "@/lib/db/actions-admin-core";

export default function CarsAdminPage() {
  const { tx } = useT();
  const s = useAdminSettings();
  return (
    <AdminPage
      title={tx("গাড়ির বিজ্ঞাপন", "Car ads")}
      subtitle={tx("গাড়ি কেনাবেচা মডিউল · ফেজ ২", "Car marketplace module · Phase 2")}
      guide={tx(
        "এই মডিউল ফেজ ২-এ চালু হবে। নিচে নমুনা দিয়ে দেখানো হলো কী কী কাজ থাকবে: নতুন বিজ্ঞাপন অনুমোদন, কাগজ যাচাই করে ব্যাজ দেওয়া আর প্রতারণার সংকেত দেখা। চালু হলে জানতে নীল বাটন চাপুন।",
        "This module launches in phase 2. The samples below show the planned work: approving new ads, verifying papers to give badges, and watching fraud signals. Press the blue button to be notified.",
      )}
      actions={<StatusPill tone={s.feature_flags.cars ? "ok" : "info"}>{s.feature_flags.cars ? tx("ফ্ল্যাগ চালু", "Flag on") : tx("ফ্ল্যাগ বন্ধ", "Flag off")}</StatusPill>}
    >
      <PhaseNotice phase={2}>
        {tx("গাড়ির বিজ্ঞাপন এখনো চালু হয়নি। নিচের সব তালিকা নমুনা, আসল ডেটা নয়।", "Car ads are not live yet. All lists below are samples, not real data.")}
      </PhaseNotice>
      <InterestButton service="admin_cars" />
      <CarsPreview />
    </AdminPage>
  );
}
