"use client";

import { SellerGate, useVendor } from "@/components/seller/Gate";
import { ReviewsPage } from "@/components/seller/reviews/ReviewsPage";

function Inner() {
  const v = useVendor()!;
  return <ReviewsPage vendor={v} />;
}

export default function Page() {
  return (
    <SellerGate>
      <Inner />
    </SellerGate>
  );
}
