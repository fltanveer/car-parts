"use client";

import Link from "next/link";
import { type Column, DataTable, KpiCard, KpiGrid } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { StatusPill } from "@/components/ui/primitives";
import { useAdminSettings } from "@/lib/db/actions-admin-core";
import type { DB } from "@/lib/db/seed";
import { pct, ReportBlock } from "./util";
import { slaBreaches } from "./SellerReport";

type Verdict = "ok" | "late" | "pending";
interface Row {
  id: string;
  kind: "complaint" | "handover" | "delivery" | "refund";
  ref: string;
  href: string;
  deadline: string;
  doneAt: string | null;
  verdict: Verdict;
}

const verdictOf = (deadline: string, doneAt: string | null, now: number): Verdict =>
  doneAt ? (new Date(doneAt) <= new Date(deadline) ? "ok" : "late") : new Date(deadline).getTime() < now ? "late" : "pending";

/** Legal compliance (file 00 §5, file 03 §20): complaint first response, delivery and refund deadlines. */
export function LegalReport({ s, now }: { s: DB; now: number }) {
  const { tx, d, num, dateTime } = useT();
  const set = useAdminSettings();
  const orderOf = (orderId: string) => s.orders.find((o) => o.id === orderId);
  const rows: Row[] = [
    ...s.complaints.map<Row>((c) => ({ id: c.id, kind: "complaint", ref: c.complaint_no, href: "/admin/complaints", deadline: c.first_response_by, doneAt: c.first_response_at, verdict: verdictOf(c.first_response_by, c.first_response_at, now) })),
    ...s.vendorOrders
      .filter((v) => v.handover_by)
      .map<Row>((v) => {
        const handed = v.history.find((h) => ["picked_up", "shipped", "delivered"].includes(h.to))?.at ?? null;
        return { id: `h-${v.id}`, kind: "handover", ref: v.sub_order_no, href: `/admin/orders/${v.order_id}`, deadline: v.handover_by!, doneAt: handed, verdict: slaBreaches(v, now).handoverLate ? "late" : handed ? "ok" : "pending" };
      }),
    ...s.vendorOrders
      .filter((v) => v.deliver_by && !["cancelled", "rejected_by_vendor"].includes(v.status))
      .map<Row>((v) => ({ id: `d-${v.id}`, kind: "delivery", ref: v.sub_order_no, href: `/admin/orders/${v.order_id}`, deadline: v.deliver_by!, doneAt: v.delivered_at, verdict: verdictOf(v.deliver_by!, v.delivered_at, now) })),
    ...s.refunds.map<Row>((r) => ({ id: r.id, kind: "refund", ref: orderOf(r.order_id)?.order_no ?? r.order_id, href: "/admin/finance/refunds", deadline: r.due_by, doneAt: r.processed_at, verdict: verdictOf(r.due_by, r.processed_at, now) })),
  ];
  const stat = (k: Row["kind"]) => {
    const xs = rows.filter((r) => r.kind === k);
    const decided = xs.filter((r) => r.verdict !== "pending");
    const ok = decided.filter((r) => r.verdict === "ok").length;
    return { total: xs.length, decided: decided.length, ok, late: decided.length - ok, rate: decided.length ? pct(ok, decided.length) : null };
  };
  const kinds = {
    complaint: { ...stat("complaint"), bn: `অভিযোগে প্রথম সাড়া (${num(set.complaint_first_response_hours)} ঘণ্টা)`, en: `Complaint first response (${set.complaint_first_response_hours}h)` },
    handover: { ...stat("handover"), bn: `কুরিয়ারে হস্তান্তর (${num(set.handover_hours)} ঘণ্টা)`, en: `Hand-over (${set.handover_hours}h)` },
    delivery: { ...stat("delivery"), bn: `ডেলিভারি (${num(set.delivery_days_same_city)}/${num(set.delivery_days_other)} দিন)`, en: `Delivery (${set.delivery_days_same_city}/${set.delivery_days_other} days)` },
    refund: { ...stat("refund"), bn: `রিফান্ড (${num(set.refund_hours_unfulfillable)} ঘণ্টা / ${num(set.refund_days_late)} দিন)`, en: `Refund (${set.refund_hours_unfulfillable}h / ${set.refund_days_late}d)` },
  };

  const cols: Column<Row>[] = [
    { key: "kind", header: tx("নিয়ম", "Rule"), sort: (r) => r.kind, cell: (r) => tx(kinds[r.kind].bn, kinds[r.kind].en) },
    { key: "ref", header: tx("রেফারেন্স", "Reference"), cell: (r) => <Link href={r.href} className="font-semibold text-brand hover:underline">{r.ref}</Link> },
    { key: "dl", header: tx("সময়সীমা", "Deadline"), sort: (r) => r.deadline, cell: (r) => dateTime(r.deadline) },
    { key: "done", header: tx("সম্পন্ন", "Done at"), sort: (r) => r.doneAt ?? "", cell: (r) => (r.doneAt ? dateTime(r.doneAt) : "—") },
    {
      key: "v", header: tx("ফলাফল", "Result"), sort: (r) => r.verdict,
      cell: (r) => <StatusPill tone={r.verdict === "ok" ? "ok" : r.verdict === "late" ? "bad" : "wait"}>{{ ok: tx("সময়মতো", "On time"), late: tx("লঙ্ঘন", "Breached"), pending: tx("চলছে", "In progress") }[r.verdict]}</StatusPill>,
    },
  ];

  return (
    <div className="space-y-5">
      <KpiGrid>
        {(Object.keys(kinds) as Row["kind"][]).map((k) => (
          <KpiCard
            key={k}
            label={tx(kinds[k].bn, kinds[k].en)}
            value={kinds[k].rate === null ? "—" : `${d(kinds[k].rate!)}%`}
            tone={kinds[k].late ? "bad" : "ok"}
            sub={tx(`${d(kinds[k].ok)} ঠিক · ${d(kinds[k].late)} লঙ্ঘন · ${d(kinds[k].total - kinds[k].decided)} চলছে`, `${kinds[k].ok} ok · ${kinds[k].late} breached · ${kinds[k].total - kinds[k].decided} running`)}
          />
        ))}
      </KpiGrid>
      <ReportBlock
        title={tx("আইনি সময়সীমা মান্যতা (কর্তৃপক্ষ চাইলে দেওয়ার জন্য)", "Legal deadline compliance (for authorities on request)")}
        csvName="legal-compliance.csv"
        csv={[["rule", "reference", "deadline", "done_at", "result"], ...rows.map((r) => [r.kind, r.ref, r.deadline, r.doneAt ?? "", r.verdict])]}
      >
        <DataTable rows={rows} columns={cols} rowKey={(r) => r.id} initialSort={{ key: "v", dir: "asc" }} rowClassName={(r) => (r.verdict === "late" ? "bg-bad-soft/40" : undefined)} />
      </ReportBlock>
    </div>
  );
}
