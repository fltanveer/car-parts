"use client";

import { DonorFlow } from "@/components/seller/add/DonorFlow";
import { SellerGate, useVendor } from "@/components/seller/Gate";

function Inner() {
  const v = useVendor()!;
  return <DonorFlow vendor={v} />;
}

export default function Page() {
  return (
    <SellerGate>
      <Inner />
    </SellerGate>
  );
}
