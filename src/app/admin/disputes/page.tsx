"use client";

import { useState } from "react";
import { AdminPage, KpiCard, KpiGrid } from "@/components/admin/core";
import { ClaimCard } from "@/components/admin/core/disputes/ClaimCard";
import { useT } from "@/components/providers/LangProvider";
import { useNow } from "@/components/shared/Misc";
import { EmptyState, Tabs } from "@/components/ui/primitives";
import { useDb } from "@/lib/db/store";
import type { Claim } from "@/lib/types";

type Queue = "seller" | "escalated" | "review" | "done";
const QUEUES: Record<Queue, Claim["status"][]> = {
  seller: ["submitted", "vendor_review"],
  escalated: ["escalated", "vendor_disputed"],
  review: ["admin_review"],
  done: ["vendor_accepted", "awaiting_return", "resolved_refund", "resolved_replace", "resolved_rejected", "closed"],
};

export default function DisputesPage() {
  const { tx, d } = useT();
  const now = useNow();
  const claims = useDb((s) => s.claims);
  const [q, setQ] = useState<Queue>("escalated");
  const of = (k: Queue) => claims.filter((c) => QUEUES[k].includes(c.status));
  const overdue = of("seller").filter((c) => new Date(c.vendor_respond_by).getTime() < now).length;
  const list = [...of(q)].sort((a, b) => (q === "seller" ? a.vendor_respond_by.localeCompare(b.vendor_respond_by) : b.created_at.localeCompare(a.created_at)));

  return (
    <AdminPage
      title={tx("বিরোধ ও দাবি", "Disputes & claims")}
      subtitle={tx("কাস্টমারের সমস্যা, দোকানের উত্তর, অ্যাডমিনের সিদ্ধান্ত", "Customer claims, seller replies, admin decisions")}
      guide={tx(
        "এসকেলেট হওয়া দাবিগুলো আগে দেখুন। কার্ডে চাপলে দুই পক্ষের প্রমাণ পাশাপাশি দেখবেন, নিয়মের সাজেশন পাবেন, তারপর সিদ্ধান্ত দিন। দোকান ৪৮ ঘণ্টায় উত্তর না দিলে দাবি লাল হয়ে যায়।",
        "Handle escalated claims first. Open a card to see both sides' evidence side by side with a rule suggestion, then decide. Claims turn red when the seller misses the 48-hour reply window.",
      )}
    >
      <KpiGrid>
        <KpiCard label={tx("দোকানের উত্তর বাকি", "Awaiting seller")} value={d(of("seller").length)} sub={overdue ? tx(`${d(overdue)}টা সময় পার`, `${overdue} overdue`) : undefined} tone={overdue ? "bad" : "wait"} icon="⏳" onClick={() => setQ("seller")} active={q === "seller"} />
        <KpiCard label={tx("এসকেলেট", "Escalated")} value={d(of("escalated").length)} tone={of("escalated").length ? "bad" : "ok"} icon="⚖️" onClick={() => setQ("escalated")} active={q === "escalated"} />
        <KpiCard label={tx("অ্যাডমিন পর্যালোচনায়", "In admin review")} value={d(of("review").length)} tone="wait" icon="🔍" onClick={() => setQ("review")} active={q === "review"} />
        <KpiCard label={tx("নিষ্পত্তি", "Resolved")} value={d(of("done").length)} tone="ok" icon="✅" onClick={() => setQ("done")} active={q === "done"} />
      </KpiGrid>
      <Tabs
        value={q}
        onChange={setQ}
        items={[
          { value: "escalated", label: tx("এসকেলেট", "Escalated"), count: of("escalated").length },
          { value: "seller", label: tx("দোকানের উত্তর বাকি", "Seller reply pending"), count: overdue },
          { value: "review", label: tx("পর্যালোচনায়", "Admin review"), count: of("review").length },
          { value: "done", label: tx("নিষ্পত্তি", "Resolved") },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState icon="⚖️" title={tx("এই কিউতে কিছু নেই", "Nothing in this queue")} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((c) => (
            <ClaimCard key={c.id} claim={c} />
          ))}
        </div>
      )}
    </AdminPage>
  );
}
