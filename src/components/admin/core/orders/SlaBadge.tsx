"use client";

import clsx from "clsx";
import { useT } from "@/components/providers/LangProvider";
import { type SlaInfo, slaLabel } from "./sla";

const cls = { ok: "bg-ok-soft text-ok", warn: "bg-wait-soft text-wait", late: "bg-bad-soft text-bad" } as const;

/** "Accept · 3 h left" pill coloured green → yellow → red (rule 10). */
export function SlaBadge({ sla }: { sla: SlaInfo }) {
  const { L, ago, tx } = useT();
  return (
    <span className={clsx("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold tabular-nums", cls[sla.tone])}>
      ⏱ {L(slaLabel[sla.kind])} · {sla.tone === "late" ? tx("পার হয়েছে ", "breached ") : ""}
      {ago(sla.deadline)}
    </span>
  );
}
