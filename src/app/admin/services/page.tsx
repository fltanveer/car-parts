"use client";

import { AdminPage, PhaseNotice } from "@/components/admin/core";
import { InterestButton } from "@/components/admin/core/system/InterestButton";
import { ServicesPreview } from "@/components/admin/core/system/ServicesPreview";
import { useT } from "@/components/providers/LangProvider";
import { StatusPill } from "@/components/ui/primitives";
import { useAdminSettings } from "@/lib/db/actions-admin-core";

export default function ServicesAdminPage() {
  const { tx } = useT();
  const s = useAdminSettings();
  return (
    <AdminPage
      title={tx("সেবা প্রোভাইডার ও বুকিং", "Service providers & bookings")}
      subtitle={tx("গ্যারেজ, ওয়াশ, টোয়িং, কাগজ সহায়তা · ফেজ ২/৩", "Garages, wash, towing, paperwork · Phase 2/3")}
      guide={tx(
        "সেবা মডিউল ফেজ ২-এ আর রাস্তায় সাহায্য ফেজ ৩-এ চালু হবে। নিচের তালিকা নমুনা: প্রোভাইডার যাচাই, বুকিং, বাতিল ও না আসার হার। লাল হার মানে প্রোভাইডারকে সতর্ক করতে হবে।",
        "Services launch in phase 2 and roadside help in phase 3. The lists below are samples: provider verification, bookings, cancel and no-show rates. Red rates mean the provider needs a warning.",
      )}
      actions={<StatusPill tone={s.feature_flags.services ? "ok" : "info"}>{s.feature_flags.services ? tx("ফ্ল্যাগ চালু", "Flag on") : tx("ফ্ল্যাগ বন্ধ", "Flag off")}</StatusPill>}
    >
      <PhaseNotice phase="2/3">
        {tx("সেবা ও বুকিং এখনো চালু হয়নি। সব তালিকা নমুনা, আসল ডেটা নয়।", "Services and bookings are not live yet. All lists are samples, not real data.")}
      </PhaseNotice>
      <InterestButton service="admin_services" />
      <ServicesPreview />
    </AdminPage>
  );
}
