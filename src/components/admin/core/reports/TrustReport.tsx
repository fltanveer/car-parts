"use client";

import { BarList, type Column, DataTable, KpiCard, KpiGrid } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { StatusPill } from "@/components/ui/primitives";
import type { DB } from "@/lib/db/seed";
import { claimTypeLabel } from "@/lib/labels";
import type { ClaimType, Vendor } from "@/lib/types";
import { VendorLink } from "../finance/shared";
import { countBy, Grid2, KPI, pct, ReportBlock, sum } from "./util";

const reasonLabel = {
  fake: { bn: "নকল", en: "Fake" },
  stolen_suspect: { bn: "চুরির সন্দেহ", en: "Stolen suspect" },
  wrong_info: { bn: "ভুল তথ্য", en: "Wrong info" },
  scam: { bn: "প্রতারণা", en: "Scam" },
  other: { bn: "অন্য", en: "Other" },
};

/** Trust (file 03 §20): claims by type, dispute winners, reports, suspended sellers, contact-sharing attempts. */
export function TrustReport({ s }: { s: DB }) {
  const { tx, d, L } = useT();
  const byType = countBy(s.claims, (c) => c.type) as [ClaimType, number][];
  const winners = {
    customer: s.claims.filter((c) => c.resolution === "refund" || c.resolution === "partial_refund" || c.resolution === "replace").length,
    seller: s.claims.filter((c) => c.resolution === "rejected").length,
    open: s.claims.filter((c) => c.resolution === null).length,
  };
  const nad = s.claims.filter((c) => c.type === "not_as_described").length;
  const nadRate = pct(nad, s.vendorOrders.length);
  const suspended = s.vendors.filter((v) => v.status === "suspended");
  const attempts = sum(s.vendors.map((v) => v.contact_attempts));
  const attemptsTop = s.vendors.filter((v) => v.contact_attempts > 0).sort((a, b) => b.contact_attempts - a.contact_attempts);
  const flagged = new Map<string, number>();
  s.threads.forEach((t) => t.messages.forEach((m) => m.contains_contact_info && t.vendor_id && flagged.set(t.vendor_id, (flagged.get(t.vendor_id) ?? 0) + 1)));
  const people = [...new Set([...attemptsTop.map((v) => v.id), ...flagged.keys(), ...suspended.map((v) => v.id)])].map((id) => s.vendors.find((v) => v.id === id)!).filter(Boolean);

  const cols: Column<Vendor>[] = [
    { key: "shop", header: tx("দোকান", "Shop"), sort: (v) => v.shop_name, cell: (v) => <VendorLink id={v.id} name={v.shop_name_bn} /> },
    { key: "status", header: tx("অবস্থা", "Status"), cell: (v) => <StatusPill tone={v.status === "suspended" ? "bad" : "ok"}>{v.status === "suspended" ? tx("স্থগিত", "Suspended") : tx("সক্রিয়", "Active")}</StatusPill> },
    { key: "score", header: tx("স্কোর", "Score"), sort: (v) => v.score, cell: (v) => d(v.score) },
    { key: "att", header: tx("নম্বর শেয়ারের চেষ্টা", "Contact attempts"), sort: (v) => v.contact_attempts, cell: (v) => <span className={v.contact_attempts ? "font-bold text-bad" : ""}>{d(v.contact_attempts)}</span> },
    { key: "msg", header: tx("চ্যাটে ধরা পড়া", "Caught in chat"), sort: (v) => flagged.get(v.id) ?? 0, cell: (v) => d(flagged.get(v.id) ?? 0) },
    { key: "cl", header: tx("দাবি", "Claims"), sort: (v) => s.claims.filter((c) => c.vendor_id === v.id).length, cell: (v) => d(s.claims.filter((c) => c.vendor_id === v.id).length) },
  ];

  return (
    <div className="space-y-5">
      <KpiGrid>
        <KpiCard label={tx("মোট দাবি", "Claims")} value={d(s.claims.length)} />
        <KpiCard label={tx("\"মেলে না\" দাবির হার", "\"Not as described\" rate")} value={`${d(nadRate)}%`} tone={nadRate < KPI.notAsDescribedPct ? "ok" : "bad"} sub={tx(`লক্ষ্য ${d(KPI.notAsDescribedPct)}% এর কম`, `Target under ${KPI.notAsDescribedPct}%`)} />
        <KpiCard label={tx("খোলা রিপোর্ট", "Open reports")} value={d(s.reports.filter((r) => r.status === "open").length)} sub={tx(`মোট ${d(s.reports.length)}`, `${s.reports.length} total`)} tone="wait" />
        <KpiCard label={tx("স্থগিত বিক্রেতা", "Suspended sellers")} value={d(suspended.length)} tone={suspended.length ? "bad" : "ok"} />
        <KpiCard label={tx("নম্বর শেয়ারের চেষ্টা", "Contact-sharing attempts")} value={d(attempts)} tone={attempts ? "bad" : "ok"} />
      </KpiGrid>
      <Grid2>
        <ReportBlock title={tx("ধরন অনুযায়ী দাবি", "Claims by type")} csvName="claims-by-type.csv" csv={[["type", "count"], ...byType.map(([t, n]) => [t, n])]}>
          <BarList data={byType.map(([t, n]) => ({ label: `${claimTypeLabel[t].icon} ${L(claimTypeLabel[t])}`, value: n, tone: "wait" }))} />
        </ReportBlock>
        <ReportBlock title={tx("বিরোধে কে জিতেছে", "Who won disputes")}>
          <BarList
            data={[
              { label: tx("কাস্টমার (রিফান্ড/বদল)", "Customer (refund/replace)"), value: winners.customer, tone: "ok" },
              { label: tx("বিক্রেতা (দাবি বাতিল)", "Seller (claim rejected)"), value: winners.seller, tone: "bad" },
              { label: tx("এখনো খোলা", "Still open"), value: winners.open, tone: "wait" },
            ]}
            max={Math.max(1, s.claims.length)}
          />
          <h3 className="mb-2 mt-5 text-sm font-bold">{tx("রিপোর্টের কারণ", "Report reasons")}</h3>
          <BarList data={countBy(s.reports, (r) => r.reason).map(([r, n]) => ({ label: L(reasonLabel[r as keyof typeof reasonLabel]), value: n }))} />
        </ReportBlock>
      </Grid2>
      <ReportBlock
        title={tx("ঝুঁকিপূর্ণ বিক্রেতা", "Risky sellers")}
        csvName="trust-sellers.csv"
        csv={[["vendor_id", "shop", "status", "score", "contact_attempts", "flagged_messages", "claims"], ...people.map((v) => [v.id, v.shop_name, v.status, v.score, v.contact_attempts, flagged.get(v.id) ?? 0, s.claims.filter((c) => c.vendor_id === v.id).length])]}
      >
        <DataTable rows={people} columns={cols} rowKey={(v) => v.id} initialSort={{ key: "att", dir: "desc" }} empty={tx("কোনো ঝুঁকিপূর্ণ বিক্রেতা নেই", "No risky sellers")} />
      </ReportBlock>
    </div>
  );
}
