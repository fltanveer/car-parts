"use client";

import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { Countdown, toast } from "@/components/shared/Misc";
import { Button, StatusPill, Textarea } from "@/components/ui/primitives";
import { useOps } from "@/lib/db/actions-admin-ops";
import { assignComplaint, resolveComplaint, respondComplaint } from "@/lib/db/actions-admin-ops-trust";
import { displayPhone } from "@/lib/format";
import { settings } from "@/lib/mock/settings";
import type { Complaint } from "@/lib/types";
import { Dictate } from "./Dictate";
import { StaffSelect, useStaffName } from "./ui";

const TONE = { open: "bad", in_progress: "wait", resolved: "ok", closed: "info" } as const;
const LABEL = { open: { bn: "খোলা", en: "Open" }, in_progress: { bn: "চলছে", en: "In progress" }, resolved: { bn: "সমাধান", en: "Resolved" }, closed: { bn: "বন্ধ", en: "Closed" } };

/** Legal complaint with the 72h first-response timer (file 03 12). */
export function ComplaintCard({ c }: { c: Complaint }) {
  const { tx, L, d, dateTime, ago } = useT();
  const staffName = useStaffName();
  const notes = useOps((s) => s.notes.filter((n) => n.target === `complaint:${c.id}`));
  const [text, setText] = useState("");
  const done = c.status === "resolved" || c.status === "closed";

  return (
    <article className="rounded-2xl border border-line bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-bold">{c.complaint_no} · {c.subject}</p>
          <p className="text-xs text-muted">{d(displayPhone(c.user_phone))} · {dateTime(c.created_at)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone={TONE[c.status]}>{L(LABEL[c.status])}</StatusPill>
          {c.first_response_at ? (
            <span className="text-xs text-ok">✅ {tx("প্রথম সাড়া", "First reply")} {ago(c.first_response_at)}</span>
          ) : (
            <Countdown to={c.first_response_by} warnHours={settings.complaint_first_response_hours / 3} prefix={tx("প্রথম সাড়া: ", "First reply: ")} />
          )}
        </div>
      </div>
      <p className="mt-2 text-sm">{c.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">{tx("দায়িত্বে", "Assignee")}</span>
        <StaffSelect value={c.assigned_to} onChange={(id) => assignComplaint(c.id, id)} />
      </div>
      {notes.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-sm">
          {notes.map((n) => (
            <li key={n.id} className="rounded-lg bg-surface px-3 py-2">
              {n.kind === "resolution" ? "✅" : "💬"} {n.text} <span className="text-xs text-muted">· {staffName(n.staff_id)} · {ago(n.at)}</span>
            </li>
          ))}
        </ul>
      )}
      {c.status !== "closed" && (
        <div className="mt-3 space-y-2">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-20" placeholder={tx("কাস্টমারকে উত্তর বা সমাধানের নোট", "Reply to customer or resolution note")} />
          <div className="flex flex-wrap gap-2">
            <Dictate onText={(t) => setText((s) => (s ? `${s} ${t}` : t))} />
            {!done && (
              <Button size="sm" variant="brand" disabled={!text.trim()} onClick={() => { respondComplaint(c.id, text.trim()); setText(""); toast(tx("কাস্টমারকে SMS গেছে", "SMS sent")); }}>
                💬 {tx("সাড়া দিন (SMS)", "Reply (SMS)")}
              </Button>
            )}
            {!done && (
              <Button size="sm" variant="ok" disabled={!text.trim()} onClick={() => { resolveComplaint(c.id, text.trim()); setText(""); }}>
                ✅ {tx("সমাধান হয়েছে", "Resolved")}
              </Button>
            )}
            <Button size="sm" variant="outline" disabled={!text.trim()} onClick={() => { resolveComplaint(c.id, text.trim(), true); setText(""); }}>
              🔒 {tx("বন্ধ করুন", "Close")}
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
