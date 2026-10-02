"use client";

import { useParams } from "next/navigation";
import { ServicesView } from "@/components/customer/my/ServicesView";

export default function ServicePage() {
  const { type } = useParams<{ type: string }>();
  return <ServicesView type={type} />;
}
