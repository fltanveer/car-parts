"use client";

import { useT } from "@/components/providers/LangProvider";
import { ClaimCard } from "@/components/seller/claims/ClaimCard";
import { SellerGate, useVendor } from "@/components/seller/Gate";
import { SellerPage } from "@/components/seller/SellerPage";
import { EmptyState } from "@/components/ui/primitives";
import { useDb } from "@/lib/db/store";

function Claims() {
  const { tx } = useT();
  const v = useVendor()!;
  const claims = useDb((s) =>
    s.claims
      .filter((c) => c.vendor_id === v.id)
      .sort((a, b) => Number(b.status === "vendor_review") - Number(a.status === "vendor_review") || b.created_at.localeCompare(a.created_at)),
  );
  return (
    <SellerPage
      title={tx("⚠️ সমস্যা / দাবি", "⚠️ Problems / claims")}
      guide={tx(
        "কাস্টমার কোনো সমস্যা জানালে এখানে আসে। ৪৮ ঘণ্টার মধ্যে উত্তর দিন: মেনে নিন, একমত না হলে কারণ আর ছবি দিন, বা কাস্টমারের সাথে কথা বলুন। উত্তর না দিলে স্কোর কাটা যাবে।",
        "Customer problems show here. Reply within 48 hours: accept, disagree with a reason and photos, or talk to the customer. No reply lowers your score.",
      )}
    >
      {claims.length ? <div className="space-y-4">{claims.map((c) => <ClaimCard key={c.id} c={c} vendor={v} />)}</div> : <EmptyState icon="🎉" title={tx("কোনো সমস্যা নেই", "No problems")} />}
    </SellerPage>
  );
}

export default function Page() {
  return (
    <SellerGate>
      <Claims />
    </SellerGate>
  );
}
