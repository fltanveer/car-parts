"use client";

import { useParams } from "next/navigation";
import { OrderTracking } from "@/components/customer/my/OrderTracking";

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  return <OrderTracking id={id} />;
}
