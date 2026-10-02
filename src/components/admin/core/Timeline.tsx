"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { useT } from "@/components/providers/LangProvider";
import type { Tone } from "@/lib/labels";

export interface TimelineItem {
  at: string;
  title: ReactNode;
  note?: ReactNode;
  actor?: string;
  tone?: Tone;
}

const dot: Record<Tone, string> = { ok: "bg-ok", wait: "bg-wait-bg", bad: "bg-bad", info: "bg-muted" };

/** Vertical event list, newest last (status history, calls, notes). */
export function Timeline({ items, newestFirst }: { items: TimelineItem[]; newestFirst?: boolean }) {
  const { dateTime, tx } = useT();
  const sorted = [...items].sort((a, b) => (newestFirst ? -1 : 1) * (new Date(a.at).getTime() - new Date(b.at).getTime()));
  if (!sorted.length) return <p className="text-sm text-muted">{tx("এখনো কিছু নেই", "Nothing yet")}</p>;
  return (
    <ol className="relative space-y-3 border-l-2 border-line pl-5">
      {sorted.map((it, i) => (
        <li key={i} className="relative">
          <span className={clsx("absolute -left-[27px] top-1.5 size-3 rounded-full ring-4 ring-card", dot[it.tone ?? "info"])} aria-hidden />
          <p className="text-sm font-semibold">{it.title}</p>
          <p className="text-xs text-muted">
            {dateTime(it.at)}
            {it.actor && ` · ${it.actor}`}
          </p>
          {it.note && <p className="mt-0.5 text-sm text-ink-2">{it.note}</p>}
        </li>
      ))}
    </ol>
  );
}
