"use client";

import { useParams } from "next/navigation";
import { SellerGate, useVendor } from "@/components/seller/Gate";
import { RequestDetail } from "@/components/seller/requests/RequestDetail";

function Inner() {
  const { id } = useParams<{ id: string }>();
  const v = useVendor()!;
  return <RequestDetail key={id} id={id} vendor={v} />;
}

export default function Page() {
  return (
    <SellerGate>
      <Inner />
    </SellerGate>
  );
}
