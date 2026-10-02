"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ListingsScreen } from "@/components/admin/core/catalog/ListingsScreen";

function WithQuery() {
  const q = useSearchParams().get("q") ?? "";
  return <ListingsScreen key={q} initialQuery={q} />;
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<ListingsScreen initialQuery="" />}>
      <WithQuery />
    </Suspense>
  );
}
