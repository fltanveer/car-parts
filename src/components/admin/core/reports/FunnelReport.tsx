"use client";

import { BarList, type Column, DataTable, KpiCard, KpiGrid } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import type { DB } from "@/lib/db/seed";
import { avg, Grid2, KPI, median, pct, ReportBlock } from "./util";

interface Step {
  key: string;
  bn: string;
  en: string;
  count: number;
}

const MIN = 60_000;

/** Request funnel (file 03 §20): requests → clarified → sent → first quote → accepted → delivered. */
export function FunnelReport({ s }: { s: DB }) {
  const { tx, d, L, num } = useT();
  const reqs = s.requests;
  const firstQuote = new Map<string, number>();
  s.quotes.forEach((q) => {
    const t = new Date(q.created_at).getTime();
    if (!firstQuote.has(q.request_id) || t < firstQuote.get(q.request_id)!) firstQuote.set(q.request_id, t);
  });
  const deliveredQuoteIds = new Set(
    s.vendorOrders.filter((v) => v.status === "delivered" || v.status === "completed").flatMap((v) => v.items.map((i) => i.quote_id).filter(Boolean) as string[]),
  );
  const clarified = reqs.filter((r) => r.clarity !== null || !["new", "needs_clarification"].includes(r.status));
  const sent = reqs.filter((r) => r.broadcast_at);
  const quoted = reqs.filter((r) => firstQuote.has(r.id));
  const accepted = reqs.filter((r) => r.status === "accepted" || r.accepted_quote_ids.length > 0 || s.quotes.some((q) => q.request_id === r.id && q.status === "accepted"));
  const delivered = reqs.filter((r) => s.quotes.some((q) => q.request_id === r.id && deliveredQuoteIds.has(q.id)));

  const steps: Step[] = [
    { key: "requests", bn: "রিকোয়েস্ট", en: "Requests", count: reqs.length },
    { key: "clarified", bn: "পরিষ্কার", en: "Clarified", count: clarified.length },
    { key: "sent", bn: "দোকানে পাঠানো", en: "Sent to shops", count: sent.length },
    { key: "quoted", bn: "প্রথম দাম এসেছে", en: "First quote", count: quoted.length },
    { key: "accepted", bn: "গ্রহণ (অর্ডার)", en: "Accepted (ordered)", count: accepted.length },
    { key: "delivered", bn: "ডেলিভারি", en: "Delivered", count: delivered.length },
  ];
  const waits = quoted.map((r) => (firstQuote.get(r.id)! - new Date(r.broadcast_at ?? r.created_at).getTime()) / MIN).filter((m) => m >= 0);
  const clarifyWaits = sent.filter((r) => r.clarity !== "clear" || r.source !== "web_text").map((r) => (new Date(r.broadcast_at!).getTime() - new Date(r.created_at).getTime()) / MIN).filter((m) => m >= 0);

  const rows = steps.map((st, i) => ({ ...st, drop: i === 0 ? 0 : 100 - pct(st.count, steps[i - 1].count), ofAll: pct(st.count, steps[0].count) }));
  const cols: Column<(typeof rows)[number]>[] = [
    { key: "step", header: tx("ধাপ", "Step"), cell: (r) => L(r) },
    { key: "count", header: tx("সংখ্যা", "Count"), cell: (r) => d(r.count) },
    { key: "of", header: tx("শুরুর তুলনায়", "Of all"), cell: (r) => `${d(r.ofAll)}%` },
    { key: "drop", header: tx("আগের ধাপ থেকে ঝরে পড়া", "Drop-off from previous"), cell: (r) => <span className={r.drop >= 50 ? "font-bold text-bad" : ""}>{r.key === "requests" ? "—" : `${d(r.drop)}%`}</span> },
  ];
  const fmtMin = (m: number) => (m < 120 ? tx(`${num(Math.round(m))} মিনিট`, `${Math.round(m)} min`) : tx(`${num(Math.round(m / 60))} ঘণ্টা`, `${Math.round(m / 60)} h`));

  return (
    <div className="space-y-5">
      <KpiGrid>
        <KpiCard label={tx("রিকোয়েস্ট → অর্ডার", "Request → order")} value={`${d(pct(accepted.length, reqs.length))}%`} tone={pct(accepted.length, reqs.length) >= KPI.requestToOrderPct ? "ok" : "wait"} sub={tx(`লক্ষ্য ${d(KPI.requestToOrderPct)}%+`, `Target ${KPI.requestToOrderPct}%+`)} />
        <KpiCard label={tx("প্রথম দামের গড় সময়", "Avg time to first quote")} value={waits.length ? fmtMin(avg(waits)) : "—"} />
        <KpiCard label={tx("প্রথম দামের মধ্যমা", "Median time to first quote")} value={waits.length ? fmtMin(median(waits)) : "—"} tone={waits.length && median(waits) < KPI.firstQuoteMinutes ? "ok" : "wait"} sub={tx(`লক্ষ্য ${fmtMin(KPI.firstQuoteMinutes)} এর কম`, `Target under ${fmtMin(KPI.firstQuoteMinutes)}`)} />
        <KpiCard label={tx("পরিষ্কার করতে গড় সময়", "Avg clarify time")} value={clarifyWaits.length ? fmtMin(avg(clarifyWaits)) : "—"} />
      </KpiGrid>
      <Grid2>
        <ReportBlock title={tx("ফানেল", "Funnel")}>
          <BarList data={steps.map((st, i) => ({ label: L(st), value: st.count, tone: i === steps.length - 1 ? "ok" : "info" }))} max={Math.max(1, reqs.length)} />
        </ReportBlock>
        <ReportBlock title={tx("ধাপে ধাপে ঝরে পড়া", "Step drop-off")} csvName="request-funnel.csv" csv={[["step", "count", "of_all_pct", "drop_pct"], ...rows.map((r) => [r.en, r.count, r.ofAll, r.drop])]}>
          <DataTable rows={rows} columns={cols} rowKey={(r) => r.key} />
        </ReportBlock>
      </Grid2>
    </div>
  );
}
