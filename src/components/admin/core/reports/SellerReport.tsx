"use client";

import { BarList, type Column, DataTable, KpiCard, KpiGrid } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { StatusPill } from "@/components/ui/primitives";
import { useAdminSettings } from "@/lib/db/actions-admin-core";
import type { DB } from "@/lib/db/seed";
import { slaTone } from "@/lib/rules";
import type { Vendor, VendorOrder } from "@/lib/types";
import { VendorLink } from "../finance/shared";
import { avg, Grid2, pct, ReportBlock } from "./util";

interface Row {
  v: Vendor;
  orders: number;
  submitted: number;
  won: number;
  winRate: number;
  breaches: number;
  claims: number;
  claimRate: number;
}

const evAt = (vo: VendorOrder, to: string[]) => vo.history.find((h) => to.includes(h.to))?.at ?? null;
const later = (a: string | null, b: string | null) => !!a && !!b && new Date(a).getTime() > new Date(b).getTime();

/** SLA breaches on a sub-order: accept (12h), hand-over (48h), delivery (5/10 days). */
export const slaBreaches = (vo: VendorOrder, now: number) => {
  const dead = ["cancelled", "rejected_by_vendor"].includes(vo.status);
  const accepted = evAt(vo, ["accepted"]);
  const handed = evAt(vo, ["picked_up", "shipped", "delivered"]);
  const acceptLate = later(accepted, vo.accept_by) || (vo.status === "pending_vendor" && slaTone(vo.accept_by, now) === "late");
  const handoverLate = !!vo.handover_by && (later(handed, vo.handover_by) || (!handed && !dead && slaTone(vo.handover_by, now) === "late"));
  const deliverLate = !!vo.deliver_by && (later(vo.delivered_at, vo.deliver_by) || (!vo.delivered_at && !dead && slaTone(vo.deliver_by, now) === "late"));
  return { acceptLate, handoverLate, deliverLate, count: Number(acceptLate) + Number(handoverLate) + Number(deliverLate) };
};

