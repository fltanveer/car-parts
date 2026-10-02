"use client";

import { SellerGate, useVendor } from "@/components/seller/Gate";
import { MoneyPage } from "@/components/seller/money/MoneyPage";

function Inner() {
  const v = useVendor()!;
  return <MoneyPage vendor={v} />;
}

export default function Page() {
  return (
    <SellerGate>
      <Inner />
    </SellerGate>
  );
}
