"use client";

import { useParams } from "next/navigation";
import { ClaimCenter } from "@/components/customer/my/ClaimCenter";

export default function ClaimPage() {
  const { id } = useParams<{ id: string }>();
  return <ClaimCenter orderId={id} />;
}
