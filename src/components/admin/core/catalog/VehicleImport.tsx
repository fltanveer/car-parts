"use client";

import { Upload } from "lucide-react";
import { useState } from "react";
import { CsvImport, Panel } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, StatusPill, Toggle } from "@/components/ui/primitives";
import { generations } from "@/lib/db/queries";
import type { VehicleGeneration, VehicleTypeCode } from "@/lib/types";
import { VEHICLE_TYPES } from "./constants";
import { type ImportedVehicle, importVehicles } from "./overlay";
import { findMake, findModel, parseEngines } from "./vehicleData";

const SAMPLE = [
  ["make", "model", "generation", "year_from", "year_to", "chassis_codes", "facelift", "engines", "type"],
  ["Toyota", "Axio", "E210", "2019", "", "NRE210|ZWE211", "na", "2NR-FKE:1500:petrol|2ZR-FXE:1800:hybrid", "car"],
  ["Toyota", "Premio", "T260", "2016", "2021", "NZT260|ZRT260", "post", "1NZ-FE:1500:petrol", "car"],
  ["Tata", "Xenon", "Pickup", "2012", "2020", "", "na", "2.2 DICOR:2200:diesel", "pickup"],
];

type Row = { data: Omit<ImportedVehicle, "id" | "at">; errors: string[]; warnings: string[]; info: string[] };

const validate = (raw: Record<string, string>[], imports: ImportedVehicle[], lang: "bn" | "en"): Row[] => {
  const t = (bn: string, en: string) => (lang === "bn" ? bn : en);
  const seen = new Set<string>();
  return raw.map((r) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const info: string[] = [];
    const make = (r.make ?? "").trim();
    const model = (r.model ?? "").trim();
    const generation = (r.generation ?? "").trim();
    const yf = Number(r.year_from);
    const yt = (r.year_to ?? "").trim() ? Number(r.year_to) : null;
    const fl = ((r.facelift ?? "").trim() || "na") as VehicleGeneration["facelift"];
    const type = ((r.type ?? "").trim() || "car") as VehicleTypeCode;
    if (!make || !model || !generation) errors.push(t("make/model/generation খালি", "make/model/generation missing"));
    if (!Number.isInteger(yf) || yf < 1950 || yf > 2035) errors.push(t("year_from ভুল", "bad year_from"));
    if (yt !== null && (!Number.isInteger(yt) || yt < yf)) errors.push(t("year_to ভুল", "bad year_to"));
    if (!["pre", "post", "na"].includes(fl)) errors.push(t("facelift হবে pre/post/na", "facelift must be pre/post/na"));
    if (!(type in VEHICLE_TYPES)) errors.push(t("type ভুল", "bad type"));
    const mk = make ? findMake(make) : null;
    const md = mk ? findModel(mk.id, model) : null;
    if (make && !mk) info.push(t("নতুন ব্র্যান্ড", "new make"));
    else if (model && !md) info.push(t("নতুন মডেল", "new model"));
    const key = `${make}|${model}|${generation}|${yf}`.toLowerCase();
    const dupBase = md && generations.some((g) => g.model_id === md.id && (g.label.toLowerCase() === generation.toLowerCase() || g.year_from === yf));
    const dupImp = imports.some((i) => `${i.make}|${i.model}|${i.generation}|${i.year_from}`.toLowerCase() === key);
    if (dupBase || dupImp) warnings.push(t("এই প্রজন্ম আগেই আছে", "generation already exists"));
    if (seen.has(key)) warnings.push(t("ফাইলে দুইবার আছে", "duplicate in file"));
    seen.add(key);
    return {
      errors, warnings, info,
      data: {
        type, make, model, generation, year_from: yf, year_to: yt, facelift: fl,
        chassis_codes: (r.chassis_codes ?? "").split(/[|;]/).map((c) => c.trim().toUpperCase()).filter(Boolean),
        engines: parseEngines(r.engines ?? ""),
      },
    };
  });
};

export function VehicleImport({ imports }: { imports: ImportedVehicle[] }) {
  const { tx, d, lang } = useT();
  const [raw, setRaw] = useState<Record<string, string>[] | null>(null);
  const [skipDup, setSkipDup] = useState(true);
  const rows = raw ? validate(raw, imports, lang) : [];
  const ok = rows.filter((r) => !r.errors.length && (!skipDup || !r.warnings.length));

  return (
    <Panel title={tx("CSV থেকে গাড়ির ডেটা ইমপোর্ট", "Import vehicles from CSV")}>
      <p className="mb-3 text-sm text-muted">
        {tx("কলাম: make, model, generation, year_from, year_to, chassis_codes (| দিয়ে আলাদা), facelift (pre/post/na), engines (কোড:সিসি:জ্বালানি | দিয়ে আলাদা), type (ঐচ্ছিক, ডিফল্ট car)", "Columns: make, model, generation, year_from, year_to, chassis_codes (| separated), facelift (pre/post/na), engines (code:cc:fuel | separated), type (optional, default car)")}
      </p>
      <CsvImport sample={SAMPLE} sampleName="vehicles-sample.csv" onRows={setRaw} />
      {raw && (
        <div className="mt-4 space-y-3">
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-xs text-muted">
                <tr>
                  {["#", "make", "model", "generation", tx("সাল", "years"), tx("চেসিস", "chassis"), tx("ইঞ্জিন", "engines"), tx("যাচাই", "check")].map((h) => (
                    <th key={h} className="whitespace-nowrap px-2 py-1.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={r.errors.length ? "bg-bad-soft/50" : r.warnings.length ? "bg-wait-soft/50" : ""}>
                    <td className="px-2 py-1.5">{d(i + 1)}</td>
                    <td className="px-2 py-1.5">{r.data.make}</td>
                    <td className="px-2 py-1.5">{r.data.model}</td>
                    <td className="px-2 py-1.5">{r.data.generation}</td>
                    <td className="whitespace-nowrap px-2 py-1.5">{d(r.data.year_from || 0)}–{r.data.year_to ? d(r.data.year_to) : tx("এখন", "now")}</td>
                    <td className="px-2 py-1.5 text-xs">{r.data.chassis_codes.join(", ")}</td>
                    <td className="px-2 py-1.5 text-xs">{r.data.engines.map((e) => e.code).join(", ")}</td>
                    <td className="space-x-1 px-2 py-1.5">
                      {r.errors.map((e) => <StatusPill key={e} tone="bad">{e}</StatusPill>)}
                      {r.warnings.map((e) => <StatusPill key={e} tone="wait">{e}</StatusPill>)}
                      {r.info.map((e) => <StatusPill key={e} tone="info">{e}</StatusPill>)}
                      {!r.errors.length && !r.warnings.length && !r.info.length && <StatusPill tone="ok">{tx("ঠিক আছে", "OK")}</StatusPill>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Toggle checked={skipDup} onChange={setSkipDup} label={tx("আগে থেকে থাকা প্রজন্ম বাদ দিন", "Skip existing generations")} />
          <Button
            size="lg"
            variant="brand"
            disabled={!ok.length}
            onClick={() => {
              importVehicles(ok.map((r) => r.data));
              toast(tx(`${d(ok.length)}টা প্রজন্ম ইমপোর্ট হয়েছে`, `${ok.length} generations imported`));
              setRaw(null);
            }}
          >
            <Upload className="size-5" /> {tx(`${d(ok.length)}টা সারি ইমপোর্ট করুন`, `Import ${ok.length} rows`)}
          </Button>
        </div>
      )}
    </Panel>
  );
}
