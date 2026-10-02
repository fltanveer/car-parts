"use client";

import { Smartphone } from "lucide-react";
import { DataTable, KpiTile, OpsPage, Panel, useStaffName } from "@/components/admin/ops/ui";
import { vendorMetrics } from "@/components/admin/ops/vendorUtils";
import { useT } from "@/components/providers/LangProvider";
import { useNow } from "@/components/shared/Misc";
import { ButtonLink } from "@/components/ui/primitives";
import { useDb } from "@/lib/db/store";
import { displayPhone } from "@/lib/format";
import type { Staff } from "@/lib/types";

const DAY = 86_400_000;

export default function FieldPage() {
  const { tx, d, taka, dateTime } = useT();
  const now = useNow();
  const db = useDb((s) => s);
  const staffName = useStaffName();
  const agents = db.staff.filter((s) => s.roles.includes("field_agent"));
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const today = db.fieldVisits.filter((f) => new Date(f.at).getTime() >= start.getTime());
  const stats = (a: Staff) => {
    const shops = db.vendors.filter((v) => v.onboarded_by === a.id);
    const visits = db.fieldVisits.filter((f) => f.agent_id === a.id);
    return {
      shops: shops.length,
      visits30: visits.filter((f) => now - new Date(f.at).getTime() < 30 * DAY).length,
      today: today.filter((f) => f.agent_id === a.id).length,
      listings: visits.reduce((t, f) => t + f.listings_created, 0),
      sales: shops.reduce((t, v) => t + vendorMetrics(db, v, now).sales30Value, 0),
    };
  };

  return (
    <OpsPage
      title={tx("মাঠকর্মী", "Field agents")}
      guide={tx("এখানে প্রতিটা মাঠকর্মীর ভিজিট, যুক্ত করা দোকান, তৈরি লিস্টিং আর সেই দোকানগুলোর বিক্রি দেখুন। মাঠকর্মী নিজে ফোনে মাঠকর্মী অ্যাপ বাটন চেপে কাজ করবেন।", "See each agent's visits, onboarded shops, listings created and those shops' sales. Agents use the field app button on their phone.")}
      actions={<ButtonLink href="/admin/field/app" variant="brand"><Smartphone className="size-5" /> {tx("মাঠকর্মী অ্যাপ", "Field app")}</ButtonLink>}
    >
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile label={tx("আজকের ভিজিট", "Visits today")} value={d(today.length)} />
        <KpiTile label={tx("মাঠকর্মী", "Agents")} value={d(agents.length)} />
        <KpiTile label={tx("মোট যুক্ত দোকান", "Shops onboarded")} value={d(db.vendors.filter((v) => v.onboarded_by && agents.some((a) => a.id === v.onboarded_by)).length)} />
        <KpiTile label={tx("তৈরি লিস্টিং", "Listings created")} value={d(db.fieldVisits.reduce((t, f) => t + f.listings_created, 0))} />
      </div>
      <DataTable
        rows={agents}
        rowKey={(a) => a.id}
        columns={[
          { key: "n", header: tx("নাম", "Name"), cell: (a) => <span><b>{a.name}</b><span className="block text-xs text-muted">{d(displayPhone(a.phone))}</span></span> },
          { key: "t", header: tx("আজ ভিজিট", "Today"), sort: (a) => stats(a).today, cell: (a) => d(stats(a).today) },
          { key: "v", header: tx("৩০ দিনে ভিজিট", "Visits 30d"), sort: (a) => stats(a).visits30, cell: (a) => d(stats(a).visits30) },
          { key: "s", header: tx("যুক্ত দোকান", "Shops onboarded"), sort: (a) => stats(a).shops, cell: (a) => d(stats(a).shops) },
          { key: "l", header: tx("তৈরি লিস্টিং", "Listings created"), sort: (a) => stats(a).listings, cell: (a) => d(stats(a).listings) },
          { key: "x", header: tx("সেই দোকানের ৩০ দিনের বিক্রি", "Those shops' 30d sales"), sort: (a) => stats(a).sales, cell: (a) => taka(stats(a).sales) },
        ]}
      />
      <Panel title={tx("সাম্প্রতিক ভিজিট", "Recent visits")} className="mt-4">
        <ul className="space-y-2 text-sm">
          {[...db.fieldVisits].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 15).map((f) => {
            const v = db.vendors.find((x) => x.id === f.vendor_id);
            const l = db.leads.find((x) => x.id === f.lead_id);
            return (
              <li key={f.id} className="rounded-lg bg-surface p-2.5">
                📍 <b>{v?.shop_name_bn ?? l?.shop_name ?? "—"}</b> · {f.purpose} · {tx("লিস্টিং", "listings")} {d(f.listings_created)}
                {f.report && <span className="block text-ink-2">{f.report}</span>}
                <span className="block text-xs text-muted">{staffName(f.agent_id)} · {dateTime(f.at)}</span>
              </li>
            );
          })}
        </ul>
      </Panel>
    </OpsPage>
  );
}
