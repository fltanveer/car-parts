"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AttributesScreen } from "@/components/admin/core/catalog/AttributesScreen";
import { TEMPLATES } from "@/components/admin/core/catalog/constants";
import type { AttributeTemplate } from "@/lib/types";

function WithParams() {
  const t = useSearchParams().get("t");
  const initial = TEMPLATES.some((x) => x.value === t) ? (t as AttributeTemplate) : null;
  return <AttributesScreen key={initial ?? "none"} initial={initial} />;
}

export default function AttributesPage() {
  return (
    <Suspense fallback={<AttributesScreen initial={null} />}>
      <WithParams />
    </Suspense>
  );
}
