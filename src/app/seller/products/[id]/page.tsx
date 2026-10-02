"use client";

import { useParams } from "next/navigation";
import { SellerGate, useVendor } from "@/components/seller/Gate";
import { ProductEdit } from "@/components/seller/products/ProductEdit";

function Inner() {
  const { id } = useParams<{ id: string }>();
  const v = useVendor()!;
  return <ProductEdit key={id} id={id} vendor={v} />;
}

export default function Page() {
  return (
    <SellerGate>
      <Inner />
    </SellerGate>
  );
}
