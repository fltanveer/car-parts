"use client";

import clsx from "clsx";
import { Download } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { toast, useNow } from "@/components/shared/Misc";
import { Button } from "@/components/ui/primitives";
import { useDb } from "@/lib/db/store";
import type { AuditLog } from "@/lib/types";
import { downloadCsv } from "../csv";
import { DataTable, FilterChip, FilterSelect, type Column } from "../DataTable";
import { KpiCard, KpiGrid } from "../Panel";
import { AUDIT_CATEGORIES, categoryOf } from "./auditCategories";
import { staffName } from "./permissions";

type Range = "today" | "7d" | "30d" | "all";
const DAY = 86_400_000;

export function AuditLogTable() {
  const { tx, d, dateTime, ago } = useT();
  const now = useNow();
  const logs = useDb((s) => s.audit);
  const staff = useDb((s) => s.staff);
  const [who, setWho] = useState("all");
  const [range, setRange] = useState<Range>("all");
  const [cat, setCat] = useState("all");
  const [target, setTarget] = useState("");
  const [sensitiveOnly, setSensitiveOnly] = useState(false);

  const since = range === "today" ? now - ((now + 6 * 3_600_000) % DAY) : range === "7d" ? now - 7 * DAY : range === "30d" ? now - 30 * DAY : 0;
  const rows = logs.filter((l) => {
    const c = categoryOf(l.action);
    if (who !== "all" && l.staff_id !== who) return false;
    if (since && new Date(l.at).getTime() < since) return false;
    if (cat !== "all" && c?.id !== cat) return false;
    if (sensitiveOnly && !c) return false;
    if (target.trim() && !l.target.toLowerCase().includes(target.trim().toLowerCase())) return false;
    return true;
  });
  const sensitive = logs.filter((l) => categoryOf(l.action)).length;
  const today = logs.filter((l) => now - new Date(l.at).getTime() < DAY).length;

  const exportCsv = () => {
    downloadCsv(`audit-log-${new Date(now).toISOString().slice(0, 10)}.csv`, [
      ["time", "staff", "action", "target", "category"],
      ...[...rows].sort((a, b) => b.at.localeCompare(a.at)).map((l) => [l.at, staffName(staff, l.staff_id), l.action, l.target, categoryOf(l.action)?.en ?? ""]),
    ]);
    toast(tx(`${rows.length}টা সারি ডাউনলোড হয়েছে`, `${rows.length} rows downloaded`));
  };

  const cols: Column<AuditLog>[] = [
    { key: "at", header: tx("সময়", "Time"), sort: (l) => l.at, cell: (l) => <span className="whitespace-nowrap">{dateTime(l.at)}<span className="block text-xs text-muted">{ago(l.at)}</span></span> },
    { key: "staff", header: tx("স্টাফ", "Staff"), sort: (l) => staffName(staff, l.staff_id), cell: (l) => <span className="font-semibold">{staffName(staff, l.staff_id)}</span> },
    { key: "action", header: tx("কাজ", "Action"), sort: (l) => l.action, cell: (l) => <span className="font-semibold">{l.action}</span> },
    { key: "target", header: tx("লক্ষ্য", "Target"), cell: (l) => <span className="break-all text-ink-2">{l.target}</span> },
    {
      key: "cat", header: tx("ধরন", "Category"), hideOnMobile: true,
      cell: (l) => {
        const c = categoryOf(l.action);
        return c ? <span className="whitespace-nowrap rounded-full bg-bad-soft px-2 py-0.5 text-xs font-bold text-bad">{c.icon} {tx(c.bn, c.en)}</span> : <span className="text-xs text-muted">{tx("সাধারণ", "General")}</span>;
      },
    },
  ];

  const rangeChips: [Range, string, string][] = [["today", "আজ", "Today"], ["7d", "৭ দিন", "7 days"], ["30d", "৩০ দিন", "30 days"], ["all", "সব", "All"]];

  return (
    <>
      <KpiGrid>
        <KpiCard label={tx("মোট এন্ট্রি", "Total entries")} value={d(logs.length)} />
        <KpiCard label={tx("গত ২৪ ঘণ্টা", "Last 24 h")} value={d(today)} />
        <KpiCard label={tx("সংবেদনশীল", "Sensitive")} value={d(sensitive)} tone={sensitive ? "bad" : "info"} onClick={() => setSensitiveOnly(true)} active={sensitiveOnly} />
        <KpiCard label={tx("ফিল্টারে", "Filtered")} value={d(rows.length)} />
      </KpiGrid>
      <div className="flex flex-wrap items-center gap-2">
        {rangeChips.map(([v, bn, en]) => (
          <FilterChip key={v} active={range === v} onClick={() => setRange(v)}>{tx(bn, en)}</FilterChip>
        ))}
        <FilterChip active={sensitiveOnly} onClick={() => setSensitiveOnly(!sensitiveOnly)}>🔴 {tx("শুধু সংবেদনশীল", "Sensitive only")}</FilterChip>
        <Button variant="outline" size="sm" className="ml-auto" onClick={exportCsv}>
          <Download className="size-4" aria-hidden /> CSV
        </Button>
      </div>
      <DataTable
        rows={rows}
        columns={cols}
        rowKey={(l) => l.id}
        initialSort={{ key: "at", dir: "desc" }}
        search={(l) => `${l.action} ${l.target}`}
        searchPlaceholder={tx("কাজ খুঁজুন…", "Search action…")}
        rowClassName={(l) => clsx(categoryOf(l.action) && "bg-bad-soft/30")}
        empty={tx("এই ফিল্টারে কোনো এন্ট্রি নেই", "No entries for this filter")}
        toolbar={
          <>
            <FilterSelect label={tx("স্টাফ", "Staff")} value={who} onChange={setWho} options={[{ value: "all", label: tx("সব স্টাফ", "All staff") }, ...staff.map((s) => ({ value: s.id, label: s.name })), { value: "system", label: tx("সিস্টেম", "System") }]} />
            <FilterSelect label={tx("ধরন", "Category")} value={cat} onChange={setCat} options={[{ value: "all", label: tx("সব ধরন", "All categories") }, ...AUDIT_CATEGORIES.map((c) => ({ value: c.id, label: `${c.icon} ${tx(c.bn, c.en)}` }))]} />
            <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder={tx("লক্ষ্য (দোকান/নম্বর)…", "Target…")} aria-label={tx("লক্ষ্য", "Target")} className="min-h-10 w-44 rounded-xl border border-line bg-surface px-3 text-sm" />
          </>
        }
      />
    </>
  );
}
