"use client";

import type { Tone } from "@/lib/labels";
import { useT } from "@/components/providers/LangProvider";

export interface BarDatum {
  label: string;
  value: number;
  tone?: Tone;
  sub?: string;
}

const fill: Record<Tone, string> = { ok: "var(--color-ok)", wait: "var(--color-wait-bg)", bad: "var(--color-bad)", info: "var(--color-brand)" };

/** Horizontal SVG bars with labels (categories, sellers, markets). */
export function BarList({ data, format, max }: { data: BarDatum[]; format?: (n: number) => string; max?: number }) {
  const { tx, num } = useT();
  const top = max ?? Math.max(1, ...data.map((x) => x.value));
  const fmt = format ?? num;
  if (!data.length) return <p className="text-sm text-muted">{tx("ডেটা নেই", "No data")}</p>;
  return (
    <ul className="space-y-2">
      {data.map((x) => (
        <li key={x.label}>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="min-w-0 truncate font-medium">{x.label}</span>
            <span className="shrink-0 font-bold tabular-nums">{fmt(x.value)}</span>
          </div>
          <svg viewBox="0 0 100 6" preserveAspectRatio="none" className="mt-1 h-2.5 w-full" role="img" aria-label={`${x.label}: ${fmt(x.value)}`}>
            <rect x="0" y="0" width="100" height="6" rx="3" fill="var(--color-surface)" />
            <rect x="0" y="0" width={Math.max(0.5, (x.value / top) * 100)} height="6" rx="3" fill={fill[x.tone ?? "info"]} />
          </svg>
          {x.sub && <p className="text-xs text-muted">{x.sub}</p>}
        </li>
      ))}
    </ul>
  );
}

/** Vertical SVG columns for time series (daily orders, funnel steps). */
export function ColumnChart({ data, height = 160, format }: { data: BarDatum[]; height?: number; format?: (n: number) => string }) {
  const { num, tx } = useT();
  const fmt = format ?? num;
  if (!data.length) return <p className="text-sm text-muted">{tx("ডেটা নেই", "No data")}</p>;
  const top = Math.max(1, ...data.map((x) => x.value));
  const w = 100 / data.length;
  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }} role="img" aria-label={data.map((x) => `${x.label} ${fmt(x.value)}`).join(", ")}>
        {data.map((x, i) => {
          const h = (x.value / top) * (height - 4);
          return <rect key={x.label} x={i * w + w * 0.15} y={height - h} width={w * 0.7} height={Math.max(h, 0.5)} rx="1" fill={fill[x.tone ?? "info"]} />;
        })}
      </svg>
      <div className="mt-1 grid text-center text-[11px] text-muted" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
        {data.map((x) => (
          <span key={x.label} className="truncate px-0.5" title={x.label}>
            <span className="block font-bold text-ink">{fmt(x.value)}</span>
            {x.label}
          </span>
        ))}
      </div>
    </div>
  );
}
