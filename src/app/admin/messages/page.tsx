"use client";

import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { ThreadView } from "@/components/admin/ops/ThreadView";
import { OpsPage, Panel } from "@/components/admin/ops/ui";
import { useT } from "@/components/providers/LangProvider";
import { Button, EmptyState, Notice, StatusPill, Tabs } from "@/components/ui/primitives";
import { audit, markThreadRead } from "@/lib/db/actions";
import { useDb } from "@/lib/db/store";
import { displayPhone } from "@/lib/format";
import type { ChatThread } from "@/lib/types";

type Tab = "inbox" | "monitor";

export default function MessagesPage() {
  const { tx, d, ago } = useT();
  const db = useDb((s) => s);
  const [tab, setTab] = useState<Tab>("inbox");
  const [selected, setSelected] = useState<string | null>(null);
  const [viewed, setViewed] = useState<string[]>([]);

  const inbox = db.threads.filter((t) => t.type !== "customer_vendor").sort((a, b) => b.last_message_at.localeCompare(a.last_message_at));
  // Privacy: only reported, disputed, or contact-sharing flagged chats (file 03 14.1).
  const flags = (t: ChatThread) => {
    const out: string[] = [];
    if (t.messages.some((m) => m.contains_contact_info)) out.push(tx("📵 নম্বর শেয়ার", "📵 Contact sharing"));
    if (db.reports.some((r) => r.target_type === "message" && (r.target_id === t.id || t.messages.some((m) => m.id === r.target_id)))) out.push(tx("🚩 রিপোর্ট", "🚩 Reported"));
    if (db.claims.some((c) => c.vendor_id === t.vendor_id && c.user_phone === t.customer_phone && !["closed", "resolved_refund", "resolved_replace", "resolved_rejected"].includes(c.status))) out.push(tx("⚖️ বিরোধ", "⚖️ Dispute"));
    return out;
  };
  const monitor = db.threads.filter((t) => t.type === "customer_vendor").map((t) => ({ t, f: flags(t) })).filter((x) => x.f.length);
  const list = tab === "inbox" ? inbox : monitor.map((x) => x.t);
  const current = list.find((t) => t.id === selected) ?? null;
  const who = (t: ChatThread) =>
    t.type === "vendor_support" ? `🏪 ${db.vendors.find((v) => v.id === t.vendor_id)?.shop_name_bn ?? ""}` : t.type === "customer_support" ? `👤 ${t.customer_name ?? d(displayPhone(t.customer_phone ?? ""))}` : `👤 ${t.customer_name ?? ""} ↔ 🏪 ${db.vendors.find((v) => v.id === t.vendor_id)?.shop_name_bn ?? ""}`;

  const open = (t: ChatThread) => {
    setSelected(t.id);
    if (t.type !== "customer_vendor") markThreadRead(t.id, "support");
  };

  return (
    <OpsPage
      title={tx("সাপোর্ট ইনবক্স", "Support inbox")}
      guide={tx("ইনবক্সে কাস্টমার আর বিক্রেতার সাপোর্ট মেসেজ। তৈরি উত্তরে চাপলে লেখা বসে যাবে, বা ভয়েসে উত্তর দিন। মনিটর ট্যাবে শুধু রিপোর্ট হওয়া, বিরোধের বা নম্বর শেয়ারের চ্যাট দেখা যাবে, আর প্রতিটা দেখা অডিট লগে যাবে।", "Inbox has customer and seller support chats; tap a canned reply or answer by voice. Monitor shows only reported, disputed or number-sharing chats, and every view is audited.")}
    >
      <div className="mb-4 px-4">
        <Tabs<Tab>
          value={tab}
          onChange={(v) => { setTab(v); setSelected(null); }}
          items={[
            { value: "inbox", label: tx("সাপোর্ট ইনবক্স", "Support inbox"), count: inbox.reduce((n, t) => n + t.unread_support, 0) },
            { value: "monitor", label: tx("মনিটর", "Monitor"), count: monitor.length },
          ]}
        />
      </div>
      {list.length === 0 ? (
        <EmptyState icon="💬" title={tx("কিছু নেই", "Nothing here")} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
          <ul className={clsx("space-y-2", current && "hidden lg:block")}>
            {list.map((t) => (
              <li key={t.id}>
                <button type="button" onClick={() => open(t)} className={clsx("w-full rounded-xl border-2 bg-card p-3 text-left", current?.id === t.id ? "border-brand" : "border-line hover:border-ink/30")}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold">{who(t)}</span>
                    {t.unread_support > 0 && tab === "inbox" && <span className="rounded-full bg-bad px-2 text-xs font-bold text-white">{d(t.unread_support)}</span>}
                  </div>
                  {tab === "inbox" ? (
                    <p className="truncate text-sm text-muted">{t.messages[t.messages.length - 1]?.body ?? "🎤"}</p>
                  ) : (
                    <p className="mt-1 flex flex-wrap gap-1">{flags(t).map((f) => <StatusPill key={f} tone="bad">{f}</StatusPill>)}</p>
                  )}
                  <p className="text-xs text-muted">{ago(t.last_message_at)}</p>
                </button>
              </li>
            ))}
          </ul>
          {current ? (
            <Panel
              title={who(current)}
              action={
                <span className="flex items-center gap-2">
                  {current.vendor_id && <Link href={`/admin/vendors/${current.vendor_id}`} className="text-sm font-semibold text-brand">{tx("দোকান", "Shop")}</Link>}
                  {current.customer_phone && <Link href={`/admin/customers/${encodeURIComponent(current.customer_phone)}`} className="text-sm font-semibold text-brand">{tx("কাস্টমার", "Customer")}</Link>}
                  <Button size="sm" variant="ghost" className="lg:hidden" onClick={() => setSelected(null)}>{tx("তালিকা", "List")}</Button>
                </span>
              }
            >
              {current.type === "customer_vendor" && !viewed.includes(current.id) ? (
                <div className="space-y-3">
                  <Notice tone="wait">{tx("এটা কাস্টমার আর বিক্রেতার ব্যক্তিগত চ্যাট। শুধু কাজের প্রয়োজনে দেখুন; দেখলে আপনার নাম অডিট লগে যাবে।", "This is a private customer–seller chat. Open only when needed; your view is audited.")}</Notice>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => {
                      audit("কাস্টমার-বিক্রেতা চ্যাট দেখা (মনিটর)", `${current.id} · ${flags(current).join(", ")}`);
                      setViewed([...viewed, current.id]);
                    }}
                  >
                    🔒 {tx("কারণ বুঝেছি, চ্যাট দেখুন", "I understand, view chat")}
                  </Button>
                </div>
              ) : (
                <ThreadView key={current.id} t={current} canReply={current.type !== "customer_vendor"} />
              )}
            </Panel>
          ) : (
            <div className="hidden lg:block"><EmptyState icon="👈" title={tx("বাম দিক থেকে একটা চ্যাট বাছুন", "Pick a chat on the left")} /></div>
          )}
        </div>
      )}
    </OpsPage>
  );
}