export function SellerReport({ s, now }: { s: DB; now: number }) {
  const { tx, d, num } = useT();
  const set = useAdminSettings();
  const rows: Row[] = s.vendors.map((v) => {
    const vos = s.vendorOrders.filter((o) => o.vendor_id === v.id);
    const quotes = s.quotes.filter((q) => q.vendor_id === v.id);
    const won = quotes.filter((q) => q.status === "accepted").length;
    const claims = s.claims.filter((c) => c.vendor_id === v.id).length;
    return {
      v, orders: vos.length, submitted: quotes.length, won, winRate: pct(won, quotes.length),
      breaches: vos.reduce((t, o) => t + slaBreaches(o, now).count, 0), claims, claimRate: pct(claims, vos.length),
    };
  });
  const buckets = [
    { label: tx(`${num(set.vendor_score_suspend)}-এর নিচে (স্থগিত পর্যালোচনা)`, `Below ${set.vendor_score_suspend} (suspend review)`), min: -1, max: set.vendor_score_suspend, tone: "bad" as const },
    { label: tx(`${num(set.vendor_score_suspend)}–${num(set.vendor_score_warn - 1)} (সতর্কতা)`, `${set.vendor_score_suspend}–${set.vendor_score_warn - 1} (warning)`), min: set.vendor_score_suspend - 1, max: set.vendor_score_warn, tone: "wait" as const },
    { label: `${num(set.vendor_score_warn)}–${num(69)}`, min: set.vendor_score_warn - 1, max: 70, tone: "info" as const },
    { label: `${num(70)}–${num(84)}`, min: 69, max: 85, tone: "ok" as const },
    { label: `${num(85)}+`, min: 84, max: 1000, tone: "ok" as const },
  ].map((b) => ({ ...b, value: s.vendors.filter((v) => v.score > b.min && v.score < b.max).length }));

  const cols: Column<Row>[] = [
    { key: "shop", header: tx("দোকান", "Shop"), sort: (r) => r.v.shop_name, cell: (r) => <VendorLink id={r.v.id} name={r.v.shop_name_bn} /> },
    {
      key: "score", header: tx("স্কোর", "Score"), sort: (r) => r.v.score,
      cell: (r) => <StatusPill tone={r.v.score < set.vendor_score_suspend ? "bad" : r.v.score < set.vendor_score_warn ? "wait" : "ok"}>{d(r.v.score)}</StatusPill>,
    },
    { key: "resp", header: tx("সাড়ার সময়", "Response"), sort: (r) => r.v.response_minutes, cell: (r) => tx(`${num(r.v.response_minutes)} মিনিট`, `${r.v.response_minutes} min`) },
    { key: "win", header: tx("জেতার হার", "Win rate"), sort: (r) => r.winRate, cell: (r) => (r.submitted ? tx(`${d(r.winRate)}% (${d(r.won)}/${d(r.submitted)})`, `${r.winRate}% (${r.won}/${r.submitted})`) : "—") },
    { key: "ontime", header: tx("সময়মতো", "On time"), sort: (r) => r.v.on_time_rate, cell: (r) => `${d(Math.round(r.v.on_time_rate * 100))}%`, hideOnMobile: true },
    { key: "sla", header: tx("SLA লঙ্ঘন", "SLA breaches"), sort: (r) => r.breaches, cell: (r) => <span className={r.breaches ? "font-bold text-bad" : ""}>{d(r.breaches)}</span> },
    { key: "claim", header: tx("দাবির হার", "Claim rate"), sort: (r) => r.claimRate, cell: (r) => (r.orders ? `${d(r.claimRate)}% (${d(r.claims)}/${d(r.orders)})` : "—") },
  ];

  return (
    <div className="space-y-5">
      <KpiGrid>
        <KpiCard label={tx("গড় স্কোর", "Average score")} value={d(Math.round(avg(s.vendors.map((v) => v.score))))} />
        <KpiCard label={tx("গড় সাড়ার সময়", "Avg response")} value={tx(`${num(Math.round(avg(s.vendors.map((v) => v.response_minutes))))} মিনিট`, `${Math.round(avg(s.vendors.map((v) => v.response_minutes)))} min`)} />
        <KpiCard label={tx("মোট SLA লঙ্ঘন", "Total SLA breaches")} value={d(rows.reduce((t, r) => t + r.breaches, 0))} tone={rows.some((r) => r.breaches) ? "bad" : "ok"} />
        <KpiCard label={tx("সতর্কতা সীমার নিচে", "Below warning")} value={d(s.vendors.filter((v) => v.score < set.vendor_score_warn).length)} tone="wait" />
      </KpiGrid>
      <Grid2>
        <ReportBlock title={tx("স্কোর বণ্টন", "Score distribution")}>
          <BarList data={buckets.map((b) => ({ label: b.label, value: b.value, tone: b.tone }))} />
        </ReportBlock>
        <ReportBlock title={tx("জেতার হার (দাম → গ্রহণ)", "Win rate (quotes → accepted)")}>
          <BarList data={rows.filter((r) => r.submitted).sort((a, b) => b.winRate - a.winRate).map((r) => ({ label: r.v.shop_name_bn, value: r.winRate }))} format={(n) => `${d(n)}%`} max={100} />
        </ReportBlock>
      </Grid2>
      <ReportBlock
        title={tx("বিক্রেতা অনুযায়ী", "Per seller")}
        csvName="seller-performance.csv"
        csv={[["vendor_id", "shop", "score", "response_minutes", "quotes", "won", "win_rate_pct", "on_time_pct", "sla_breaches", "orders", "claims", "claim_rate_pct"], ...rows.map((r) => [r.v.id, r.v.shop_name, r.v.score, r.v.response_minutes, r.submitted, r.won, r.winRate, Math.round(r.v.on_time_rate * 100), r.breaches, r.orders, r.claims, r.claimRate])]}
      >
        <DataTable rows={rows} columns={cols} rowKey={(r) => r.v.id} initialSort={{ key: "score", dir: "desc" }} search={(r) => `${r.v.shop_name} ${r.v.shop_name_bn}`} />
      </ReportBlock>
    </div>
  );
}
