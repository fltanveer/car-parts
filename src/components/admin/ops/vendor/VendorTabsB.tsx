"use client";

import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { Button, Notice, StatusPill, Textarea } from "@/components/ui/primitives";
import { audit } from "@/lib/db/actions";
import { addNote, useOps } from "@/lib/db/actions-admin-ops";
import { vendorBalance } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import { displayPhone } from "@/lib/format";
import { claimStatusLabel, claimTypeLabel } from "@/lib/labels";
import type { Vendor } from "@/lib/types";
import { DataTable, KpiTile, Panel, useStaffName } from "../ui";

export function ClaimsTab({ v }: { v: Vendor }) {
  const { tx, L, ago, taka } = useT();
  const rows = useDb((s) => s.claims.filter((c) => c.vendor_id === v.id));
  return (
    <DataTable
      rows={rows}
      rowKey={(r) => r.id}
      columns={[
        { key: "n", header: tx("দাবি", "Claim"), cell: (r) => <Link href={`/admin/disputes/${r.id}`} className="font-semibold text-brand">{r.claim_no}</Link> },
        { key: "t", header: tx("ধরন", "Type"), cell: (r) => `${claimTypeLabel[r.type].icon} ${L(claimTypeLabel[r.type])}` },
        { key: "s", header: tx("অবস্থা", "Status"), cell: (r) => <StatusPill tone={claimStatusLabel[r.status].tone}>{L(claimStatusLabel[r.status])}</StatusPill> },
        { key: "a", header: tx("টাকা", "Amount"), cell: (r) => (r.refund_amount ? taka(r.refund_amount) : "—") },
        { key: "w", header: tx("কবে", "When"), sort: (r) => r.created_at, cell: (r) => ago(r.created_at) },
      ]}
    />
  );
}

export function ReportsTab({ v }: { v: Vendor }) {
  const { tx, ago } = useT();
  const listingIds = useDb((s) => s.listings.filter((l) => l.vendor_id === v.id).map((l) => l.id));
  const reports = useDb((s) => s.reports.filter((r) => r.target_id === v.id || listingIds.includes(r.target_id)));
  const mods = useDb((s) => s.moderation.filter((m) => m.target_id === v.id || listingIds.includes(m.target_id)));
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title={tx("রিপোর্ট", "Reports")}>
        <ul className="space-y-2 text-sm">
          {reports.map((r) => <li key={r.id}>🚩 {r.target_type} · {r.reason} · {r.details} <span className="text-muted">· {ago(r.created_at)}</span> <StatusPill tone={r.status === "open" ? "wait" : "info"}>{r.status}</StatusPill></li>)}
          {!reports.length && <li className="text-muted">—</li>}
        </ul>
      </Panel>
      <Panel title={tx("মডারেশন", "Moderation")} action={<Link href="/admin/moderation" className="text-sm font-semibold text-brand">{tx("কিউ", "Queue")}</Link>}>
        <ul className="space-y-2 text-sm">
          {mods.map((m) => <li key={m.id}>🛡️ {m.reason} · {m.target_id} <StatusPill tone={m.status === "open" ? "wait" : m.status === "approved" ? "ok" : "bad"}>{m.status}</StatusPill> {m.decision_note && <span className="text-muted">· {m.decision_note}</span>}</li>)}
          {!mods.length && <li className="text-muted">—</li>}
        </ul>
      </Panel>
    </div>
  );
}

