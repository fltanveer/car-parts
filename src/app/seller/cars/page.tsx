"use client";

import { useT } from "@/components/providers/LangProvider";
import { ComingSoon } from "@/components/seller/ComingSoon";
import { SellerGate, useVendor } from "@/components/seller/Gate";

// Car dealer section, phase 2 (file 02 §14).
function Cars() {
  const { tx } = useT();
  const v = useVendor()!;
  return (
    <ComingSoon
      vendor={v}
      service="seller_cars"
      icon="🚙"
      title={tx("গাড়ির বিজ্ঞাপন", "Car ads")}
      items={[
        { icon: "➕", text: tx("একসাথে অনেক গাড়ির বিজ্ঞাপন (নিলাম গ্রেড, চেসিস নম্বর, আমদানির বছর)", "Many car ads at once (auction grade, chassis, import year)") },
        { icon: "📊", text: tx("প্রতিটা গাড়ি কতজন দেখেছে, কতজন আগ্রহী", "Views and interested buyers per car") },
        { icon: "🙋", text: tx("আগ্রহী কাস্টমার (লিড): কথা হয়েছে / দেখতে আসবে / শেষ", "Leads: contacted / visiting / closed") },
        { icon: "🚀", text: tx("প্রচার (Boost) ও সাবস্ক্রিপশন", "Boost and subscriptions") },
        { icon: "📄", text: tx("কাগজ আপলোড করে ✅ ব্যাজ, ইন্সপেকশন অনুরোধ", "Upload papers for ✅ badge, request inspection") },
      ]}
    />
  );
}

export default function Page() {
  return (
    <SellerGate>
      <Cars />
    </SellerGate>
  );
}
