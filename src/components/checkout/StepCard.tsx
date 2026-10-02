"use client";

import clsx from "clsx";
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { useT } from "../providers/LangProvider";
import { Card } from "../ui/primitives";

export type StepState = "done" | "active" | "locked";

// One numbered step of the single-page checkout. Done steps collapse to a
// one-line summary with a "change" link; locked steps show only the title.
export function StepCard({
  n,
  title,
  state,
  summary,
  onEdit,
  children,
}: {
  n: number;
  title: ReactNode;
  state: StepState;
  summary?: ReactNode;
  onEdit?: () => void;
  children?: ReactNode;
}) {
  const { d, t } = useT();
  return (
    <Card className={clsx("p-4", state === "active" && "border-2 border-ink/70", state === "locked" && "opacity-60")}>
      <div className="flex items-center gap-3">
        <span
          className={clsx(
            "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold",
            state === "done" && "bg-ok text-white",
            state === "active" && "bg-ink text-white",
            state === "locked" && "border-2 border-line text-muted",
          )}
          aria-hidden
        >
          {state === "done" ? <Check className="size-4" strokeWidth={3} /> : d(n)}
        </span>
        <h2 className="min-w-0 flex-1 text-lg font-bold">{title}</h2>
        {state === "done" && onEdit && (
          <button type="button" onClick={onEdit} className="min-h-10 shrink-0 px-2 text-sm font-semibold underline">
            {t("change")}
          </button>
        )}
      </div>
      {state === "done" && summary && <div className="mt-2 pl-11 text-sm text-ink-2">{summary}</div>}
      {state === "active" && <div className="mt-4">{children}</div>}
    </Card>
  );
}
