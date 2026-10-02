// Vehicle tree (type → make → model → generation → engines) merged from the
// static seed and CSV rows imported into the catalog overlay (file 03 §9.2).
import { enginesOf, generations, makes, models } from "@/lib/db/queries";
import type { DB } from "@/lib/db/seed";
import type { VehicleGeneration, VehicleTypeCode } from "@/lib/types";
import { VEHICLE_TYPES } from "./constants";
import type { ImportedVehicle } from "./overlay";

export interface VGen {
  id: string;
  label: string;
  year_from: number;
  year_to: number | null;
  chassis_codes: string[];
  facelift: VehicleGeneration["facelift"];
  engines: { code: string; cc: number | null; fuel: string | null }[];
  imported: boolean;
}
export interface VModel { id: string; name: string; name_bn: string; imported: boolean; gens: VGen[] }
export interface VMake { id: string; name: string; name_bn: string; color: string; imported: boolean; models: VModel[] }
export interface VType { type: VehicleTypeCode; makes: VMake[] }

const norm = (s: string) => s.trim().toLowerCase();

export const findMake = (name: string) => makes.find((m) => norm(m.name) === norm(name) || m.name_bn === name.trim()) ?? null;
export const findModel = (makeId: string, name: string) => models.find((m) => m.make_id === makeId && (norm(m.name) === norm(name) || m.name_bn === name.trim())) ?? null;

export const buildVehicleTree = (imports: ImportedVehicle[]): VType[] => {
  const out: VType[] = [];
  (Object.keys(VEHICLE_TYPES) as VehicleTypeCode[]).forEach((type) => {
    const mk: VMake[] = makes.map((m) => ({
      id: m.id, name: m.name, name_bn: m.name_bn, color: m.color, imported: false,
      models: models.filter((x) => x.make_id === m.id && x.vehicle_type_code === type).map((x) => ({
        id: x.id, name: x.name, name_bn: x.name_bn, imported: false,
        gens: generations.filter((g) => g.model_id === x.id).map((g) => ({
          ...g, imported: false,
          engines: enginesOf(g.id).map((e) => ({ code: e.code, cc: e.displacement_cc, fuel: e.fuel_type })),
        })),
      })),
    }));
    imports.filter((r) => r.type === type).forEach((r) => {
      const base = findMake(r.make);
      const makeId = base?.id ?? `imp-make:${norm(r.make)}`;
      let make = mk.find((m) => m.id === makeId);
      if (!make) {
        make = { id: makeId, name: r.make.trim(), name_bn: r.make.trim(), color: "#6b7280", imported: true, models: [] };
        mk.push(make);
      }
      const bm = base ? findModel(base.id, r.model) : null;
      const modelId = bm?.id ?? `imp-model:${makeId}:${norm(r.model)}`;
      let model = make.models.find((m) => m.id === modelId);
      if (!model) {
        model = { id: modelId, name: r.model.trim(), name_bn: bm?.name_bn ?? r.model.trim(), imported: !bm, gens: [] };
        make.models.push(model);
      }
      model.gens.push({ id: r.id, label: r.generation, year_from: r.year_from, year_to: r.year_to, chassis_codes: r.chassis_codes, facelift: r.facelift, engines: r.engines, imported: true });
    });
    const used = mk.filter((m) => m.models.length > 0);
    if (used.length) out.push({ type, makes: used });
  });
  return out;
};

/** Listings per generation (explicit generation fitments only, universal excluded). */
export const selectGenCounts = (s: DB): Record<string, number> => {
  const out: Record<string, number> = {};
  s.listings.forEach((l) => {
    if (l.is_universal || l.status === "removed") return;
    new Set(l.fitments.map((f) => f.generation_id).filter((g): g is string => !!g)).forEach((g) => {
      out[g] = (out[g] ?? 0) + 1;
    });
  });
  return out;
};

export const gapTone = (n: number) => (n === 0 ? "bad" : n < 3 ? "wait" : "ok") as "bad" | "wait" | "ok";

/** Parse "1NZ-FE:1500:petrol|2ZR-FE:1800" into engine rows. */
export const parseEngines = (s: string) =>
  s
    .split(/[|;]/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => {
      const [code, cc, fuel] = x.split(":").map((y) => y.trim());
      const n = Number(cc);
      return { code, cc: cc && !Number.isNaN(n) ? n : null, fuel: fuel || null };
    });
