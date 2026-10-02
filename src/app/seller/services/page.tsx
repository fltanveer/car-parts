"use client";

import { useT } from "@/components/providers/LangProvider";
import { ComingSoon } from "@/components/seller/ComingSoon";
import { SellerGate, useVendor } from "@/components/seller/Gate";

// Garage / service provider section, phase 2 (file 02 §15).
function Services() {
  const { tx } = useT();
  const v = useVendor()!;
  return (
    <ComingSoon
      vendor={v}
      service="seller_services"
      icon="🧰"
      title={tx("সেবা ও বুকিং", "Services & bookings")}
      items={[
        { icon: "📋", text: tx("সেবার তালিকা: ধরন, দামের সীমা, সময়, বাসায় যান কিনা", "Service list: type, price range, time, home visits") },
        { icon: "📅", text: tx("বুকিং ক্যালেন্ডার: দিনের স্লট, নতুন বুকিং গ্রহণ/বাতিল", "Booking calendar: daily slots, accept/decline") },
        { icon: "🔧", text: tx("পার্টস-ফিটিং বান্ডেল: অর্ডারের পার্টস আপনার গ্যারেজে আসবে", "Parts + fitting bundles delivered to your garage") },
        { icon: "🧾", text: tx("কাজ শেষে চূড়ান্ত দাম, কাস্টমারের অ্যাপে রসিদ", "Final bill and receipt in the customer's app") },
      ]}
    />
  );
}

export default function Page() {
  return (
    <SellerGate>
      <Services />
    </SellerGate>
  );
}
