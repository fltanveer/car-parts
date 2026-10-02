"use client";

import { Download } from "lucide-react";
import type { ReactNode } from "react";
import { type CsvCell, downloadCsv, Panel } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { Button } from "@/components/ui/primitives";
import type { DB } from "@/lib/db/seed";

export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;

/** KPI targets for the first 6 months (file 00 §15). */
export const KPI = { requestToOrderPct: 25, firstQuoteMinutes: 120, notAsDescribedPct: 3, myCarSetPct: 60, zeroResultPct: 15, repeat90Pct: 30 };

export const selectAll = (s: DB) => s;
export const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);
export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
export const avg = (xs: number[]) => (xs.length ? sum(xs) / xs.length : 0);

/** Linear-interpolated quantile (q in 0..1). */
export const quantile = (xs: number[], q: number) => {
  if (!xs.length) return 0;
  const a = [...xs].sort((x, y) => x - y);
  const pos = (a.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return Math.round(a[lo] + (a[hi] - a[lo]) * (pos - lo));
};
export const median = (xs: number[]) => quantile(xs, 0.5);

export const countBy = <T,>(xs: T[], key: (x: T) => string) => {
  const m = new Map<string, number>();
  xs.forEach((x) => m.set(key(x), (m.get(key(x)) ?? 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

/** Orders that still carry money (not every sub-order cancelled/rejected). */
export const liveOrderIds = (s: DB) => {
  const dead = new Set<string>(["cancelled", "rejected_by_vendor", "qc_failed"]);
  return new Set(s.orders.filter((o) => s.vendorOrders.some((v) => v.order_id === o.id && !dead.has(v.status))).map((o) => o.id));
};

/** When a sub-order was created (first status event). */
export const voCreated = (v: DB["vendorOrders"][number]) => v.history[0]?.at ?? v.accept_by;

/** Report section with a CSV export of its main table. */
export function ReportBlock({ title, csv, csvName, children, actions }: { title: ReactNode; csv?: CsvCell[][]; csvName?: string; children: ReactNode; actions?: ReactNode }) {
  const { tx } = useT();
  return (
    <Panel
      title={title}
      actions={
        <>
          {actions}
          {csv && (
            <Button size="sm" variant="outline" onClick={() => downloadCsv(csvName ?? "report.csv", csv)} disabled={csv.length < 2}>
              <Download className="size-4" /> {tx("CSV নামান", "Export CSV")}
            </Button>
          )}
        </>
      }
    >
      {children}
    </Panel>
  );
}

export function Grid2({ children }: { children: ReactNode }) {
  return <div className="grid gap-5 lg:grid-cols-2">{children}</div>;
}
