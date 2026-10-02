"use client";

import { CameraFlow } from "@/components/seller/add/CameraFlow";
import { SellerGate, useVendor } from "@/components/seller/Gate";

// ➕ opens the camera path directly; other methods are tabs on top (file 02 §5).
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
