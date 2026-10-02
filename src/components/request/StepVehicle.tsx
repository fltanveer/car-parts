"use client";

import clsx from "clsx";
import { Car, Check, ChevronLeft, Hash, HelpCircle, ListChecks } from "lucide-react";
import { useState } from "react";
import type { UserVehicle } from "@/lib/types";
import { ChassisLookup } from "../garage/ChassisLookup";
import { useT } from "../providers/LangProvider";
import { ChoiceCard } from "../ui/primitives";
import { vehicleLabel } from "../vehicle/VehicleChip";
import { VehiclePicker } from "../vehicle/VehiclePicker";
import { resolveVehicle, type VehicleSel } from "./draft";

type Mode = "list" | "pick" | "chassis";

const Tick = () => (
  <span className="grid size-7 place-items-center rounded-full bg-ink text-white">
    <Check className="size-4" strokeWidth={3} />
  </span>
);

export function StepVehicle({
  vehicles,
  value,
  onChange,
  hasVoice,
}: {
  vehicles: UserVehicle[];
  value: VehicleSel | null;
  onChange: (v: VehicleSel | null) => void;
  hasVoice: boolean;
}) {
  const { tx, lang } = useT();
  const [mode, setMode] = useState<Mode>("list");

  if (mode !== "list")
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setMode("list")} className="flex min-h-11 items-center gap-1 font-semibold">
          <ChevronLeft className="size-5" /> {tx("অন্য উপায়ে", "Other options")}
        </button>
        {mode === "pick" ? (
          <VehiclePicker
            onPick={(p) => {
              onChange({ kind: "picked", generation_id: p.generation_id, engine_id: p.engine_id, save: true });
              setMode("list");
            }}
          />
        ) : (
          <ChassisLookup
            initial={value?.kind === "chassis" ? value.chassis_number : ""}
            onPick={(p) => {
              onChange({ kind: "chassis", generation_id: p.generation_id, chassis_number: p.chassis_number, save: !!p.generation_id });
              setMode("list");
            }}
          />
        )}
      </div>
    );

  const newSel = value && (value.kind === "picked" || value.kind === "chassis") ? value : null;
  const newLabel = newSel ? resolveVehicle(newSel, vehicles, lang).label : null;

  return (
    <div className="space-y-5">
      {vehicles.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold">{tx("আপনার সেভ করা গাড়ি", "Your saved cars")}</h2>
          {vehicles.map((v) => {
            const selected = value?.kind === "saved" && value.vehicleId === v.id;
            return (
              <div key={v.id} className="relative">
                <ChoiceCard
                  selected={selected}
                  onClick={() => onChange(selected ? null : { kind: "saved", vehicleId: v.id })}
                  icon={<Car className="size-6" />}
                  title={vehicleLabel(v, lang)}
                  subtitle={v.nickname ?? (v.is_primary ? tx("প্রধান গাড়ি", "Primary car") : undefined)}
                  className="pr-12"
                />
                {selected && (
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    <Tick />
                  </span>
                )}
              </div>
            );
          })}
        </section>
      )}

      {newSel && newLabel && (
        <section className="space-y-2">
          <h2 className="font-semibold">{tx("আপনি বেছে নিয়েছেন", "You chose")}</h2>
          <div className="rounded-2xl border-2 border-ink bg-card p-4">
            <div className="flex items-center gap-3">
              <Car className="size-6 shrink-0" />
              <p className="flex-1 font-bold">{newLabel}</p>
              <Tick />
            </div>
            {newSel.generation_id && (
              <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 border-t border-line pt-3 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={newSel.save}
                  onChange={(e) => onChange({ ...newSel, save: e.target.checked })}
                  className="size-5 accent-ink"
                />
                {tx("“আমার গাড়ি”-তে সেভ করে রাখুন", "Save to “My cars”")}
              </label>
            )}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="font-semibold">{vehicles.length || newSel ? tx("অন্য গাড়ি?", "Another car?") : tx("গাড়ি বেছে নিন", "Choose the car")}</h2>
        <ChoiceCard onClick={() => setMode("pick")} icon={<ListChecks className="size-6" />} title={tx("কোম্পানি ও মডেল বেছে নিন", "Choose make and model")} subtitle={tx("Toyota, Honda, Nissan…", "Toyota, Honda, Nissan…")} />
        <ChoiceCard onClick={() => setMode("chassis")} icon={<Hash className="size-6" />} title={tx("চেসিস নম্বর দিন", "Enter chassis number")} subtitle={tx("গাড়ির কাগজে লেখা থাকে", "It's on the registration paper")} />
        <div className="relative">
          <ChoiceCard
            selected={value?.kind === "unknown"}
            onClick={() => onChange(value?.kind === "unknown" ? null : { kind: "unknown" })}
            icon={<HelpCircle className="size-6" />}
            title={hasVoice ? tx("জানি না, ভয়েসে বলেছি", "Not sure, I said it in the voice note") : tx("জানি না", "Not sure")}
            subtitle={tx("সমস্যা নেই, আমরা ফোন করে জেনে নেবো", "No problem, we'll ask you on the phone")}
            className={clsx(value?.kind === "unknown" && "pr-12")}
          />
          {value?.kind === "unknown" && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              <Tick />
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
