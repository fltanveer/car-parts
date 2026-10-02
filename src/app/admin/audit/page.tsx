"use client";

import { Lock } from "lucide-react";
import { AdminPage } from "@/components/admin/core";
import { AuditLogTable } from "@/components/admin/core/system/AuditLogTable";
import { useStaffAccess } from "@/components/admin/core/system/permissions";
import { useT } from "@/components/providers/LangProvider";
import { Notice } from "@/components/ui/primitives";

export default function AuditPage() {
  const { tx } = useT();
  const { canView } = useStaffAccess("audit");
  return (
    <AdminPage
      title={tx("অডিট লগ", "Audit log")}
      subtitle={tx("কে কখন কী বদলেছে; সংবেদনশীল কাজ লাল দাগে", "Who changed what and when; sensitive actions in red")}
      guide={tx(
        "সবচেয়ে নতুন কাজ উপরে। উপরের চিপ দিয়ে সময় বাছুন, স্টাফ বা ধরন দিয়ে ছাঁকুন। লাল সারি মানে সংবেদনশীল কাজ, যেমন কমিশন বদল, স্থগিত, রিফান্ড, পেআউট বা কাগজ দেখা। CSV বাটনে ডাউনলোড।",
        "Newest first. Use the chips for time range and the selects for staff or category. Red rows are sensitive actions like commission changes, suspensions, refunds, payouts or document views. CSV downloads the filtered list.",
      )}
    >
      {canView ? (
        <AuditLogTable />
      ) : (
        <Notice tone="bad" className="flex items-start gap-2">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
          {tx("অডিট লগ দেখার অনুমতি শুধু সুপার অ্যাডমিন, অপারেশনস ও ট্রাস্ট অ্যান্ড সেফটির। উপরের স্টাফ বদলে দেখুন।", "Only super admin, ops and trust & safety can view the audit log. Switch staff in the header.")}
        </Notice>
      )}
    </AdminPage>
  );
}
