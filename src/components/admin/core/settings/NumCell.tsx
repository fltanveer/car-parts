"use client";

import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";

/** Small numeric cell editor: saves on blur/Enter when changed and valid. */
export function NumCell({ value, onSave, canEdit, label, min = 0, max = 1_000_000 }: { value: number; onSave: (v: number) => void; canEdit: boolean; label: string; min?: number; max?: number }) {
  const { d } = useT();
  const [draft, setDraft] = useState(String(value));
  if (!canEdit) return <span className="tabular-nums">{d(value)}</span>;
  const commit = () => {
    const n = Number(draft);
    if (draft.trim() === "" || Number.isNaN(n) || n < min || n > max) {
      setDraft(String(value));
      return;
    }
    if (n !== value) onSave(n);
  };
  return (
    <input
      value={draft}
      inputMode="decimal"
      aria-label={label}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      className="min-h-10 w-24 rounded-lg border-2 border-line bg-card px-2 text-right tabular-nums outline-none focus:border-brand"
    />
  );
}
