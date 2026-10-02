"use client";

import { SellerGate, useVendor } from "@/components/seller/Gate";
import { ShopSettings } from "@/components/seller/shop/ShopSettings";

function Inner() {
  const v = useVendor()!;
  return <ShopSettings vendor={v} />;
}

export default function Page() {
  return (
    <SellerGate>
      <Inner />
    </SellerGate>
  );
}
