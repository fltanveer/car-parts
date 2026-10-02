"use client";

import { useParams } from "next/navigation";
import { AdminPage, PhaseNotice } from "@/components/admin/core";
import { CarReview } from "@/components/admin/core/system/CarReview";
import { InterestButton } from "@/components/admin/core/system/InterestButton";
import { useT } from "@/components/providers/LangProvider";

export default function CarAdReviewPage() {
  const { tx } = useT();
  const { id } = useParams<{ id: string }>();
  return (
    <AdminPage
      back="/admin/cars"
      title={tx("বিজ্ঞাপন পর্যালোচনা", "Ad review")}
      subtitle={tx("ফেজ ২ · নমুনা বিজ্ঞাপন", "Phase 2 · sample ad")}
      guide={tx(
        "ডান পাশের চেকলিস্টের প্রতিটা ঘরে টিক দিন, কাগজ ঠিক থাকলে 'ঠিক আছে' চাপুন। সব টিক হলে অনুমোদন বাটন চালু হবে। এটা নমুনা, ফেজ ২-এ আসল হবে।",
        "Tick every item in the checklist and press Valid for good papers. Approve turns on when all are ticked. This is a sample; it goes live in phase 2.",
      )}
    >
      <PhaseNotice phase={2} />
      <CarReview key={id} id={id} />
      <InterestButton service="admin_cars" />
    </AdminPage>
  );
}
