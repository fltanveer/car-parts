"use client";

import clsx from "clsx";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useMemo, useState } from "react";
import { AudioGuide } from "@/components/layout/AudioGuide";
import { useT } from "@/components/providers/LangProvider";
import { HelpCall } from "@/components/shared/Misc";
import { PageHeader } from "@/components/ui/primitives";
import { useDb, useHydrated } from "@/lib/db/store";
import type { Tone } from "@/lib/labels";
import type { RequestSource } from "@/lib/types";

/** Page frame for every ops screen: title, 🔊 instructions, help line (rules 5, 7). */
export function OpsPage({ title, subtitle, guide, actions, back, children, narrow }: { title: ReactNode; subtitle?: ReactNode; guide: string; actions?: ReactNode; back?: ReactNode; children: ReactNode; narrow?: boolean }) {
  const { tx } = useT();
  // Times and localStorage data differ from the server render; paint after hydration.
  const hydrated = useHydrated();
  if (!hydrated) return <Wrap narrow={narrow}><div className="h-40 animate-pulse rounded-2xl bg-surface" /></Wrap>;
  return (
    <Wrap narrow={narrow}>
      <PageHeader title={title} subtitle={subtitle} back={back}>
        {actions && <div className="flex shrink-0 flex-wrap justify-end gap-2">{actions}</div>}
      </PageHeader>
      <AudioGuide text={guide} className="mb-4" />
      {children}
      <HelpCall className="mt-8 max-w-md" text={tx("আটকে গেলে সুপারভাইজার / টেক সাপোর্টকে কল করুন", "Stuck? Call your supervisor / tech support")} />
    </Wrap>
  );
}

function Wrap({ narrow, children }: { narrow?: boolean; children: ReactNode }) {
  return narrow ? <div className="mx-auto w-full max-w-3xl">{children}</div> : <div className="mx-auto w-full max-w-[1600px]">{children}</div>;
}

/** Titled white box. */
export function Panel({ title, action, children, className, bodyClass }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={clsx("rounded-2xl border border-line bg-card", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
          <h2 className="font-bold">{title}</h2>
          {action}
        </header>
      )}
      <div className={clsx("p-4", bodyClass)}>{children}</div>
    </section>
  );
}

const toneRing: Record<Tone, string> = {
  bad: "border-bad/40 bg-bad-soft/60 hover:border-bad",
  wait: "border-wait-bg/60 bg-wait-soft/60 hover:border-wait-bg",
  ok: "border-ok/30 bg-ok-soft/50 hover:border-ok",
  info: "border-line bg-card hover:border-ink/30",
};

/** Dashboard "urgent work" tile; links to the filtered queue. */
export function UrgentTile({ icon, label, count, sub, href, tone }: { icon: string; label: ReactNode; count: number; sub?: ReactNode; href: string; tone: Tone }) {
  const { d } = useT();
  return (
    <Link href={href} className={clsx("flex min-h-24 items-start gap-3 rounded-2xl border-2 p-3.5 transition-colors", count ? toneRing[tone] : toneRing.info)}>
      <span className="text-2xl" aria-hidden>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-tight">{label}</span>
        <span className="mt-1 block text-3xl font-bold tabular-nums">{d(count)}</span>
        {sub && <span className="block text-xs text-ink-2">{sub}</span>}
      </span>
    </Link>
  );
}

