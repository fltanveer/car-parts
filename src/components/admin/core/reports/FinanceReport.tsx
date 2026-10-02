"use client";

import { BarList, type Column, DataTable, KpiCard, KpiGrid } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { StatusPill } from "@/components/ui/primitives";
import type { DB } from "@/lib/db/seed";
import { ledgerTotals } from "../finance/Balances";
import { type CodBatch, financeOverlay } from "../finance/overlay";
import { Grid2, pct, ReportBlock, sum } from "./util";

/** Finance (file 03 §20): commission, payouts, refunds (% within deadline), COD mismatch. */
export function FinanceReport({ s, now }: { s: DB; now: number }) {
  const { tx, d, taka, dateTime } = useT();
  const batches = financeOverlay.useStore((o) => o.codBatches);
  const t = ledgerTotals(s);
  const paid = s.payouts.filter((p) => p.status === "paid");
  const waiting = s.payouts.filter((p) => p.status === "requested" || p.status === "processing");
  const done = s.refunds.filter((r) => r.status === "done");
  const onTime = done.filter((r) => r.processed_at && r.processed_at <= r.due_by).length;
  const open = s.refunds.filter((r) => r.status !== "done");
  const overdue = open.filter((r) => new Date(r.due_by).getTime() < now).length;
  const mismatch = batches.filter((b) => b.status === "mismatch");

  const cols: Column<CodBatch>[] = [
    { key: "at", header: tx("সময়", "Saved"), sort: (b) => b.at, cell: (b) => dateTime(b.at) },
    { key: "p", header: tx("সময়কাল", "Period"), cell: (b) => b.period },
    { key: "c", header: tx("কুরিয়ার", "Courier"), cell: (b) => b.courier },
    { key: "e", header: tx("পাওয়ার কথা", "Expected"), sort: (b) => b.expected, cell: (b) => taka(b.expected) },
    { key: "r", header: tx("পাওয়া", "Received"), sort: (b) => b.received, cell: (b) => taka(b.received) },
    { key: "d", header: tx("পার্থক্য", "Difference"), sort: (b) => b.difference, cell: (b) => <span className={b.difference ? "font-bold text-bad" : "text-ok"}>{taka(b.difference)}</span> },
    { key: "s", header: tx("অবস্থা", "Status"), cell: (b) => <StatusPill tone={b.status === "mismatch" ? "bad" : "ok"}>{b.status === "mismatch" ? tx("গরমিল", "Mismatch") : b.status === "resolved" ? tx("মীমাংসা", "Resolved") : tx("মিলেছে", "Matched")}</StatusPill> },
  ];

  return (
    <div className="space-y-5">
      <KpiGrid>
        <KpiCard label={tx("কমিশন আয়", "Commission")} value={taka(t.commission)} tone="ok" icon="🏦" />
        <KpiCard label={tx("পেআউট পরিশোধ", "Payouts paid")} value={taka(sum(paid.map((p) => p.amount)))} sub={tx(`${d(paid.length)}টা · বাকি ${taka(sum(waiting.map((p) => p.amount)))}`, `${paid.length} · waiting ${taka(sum(waiting.map((p) => p.amount)))}`)} />
        <KpiCard label={tx("রিফান্ড", "Refunds")} value={taka(sum(s.refunds.map((r) => r.amount)))} sub={tx(`${d(done.length)} সম্পন্ন · ${d(open.length)} বাকি`, `${done.length} done · ${open.length} open`)} />
        <KpiCard label={tx("সময়সীমার মধ্যে রিফান্ড", "Refunds within deadline")} value={done.length ? `${d(pct(onTime, done.length))}%` : "—"} tone={overdue || onTime < done.length ? "bad" : "ok"} sub={overdue ? tx(`${d(overdue)}টা এখন সময় পার`, `${overdue} overdue now`) : undefined} />
        <KpiCard label={tx("COD গরমিল", "COD mismatch")} value={taka(sum(mismatch.map((b) => b.difference)))} tone={mismatch.length ? "bad" : "ok"} sub={tx(`${d(mismatch.length)}টা ব্যাচ`, `${mismatch.length} batches`)} />
        <KpiCard label={tx("জরিমানা আয়", "Penalties")} value={taka(t.penalties)} />
      </KpiGrid>
      <Grid2>
        <ReportBlock title={tx("টাকার প্রবাহ (লেজার)", "Money flow (ledger)")}>
          <BarList
            format={taka}
            data={[
              { label: tx("বিক্রেতার বিক্রি", "Seller sales"), value: t.sales, tone: "ok" },
              { label: tx("কমিশন", "Commission"), value: t.commission, tone: "info" },
              { label: tx("পেআউট", "Payouts"), value: t.payouts, tone: "info" },
              { label: tx("রিফান্ড কাটা", "Refund debits"), value: t.refunds, tone: "bad" },
              { label: tx("জরিমানা", "Penalties"), value: t.penalties, tone: "wait" },
            ]}
          />
        </ReportBlock>
        <ReportBlock
          title={tx("COD ব্যাচ", "COD batches")}
          csvName="finance-cod-batches.csv"
          csv={[["saved_at", "period", "courier", "expected", "received", "difference", "status"], ...batches.map((b) => [b.at, b.period, b.courier, b.expected, b.received, b.difference, b.status])]}
        >
          <DataTable rows={batches} columns={cols} rowKey={(b) => b.id} empty={tx("COD মেলানো পাতায় ব্যাচ সংরক্ষণ করলে এখানে আসবে", "Save a batch on the COD page to see it here")} />
        </ReportBlock>
      </Grid2>
    </div>
  );
}
