"use client";

import { SellerGate, useVendor } from "@/components/seller/Gate";
import { ProductsList } from "@/components/seller/products/ProductsList";

function Inner() {
  const v = useVendor()!;
  return <ProductsList vendor={v} />;
}

export default function Page() {
  return (
    <SellerGate>
      <Inner />
    </SellerGate>
  );
}
