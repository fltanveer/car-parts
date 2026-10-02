"use client";

import { useParams } from "next/navigation";
import { RequestDetail } from "@/components/customer/my/RequestDetail";

export default function RequestPage() {
  const { id } = useParams<{ id: string }>();
  return <RequestDetail id={id} />;
}
