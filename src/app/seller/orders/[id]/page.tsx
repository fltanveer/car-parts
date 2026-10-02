"use client";

import { useParams } from "next/navigation";
import { SellerGate, useVendor } from "@/components/seller/Gate";
import { OrderDetail } from "@/components/seller/orders/OrderDetail";

function Inner() {
  const { id } = useParams<{ id: string }>();
  const v = useVendor()!;
  return <OrderDetail key={id} id={id} vendor={v} />;
}

export default function Page() {
  return (
    <SellerGate>
      <Inner />
    </SellerGate>
  );
}
