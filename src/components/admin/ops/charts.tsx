"use client";

import { useT } from "@/components/providers/LangProvider";

// Small, dependency-free charts. One hue per series, light gridlines, labelled
// axes, values available on hover (<title>) and as direct labels where room.

const SERIES_COLORS = ["var(--color-brand)", "var(--color-wait-bg)"];

/** Grouped columns over days (e.g. orders vs requests, last 14 days). */
export function ColumnChart({ days, series, yLabel }: { days: { label: string; values: number[] }[]; series: string[]; yLabel: string }) {
  const { d } = useT();
  const W = 640;
  const H = 220;
  const pad = { l: 36, r: 8, t: 10, b: 30 };
  const max = Math.max(1, ...days.flatMap((x) => x.values));
  const top = Math.max(2, Math.ceil(max / 2) * 2);
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const slot = iw / days.length;
  const bw = Math.min(14, (slot - 6) / series.length);
  const y = (v: number) => pad.t + ih - (v / top) * ih;
  const ticks = [0, top / 2, top];
  return (
    <figure>
      <div className="mb-2 flex flex-wrap gap-4 text-xs">
        {series.map((s, i) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: SERIES_COLORS[i] }} aria-hidden />
            {s}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${series.join(", ")} · ${yLabel}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth={1} />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--color-muted)">
              {d(t)}
            </text>
          </g>
        ))}
        <text x={10} y={pad.t + ih / 2} fontSize={11} fill="var(--color-muted)" textAnchor="middle" transform={`rotate(-90 10 ${pad.t + ih / 2})`}>
          {yLabel}
        </text>
        {days.map((day, i) => {
          const x0 = pad.l + i * slot + (slot - bw * series.length) / 2;
          return (
            <g key={day.label + i}>
              {day.values.map((v, k) => (
                <rect key={k} x={x0 + k * bw} y={y(v)} width={bw - 1} height={Math.max(0, pad.t + ih - y(v))} rx={2} fill={SERIES_COLORS[k]}>
                  <title>{`${day.label} · ${series[k]}: ${v}`}</title>
                </rect>
              ))}
              {i % 2 === days.length % 2 && (
                <text x={pad.l + i * slot + slot / 2} y={H - 10} textAnchor="middle" fontSize={10} fill="var(--color-muted)">
                  {day.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

/** Horizontal bars with direct value labels (categories, markets). */
export function HBarChart({ rows, format }: { rows: { label: string; value: number }[]; format?: (n: number) => string }) {
  const { num } = useT();
  const max = Math.max(1, ...rows.map((r) => r.value));
  const fmt = format ?? num;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,8rem)_1fr] items-center gap-2 text-sm">
          <span className="truncate text-ink-2" title={r.label}>
            {r.label}
          </span>
          <span className="flex items-center gap-2">
            <span className="h-4 rounded-r bg-brand" style={{ width: `${Math.max(1, (r.value / max) * 80)}%` }} aria-hidden />
            <span className="shrink-0 text-xs font-semibold tabular-nums">{fmt(r.value)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
