"use client";

import Link from "next/link";
import { BarList, type Column, DataTable, KpiCard, KpiGrid } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { Notice } from "@/components/ui/primitives";
import { categories } from "@/lib/db/queries";
import { Grid2, KPI, pct, ReportBlock, sum } from "./util";

// Mock search log (no search analytics in the demo store). Replace with the
// `search_logs` table aggregate once the backend exists.
const TOP_TERMS: { term: string; count: number; results: number }[] = [
  { term: "ব্রেক প্যাড", count: 412, results: 3 },
  { term: "axio headlight", count: 268, results: 2 },
  { term: "মবিল ফিল্টার", count: 241, results: 3 },
  { term: "স্পার্ক প্লাগ", count: 190, results: 1 },
  { term: "ব্যাটারি", count: 176, results: 1 },
  { term: "সাইড মিরর", count: 151, results: 2 },
  { term: "noah bumper", count: 122, results: 1 },
  { term: "ইঞ্জিন অয়েল", count: 118, results: 2 },
];
const ZERO_TERMS: { term: string; count: number; suggestion: string | null }[] = [
  { term: "পিস্টন রিং", count: 38, suggestion: null },
  { term: "ডিকি লাইট", count: 31, suggestion: "ব্যাকলাইট / টেইল লাইট" },
  { term: "চাক্কা", count: 27, suggestion: "চাকা / রিম" },
  { term: "harrier ac compressor", count: 22, suggestion: null },
  { term: "লুকিং গ্লাস", count: 19, suggestion: "সাইড মিরর" },
  { term: "সাইলেন্সার পাইপ", count: 14, suggestion: "এক্সজস্ট" },
];

type ZeroRow = (typeof ZERO_TERMS)[number];

/** Search (file 03 §20): top terms, zero-result terms, synonym coverage. */
export function SearchReport() {
  const { tx, d } = useT();
  const total = sum(TOP_TERMS.map((t) => t.count)) + sum(ZERO_TERMS.map((t) => t.count));
  const zero = sum(ZERO_TERMS.map((t) => t.count));
  const zeroPct = pct(zero, total);
  const leaves = categories.filter((c) => c.level === 3);
  const withSyn = categories.filter((c) => c.synonyms.length > 0);
  const leavesWithSyn = leaves.filter((c) => c.synonyms.length > 0);

  const cols: Column<ZeroRow>[] = [
    { key: "term", header: tx("শব্দ", "Term"), sort: (r) => r.term, cell: (r) => <span className="font-semibold">{r.term}</span> },
    { key: "count", header: tx("কতবার", "Searches"), sort: (r) => r.count, cell: (r) => d(r.count) },
    { key: "sug", header: tx("সম্ভাব্য synonym", "Suggested synonym"), cell: (r) => r.suggestion ?? <span className="text-bad">{tx("পণ্য/বিক্রেতা নেই", "No product/seller")}</span> },
  ];

  return (
    <div className="space-y-5">
      <Notice tone="info">{tx("নমুনা সার্চ লগ (ডেমো)। আসল সার্চ লগ চালু হলে এখানে স্বয়ংক্রিয়ভাবে আসবে।", "Sample search log (demo). Real search logs will feed this once live.")}</Notice>
      <KpiGrid>
        <KpiCard label={tx("মোট সার্চ", "Searches")} value={d(total)} />
        <KpiCard label={tx("শূন্য ফলাফল", "Zero results")} value={`${d(zeroPct)}%`} tone={zeroPct < KPI.zeroResultPct ? "ok" : "bad"} sub={tx(`লক্ষ্য ${d(KPI.zeroResultPct)}% এর কম`, `Target under ${KPI.zeroResultPct}%`)} />
        <KpiCard label={tx("synonym কভারেজ (সব ক্যাটাগরি)", "Synonym coverage (all categories)")} value={`${d(pct(withSyn.length, categories.length))}%`} sub={tx(`${d(withSyn.length)} / ${d(categories.length)}`, `${withSyn.length} of ${categories.length}`)} />
        <KpiCard label={tx("synonym কভারেজ (আইটেম স্তর)", "Synonym coverage (item level)")} value={`${d(pct(leavesWithSyn.length, leaves.length))}%`} sub={tx(`${d(leavesWithSyn.length)} / ${d(leaves.length)}`, `${leavesWithSyn.length} of ${leaves.length}`)} />
      </KpiGrid>
      <Grid2>
        <ReportBlock title={tx("শীর্ষ শব্দ", "Top terms")} csvName="top-search-terms.csv" csv={[["term", "searches", "results"], ...TOP_TERMS.map((t) => [t.term, t.count, t.results])]}>
          <BarList data={TOP_TERMS.map((t) => ({ label: t.term, value: t.count, sub: tx(`${d(t.results)}টা ফলাফল`, `${t.results} results`) }))} />
        </ReportBlock>
        <ReportBlock
          title={tx("শূন্য ফলাফলের শব্দ", "Zero-result terms")}
          csvName="zero-result-terms.csv"
          csv={[["term", "searches", "suggested_synonym"], ...ZERO_TERMS.map((t) => [t.term, t.count, t.suggestion ?? ""])]}
          actions={
            <Link href="/admin/catalog/dictionary" className="text-sm font-semibold text-brand hover:underline">
              {tx("শব্দভাণ্ডারে যোগ করুন →", "Add to dictionary →")}
            </Link>
          }
        >
          <DataTable rows={ZERO_TERMS} columns={cols} rowKey={(r) => r.term} initialSort={{ key: "count", dir: "desc" }} />
        </ReportBlock>
      </Grid2>
    </div>
  );
}
