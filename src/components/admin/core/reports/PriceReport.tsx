"use client";

import { type Column, DataTable, KpiCard, KpiGrid } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { StatusPill } from "@/components/ui/primitives";
import { benchmarkFor, getCategory } from "@/lib/db/queries";
import type { DB } from "@/lib/db/seed";
import { conditionLabel } from "@/lib/labels";
import { priceBenchmarks } from "@/lib/mock/catalog";
import type { Condition, PriceBenchmark } from "@/lib/types";
import { median, quantile, ReportBlock } from "./util";

/** Flag when the live median moves this far from the stored benchmark. */
const DRIFT_PCT = 20;

interface Row {
  key: string;
  category_id: string;
  condition: Condition;
  n: number;
  p25: number;
  med: number;
  p75: number;
  bench: PriceBenchmark | undefined;
  drift: number | null;
}

/** Price benchmarks (file 03 §20): p25/median/p75 per category × condition from live listings vs seeded `price_benchmarks`. */
export function PriceReport({ s }: { s: DB }) {
  const { tx, d, taka, L } = useT();
  const groups = new Map<string, number[]>();
  s.listings
    .filter((l) => !["removed", "draft", "rejected"].includes(l.status))
    .forEach((l) => {
      const k = `${l.category_id}|${l.condition}`;
      groups.set(k, [...(groups.get(k) ?? []), l.price]);
    });
  priceBenchmarks.forEach((b) => {
    const k = `${b.category_id}|${b.condition}`;
    if (!groups.has(k)) groups.set(k, []);
  });
  const rows: Row[] = [...groups.entries()].map(([key, prices]) => {
    const [category_id, condition] = key.split("|") as [string, Condition];
    const bench = benchmarkFor(category_id, condition);
    const med = median(prices);
    return { key, category_id, condition, n: prices.length, p25: quantile(prices, 0.25), med, p75: quantile(prices, 0.75), bench, drift: bench && prices.length ? Math.round(((med - bench.median) / bench.median) * 100) : null };
  });
  const catName = (id: string) => {
    const c = getCategory(id);
    return c ? L({ bn: c.name_bn, en: c.name }) : id;
  };

  const cols: Column<Row>[] = [
    { key: "cat", header: tx("ক্যাটাগরি", "Category"), sort: (r) => catName(r.category_id), cell: (r) => <span className="font-semibold">{catName(r.category_id)}</span> },
    { key: "cond", header: tx("অবস্থা", "Condition"), sort: (r) => r.condition, cell: (r) => L(conditionLabel[r.condition]) },
    { key: "n", header: tx("লিস্টিং", "Listings"), sort: (r) => r.n, cell: (r) => d(r.n) },
    { key: "p25", header: "p25", sort: (r) => r.p25, cell: (r) => (r.n ? taka(r.p25) : "—") },
    { key: "med", header: tx("মধ্যমা", "Median"), sort: (r) => r.med, cell: (r) => (r.n ? <b>{taka(r.med)}</b> : "—") },
    { key: "p75", header: "p75", sort: (r) => r.p75, cell: (r) => (r.n ? taka(r.p75) : "—") },
    {
      key: "bench", header: tx("সংরক্ষিত বাজারদর", "Stored benchmark"),
      cell: (r) => (r.bench ? <span className="text-xs">{taka(r.bench.p25)} · <b>{taka(r.bench.median)}</b> · {taka(r.bench.p75)}</span> : <span className="text-xs text-muted">{tx("নেই", "None")}</span>),
    },
    {
      key: "drift", header: tx("পার্থক্য", "Drift"), sort: (r) => r.drift ?? 0,
      cell: (r) => (r.drift === null ? "—" : <StatusPill tone={Math.abs(r.drift) > DRIFT_PCT ? "wait" : "ok"}>{r.drift > 0 ? "+" : ""}{d(r.drift)}%</StatusPill>),
    },
  ];

  return (
    <div className="space-y-5">
      <KpiGrid>
        <KpiCard label={tx("ক্যাটাগরি × অবস্থা", "Category × condition")} value={d(rows.length)} />
        <KpiCard label={tx("সংরক্ষিত বাজারদর", "Stored benchmarks")} value={d(priceBenchmarks.length)} />
        <KpiCard label={tx("বাজারদর নেই", "No benchmark yet")} value={d(rows.filter((r) => !r.bench && r.n >= 1).length)} tone="wait" sub={tx("রাতের হিসাবে তৈরি হবে", "Built by the nightly job")} />
        <KpiCard label={tx(`${d(DRIFT_PCT)}%+ সরে গেছে`, `Drifted ${DRIFT_PCT}%+`)} value={d(rows.filter((r) => r.drift !== null && Math.abs(r.drift) > DRIFT_PCT).length)} tone="wait" />
      </KpiGrid>
      <ReportBlock
        title={tx("বাজারদর (লিস্টিংয়ের দাম থেকে)", "Price benchmarks (from listing prices)")}
        csvName="price-benchmarks.csv"
        csv={[["category_id", "condition", "listings", "p25", "median", "p75", "stored_p25", "stored_median", "stored_p75", "drift_pct"], ...rows.map((r) => [r.category_id, r.condition, r.n, r.p25, r.med, r.p75, r.bench?.p25 ?? "", r.bench?.median ?? "", r.bench?.p75 ?? "", r.drift ?? ""])]}
      >
        <DataTable rows={rows} columns={cols} rowKey={(r) => r.key} initialSort={{ key: "n", dir: "desc" }} search={(r) => `${catName(r.category_id)} ${r.condition}`} />
      </ReportBlock>
    </div>
  );
}
