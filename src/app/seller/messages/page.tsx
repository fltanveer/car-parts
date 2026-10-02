"use client";

import { SellerGate, useVendorId } from "@/components/seller/Gate";
import { ThreadList } from "@/components/seller/messages/ThreadList";

function Inner() {
  const vid = useVendorId();
  return <ThreadList vendorId={vid} />;
}

export default function Page() {
  return (
    <SellerGate>
      <Inner />
    </SellerGate>
  );
}
