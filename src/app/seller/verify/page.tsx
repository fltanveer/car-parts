"use client";

import { SellerGate, useVendor } from "@/components/seller/Gate";
import { VerifyPage } from "@/components/seller/verify/VerifyPage";

function Inner() {
  const v = useVendor()!;
  return <VerifyPage vendor={v} />;
}

export default function Page() {
  return (
    <SellerGate>
      <Inner />
    </SellerGate>
  );
}
