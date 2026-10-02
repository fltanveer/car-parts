"use client";

import { useState } from "react";
import { ColumnChart, type Column, DataTable, FilterChip, KpiCard, KpiGrid } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import type { DB } from "@/lib/db/seed";
import { DAY, Grid2, liveOrderIds, pct, ReportBlock, sum, voCreated } from "./util";

type Period = "7" | "30" | "90" | "all";
interface DayRow {
  key: string;
  label: string;
  orders: number;
  gmv: number;
}

/** Marketplace health (file 03 §20): GMV, orders, AOV, commission, repeat customers. */
export function HealthReport({ s, now }: { s: DB; now: number }) {
  const { tx, d, taka, date } = useT();
  const [period, setPeriod] = useState<Period>("30");
  const live = liveOrderIds(s);
  const inPeriod = (at: string) => period === "all" || now - new Date(at).getTime() <= Number(period) * DAY;
  const orders = s.orders.filter((o) => live.has(o.id) && inPeriod(o.created_at));
  const gmv = sum(orders.map((o) => o.grand_total));
  const ids = new Set(orders.map((o) => o.id));
  const subs = s.vendorOrders.filter((v) => ids.has(v.order_id) && !["cancelled", "rejected_by_vendor", "qc_failed"].includes(v.status));
  const commission = sum(subs.map((v) => v.commission_amount));
  const byPhone = new Map<string, number>();
  s.orders.filter((o) => live.has(o.id)).forEach((o) => byPhone.set(o.user_phone, (byPhone.get(o.user_phone) ?? 0) + 1));
  const buyers = new Set(orders.map((o) => o.user_phone));
  const repeat = [...buyers].filter((p) => (byPhone.get(p) ?? 0) >= 2).length;
  const activeSellers = new Set(s.vendorOrders.filter((v) => now - new Date(voCreated(v)).getTime() <= 30 * DAY).map((v) => v.vendor_id)).size;

  const days: DayRow[] = Array.from({ length: 14 }, (_, i) => {
    const start = new Date(now - (13 - i) * DAY);
    const key = start.toISOString().slice(0, 10);
    const dayOrders = s.orders.filter((o) => live.has(o.id) && o.created_at.slice(0, 10) === key);
    return { key, label: d(`${start.getDate()}/${start.getMonth() + 1}`), orders: dayOrders.length, gmv: sum(dayOrders.map((o) => o.grand_total)) };
  });

  const cols: Column<DayRow>[] = [
    { key: "day", header: tx("দিন", "Day"), sort: (r) => r.key, cell: (r) => date(r.key) },
    { key: "orders", header: tx("অর্ডার", "Orders"), sort: (r) => r.orders, cell: (r) => d(r.orders) },
    { key: "gmv", header: "GMV", sort: (r) => r.gmv, cell: (r) => taka(r.gmv) },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1.5">
        {(["7", "30", "90", "all"] as Period[]).map((p) => (
          <FilterChip key={p} active={period === p} onClick={() => setPeriod(p)}>
            {p === "all" ? tx("সব সময়", "All time") : tx(`শেষ ${d(p)} দিন`, `Last ${p} days`)}
          </FilterChip>
        ))}
      </div>
      <KpiGrid>
        <KpiCard label="GMV" value={taka(gmv)} icon="💰" />
        <KpiCard label={tx("অর্ডার", "Orders")} value={d(orders.length)} icon="📦" />
        <KpiCard label={tx("গড় অর্ডার মূল্য", "Average order value")} value={taka(orders.length ? Math.round(gmv / orders.length) : 0)} />
        <KpiCard label={tx("কমিশন আয়", "Commission")} value={taka(commission)} tone="ok" />
        <KpiCard label={tx("রিপিট কাস্টমার", "Repeat customers")} value={`${d(pct(repeat, buyers.size))}%`} sub={tx(`${d(repeat)} / ${d(buyers.size)} জন`, `${repeat} of ${buyers.size}`)} />
        <KpiCard label={tx("সক্রিয় বিক্রেতা (৩০ দিন)", "Active sellers (30d)")} value={d(activeSellers)} />
      </KpiGrid>
      <Grid2>
        <ReportBlock title={tx("দৈনিক অর্ডার (শেষ ১৪ দিন)", "Daily orders (last 14 days)")}>
          <ColumnChart data={days.map((r) => ({ label: r.label, value: r.orders }))} />
        </ReportBlock>
        <ReportBlock title={tx("দৈনিক হিসাব", "Daily table")} csvName="marketplace-health.csv" csv={[["day", "orders", "gmv"], ...days.map((r) => [r.key, r.orders, r.gmv])]}>
          <DataTable rows={[...days].reverse()} columns={cols} rowKey={(r) => r.key} pageSize={14} />
        </ReportBlock>
      </Grid2>
    </div>
  );
}
