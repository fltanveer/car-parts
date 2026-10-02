"use client";

import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { BackButton } from "@/components/shared/Misc";
import { StatusPill } from "@/components/ui/primitives";
import { assignRequest, useOps } from "@/lib/db/actions-admin-ops";
import { useDb } from "@/lib/db/store";
import { requestStatusLabel } from "@/lib/labels";
import type { PartRequest } from "@/lib/types";
import { CallLogForm } from "../CallLogForm";
import { OpsPage, Panel, StaffSelect, Timeline, type TimelineItem, useStaffName } from "../ui";
import { ClarifyForm } from "./ClarifyForm";
import { draftFrom } from "./draft";
import { MatchPanel } from "./MatchPanel";
import { NoQuoteActions } from "./NoQuoteActions";
import { QuotesPanel } from "./QuotesPanel";
import { RequestInput } from "./RequestInput";

/** Three-column request desk view (file 03 6.2). Mount with key={r.id}. */
export function RequestDetail({ r }: { r: PartRequest }) {
  const { tx, L } = useT();
  const [draft, setDraft] = useState(() => draftFrom(r));
  const [widen, setWiden] = useState(false);

  return (
    <OpsPage
      back={<BackButton href="/admin/requests" label={tx("রিকোয়েস্ট ডেস্ক", "Request desk")} />}
      title={<span className="flex flex-wrap items-center gap-2">{r.request_no} <StatusPill tone={requestStatusLabel[r.status].tone}>{L(requestStatusLabel[r.status])}</StatusPill></span>}
      subtitle={tx("বামে শুনুন, মাঝে পরিষ্কার করুন, ডানে দোকানে পাঠান।", "Listen on the left, clarify in the middle, send on the right.")}
      guide={tx("প্রথমে বাম দিকে কাস্টমারের ভয়েস শুনুন ও ছবি দেখুন। মাঝখানে গাড়ি আর পার্ট বাছুন, বিক্রেতারা যা দেখবে সেই সারাংশ লিখুন। ডান দিকে দোকান মিলিয়ে দোকানে পাঠান বাটন চাপুন।", "First listen and look on the left. In the middle choose car and part and write the summary sellers see. On the right check the shops and press Send to shops.")}
      actions={<StaffSelect value={r.assigned_admin} onChange={(id) => assignRequest(r.id, id)} />}
    >
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <RequestInput r={r} />
        <ClarifyForm r={r} draft={draft} setDraft={setDraft} />
        <div className="space-y-4 lg:col-span-2 2xl:col-span-1">
          <MatchPanel r={r} draft={draft} widen={widen} />
          <QuotesPanel r={r} />
          <NoQuoteActions r={r} widen={widen} onWiden={() => setWiden(true)} />
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title={tx("কাস্টমারকে বেছে নিতে সাহায্য: কল লগ", "Help the customer choose: call log")}>
          <CallLogForm phone={r.user_phone} refNo={r.request_no} purpose="রিকোয়েস্ট পরিষ্কার" />
        </Panel>
        <Panel title={tx("টাইমলাইন", "Timeline")}>
          <RequestTimeline r={r} />
        </Panel>
      </div>
    </OpsPage>
  );
}

function RequestTimeline({ r }: { r: PartRequest }) {
  const { tx, taka } = useT();
  const staffName = useStaffName();
  const quotes = useDb((s) => s.quotes.filter((q) => q.request_id === r.id));
  const calls = useDb((s) => s.callLogs.filter((c) => c.ref === r.request_no));
  const audits = useDb((s) => s.audit.filter((a) => a.target.includes(r.request_no) || a.target === r.id));
  const vendors = useDb((s) => s.vendors);
  const notes = useOps((s) => s.notes.filter((n) => n.target === `request:${r.id}`));
  const vn = (id: string) => vendors.find((v) => v.id === id)?.shop_name_bn ?? id;
  const items: TimelineItem[] = [
    { at: r.created_at, icon: "🆕", text: tx("রিকোয়েস্ট এসেছে", "Request created") },
    ...(r.broadcast_at ? [{ at: r.broadcast_at, icon: "📤", text: tx(`দোকানে পাঠানো (${r.matches.length})`, `Sent to shops (${r.matches.length})`) }] : []),
    ...r.matches.filter((m) => m.seen_at).map((m) => ({ at: m.seen_at!, icon: m.declined ? "🙅" : "👀", text: `${vn(m.vendor_id)} ${m.declined ? tx(`না বলেছে: ${m.decline_reason ?? ""}`, `declined: ${m.decline_reason ?? ""}`) : tx("দেখেছে", "saw it")}` })),
    ...r.questions.flatMap((q) => [
      { at: q.asked_at, icon: "❓", text: `${vn(q.vendor_id)}: ${q.question}` },
      ...(q.answered_at ? [{ at: q.answered_at, icon: "💬", text: `${tx("উত্তর", "Answer")}: ${q.answer}` }] : []),
    ]),
    ...quotes.map((q) => ({ at: q.created_at, icon: "💰", text: `${vn(q.vendor_id)}: ${q.title} · ${taka(q.price)} (${q.status})` })),
    ...calls.map((c) => ({ at: c.created_at, icon: "📞", text: `${c.purpose}: ${c.summary}`, who: staffName(c.staff_id) })),
    ...notes.map((n) => ({ at: n.at, icon: "📝", text: n.text, who: staffName(n.staff_id) })),
    ...audits.map((a) => ({ at: a.at, icon: "🔒", text: a.action, who: staffName(a.staff_id) })),
  ];
  return <Timeline items={items} />;
}
