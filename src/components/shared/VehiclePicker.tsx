"use client";

import { ChevronRight, HelpCircle, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { enginesOf, generationsOf, getMake, getModel, makes, modelsOf } from "@/lib/db/queries";
import { useT } from "../providers/LangProvider";
import { Input } from "../ui/primitives";
import { MakeLogo } from "./Misc";

export interface VehicleChoice {
  make_id: string | null;
  model_id: string | null;
  generation_id: string | null;
  engine_id: string | null;
}

/**
 * Logo → model → year/generation → engine, with "don't know" at every step
 * (file 01 §11.3). Calls onDone with whatever was chosen.
 */
export function VehiclePicker({ onDone, initial, allowUniversal, onUniversal }: { onDone: (v: VehicleChoice) => void; initial?: Partial<VehicleChoice>; allowUniversal?: boolean; onUniversal?: () => void }) {
  const { tx, lang, d } = useT();
  const [makeId, setMakeId] = useState<string | null>(initial?.make_id ?? null);
  const [modelId, setModelId] = useState<string | null>(initial?.model_id ?? null);
  const [genId, setGenId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const make = getMake(makeId);
  const model = getModel(modelId);
  const filteredModels = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return makes.flatMap((mk) => modelsOf(mk.id).filter((m) => m.name.toLowerCase().includes(term) || m.name_bn.includes(term)).map((m) => ({ m, mk })));
  }, [q]);

  const dontKnow = (label: string, onClick: () => void) => (
    <button type="button" onClick={onClick} className="mt-3 flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 border-dashed border-line px-4 text-left font-semibold text-ink-2 hover:border-ink/30">
      <HelpCircle className="size-5" aria-hidden /> {label}
    </button>
  );
  const crumbs = (
    <p className="mb-3 flex flex-wrap items-center gap-1 text-sm text-muted">
      <button type="button" className="font-semibold underline-offset-4 hover:underline" onClick={() => { setMakeId(null); setModelId(null); setGenId(null); }}>
        {tx("ব্র্যান্ড", "Brand")}
      </button>
      {make && (<><ChevronRight className="size-3.5" /><button type="button" className="font-semibold underline-offset-4 hover:underline" onClick={() => { setModelId(null); setGenId(null); }}>{make.name}</button></>)}
      {model && (<><ChevronRight className="size-3.5" /><button type="button" className="font-semibold underline-offset-4 hover:underline" onClick={() => setGenId(null)}>{model.name}</button></>)}
    </p>
  );

  // Step 1: brand logos (+ search by model name)
  if (!make) {
    return (
      <div>
        <div className="relative mb-3">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tx("মডেলের নাম লিখুন (যেমন Axio)", "Type a model (e.g. Axio)")} className="pl-12" />
        </div>
        {filteredModels.length > 0 ? (
          <ul className="space-y-2">
            {filteredModels.map(({ m, mk }) => (
              <li key={m.id}>
                <button type="button" onClick={() => { setMakeId(mk.id); setModelId(m.id); setQ(""); }} className="flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 border-line bg-card px-3 text-left hover:border-ink/30">
                  <MakeLogo make={mk} size="sm" />
                  <span className="font-semibold">{mk.name} {m.name}</span>
                  <span className="text-sm text-muted">{m.name_bn}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="grid grid-cols-3 gap-2">
            {makes.map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => setMakeId(m.id)} className="flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-line bg-card p-2 hover:border-ink/30">
                  <MakeLogo make={m} size="lg" />
                  <span className="text-sm font-semibold">{lang === "bn" ? m.name_bn : m.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {allowUniversal && onUniversal && dontKnow(tx("সব গাড়িতে লাগে / স্পেক দিয়ে মিলবে", "Fits all cars / matched by spec"), onUniversal)}
        {dontKnow(tx("জানি না, টিম ঠিক করে দেবে", "Not sure, let the team set it"), () => onDone({ make_id: null, model_id: null, generation_id: null, engine_id: null }))}
      </div>
    );
  }

  // Step 2: model
  if (!model) {
    return (
      <div>
        {crumbs}
        <ul className="grid grid-cols-2 gap-2">
          {modelsOf(make.id).map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => setModelId(m.id)} className="flex min-h-16 w-full flex-col items-start justify-center rounded-2xl border-2 border-line bg-card px-4 py-2 text-left hover:border-ink/30">
                <span className="font-bold">{m.name}</span>
                <span className="text-sm text-muted">{m.name_bn}</span>
              </button>
            </li>
          ))}
        </ul>
        {dontKnow(tx("মডেল জানি না", "Don't know the model"), () => onDone({ make_id: make.id, model_id: null, generation_id: null, engine_id: null }))}
      </div>
    );
  }

  // Step 3: generation (year range)
  if (!genId) {
    return (
      <div>
        {crumbs}
        <p className="mb-2 font-semibold">{tx("কোন সালের?", "Which year?")}</p>
        <ul className="space-y-2">
          {generationsOf(model.id).map((g) => (
            <li key={g.id}>
              <button
                type="button"
                onClick={() => (enginesOf(g.id).length > 1 ? setGenId(g.id) : onDone({ make_id: make.id, model_id: model.id, generation_id: g.id, engine_id: enginesOf(g.id)[0]?.id ?? null }))}
                className="flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl border-2 border-line bg-card px-4 text-left hover:border-ink/30"
              >
                <span>
                  <span className="block text-lg font-bold">{d(g.year_from)} – {g.year_to ? d(g.year_to) : tx("এখন", "now")}</span>
                  <span className="block text-sm text-muted">{g.label} · {g.chassis_codes.join(", ")}</span>
                </span>
                <ChevronRight className="size-5 text-muted" />
              </button>
            </li>
          ))}
        </ul>
        {dontKnow(tx("সাল জানি না", "Don't know the year"), () => onDone({ make_id: make.id, model_id: model.id, generation_id: null, engine_id: null }))}
      </div>
    );
  }

  // Step 4: engine
  return (
    <div>
      {crumbs}
      <p className="mb-2 font-semibold">{tx("কোন ইঞ্জিন?", "Which engine?")}</p>
      <ul className="space-y-2">
        {enginesOf(genId).map((e) => (
          <li key={e.id}>
            <button type="button" onClick={() => onDone({ make_id: make.id, model_id: model.id, generation_id: genId, engine_id: e.id })} className="flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 border-line bg-card px-4 text-left hover:border-ink/30">
              <span className="text-lg font-bold">{e.code}</span>
              <span className="text-sm text-muted">{d(e.displacement_cc)}cc · {e.fuel_type}</span>
            </button>
          </li>
        ))}
      </ul>
      {dontKnow(tx("ইঞ্জিন জানি না", "Don't know the engine"), () => onDone({ make_id: make.id, model_id: model.id, generation_id: genId, engine_id: null }))}
    </div>
  );
}
