"use client";

import { useParams } from "next/navigation";
import { SellerGate, useVendor } from "@/components/seller/Gate";
import { Thread } from "@/components/seller/messages/Thread";

function Inner() {
  const { thread } = useParams<{ thread: string }>();
  const v = useVendor()!;
  return <Thread key={thread} id={thread} vendor={v} />;
}

export default function Page() {
  return (
    <SellerGate>
      <Inner />
    </SellerGate>
  );
}
