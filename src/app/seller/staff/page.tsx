"use client";

import { SellerGate, useVendor } from "@/components/seller/Gate";
import { StaffPage } from "@/components/seller/staff/StaffPage";

function Inner() {
  const v = useVendor()!;
  return <StaffPage vendor={v} />;
}

export default function Page() {
  return (
    <SellerGate>
      <Inner />
    </SellerGate>
  );
}
