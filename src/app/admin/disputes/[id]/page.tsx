"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminPage, KV, Panel, Timeline } from "@/components/admin/core";
import { liabilityLabel } from "@/components/admin/core/disputes/ClaimCard";
import { DecisionForm } from "@/components/admin/core/disputes/DecisionForm";
import { EvidencePanel } from "@/components/admin/core/disputes/EvidencePanel";
import { RuleSuggestion } from "@/components/admin/core/disputes/RuleSuggestion";
import { useT } from "@/components/providers/LangProvider";
import { Countdown, toast } from "@/components/shared/Misc";
import { Button, EmptyState, Notice, StatusPill } from "@/components/ui/primitives";
import { takeClaimForReview } from "@/lib/db/actions-admin-core";
import { useDb } from "@/lib/db/store";
import { displayPhone } from "@/lib/format";
import { claimStatusLabel, claimTypeLabel } from "@/lib/labels";
import type { ClaimStatus } from "@/lib/types";

const DECIDABLE: ClaimStatus[] = ["vendor_review", "vendor_disputed", "escalated", "admin_review", "submitted"];

export default function DisputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { tx, L, taka, dateTime } = useT();
  const claim = useDb((s) => s.claims.find((c) => c.id === id) ?? null);
  const vo = useDb((s) => s.vendorOrders.find((v) => v.id === claim?.vendor_order_id) ?? null);
  const order = useDb((s) => s.orders.find((o) => o.id === vo?.order_id) ?? null);
  const vendor = useDb((s) => s.vendors.find((v) => v.id === claim?.vendor_id) ?? null);
  const refunds = useDb((s) => s.refunds.filter((r) => r.claim_id === id));

  if (!claim || !vo || !order)
    return (
      <AdminPage title={tx("দাবি পাওয়া যায়নি", "Claim not found")} back="/admin/disputes">
        <EmptyState icon="⚖️" title={tx("এই দাবি নেই", "No such claim")} />
      </AdminPage>
    );

  const item = vo.items.find((i) => i.id === claim.order_item_id) ?? vo.items[0];
  const open = DECIDABLE.includes(claim.status);

  return (
    <AdminPage
      back="/admin/disputes"
      title={
        <span className="flex flex-wrap items-center gap-2">
          {claimTypeLabel[claim.type].icon} {claim.claim_no}
          <StatusPill tone={claimStatusLabel[claim.status].tone}>{L(claimStatusLabel[claim.status])}</StatusPill>
        </span>
      }
      subtitle={`${L(claimTypeLabel[claim.type])} · ${dateTime(claim.created_at)}`}
      guide={tx(
        "উপরে চারটা ঘরে লিস্টিং, প্যাকিং ছবি, QC আর কাস্টমারের প্রমাণ পাশাপাশি দেখুন। তারপর নিয়মের সাজেশন পড়ে সিদ্ধান্ত বাছুন, কারণ লিখুন, আর শুনে দেখুন দুই পক্ষ কী পাবে। শেষে নিচের বোতাম চাপুন।",
        "Compare listing, packing photo, QC and customer evidence in the four boxes. Read the rule suggestion, pick a decision, write the reason and listen to what both sides receive. Then press the button at the bottom.",
      )}
      actions={
        open && claim.status !== "admin_review" ? (
          <Button variant="outline" onClick={() => { takeClaimForReview(claim.id); toast(tx("পর্যালোচনায় নেওয়া হয়েছে", "Taken for review")); }}>
            <Search className="size-4" /> {tx("পর্যালোচনায় নিন", "Take for review")}
          </Button>
        ) : undefined
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title={tx("অর্ডার", "Order")}>
          <KV
            rows={[
              [tx("সাব-অর্ডার", "Sub-order"), <Link key="o" href={`/admin/orders/${order.id}#${vo.id}`} className="text-brand hover:underline">{vo.sub_order_no}</Link>],
              [tx("পণ্য", "Item"), item.snapshot.title],
              [tx("মূল্য", "Amount"), taka(item.line_total)],
              [tx("পৌঁছেছে", "Delivered"), vo.delivered_at ? dateTime(vo.delivered_at) : "—"],
            ]}
          />
        </Panel>
        <Panel title={tx("দুই পক্ষ", "Parties")}>
          <KV
            rows={[
              [tx("কাস্টমার", "Customer"), <Link key="c" href={`/admin/customers/${encodeURIComponent(claim.user_phone)}`} className="text-brand hover:underline">{order.customer_name} · {displayPhone(claim.user_phone)}</Link>],
              [tx("দোকান", "Seller"), <Link key="v" href={`/admin/vendors/${claim.vendor_id}`} className="text-brand hover:underline">{vendor?.shop_name_bn ?? claim.vendor_id}</Link>],
              [tx("প্রাথমিক দায়", "Initial liability"), L(liabilityLabel[claim.liability])],
            ]}
          />
        </Panel>
        <Panel title={tx("সময়", "Timing")}>
          {claim.status === "vendor_review" || claim.status === "submitted" ? (
            <Countdown to={claim.vendor_respond_by} prefix={tx("দোকানের উত্তর: ", "Seller reply: ")} />
          ) : (
            <p className="text-sm text-muted">{tx("দোকানের উত্তরের সময় শেষ/উত্তর দিয়েছে", "Seller reply window closed / replied")}</p>
          )}
          {refunds.map((r) => (
            <p key={r.id} className="mt-2 text-sm">💸 {taka(r.amount)} · <StatusPill tone={r.status === "done" ? "ok" : "wait"}>{r.status}</StatusPill></p>
          ))}
        </Panel>
      </div>
      <EvidencePanel claim={claim} vo={vo} item={item} />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <RuleSuggestion claim={claim} vo={vo} item={item} order={order} />
        {open ? (
          <DecisionForm key={claim.id} claim={claim} vo={vo} item={item} order={order} />
        ) : (
          <Panel title={tx("সিদ্ধান্ত হয়ে গেছে", "Already decided")}>
            <Notice tone={claim.status === "resolved_rejected" ? "bad" : "ok"}>{claim.decision_note ?? L(claimStatusLabel[claim.status])}</Notice>
            {claim.refund_amount ? <p className="mt-2 font-semibold">{tx("ফেরত:", "Refund:")} {taka(claim.refund_amount)}</p> : null}
          </Panel>
        )}
      </div>
      <Panel title={tx("টাইমলাইন", "Timeline")}>
        <Timeline items={claim.history.map((h) => ({ at: h.at, title: L(claimStatusLabel[h.to as ClaimStatus]) || h.to, note: h.note ?? undefined, actor: h.actor, tone: claimStatusLabel[h.to as ClaimStatus]?.tone }))} />
      </Panel>
    </AdminPage>
  );
}
