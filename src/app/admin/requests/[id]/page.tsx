"use client";

import { useParams } from "next/navigation";
import { RequestDetail } from "@/components/admin/ops/request/RequestDetail";
import { useT } from "@/components/providers/LangProvider";
import { ButtonLink, EmptyState } from "@/components/ui/primitives";
import { requestById } from "@/lib/db/queries";
import { useDb, useHydrated } from "@/lib/db/store";

export default function AdminRequestPage() {
  const { id } = useParams<{ id: string }>();
  const { tx } = useT();
  const hydrated = useHydrated();
  const r = useDb((s) => requestById(s, id));
  if (!hydrated) return null;
  if (!r)
    return (
      <EmptyState
        icon="🔍"
        title={tx("রিকোয়েস্ট পাওয়া যায়নি", "Request not found")}
        action={<ButtonLink href="/admin/requests">{tx("ডেস্কে ফিরুন", "Back to desk")}</ButtonLink>}
      />
    );
  return <RequestDetail key={r.id} r={r} />;
}
