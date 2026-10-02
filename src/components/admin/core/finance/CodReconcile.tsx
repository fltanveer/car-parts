"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import { type Column, CsvImport, DataTable, FilterChip, KpiCard, KpiGrid, Panel } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, Field, Input, Notice, StatusPill } from "@/components/ui/primitives";
import type { DB } from "@/lib/db/seed";
import type { Tone } from "@/lib/labels";
import { type CodKind, type CodResult, codSample, codTotals, matchCod } from "./cod";
import { saveCodBatch } from "./overlay";
import { Money, OrderLink } from "./shared";

const KIND_TONE: Record<CodKind, Tone> = { ok: "ok", short: "bad", returned: "wait", unknown: "bad", missing: "bad" };

export function CodReconcile({ s, defaultPeriod }: { s: DB; defaultPeriod: string }) {
  const { tx, d, taka } = useT();
  const [rows, setRows] = useState<Record<string, string>[] | null>(null);
  const [filter, setFilter] = useState<CodKind | "all">("all");
  const [period, setPeriod] = useState(defaultPeriod);
  const [saved, setSaved] = useState(false);

  const kindLabel: Record<CodKind, string> = {
    ok: tx("মিলেছে", "Matched"),
    short: tx("কম পাওয়া", "Short"),
    returned: tx("ফেরত পার্সেল", "Returned"),
    unknown: tx("ফাইলে আছে, সিস্টেমে নেই", "Unknown in file"),
    missing: tx("ফাইলে নেই (টাকা আসেনি)", "Missing from file"),
  };

  const results = rows ? matchCod(s, rows) : [];
  const totals = codTotals(results);
  const shown = filter === "all" ? results : results.filter((r) => r.kind === filter);
  const orderOf = (r: CodResult) => (r.vo ? s.orders.find((o) => o.id === r.vo!.order_id) ?? null : null);

  const cols: Column<CodResult>[] = [
    { key: "kind", header: tx("ফলাফল", "Result"), sort: (r) => r.kind, cell: (r) => <StatusPill tone={KIND_TONE[r.kind]}>{kindLabel[r.kind]}</StatusPill> },
    {
      key: "sub", header: tx("সাব-অর্ডার", "Sub-order"), sort: (r) => r.subOrderNo,
      cell: (r) => {
        const o = orderOf(r);
        return o ? <OrderLink id={o.id} no={r.vo!.sub_order_no} /> : <span className="font-mono">{r.subOrderNo || "—"}</span>;
      },
    },
    { key: "courier", header: tx("কুরিয়ার", "Courier"), cell: (r) => r.courier || "—" },
    { key: "trk", header: tx("ট্র্যাকিং", "Tracking"), cell: (r) => <span className="font-mono text-xs">{r.tracking || "—"}</span>, hideOnMobile: true },
    { key: "exp", header: tx("পাওয়ার কথা", "Expected"), sort: (r) => r.expected, cell: (r) => (r.vo ? <Money value={r.expected} /> : "—") },
    { key: "got", header: tx("পাওয়া গেছে", "Received"), sort: (r) => r.collected, cell: (r) => <Money value={r.collected} /> },
    { key: "diff", header: tx("পার্থক্য", "Difference"), sort: (r) => r.collected - r.expected, cell: (r) => (r.kind === "returned" ? "—" : <Money value={r.collected - r.expected} signed />) },
    { key: "fs", header: tx("ফাইলের অবস্থা", "File status"), cell: (r) => r.fileStatus || "—", hideOnMobile: true },
  ];

  const save = () => {
    const couriers = [...new Set(results.map((r) => r.courier).filter(Boolean))].join(", ");
    const clean = totals.difference === 0 && !totals.counts.short && !totals.counts.unknown && !totals.counts.missing;
    saveCodBatch({ period, courier: couriers || "—", expected: totals.expected, received: totals.received, difference: totals.difference, status: clean ? "matched" : "mismatch", counts: totals.counts, file_name: null });
    setSaved(true);
    toast(tx("ব্যাচ সংরক্ষণ হয়েছে", "Batch saved"));
  };

  return (
    <div className="space-y-5">
      <Panel title={tx("১. কুরিয়ারের রেমিট্যান্স ফাইল দিন", "1. Upload the courier remittance file")}>
        <CsvImport
          sample={codSample(s)}
          sampleName="cod-remittance-sample.csv"
          onRows={(r) => {
            setRows(r);
            setSaved(false);
            setFilter("all");
          }}
        />
        <p className="mt-2 text-xs text-muted">
          {tx("কলাম: courier, tracking_no, sub_order_no, collected_amount, status (delivered / returned / partial)", "Columns: courier, tracking_no, sub_order_no, collected_amount, status (delivered / returned / partial)")}
        </p>
      </Panel>

      {rows && (
        <>
          <KpiGrid>
            <KpiCard label={tx("পাওয়ার কথা", "Expected")} value={taka(totals.expected)} />
            <KpiCard label={tx("পাওয়া গেছে", "Received")} value={taka(totals.received)} />
            <KpiCard label={tx("পার্থক্য", "Difference")} value={<Money value={totals.difference} signed />} tone={totals.difference === 0 ? "ok" : "bad"} />
            <KpiCard label={tx("গরমিল সারি", "Problem rows")} value={d(totals.counts.short + totals.counts.unknown + totals.counts.missing)} tone={totals.counts.short + totals.counts.unknown + totals.counts.missing ? "bad" : "ok"} sub={tx(`ফেরত ${d(totals.counts.returned)}টা`, `${totals.counts.returned} returned`)} />
          </KpiGrid>
          <DataTable
            rows={shown}
            columns={cols}
            rowKey={(r) => String(r.idx)}
            caption={tx("২. স্বয়ংক্রিয় মেলানো", "2. Auto-match")}
            rowClassName={(r) => (KIND_TONE[r.kind] === "bad" ? "bg-bad-soft/40" : undefined)}
            toolbar={
              <div className="flex flex-wrap gap-1.5">
                <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
                  {tx("সব", "All")} ({d(results.length)})
                </FilterChip>
                {(Object.keys(kindLabel) as CodKind[]).map((k) => (
                  <FilterChip key={k} active={filter === k} onClick={() => setFilter(k)}>
                    {kindLabel[k]} ({d(totals.counts[k])})
                  </FilterChip>
                ))}
              </div>
            }
          />
          <Panel title={tx("৩. ব্যাচ সংরক্ষণ", "3. Save batch")}>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <Field label={tx("সময়কাল", "Period")}>
                <Input value={period} onChange={(e) => setPeriod(e.target.value)} />
              </Field>
              <Button size="lg" variant="brand" onClick={save} disabled={saved || !results.length || !period.trim()}>
                <Save className="size-5" /> {saved ? tx("সংরক্ষিত", "Saved") : tx("ব্যাচ সংরক্ষণ করুন", "Save batch")}
              </Button>
            </div>
            {totals.counts.missing > 0 && (
              <Notice tone="bad" className="mt-3">
                {tx("কিছু পার্সেলের টাকা ফাইলে নেই। কুরিয়ারকে কল করে জানতে চান, কল লগে লিখে রাখুন।", "Some parcels are missing from the file. Call the courier and log the call.")}
              </Notice>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
