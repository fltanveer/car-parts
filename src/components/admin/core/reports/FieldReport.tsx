"use client";

import { BarList, type Column, DataTable, KpiCard, KpiGrid } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import type { DB } from "@/lib/db/seed";
import type { Staff } from "@/lib/types";
import { countBy, DAY, Grid2, ReportBlock, sum, voCreated } from "./util";

interface Row {
  a: Staff;
  visits: number;
  onboardings: number;
  vendors: number;
  listings: number;
  sales30: number;
  leads: number;
}

const purposeLabel = {
  onboarding: { bn: "অনবোর্ডিং", en: "Onboarding" },
  verification: { bn: "যাচাই", en: "Verification" },
  assisted_upload: { bn: "পণ্য আপলোড", en: "Assisted upload" },
  training: { bn: "প্রশিক্ষণ", en: "Training" },
  audit: { bn: "অডিট", en: "Audit" },
};

/** Field agents (file 03 §20): visits, onboardings, listings created, 30-day sales of their sellers. */
export function FieldReport({ s, now }: { s: DB; now: number }) {
  const { tx, d, taka, L } = useT();
  const agents = s.staff.filter((x) => x.roles.includes("field_agent") || s.fieldVisits.some((v) => v.agent_id === x.id));
  const rows: Row[] = agents.map((a) => {
    const visits = s.fieldVisits.filter((v) => v.agent_id === a.id);
    const vendorIds = new Set([...s.vendors.filter((v) => v.onboarded_by === a.id).map((v) => v.id)]);
    const sales30 = sum(
      s.vendorOrders.filter((o) => vendorIds.has(o.vendor_id) && now - new Date(voCreated(o)).getTime() <= 30 * DAY && !["cancelled", "rejected_by_vendor", "qc_failed"].includes(o.status)).map((o) => o.subtotal),
    );
    return {
      a, visits: visits.length, onboardings: visits.filter((v) => v.purpose === "onboarding").length, vendors: vendorIds.size,
      listings: sum(visits.map((v) => v.listings_created)), sales30, leads: s.leads.filter((l) => l.owner_agent === a.id).length,
    };
  });

  const cols: Column<Row>[] = [
    { key: "name", header: tx("মাঠকর্মী", "Agent"), sort: (r) => r.a.name, cell: (r) => <span className="font-semibold">{r.a.name}</span> },
    { key: "v", header: tx("ভিজিট", "Visits"), sort: (r) => r.visits, cell: (r) => d(r.visits) },
    { key: "o", header: tx("অনবোর্ডিং", "Onboardings"), sort: (r) => r.onboardings, cell: (r) => d(r.onboardings) },
    { key: "vend", header: tx("যুক্ত করা দোকান", "Sellers brought"), sort: (r) => r.vendors, cell: (r) => d(r.vendors) },
    { key: "l", header: tx("তৈরি লিস্টিং", "Listings created"), sort: (r) => r.listings, cell: (r) => d(r.listings) },
    { key: "leads", header: tx("লিড", "Leads"), sort: (r) => r.leads, cell: (r) => d(r.leads), hideOnMobile: true },
    { key: "s", header: tx("সেই দোকানের ৩০ দিনের বিক্রি", "Their sellers' 30-day sales"), sort: (r) => r.sales30, cell: (r) => taka(r.sales30) },
  ];

  return (
    <div className="space-y-5">
      <KpiGrid>
        <KpiCard label={tx("মোট ভিজিট", "Visits")} value={d(s.fieldVisits.length)} />
        <KpiCard label={tx("অনবোর্ডিং", "Onboardings")} value={d(s.fieldVisits.filter((v) => v.purpose === "onboarding").length)} />
        <KpiCard label={tx("তৈরি লিস্টিং", "Listings created")} value={d(sum(s.fieldVisits.map((v) => v.listings_created)))} />
        <KpiCard label={tx("৩০ দিনের বিক্রি", "30-day sales")} value={taka(sum(rows.map((r) => r.sales30)))} tone="ok" />
      </KpiGrid>
      <Grid2>
        <ReportBlock title={tx("ভিজিটের উদ্দেশ্য", "Visit purpose")}>
          <BarList data={countBy(s.fieldVisits, (v) => v.purpose).map(([p, n]) => ({ label: L(purposeLabel[p as keyof typeof purposeLabel]), value: n }))} />
        </ReportBlock>
        <ReportBlock title={tx("মাঠকর্মী অনুযায়ী বিক্রি", "Sales by agent")}>
          <BarList data={rows.map((r) => ({ label: r.a.name, value: r.sales30, tone: "ok" }))} format={taka} />
        </ReportBlock>
      </Grid2>
      <ReportBlock
        title={tx("মাঠকর্মী", "Field agents")}
        csvName="field-agents.csv"
        csv={[["staff_id", "name", "visits", "onboardings", "sellers_brought", "listings_created", "leads", "sales_30d"], ...rows.map((r) => [r.a.id, r.a.name, r.visits, r.onboardings, r.vendors, r.listings, r.leads, r.sales30])]}
      >
        <DataTable rows={rows} columns={cols} rowKey={(r) => r.a.id} empty={tx("কোনো মাঠকর্মী নেই", "No field agents")} />
      </ReportBlock>
    </div>
  );
}
