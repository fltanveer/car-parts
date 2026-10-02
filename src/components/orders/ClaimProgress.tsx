"use client";

import { claimStatusLabel } from "@/lib/i18n";
import type { Claim } from "@/lib/types";
import { useT } from "../providers/LangProvider";
import { StatusTimeline } from "../status/StatusTimeline";
import { claimStepIndex, claimSteps } from "./helpers";

// Spec 7.13 step 4: submitted -> review -> approved/rejected -> send part ->
// received -> replaced/refunded.
export function ClaimProgress({ claim }: { claim: Claim }) {
  const { lang, tx } = useT();
  const steps = claimSteps.map((s, i) => ({ key: s.key, label: s[lang], at: i === 0 ? claim.created_at : null }));
  return (
    <StatusTimeline
      steps={steps}
      currentIndex={claimStepIndex(claim.status)}
      stopped={claim.status === "rejected" ? `${claimStatusLabel.rejected[lang]}: ${tx("বিস্তারিত জানতে কল করুন", "call us for details")}` : null}
    />
  );
}
