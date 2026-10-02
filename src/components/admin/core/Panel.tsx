"use client";

import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Tone } from "@/lib/labels";

/** Titled card section used across admin screens. */
export function Panel({ title, actions, children, className, bodyClass, id }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; bodyClass?: string; id?: string }) {
  return (
    <section id={id} className={clsx("rounded-2xl border border-line bg-card", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          {title && <h2 className="font-bold">{title}</h2>}
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={clsx("p-4", bodyClass)}>{children}</div>
    </section>
  );
}

const toneCls: Record<Tone, string> = {
  ok: "border-ok/30 bg-ok-soft text-ok",
  wait: "border-wait-bg/50 bg-wait-soft text-wait",
  bad: "border-bad/30 bg-bad-soft text-bad",
  info: "border-line bg-card text-ink",
};

/** KPI tile: big number + label (+ link to a filtered queue). */
export function KpiCard({ label, value, sub, tone = "info", icon, href, onClick, active }: { label: ReactNode; value: ReactNode; sub?: ReactNode; tone?: Tone; icon?: ReactNode; href?: string; onClick?: () => void; active?: boolean }) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold opacity-80">{label}</p>
        {icon && <span className="text-lg" aria-hidden>{icon}</span>}
      </div>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs opacity-80">{sub}</p>}
    </>
  );
  const cls = clsx("block rounded-2xl border p-4 text-left transition-shadow", toneCls[tone], (href || onClick) && "hover:shadow-md", active && "ring-2 ring-ink");
  if (href) return <Link href={href} className={cls}>{body}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={clsx(cls, "w-full")}>{body}</button>;
  return <div className={cls}>{body}</div>;
}

export function KpiGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4", className)}>{children}</div>;
}

/** Label/value rows for detail panels. */
export function KV({ rows, className }: { rows: [ReactNode, ReactNode][]; className?: string }) {
  return (
    <dl className={clsx("grid grid-cols-[minmax(7rem,auto)_1fr] gap-x-4 gap-y-1.5 text-sm", className)}>
      {rows.map(([k, v], i) => (
        <div key={i} className="contents">
          <dt className="text-muted">{k}</dt>
          <dd className="min-w-0 break-words font-medium">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
