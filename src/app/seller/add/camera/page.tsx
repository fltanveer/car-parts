"use client";

import { CameraFlow } from "@/components/seller/add/CameraFlow";
import { SellerGate, useVendor } from "@/components/seller/Gate";

// Photo-first upload, 8 steps (file 04 §9.2).
function Inner() {
  const v = useVendor()!;
  return <CameraFlow vendor={v} />;
}

export default function Page() {
  return (
    <SellerGate>
      <Inner />
    </SellerGate>
  );
}
