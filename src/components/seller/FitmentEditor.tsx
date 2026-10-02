"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { describeVehicle, enginesOf, generations } from "@/lib/db/queries";
import type { Fitment } from "@/lib/types";
import { useT } from "../providers/LangProvider";
import { MakeLogo } from "../shared/Misc";
import { VehiclePicker, type VehicleChoice } from "../shared/VehiclePicker";
import { Button, Chip, Notice } from "../ui/primitives";

const lastCarKey = (vendorId: string) => `gaarihub:last-car:${vendorId}`;
export const rememberCar = (vendorId: string, f: Fitment | undefined) => {
  try {
    if (f) localStorage.setItem(lastCarKey(vendorId), JSON.stringify(f));
  } catch {
    /* ignore */
  }
};
const readLastCar = (vendorId: string): Fitment | null => {
  try {
    return JSON.parse(localStorage.getItem(lastCarKey(vendorId)) ?? "null") as Fitment | null;
  } catch {
    return null;
  }
};

export const fitmentFrom = (c: VehicleChoice): Fitment | null =>
  c.model_id ? { make_id: c.make_id, model_id: c.model_id, generation_id: c.generation_id, engine_id: c.engine_id, notes: null } : null;

const fitName = (f: Fitment) => {
  const v = describeVehicle(f.generation_id, f.engine_id);
  return v ? `${v.short} ${v.years}${v.engine ? ` · ${v.engine.code}` : ""}` : null;
};

/** Other generations sharing an engine with the chosen ones (file 04 §4.2 "also fits"). */
const alsoFits = (list: Fitment[]) => {
  const chosen = new Set(list.map((f) => f.generation_id));
  const engineIds = new Set(list.flatMap((f) => (f.generation_id ? enginesOf(f.generation_id).map((e) => e.id) : [])));
  return generations.filter((g) => !chosen.has(g.id) && enginesOf(g.id).some((e) => engineIds.has(e.id))).slice(0, 8);
};

/** Car fitment step: last-used shortcut, picker, "also fits" ticks, universal (file 02 §5.1). */
export function FitmentEditor({ vendorId, value, universal, onChange, allowUniversal = true, locked }: { vendorId: string; value: Fitment[]; universal: boolean; onChange: (f: Fitment[], universal: boolean) => void; allowUniversal?: boolean; locked?: boolean }) {
  const { tx, d } = useT();
  const [picking, setPicking] = useState(value.length === 0 && !universal);
  const [last] = useState(() => readLastCar(vendorId));
  const add = (f: Fitment) => {
    if (value.some((x) => x.generation_id === f.generation_id && x.model_id === f.model_id)) return;
    onChange([...value, f], false);
  };
  if (locked) {
    return (
      <div className="space-y-2">
        {universal ? <p className="font-semibold">🌐 {tx("সব গাড়িতে লাগে", "Fits all cars")}</p> : value.map((f, i) => <p key={i} className="rounded-xl bg-surface px-3 py-2 font-semibold">🚗 {fitName(f) ?? tx("গাড়ি", "Car")}</p>)}
      </div>
    );
  }
  if (universal) {
    return (
      <div className="space-y-3">
        <Notice tone="ok">🌐 {tx("সব গাড়িতে লাগে / স্পেক দিয়ে মিলবে", "Fits all cars / matched by spec")}</Notice>
        <Button variant="outline" full onClick={() => { onChange([], false); setPicking(true); }}>{tx("না, নির্দিষ্ট গাড়ি বাছাই করবো", "No, pick specific cars")}</Button>
      </div>
    );
  }
  const suggestions = alsoFits(value);
  const lastName = last ? fitName(last) : null;
  return (
    <div className="space-y-4">
      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((f, i) => {
            const v = describeVehicle(f.generation_id);
            return (
              <li key={i} className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-ok/40 bg-ok-soft px-3">
                {v && <MakeLogo make={v.make} size="sm" />}
                <span className="flex-1 font-semibold">{fitName(f) ?? tx("মডেল (সব সাল)", "Model (all years)")}</span>
                <button type="button" aria-label={tx("সরান", "Remove")} onClick={() => onChange(value.filter((_, j) => j !== i), false)} className="grid size-10 place-items-center rounded-full hover:bg-white/60">
                  <X className="size-5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {lastName && !value.some((f) => f.generation_id === last?.generation_id) && (
        <button type="button" onClick={() => { add(last!); setPicking(false); }} className="flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 border-brand bg-brand-soft/50 px-4 text-left">
          <span className="text-2xl">⏮️</span>
          <span>
            <span className="block text-sm text-ink-2">{tx("শেষবার যে গাড়ি দিয়েছিলেন", "Last car you used")}</span>
            <span className="block text-lg font-bold">{lastName}</span>
          </span>
        </button>
      )}
      {suggestions.length > 0 && (
        <div>
          <p className="mb-2 font-semibold">{tx("এর মতো আর কোন গাড়িতে লাগে? (টিক দিন)", "Also fits these? (tick)")}</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((g) => {
              const v = describeVehicle(g.id)!;
              return (
                <Chip key={g.id} onClick={() => add({ make_id: v.make.id, model_id: v.model.id, generation_id: g.id, engine_id: null, notes: null })} className="min-h-11">
                  ＋ {v.short} {d(g.year_from)}
                </Chip>
              );
            })}
          </div>
        </div>
      )}
      {picking ? (
        <div className="rounded-2xl border border-line p-3">
          <VehiclePicker
            allowUniversal={allowUniversal}
            onUniversal={() => { onChange([], true); setPicking(false); }}
            onDone={(c) => {
              const f = fitmentFrom(c);
              if (f) add(f);
              setPicking(false);
            }}
          />
        </div>
      ) : (
        <Button variant="outline" size="lg" full onClick={() => setPicking(true)}>🚗 ＋ {value.length ? tx("আরেকটা গাড়ি যোগ", "Add another car") : tx("গাড়ি বাছাই করুন", "Pick a car")}</Button>
      )}
    </div>
  );
}
