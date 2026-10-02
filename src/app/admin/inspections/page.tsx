"use client";

import { AdminPage, PhaseNotice } from "@/components/admin/core";
import { ChecklistEditor } from "@/components/admin/core/system/ChecklistEditor";
import { InspectionQueue } from "@/components/admin/core/system/InspectionQueue";
import { InterestButton } from "@/components/admin/core/system/InterestButton";
import { useStaffAccess } from "@/components/admin/core/system/permissions";
import { useT } from "@/components/providers/LangProvider";

export default function InspectionsPage() {
  const { tx } = useT();
  const { canEdit } = useStaffAccess("cars");
  return (
    <AdminPage
      title={tx("ইন্সপেকশন", "Inspections")}
      subtitle={tx("গাড়ি পরীক্ষা সেবা · ফেজ ২", "Car inspection service · Phase 2")}
      guide={tx(
        "ইন্সপেকশন ফেজ ২-এ চালু হবে। নিচে নমুনা বুকিং কিউ, যেখানে ইন্সপেক্টর বাছাই করা যায়। চেকলিস্ট টেমপ্লেটে বিভাগ বেছে পয়েন্ট যোগ বা মুছুন; প্রতিটা পয়েন্টে ইন্সপেক্টর সবুজ, হলুদ বা লাল দেবেন।",
        "Inspections launch in phase 2. Below is a sample booking queue where you can pick inspectors. In the checklist template pick a section to add or remove points; inspectors rate each point green, yellow or red.",
      )}
    >
      <PhaseNotice phase={2}>
        {tx("ইন্সপেকশন সেবা এখনো চালু হয়নি। বুকিং নমুনা; চেকলিস্ট টেমপ্লেট এখনই তৈরি করে রাখা যায়।", "Inspections are not live yet. Bookings are samples; the checklist template can be prepared now.")}
      </PhaseNotice>
      <InterestButton service="admin_inspections" />
      <InspectionQueue />
      <ChecklistEditor canEdit={canEdit} />
    </AdminPage>
  );
}
