"use client";

import { CatalogFlow } from "@/components/seller/add/CatalogFlow";
import { SellerGate, useVendor } from "@/components/seller/Gate";

function Inner() {
  const v = useVendor()!;
  return <CatalogFlow vendor={v} />;
}

export default function Page() {
  return (
    <SellerGate>
      <Inner />
    </SellerGate>
  );
}
