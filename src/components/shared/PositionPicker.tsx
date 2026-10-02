"use client";

import clsx from "clsx";
import { positionLabel } from "@/lib/labels";
import type { PositionKey } from "@/lib/types";
import { useT } from "../providers/LangProvider";

/**
 * Top-down car: tap where the part sits. Bangladesh cars are RHD, so the
 * driver side is on the right (file 04 §4.3).
 */
export function PositionPicker({ value, onChange }: { value: PositionKey[]; onChange: (v: PositionKey[]) => void }) {
  const { tx, L } = useT();
  const toggle = (k: PositionKey, opposite: PositionKey) =>
    onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value.filter((x) => x !== opposite), k]);
  const zone = (k: PositionKey, opposite: PositionKey, cls: string, label: string) => (
    <button
      type="button"
      onClick={() => toggle(k, opposite)}
      aria-pressed={value.includes(k)}
      className={clsx("absolute grid place-items-center rounded-xl text-sm font-bold transition-colors", cls, value.includes(k) ? "bg-brand text-white" : "bg-white/70 text-ink-2 hover:bg-brand-soft")}
    >
      {label}
    </button>
  );
  return (
    <div className="space-y-3">
      <div className="relative mx-auto h-80 w-52">
        {/* car body */}
        <div className="absolute inset-x-6 inset-y-2 rounded-[3rem] border-4 border-ink/70 bg-surface" aria-hidden />
        <div className="absolute inset-x-11 top-16 h-14 rounded-t-2xl border-2 border-ink/30 bg-sky-100" aria-hidden />
        <div className="absolute inset-x-11 bottom-14 h-10 rounded-b-2xl border-2 border-ink/30 bg-sky-100" aria-hidden />
        <div className="absolute right-12 top-[8.5rem] grid size-8 place-items-center rounded-full border-2 border-ink/50 text-[10px]" aria-hidden>
          🛞
        </div>
        {zone("front", "rear", "inset-x-8 top-0 h-12", tx("সামনে ↑", "Front ↑"))}
        {zone("rear", "front", "inset-x-8 bottom-0 h-12", tx("পেছনে ↓", "Rear ↓"))}
        {zone("passenger", "driver", "left-0 top-28 h-24 w-14", tx("বাম", "Left"))}
        {zone("driver", "passenger", "right-0 top-28 h-24 w-14", tx("ডান", "Right"))}
      </div>
      <p className="text-center text-sm text-muted">{tx("ডান দিকে চালকের সিট (স্টিয়ারিং)", "Driver (steering) sits on the right")}</p>
      {value.length > 0 && (
        <p className="text-center font-semibold">{value.map((v) => L(positionLabel[v])).join(" · ")}</p>
      )}
    </div>
  );
}
