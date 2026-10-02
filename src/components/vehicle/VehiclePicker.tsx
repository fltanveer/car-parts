"use client";

import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import { getEngines, getGenerations, getMakes, getModels } from "@/lib/api";
import type { VehicleGeneration } from "@/lib/types";
import { useT } from "../providers/LangProvider";
import { ChoiceCard } from "../ui/primitives";

export interface PickedVehicle {
  generation_id: string;
  engine_id: string | null;
}

// Spec 7.2(a): brand -> model -> generation -> engine, one big card per option.
export function VehiclePicker({ onPick }: { onPick: (v: PickedVehicle) => void }) {
  const { lang, tx, d } = useT();
  const [makeId, setMakeId] = useState<string | null>(null);
  const [modelId, setModelId] = useState<string | null>(null);
  const [gen, setGen] = useState<VehicleGeneration | null>(null);

  const step = !makeId ? 1 : !modelId ? 2 : !gen ? 3 : 4;
  const back = () => {
    if (gen) setGen(null);
    else if (modelId) setModelId(null);
    else setMakeId(null);
  };

  const chooseGen = (g: VehicleGeneration) => {
    const engines = getEngines(g.id);
    if (engines.length <= 1) onPick({ generation_id: g.id, engine_id: engines[0]?.id ?? null });
    else setGen(g);
  };

  const heading = [
    tx("কোন কোম্পানির গাড়ি?", "Which make?"),
    tx("কোন মডেল?", "Which model?"),
    tx("কোন সালের? (চেসিস কোড মিলিয়ে দেখুন)", "Which years? (match the chassis code)"),
    tx("কোন ইঞ্জিন?", "Which engine?"),
  ][step - 1];

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        {step > 1 && (
          <button type="button" onClick={back} className="grid size-10 place-items-center rounded-lg hover:bg-ink/5" aria-label={tx("পেছনে", "Back")}>
            <ChevronLeft className="size-5" />
          </button>
        )}
        <p className="font-semibold">
          <span className="text-muted">{d(step)}/{d(4)} · </span>
          {heading}
        </p>
      </div>

      {step === 1 && (
        <div className="grid grid-cols-2 gap-2">
          {getMakes().map((m) => (
            <ChoiceCard
              key={m.id}
              onClick={() => setMakeId(m.id)}
              icon={<span className="text-lg font-black">{m.name[0]}</span>}
              title={m.name}
              subtitle={m.name_bn}
            />
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-2 gap-2">
          {getModels(makeId!).map((m) => (
            <ChoiceCard key={m.id} onClick={() => setModelId(m.id)} title={m.name} subtitle={m.name_bn} />
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-2">
          {getGenerations(modelId!).map((g) => (
            <ChoiceCard
              key={g.id}
              onClick={() => chooseGen(g)}
              title={lang === "bn" ? `${d(g.year_from)} থেকে ${g.year_to ? d(g.year_to) : "বর্তমান"}` : `${g.year_from} to ${g.year_to ?? "now"}`}
              subtitle={`${g.label} · ${g.chassis_codes.join(", ")}`}
            />
          ))}
        </div>
      )}

      {step === 4 && gen && (
        <div className="space-y-2">
          {getEngines(gen.id).map((e) => (
            <ChoiceCard
              key={e.id}
              onClick={() => onPick({ generation_id: gen.id, engine_id: e.id })}
              title={`${e.code} · ${d(e.displacement_cc)}cc`}
              subtitle={{ petrol: tx("পেট্রোল", "Petrol"), diesel: tx("ডিজেল", "Diesel"), hybrid: tx("হাইব্রিড", "Hybrid"), cng: "CNG" }[e.fuel_type]}
            />
          ))}
          <ChoiceCard onClick={() => onPick({ generation_id: gen.id, engine_id: null })} title={tx("জানি না", "Not sure")} />
        </div>
      )}
    </div>
  );
}
