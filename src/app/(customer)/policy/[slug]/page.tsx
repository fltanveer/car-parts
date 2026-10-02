"use client";

import { useParams } from "next/navigation";
import { PolicyView } from "@/components/customer/my/PolicyView";

export default function PolicyPage() {
  const { slug } = useParams<{ slug: string }>();
  return <PolicyView slug={slug} />;
}
