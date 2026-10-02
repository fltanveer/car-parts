"use client";

import Link from "next/link";
import { useState } from "react";
import { ComplaintCard } from "@/components/admin/ops/ComplaintCard";
import { DataTable, FilterChips, KpiTile, OpsPage, Panel } from "@/components/admin/ops/ui";
import { useT } from "@/components/providers/LangProvider";
import { toast, useNow } from "@/components/shared/Misc";
import { Button, Field, Input, Select, StatusPill, Tabs, Textarea } from "@/components/ui/primitives";
import { closeReport, createComplaint, reportToModeration } from "@/lib/db/actions-admin-ops-trust";
import { useDb } from "@/lib/db/store";
import { displayPhone, normalizePhone } from "@/lib/format";
import type { Report } from "@/lib/types";

const REASON = { fake: { bn: "নকল", en: "Fake" }, stolen_suspect: { bn: "চুরির সন্দেহ", en: "Stolen suspect" }, wrong_info: { bn: "ভুল তথ্য", en: "Wrong info" }, scam: { bn: "প্রতারণা", en: "Scam" }, other: { bn: "অন্য", en: "Other" } };

export default function ComplaintsPage() {
  const { tx, d, L, ago } = useT();
  const now = useNow();
  const complaints = useDb((s) => s.complaints);
  const reports = useDb((s) => s.reports);
  const moderation = useDb((s) => s.moderation);
  const listings = useDb((s) => s.listings);
  const vendors = useDb((s) => s.vendors);
  const [tab, setTab] = useState<"complaints" | "reports">("complaints");
  const [filter, setFilter] = useState<"active" | "all">("active");
  const [form, setForm] = useState({ phone: "", subject: "", description: "" });
  const [outcome, setOutcome] = useState<Record<string, string>>({});
  const monthStart = new Date(now);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const thisMonth = complaints.filter((c) => new Date(c.created_at) >= monthStart);
  const responded = thisMonth.filter((c) => c.first_response_at);
  const onTime = responded.filter((c) => c.first_response_at! <= c.first_response_by);
  const shown = complaints.filter((c) => filter === "all" || c.status === "open" || c.status === "in_progress").sort((a, b) => a.first_response_by.localeCompare(b.first_response_by));
  const e164 = normalizePhone(form.phone);

  const targetLink = (r: Report) => {
    if (r.target_type === "listing") {
      const l = listings.find((x) => x.id === r.target_id);
      return l ? <Link href={`/admin/vendors/${l.vendor_id}`} className="font-semibold text-brand">{l.title_bn}</Link> : r.target_id;
    }
    if (r.target_type === "vendor") return <Link href={`/admin/vendors/${r.target_id}`} className="font-semibold text-brand">{vendors.find((v) => v.id === r.target_id)?.shop_name_bn ?? r.target_id}</Link>;
    return `${r.target_type} ${r.target_id}`;
  };

  return (
    <OpsPage
      title={tx("অভিযোগ ও রিপোর্ট", "Complaints & reports")}
      guide={tx("আইন অনুযায়ী প্রতিটা অভিযোগে ৭২ ঘণ্টার মধ্যে প্রথম সাড়া দিতে হবে। লাল টাইমারগুলো আগে ধরুন। রিপোর্ট ট্যাবে কাস্টমারের রিপোর্ট মডারেশনে পাঠান এবং রিপোর্টকারীকে ফলাফল জানান।", "By law each complaint needs a first reply within 72 hours. Take red timers first. In Reports, send to moderation and tell the reporter the outcome.")}
    >
      <div className="mb-4 px-4">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "complaints", label: tx("অভিযোগ (আইনি)", "Complaints (legal)"), count: complaints.filter((c) => !c.first_response_at && c.status === "open").length },
            { value: "reports", label: tx("রিপোর্ট", "Reports"), count: reports.filter((r) => r.status === "open").length },
          ]}
        />
      </div>

      {tab === "complaints" ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
          <div className="space-y-3">
            <FilterChips<"active" | "all"> value={filter} onChange={setFilter} items={[{ value: "active", label: tx("চলমান", "Active") }, { value: "all", label: tx("সব", "All"), count: complaints.length }]} />
            {shown.map((c) => <ComplaintCard key={c.id} c={c} />)}
            {!shown.length && <p className="py-8 text-center text-muted">{tx("চলমান অভিযোগ নেই", "No active complaints")}</p>}
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <KpiTile label={tx("এই মাসে অভিযোগ", "This month")} value={d(thisMonth.length)} />
              <KpiTile label={tx("৭২ ঘণ্টায় সাড়া", "Replied in 72h")} value={responded.length ? `${d(Math.round((onTime.length / responded.length) * 100))}%` : "—"} />
            </div>
            <Panel title={tx("ফোনে আসা অভিযোগ লিখুন", "Log a phoned-in complaint")}>
              <div className="space-y-3">
                <Field label={tx("ফোন", "Phone")}>
                  <Input inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" />
                </Field>
                <Field label={tx("বিষয়", "Subject")}>
                  <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                </Field>
                <Field label={tx("বিবরণ", "Details")}>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </Field>
                <Button
                  variant="brand"
                  full
                  disabled={!e164 || !form.subject.trim()}
                  onClick={() => {
                    createComplaint({ user_phone: e164!, subject: form.subject.trim(), description: form.description.trim() });
                    setForm({ phone: "", subject: "", description: "" });
                    toast(tx("অভিযোগ যোগ হয়েছে, ৭২ ঘণ্টার টাইমার শুরু", "Complaint logged, 72h timer started"));
                  }}
                >
                  {tx("অভিযোগ যোগ করুন", "Add complaint")}
                </Button>
              </div>
            </Panel>
          </div>
        </div>
      ) : (
        <DataTable
          rows={[...reports].sort((a, b) => (a.status === "open" ? -1 : 1) - (b.status === "open" ? -1 : 1) || b.created_at.localeCompare(a.created_at))}
          rowKey={(r) => r.id}
          columns={[
            { key: "t", header: tx("কী", "Target"), cell: (r) => <span>{r.target_type} · {targetLink(r)}</span> },
            { key: "r", header: tx("কারণ", "Reason"), cell: (r) => <span><b>{L(REASON[r.reason])}</b>{r.details && <span className="block text-xs text-muted">{r.details}</span>}</span> },
            { key: "who", header: tx("রিপোর্টকারী", "Reporter"), cell: (r) => <span>{d(displayPhone(r.reporter))}<span className="block text-xs text-muted">{ago(r.created_at)}</span></span> },
            {
              key: "m", header: tx("মডারেশন", "Moderation"),
              cell: (r) => {
                const m = moderation.find((x) => x.target_id === r.target_id);
                return m ? <StatusPill tone={m.status === "open" ? "wait" : m.status === "approved" ? "ok" : "bad"}>{m.status}</StatusPill> : <Button size="sm" variant="outline" onClick={() => { reportToModeration(r.id); toast(tx("মডারেশনে পাঠানো হয়েছে", "Sent to moderation")); }}>🛡️ {tx("মডারেশনে পাঠান", "Send to moderation")}</Button>;
              },
            },
            {
              key: "o", header: tx("ফলাফল (রিপোর্টকারীকে জানানো)", "Outcome (told to reporter)"),
              cell: (r) =>
                r.status !== "open" ? (
                  <StatusPill tone={r.status === "actioned" ? "ok" : "info"}>{r.status === "actioned" ? tx("ব্যবস্থা নেওয়া হয়েছে", "Actioned") : tx("খারিজ", "Dismissed")}</StatusPill>
                ) : (
                  <div className="flex min-w-56 flex-col gap-1.5">
                    <Select value={outcome[r.id] ?? ""} onChange={(e) => setOutcome({ ...outcome, [r.id]: e.target.value })} className="min-h-9 text-sm">
                      <option value="">{tx("ফলাফল বাছুন", "Choose outcome")}</option>
                      <option value="actioned">{tx("ব্যবস্থা নেওয়া হয়েছে", "Actioned")}</option>
                      <option value="dismissed">{tx("সমস্যা পাওয়া যায়নি", "No issue found")}</option>
                    </Select>
                    <Button
                      size="sm"
                      disabled={!outcome[r.id]}
                      onClick={() =>
                        closeReport(r.id, outcome[r.id] as Report["status"], outcome[r.id] === "actioned" ? "ধন্যবাদ! আপনার রিপোর্ট দেখে আমরা ব্যবস্থা নিয়েছি।" : "ধন্যবাদ! আমরা দেখেছি, নিয়ম ভঙ্গ পাওয়া যায়নি।")
                      }
                    >
                      {tx("জানিয়ে বন্ধ করুন", "Notify & close")}
                    </Button>
                  </div>
                ),
            },
          ]}
        />
      )}
    </OpsPage>
  );
}
