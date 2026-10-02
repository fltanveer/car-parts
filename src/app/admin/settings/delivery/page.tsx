"use client";

import { DeliveryEditor } from "@/components/admin/core/settings/DeliveryEditor";
import { SettingsFrame } from "@/components/admin/core/settings/SettingsFrame";
import { useT } from "@/components/providers/LangProvider";

export default function DeliveryRatesPage() {
  const { tx } = useT();
  return (
    <SettingsFrame
      title={tx("ডেলিভারি রেট", "Delivery rates")}
      subtitle={tx("জোন × সাইজ × পাঠানোর পদ্ধতি, কুরিয়ার খরচ", "Zone × size × fulfillment, courier cost")}
      guide={tx(
        "প্রতিটা ঘরে নতুন টাকা লিখে Enter চাপুন বা বাইরে ট্যাপ করুন, সাথে সাথে সেভ হবে। মার্জিন লাল হলে কাস্টমারের চার্জ কুরিয়ার খরচের চেয়ে কম।",
        "Type a new amount and press Enter or tap outside to save. A red margin means the customer charge is below the courier cost.",
      )}
    >
      {(canEdit) => <DeliveryEditor canEdit={canEdit} />}
    </SettingsFrame>
  );
}
