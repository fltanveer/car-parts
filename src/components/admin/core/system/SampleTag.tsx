"use client";

import { useT } from "@/components/providers/LangProvider";

/** Marks mock preview data on phase-2/3 placeholders. */
export function SampleTag() {
  const { tx } = useT();
  return <span className="ml-2 rounded-full border border-dashed border-wait-bg bg-wait-soft px-2 py-0.5 text-xs font-bold text-wait">{tx("নমুনা", "Sample")}</span>;
}
