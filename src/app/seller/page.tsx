"use client";

import { SellerGate } from "@/components/seller/Gate";
import { SellerHome } from "@/components/seller/home/Home";

export default function SellerHomePage() {
  return (
    <SellerGate>
      <SellerHome />
    </SellerGate>
  );
}
