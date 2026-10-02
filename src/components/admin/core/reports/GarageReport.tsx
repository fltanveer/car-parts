"use client";

import { BarList, type Column, DataTable, KpiCard, KpiGrid } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { Countdown } from "@/components/shared/Misc";
import { describeVehicle } from "@/lib/db/queries";
import type { DB } from "@/lib/db/seed";
import { docTypeLabel } from "@/lib/labels";
import type { VehicleDocument } from "@/lib/types";
import { countBy, DAY, Grid2, KPI, pct, ReportBlock } from "./util";

interface DocRow {
  id: string;
  owner: string;
  vehicle: string;
  doc: VehicleDocument;
  expired: boolean;
}

/** My car (file 03 §20): how many set a car, popular models, document reminders. */
export function GarageReport({ s, now }: { s: DB; now: number }) {
  const { tx, d, L, date } = useT();
  const customers = new Set([...s.profiles.map((p) => p.phone), ...s.orders.map((o) => o.user_phone), ...s.requests.map((r) => r.user_phone)]);
  const owners = new Set(s.vehicles.filter((v) => v.generation_id).map((v) => v.owner));
  const setPct = pct(owners.size, customers.size);
  const vName = (gen: string | null, fallback: string) => describeVehicle(gen)?.short ?? fallback;
  const garageModels = countBy(s.vehicles, (v) => vName(v.generation_id, tx("প্রজন্ম ঠিক হয়নি", "Generation not set")));
  const requestModels = countBy(s.requests.filter((r) => r.generation_id), (r) => vName(r.generation_id, ""));
  const docs: DocRow[] = s.vehicles.flatMap((v) =>
    v.documents
      .filter((doc) => doc.expires_on && new Date(doc.expires_on).getTime() - now <= 30 * DAY)
      .map((doc) => ({ id: `${v.id}-${doc.id}`, owner: v.owner, vehicle: v.nickname ?? vName(v.generation_id, v.registration_no ?? "—"), doc, expired: new Date(doc.expires_on!).getTime() < now })),
  );

  const cols: Column<DocRow>[] = [
    { key: "owner", header: tx("মালিক", "Owner"), sort: (r) => r.owner, cell: (r) => <span className="font-mono">{d(r.owner.replace(/^\+88/, ""))}</span> },
    { key: "veh", header: tx("গাড়ি", "Vehicle"), cell: (r) => r.vehicle },
    { key: "doc", header: tx("কাগজ", "Document"), cell: (r) => L(docTypeLabel[r.doc.doc_type]) },
    { key: "exp", header: tx("মেয়াদ", "Expires"), sort: (r) => r.doc.expires_on ?? "", cell: (r) => date(r.doc.expires_on!) },
    { key: "left", header: tx("বাকি", "Left"), cell: (r) => <Countdown to={r.doc.expires_on!} warnHours={7 * 24} /> },
  ];

  return (
    <div className="space-y-5">
      <KpiGrid>
        <KpiCard label={tx("গাড়ি সেট করা কাস্টমার", "Customers with a car set")} value={`${d(setPct)}%`} tone={setPct >= KPI.myCarSetPct ? "ok" : "wait"} sub={tx(`${d(owners.size)} / ${d(customers.size)} · লক্ষ্য ${d(KPI.myCarSetPct)}%`, `${owners.size} of ${customers.size} · target ${KPI.myCarSetPct}%`)} />
        <KpiCard label={tx("মোট গাড়ি", "Vehicles")} value={d(s.vehicles.length)} />
        <KpiCard label={tx("৩০ দিনে মেয়াদ শেষ কাগজ", "Docs expiring in 30 days")} value={d(docs.length)} tone={docs.some((x) => x.expired) ? "bad" : docs.length ? "wait" : "ok"} sub={tx(`${d(docs.filter((x) => x.expired).length)}টা মেয়াদোত্তীর্ণ`, `${docs.filter((x) => x.expired).length} expired`)} />
        <KpiCard label={tx("কাগজ যাচাই কিউ", "Doc review queue")} value={d(s.garageTasks.filter((t) => t.status === "open").length)} href="/admin/garage-docs" />
      </KpiGrid>
      <Grid2>
        <ReportBlock title={tx("জনপ্রিয় মডেল (আমার গাড়ি)", "Popular models (my garage)")}>
          <BarList data={garageModels.map(([label, value]) => ({ label, value }))} />
        </ReportBlock>
        <ReportBlock title={tx("রিকোয়েস্টে কোন গাড়ি", "Cars in requests")}>
          <BarList data={requestModels.map(([label, value]) => ({ label, value }))} />
        </ReportBlock>
      </Grid2>
      <ReportBlock
        title={tx("কাগজের রিমাইন্ডার (৩০ দিনের মধ্যে)", "Document reminders (within 30 days)")}
        csvName="doc-reminders.csv"
        csv={[["owner", "vehicle", "doc_type", "expires_on", "expired"], ...docs.map((r) => [r.owner, r.vehicle, r.doc.doc_type, r.doc.expires_on, r.expired ? "yes" : "no"])]}
      >
        <DataTable rows={docs} columns={cols} rowKey={(r) => r.id} initialSort={{ key: "exp", dir: "asc" }} empty={tx("৩০ দিনে কোনো কাগজের মেয়াদ শেষ হচ্ছে না", "No documents expire in 30 days")} />
      </ReportBlock>
    </div>
  );
}
