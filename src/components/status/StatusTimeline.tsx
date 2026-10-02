"use client";

import clsx from "clsx";
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { useT } from "../providers/LangProvider";

export interface TimelineStep {
  key: string;
  label: string;
  icon?: ReactNode;
  at?: string | null;
}

// Vertical status timeline shared by requests, orders and claims.
export function StatusTimeline({ steps, currentIndex, stopped }: { steps: TimelineStep[]; currentIndex: number; stopped?: string | null }) {
  const { dateTime } = useT();
  return (
    <ol className="relative">
      {steps.map((s, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex && !stopped;
        return (
          <li key={s.key} className="relative flex gap-3 pb-5 last:pb-0">
            {i < steps.length - 1 && (
              <span className={clsx("absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5", done ? "bg-ok" : "bg-line")} aria-hidden />
            )}
            <span
              className={clsx(
                "relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-2 text-sm",
                done && "border-ok bg-ok text-white",
                current && "border-ink bg-ink text-white",
                !done && !current && "border-line bg-card text-muted",
              )}
            >
              {done ? <Check className="size-4" strokeWidth={3} /> : (s.icon ?? <span className="size-2 rounded-full bg-current" />)}
            </span>
            <div className="pt-1">
              <p className={clsx("font-semibold", !done && !current && "font-normal text-muted")}>{s.label}</p>
              {s.at && (done || current) && <p className="text-xs text-muted">{dateTime(s.at)}</p>}
            </div>
          </li>
        );
      })}
      {stopped && <li className="mt-2 rounded-xl bg-danger/5 px-4 py-3 font-semibold text-danger">{stopped}</li>}
    </ol>
  );
}
