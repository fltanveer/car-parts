"use client";

import { BulkFlow } from "@/components/seller/add/BulkFlow";
import { SellerGate, useVendor } from "@/components/seller/Gate";

function Inner() {
  const v = useVendor()!;
  return <BulkFlow vendor={v} />;
}

export default function Page() {
  return (
    <SellerGate>
      <Inner />
    </SellerGate>
  );
}