export function MoneyTab({ v, now }: { v: Vendor; now: number }) {
  const { tx, taka, date } = useT();
  const db = useDb((s) => s);
  const held = useOps((s) => s.payoutHolds.includes(v.id));
  const bal = vendorBalance(db, v.id, now);
  const ledger = db.ledger.filter((e) => e.vendor_id === v.id);
  const payouts = db.payouts.filter((p) => p.vendor_id === v.id);
  const penalties = ledger.filter((e) => e.entry_type === "penalty");
  return (
    <div className="space-y-4">
      {held && <Notice tone="bad">⛔ {tx("এই বিক্রেতার পেআউট আটকানো আছে।", "Payouts are on hold for this seller.")}</Notice>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile label={tx("তোলা যাবে", "Available")} value={taka(bal.available)} />
        <KpiTile label={tx("অপেক্ষায় (এসক্রো)", "Pending (escrow)")} value={taka(bal.pending)} />
        <KpiTile label={tx("এই মাসে পেআউট", "Paid this month")} value={taka(bal.paidThisMonth)} />
        <KpiTile label={tx("মোট জরিমানা", "Total penalties")} value={taka(-penalties.reduce((t, e) => t + e.amount, 0))} />
      </div>
      <DataTable
        rows={ledger}
        rowKey={(r) => r.id}
        initialSort={{ key: "d", dir: "desc" }}
        columns={[
          { key: "d", header: tx("তারিখ", "Date"), sort: (r) => r.created_at, cell: (r) => date(r.created_at) },
          { key: "t", header: tx("ধরন", "Type"), cell: (r) => <span className={clsx(r.entry_type === "penalty" && "font-bold text-bad")}>{r.entry_type}</span> },
          { key: "n", header: tx("বিবরণ", "Note"), cell: (r) => r.note },
          { key: "a", header: tx("টাকা", "Amount"), sort: (r) => r.amount, cell: (r) => <span className={r.amount < 0 ? "text-bad" : "text-ok"}>{taka(r.amount)}</span> },
          { key: "v", header: tx("উপলব্ধ", "Available"), cell: (r) => date(r.available_at) },
        ]}
      />
      <Panel title={tx("পেআউট", "Payouts")} action={<Link href="/admin/finance/payouts" className="text-sm font-semibold text-brand">{tx("পেআউট কিউ", "Payout queue")}</Link>}>
        <ul className="text-sm">
          {payouts.map((p) => <li key={p.id}>{date(p.created_at)} · {taka(p.amount)} · <StatusPill tone={p.status === "paid" ? "ok" : p.status === "failed" ? "bad" : "wait"}>{p.status}</StatusPill> {p.reference}</li>)}
          {!payouts.length && <li className="text-muted">—</li>}
        </ul>
      </Panel>
    </div>
  );
}

export function MessagesTab({ v }: { v: Vendor }) {
  const { tx, d, ago } = useT();
  const threads = useDb((s) => s.threads.filter((t) => t.vendor_id === v.id));
  const [open, setOpen] = useState<string[]>([]);
  return (
    <div className="space-y-3">
      <Notice tone={v.contact_attempts >= 3 ? "bad" : v.contact_attempts ? "wait" : "ok"}>
        {tx(`চ্যাটে নম্বর শেয়ারের চেষ্টা: ${d(v.contact_attempts)} বার`, `Number-sharing attempts in chat: ${v.contact_attempts}`)}
      </Notice>
      {threads.map((t) => {
        const flagged = t.messages.filter((m) => m.contains_contact_info).length;
        const visible = t.type === "vendor_support" || open.includes(t.id);
        return (
          <Panel key={t.id} title={`${t.type === "vendor_support" ? tx("সাপোর্ট", "Support") : t.customer_name ?? tx("কাস্টমার", "Customer")} · ${ago(t.last_message_at)}`} action={flagged > 0 && <StatusPill tone="bad">{tx(`${d(flagged)}টা নম্বর-চেষ্টা`, `${flagged} contact attempts`)}</StatusPill>}>
            {visible ? (
              <ul className="space-y-1.5 text-sm">
                {t.messages.map((m) => (
                  <li key={m.id} className={clsx("rounded-lg px-2.5 py-1.5", m.contains_contact_info ? "bg-bad-soft font-semibold text-bad" : m.sender === "system" ? "bg-surface text-muted" : "bg-surface/50")}>
                    <b>{m.sender}:</b> {m.body ?? (m.type === "voice" ? "🎤" : m.type)}
                  </li>
                ))}
              </ul>
            ) : (
              <Button size="sm" variant="outline" onClick={() => { audit("কাস্টমার-বিক্রেতা চ্যাট দেখা", `${v.shop_name_bn} · ${t.id}`); setOpen([...open, t.id]); }}>
                🔒 {tx("কাস্টমার-বিক্রেতা চ্যাট দেখুন (অডিট হবে)", "View customer–seller chat (audited)")}
              </Button>
            )}
          </Panel>
        );
      })}
      {!threads.length && <p className="text-muted">{tx("কোনো মেসেজ নেই", "No messages")}</p>}
    </div>
  );
}

export function CallsVisitsTab({ v }: { v: Vendor }) {
  const { tx, d, ago } = useT();
  const staffName = useStaffName();
  const calls = useDb((s) => s.callLogs.filter((c) => c.phone === v.owner_phone || c.ref === v.shop_name_bn || c.ref === v.id));
  const visits = useDb((s) => s.fieldVisits.filter((f) => f.vendor_id === v.id));
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title={tx("কল লগ", "Calls")} action={<Link href="/admin/calls" className="text-sm font-semibold text-brand">{tx("নতুন কল", "New call")}</Link>}>
        <ul className="space-y-2 text-sm">
          {calls.map((c) => <li key={c.id}>📞 {c.purpose}: {c.summary} <span className="text-xs text-muted">· {staffName(c.staff_id)} · {ago(c.created_at)} · {d(displayPhone(c.phone))}</span></li>)}
          {!calls.length && <li className="text-muted">—</li>}
        </ul>
      </Panel>
      <Panel title={tx("মাঠ ভিজিট", "Field visits")}>
        <ul className="space-y-2 text-sm">
          {visits.map((f) => <li key={f.id}>📍 {f.purpose} · {tx("লিস্টিং", "listings")} {d(f.listings_created)} {f.report && `· ${f.report}`} <span className="text-xs text-muted">· {staffName(f.agent_id)} · {ago(f.at)}</span></li>)}
          {!visits.length && <li className="text-muted">—</li>}
        </ul>
      </Panel>
    </div>
  );
}

export function NotesTab({ target }: { target: string }) {
  const { tx, ago } = useT();
  const staffName = useStaffName();
  const notes = useOps((s) => s.notes.filter((n) => n.target === target));
  const [text, setText] = useState("");
  return (
    <Panel title={tx("অভ্যন্তরীণ নোট (শুধু টিম দেখে)", "Internal notes (team only)")}>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={tx("নোট লিখুন…", "Write a note…")} />
      <Button size="sm" className="mt-2" disabled={!text.trim()} onClick={() => { addNote(target, text.trim()); setText(""); }}>
        {tx("নোট যোগ", "Add note")}
      </Button>
      <ul className="mt-4 space-y-2 text-sm">
        {notes.map((n) => (
          <li key={n.id} className={clsx("rounded-lg p-2.5", n.kind === "warning" ? "bg-bad-soft" : "bg-surface")}>
            {n.kind === "warning" && "⚠️ "}
            {n.text} <span className="text-xs text-muted">· {staffName(n.staff_id)} · {ago(n.at)}</span>
          </li>
        ))}
        {!notes.length && <li className="text-muted">{tx("কোনো নোট নেই", "No notes")}</li>}
      </ul>
    </Panel>
  );
}
