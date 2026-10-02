"use client";

import Link from "next/link";
import { BarList, type Column, DataTable, KpiCard, KpiGrid } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { categoryPath, describeVehicle } from "@/lib/db/queries";
import type { DB } from "@/lib/db/seed";
import { requestStatusLabel } from "@/lib/labels";
import type { PartRequest } from "@/lib/types";
import { StatusPill } from "@/components/ui/primitives";
import { countBy, DAY, Grid2, ReportBlock } from "./util";

/** Requests without quotes by category / car: which sellers to recruit (file 03 §20). */
export function NoQuoteReport({ s, now }: { s: DB; now: number }) {
  const { tx, d, L, ago } = useT();
  const quoted = new Set(s.quotes.map((q) => q.request_id));
  const rows = s.requests.filter((r) => !quoted.has(r.id) && r.status !== "cancelled");
  const old = rows.filter((r) => now - new Date(r.broadcast_at ?? r.created_at).getTime() > DAY);
  const catOf = (r: PartRequest) => {
    const top = categoryPath(r.items[0]?.category_id ?? null)[0];
    return top ? L({ bn: top.name_bn, en: top.name }) : tx("ক্যাটাগরি ঠিক হয়নি", "No category yet");
  };
  const carOf = (r: PartRequest) => describeVehicle(r.generation_id)?.short ?? r.vehicle_text ?? tx("গাড়ি অজানা", "Unknown car");
  const byCat = countBy(rows, catOf);
  const byCar = countBy(rows, carOf);

  const cols: Column<PartRequest>[] = [
    { key: "no", header: tx("নম্বর", "No."), sort: (r) => r.request_no, cell: (r) => <Link href={`/admin/requests/${r.id}`} className="font-semibold text-brand hover:underline">{r.request_no}</Link> },
    { key: "cat", header: tx("ক্যাটাগরি", "Category"), sort: catOf, cell: catOf },
    { key: "car", header: tx("গাড়ি", "Car"), sort: carOf, cell: carOf },
    { key: "what", header: tx("কী চাই", "Wanted"), cell: (r) => <span className="text-xs">{r.items[0]?.name ?? r.description_text ?? "—"}</span>, hideOnMobile: true },
    { key: "shops", header: tx("কত দোকানে", "Shops"), sort: (r) => r.matches.length, cell: (r) => tx(`${d(r.matches.length)}টা (${d(r.matches.filter((m) => m.declined).length)} না)`, `${r.matches.length} (${r.matches.filter((m) => m.declined).length} declined)`) },
    { key: "age", header: tx("বয়স", "Age"), sort: (r) => r.created_at, cell: (r) => ago(r.created_at) },
    { key: "st", header: tx("অবস্থা", "Status"), cell: (r) => <StatusPill tone={requestStatusLabel[r.status].tone}>{L(requestStatusLabel[r.status])}</StatusPill> },
  ];

  return (
    <div className="space-y-5">
      <KpiGrid>
        <KpiCard label={tx("দাম আসেনি", "No quotes")} value={d(rows.length)} tone={rows.length ? "wait" : "ok"} />
        <KpiCard label={tx("২৪ ঘণ্টা+ দাম নেই", "No quote 24h+")} value={d(old.length)} tone={old.length ? "bad" : "ok"} />
        <KpiCard label={tx("সবচেয়ে বেশি ঘাটতি", "Biggest gap")} value={byCat[0]?.[0] ?? "—"} sub={byCar[0]?.[0]} />
      </KpiGrid>
      <Grid2>
        <ReportBlock title={tx("ক্যাটাগরি অনুযায়ী", "By category")}>
          <BarList data={byCat.map(([label, value]) => ({ label, value, tone: "wait" }))} />
        </ReportBlock>
        <ReportBlock title={tx("গাড়ি অনুযায়ী", "By car")}>
          <BarList data={byCar.map(([label, value]) => ({ label, value, tone: "wait" }))} />
        </ReportBlock>
      </Grid2>
      <ReportBlock
        title={tx("দাম না আসা রিকোয়েস্ট: এই জিনিসের বিক্রেতা আনতে হবে", "Requests without quotes: recruit sellers for these")}
        csvName="no-quote-requests.csv"
        csv={[["request_no", "category", "car", "wanted", "shops", "declined", "created_at", "status"], ...rows.map((r) => [r.request_no, catOf(r), carOf(r), r.items[0]?.name ?? r.description_text ?? "", r.matches.length, r.matches.filter((m) => m.declined).length, r.created_at, r.status])]}
      >
        <DataTable rows={rows} columns={cols} rowKey={(r) => r.id} empty={tx("সব রিকোয়েস্টে দাম এসেছে 🎉", "Every request got quotes 🎉")} />
      </ReportBlock>
    </div>
  );
}
