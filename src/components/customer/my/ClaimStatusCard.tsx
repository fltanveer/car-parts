"use client";

import { ShieldAlert } from "lucide-react";
import { escalateClaim } from "@/lib/db/actions";
import { claimStatusLabel, claimTypeLabel } from "@/lib/labels";
import { settings } from "@/lib/mock/settings";
import type { Claim, ClaimStatus, VendorOrder } from "@/lib/types";
import { MediaThumb } from "../../media/PhotoUploader";
import { Countdown, toast } from "../../shared/Misc";
import { useT } from "../../providers/LangProvider";
import { Button, Card, Notice, StatusPill } from "../../ui/primitives";

const CLOSED: ClaimStatus[] = ["resolved_refund", "resolved_replace", "resolved_rejected", "closed"];
const WITH_US: ClaimStatus[] = ["escalated", "admin_review"];

/** Claim status with seller response and "tell GaariHub" escalation (file 01 §7.2, file 00 §9.2). */
export function ClaimStatusCard({ claim, vo }: { claim: Claim; vo: VendorOrder | null }) {
  const { tx, L, d, taka, dateTime } = useT();
  const st = claimStatusLabel[claim.status];
  const t = claimTypeLabel[claim.type];
  const item = vo?.items.find((i) => i.id === claim.order_item_id);
  const canEscalate = !CLOSED.includes(claim.status) && !WITH_US.includes(claim.status);
  const label = (to: string) => (to in claimStatusLabel ? L(claimStatusLabel[to as ClaimStatus]) : to === "resolved" ? tx("সিদ্ধান্ত হয়েছে", "Decided") : to);

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm text-muted">
            {d(claim.claim_no)} · {item?.snapshot.title}
          </p>
          <p className="text-lg font-bold">
            {t.icon} {L(t)}
          </p>
        </div>
        <StatusPill tone={st.tone}>{L(st)}</StatusPill>
      </div>
      {claim.description && <p className="rounded-xl bg-surface p-3 text-sm">“{claim.description}”</p>}
      {claim.media.length > 0 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {claim.media.map((m) => (
            <MediaThumb key={m.id} item={m} />
          ))}
        </div>
      )}

      {claim.status === "vendor_review" && (
        <Notice tone="wait">
          ⏳ {tx("দোকানের উত্তরের অপেক্ষা।", "Waiting for the shop.")} <Countdown to={claim.vendor_respond_by} warnHours={12} />{" "}
          {tx("সময়ে উত্তর না দিলে গাড়িহাব নিজে দেখবে।", "If they don't reply in time, GaariHub steps in.")}
        </Notice>
      )}
      {claim.vendor_response && (
        <div className="rounded-xl border border-line p-3 text-sm">
          <p className="font-semibold text-muted">🏪 {tx("দোকানের উত্তর", "Shop's reply")}</p>
          <p className="mt-1">“{claim.vendor_response}”</p>
        </div>
      )}
      {WITH_US.includes(claim.status) && <Notice tone="wait">🧑‍⚖️ {tx(`গাড়িহাব দুই পক্ষের প্রমাণ দেখছে। ${d(settings.complaint_first_response_hours)} ঘণ্টার মধ্যে প্রথম সাড়া পাবেন।`, `GaariHub is reviewing both sides. You'll hear from us within ${settings.complaint_first_response_hours} hours.`)}</Notice>}
      {claim.resolution && (
        <Notice tone={claim.resolution === "rejected" ? "bad" : "ok"}>
          {claim.resolution === "replace" ? tx("✅ জিনিস বদলে দেওয়া হবে।", "✅ The item will be replaced.") : claim.resolution === "rejected" ? tx("✖️ দাবি গ্রহণ হয়নি।", "✖️ Claim not accepted.") : tx("✅ টাকা ফেরত দেওয়া হবে।", "✅ You'll be refunded.")}
          {claim.refund_amount ? ` ${taka(claim.refund_amount)}` : ""} {claim.decision_note}
        </Notice>
      )}

      <ol className="space-y-1 border-l-2 border-line pl-4 text-sm">
        {claim.history.map((h, i) => (
          <li key={i}>
            <b>{label(h.to)}</b> <span className="text-muted">· {dateTime(h.at)}</span>
            {h.note && <span className="block text-muted">{h.note}</span>}
          </li>
        ))}
      </ol>

      {canEscalate && (
        <Button
          variant={claim.status === "vendor_disputed" ? "danger" : "outline"}
          full
          onClick={() => {
            escalateClaim(claim.id);
            toast(tx("গাড়িহাবকে জানানো হয়েছে। আমরা দেখছি।", "GaariHub has been told. We're on it."));
          }}
        >
          <ShieldAlert className="size-5" aria-hidden /> {tx("গাড়িহাবকে জানান", "Tell GaariHub")}
        </Button>
      )}
      {!CLOSED.includes(claim.status) && <p className="text-center text-xs text-muted">🔒 {tx("সমাধান না হওয়া পর্যন্ত দোকান টাকা পাবে না।", "The shop isn't paid until this is resolved.")}</p>}
    </Card>
  );
}