/** Plain number tile for KPIs. */
export function KpiTile({ label, value, sub }: { label: ReactNode; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-3.5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  sort?: (row: T) => number | string;
  className?: string;
}

/** Sortable table (desktop-first; scrolls inside its box on phones). */
export function DataTable<T>({ rows, columns, rowKey, onRowClick, initialSort, empty }: { rows: T[]; columns: Column<T>[]; rowKey: (r: T) => string; onRowClick?: (r: T) => void; initialSort?: { key: string; dir: "asc" | "desc" }; empty?: ReactNode }) {
  const { tx } = useT();
  const [sort, setSort] = useState(initialSort ?? null);
  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort?.key);
    if (!col?.sort || !sort) return rows;
    const f = col.sort;
    return [...rows].sort((a, b) => {
      const x = f(a);
      const y = f(b);
      const r = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return sort.dir === "asc" ? r : -r;
    });
  }, [rows, columns, sort]);
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-card">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-surface text-left text-xs uppercase tracking-wide text-ink-2">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={clsx("px-3 py-2.5 font-semibold", c.className)}>
                {c.sort ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-ink"
                    onClick={() => setSort((s) => ({ key: c.key, dir: s?.key === c.key && s.dir === "desc" ? "asc" : "desc" }))}
                  >
                    {c.header}
                    {sort?.key === c.key ? sort.dir === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" /> : <ArrowUpDown className="size-3.5 opacity-40" />}
                  </button>
                ) : (
                  c.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined} className={clsx("border-t border-line", onRowClick && "cursor-pointer hover:bg-surface/60")}>
              {columns.map((c) => (
                <td key={c.key} className={clsx("px-3 py-2.5 align-top", c.className)}>
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-10 text-center text-muted">
                {empty ?? tx("কিছু নেই", "Nothing here")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/** One kanban column. */
export function KanbanColumn({ title, count, tone = "info", children }: { title: ReactNode; count: number; tone?: Tone; children: ReactNode }) {
  const { d } = useT();
  const bar: Record<Tone, string> = { bad: "bg-bad", wait: "bg-wait-bg", ok: "bg-ok", info: "bg-muted" };
  return (
    <section className="flex w-full min-w-0 flex-col rounded-2xl bg-surface p-2 lg:w-72 lg:shrink-0">
      <header className="flex items-center gap-2 px-2 pb-2 pt-1">
        <span className={clsx("size-2.5 rounded-full", bar[tone])} aria-hidden />
        <h3 className="flex-1 text-sm font-bold">{title}</h3>
        <span className="rounded-full bg-card px-2 text-xs font-bold tabular-nums">{d(count)}</span>
      </header>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export interface TimelineItem {
  at: string;
  icon: string;
  text: ReactNode;
  who?: ReactNode;
}
export function Timeline({ items }: { items: TimelineItem[] }) {
  const { dateTime } = useT();
  const sorted = [...items].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <ol className="relative space-y-3 border-l-2 border-line pl-5">
      {sorted.map((it, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[31px] grid size-6 place-items-center rounded-full bg-card text-sm ring-2 ring-line" aria-hidden>
            {it.icon}
          </span>
          <p className="text-sm">{it.text}</p>
          <p className="text-xs text-muted">
            {dateTime(it.at)}
            {it.who && <> · {it.who}</>}
          </p>
        </li>
      ))}
    </ol>
  );
}

/** Single-select chip row used as a filter. */
export function FilterChips<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: ReactNode; count?: number }[] }) {
  const { d } = useT();
  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          aria-pressed={value === it.value}
          onClick={() => onChange(it.value)}
          className={clsx("inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium", value === it.value ? "border-ink bg-ink text-white" : "border-line bg-card hover:border-ink/40")}
        >
          {it.label}
          {it.count != null && <span className={clsx("rounded-full px-1.5 text-[11px] font-bold", value === it.value ? "bg-white/20" : "bg-surface")}>{d(it.count)}</span>}
        </button>
      ))}
    </div>
  );
}

export const SOURCE_ICON: Record<RequestSource, { icon: string; bn: string; en: string }> = {
  web_voice: { icon: "🎤", bn: "ভয়েস", en: "Voice" },
  web_photo: { icon: "📷", bn: "ছবি", en: "Photo" },
  web_text: { icon: "✍️", bn: "লেখা", en: "Text" },
  phone: { icon: "📞", bn: "ফোন", en: "Phone" },
  whatsapp: { icon: "💬", bn: "WhatsApp", en: "WhatsApp" },
};
export function SourceIcon({ source }: { source: RequestSource }) {
  const { L } = useT();
  const s = SOURCE_ICON[source];
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-xs font-semibold" title={L(s)}>
      <span aria-hidden>{s.icon}</span>
      {L(s)}
    </span>
  );
}

/** Staff dropdown (assignee). */
export function StaffSelect({ value, onChange, role, allowNone = true, className }: { value: string | null; onChange: (id: string | null) => void; role?: string; allowNone?: boolean; className?: string }) {
  const { tx } = useT();
  const staff = useDb((s) => s.staff.filter((x) => x.active && (!role || x.roles.includes(role as never) || x.roles.includes("super_admin"))));
  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} className={clsx("min-h-10 rounded-xl border-2 border-line bg-card px-2 text-sm", className)} aria-label={tx("দায়িত্বপ্রাপ্ত", "Assignee")}>
      {allowNone && <option value="">{tx("কেউ না", "Unassigned")}</option>}
      {staff.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}

/** Staff name from id. */
export function useStaffName() {
  const staff = useDb((s) => s.staff);
  return (id: string | null) => staff.find((s) => s.id === id)?.name ?? (id === "system" ? "System" : "—");
}
