"use client";

import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import { useT } from "@/components/providers/LangProvider";
import { MakeLogo } from "@/components/shared/Misc";
import { StatusPill } from "@/components/ui/primitives";
import { VEHICLE_TYPES } from "./constants";
import { type VGen, type VType, gapTone } from "./vehicleData";

const summaryCls = "flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg px-2 hover:bg-ink/5 [&::-webkit-details-marker]:hidden";

function Count({ n }: { n: number }) {
  const { tx, d } = useT();
  return <StatusPill tone={gapTone(n)}>{n === 0 ? tx("লিস্টিং নেই", "No listings") : tx(`${d(n)} লিস্টিং`, `${n} listings`)}</StatusPill>;
}

function GenRow({ g, n }: { g: VGen; n: number }) {
  const { tx, d } = useT();
  return (
    <li className={clsx("rounded-xl border p-3", n === 0 ? "border-bad/30 bg-bad-soft/40" : n < 3 ? "border-wait-bg/50 bg-wait-soft/40" : "border-line bg-card")}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-bold">{g.label}</span>
        <span className="text-sm">{d(g.year_from)}–{g.year_to ? d(g.year_to) : tx("এখন", "now")}</span>
        {g.facelift !== "na" && <StatusPill tone="info">{g.facelift === "pre" ? tx("ফেসলিফট আগে", "Pre-facelift") : tx("ফেসলিফট পরে", "Facelift")}</StatusPill>}
        {g.imported && <StatusPill tone="wait">{tx("ইমপোর্ট করা", "imported")}</StatusPill>}
        <span className="ml-auto">
          <Count n={n} />
        </span>
      </div>
      <p className="mt-1 text-xs text-muted">
        {tx("চেসিস", "Chassis")}: {g.chassis_codes.join(", ") || "—"}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {g.engines.map((e) => (
          <span key={e.code} className="rounded-md bg-surface px-2 py-0.5 text-xs font-semibold ring-1 ring-line">
            {e.code}
            {e.cc ? ` · ${d(e.cc)}cc` : ""}
            {e.fuel ? ` · ${e.fuel}` : ""}
          </span>
        ))}
        {g.engines.length === 0 && <span className="text-xs text-muted">{tx("ইঞ্জিন নেই", "No engines")}</span>}
      </div>
    </li>
  );
}

/** Collapsible type → make → model → generation tree with listing counts per generation. */
export function VehicleTree({ tree, counts, gapsOnly, q }: { tree: VType[]; counts: Record<string, number>; gapsOnly: boolean; q: string }) {
  const { tx, L, d, lang } = useT();
  const term = q.trim().toLowerCase();
  const genOk = (g: VGen, hay: string) => (!gapsOnly || (counts[g.id] ?? 0) === 0) && (!term || `${hay} ${g.label} ${g.chassis_codes.join(" ")} ${g.engines.map((e) => e.code).join(" ")} ${g.year_from}`.toLowerCase().includes(term));

  const types = tree
    .map((t) => ({
      ...t,
      makes: t.makes
        .map((m) => ({ ...m, models: m.models.map((md) => ({ ...md, gens: md.gens.filter((g) => genOk(g, `${m.name} ${m.name_bn} ${md.name} ${md.name_bn}`)) })).filter((md) => md.gens.length > 0) }))
        .filter((m) => m.models.length > 0),
    }))
    .filter((t) => t.makes.length > 0);
  const auto = !!term || gapsOnly;

  if (!types.length) return <p className="py-8 text-center text-muted">{tx("কিছু পাওয়া যায়নি", "Nothing found")}</p>;

  return (
    <div className="space-y-2">
      {types.map((t) => {
        const tGens = t.makes.flatMap((m) => m.models.flatMap((x) => x.gens));
        return (
          <details key={t.type} open className="group rounded-2xl border border-line bg-card p-2">
            <summary className={summaryCls}>
              <ChevronRight className="size-4 transition-transform group-open:rotate-90" />
              <span className="text-lg font-bold">{L(VEHICLE_TYPES[t.type])}</span>
              <span className="text-sm text-muted">{tx(`${d(tGens.length)} প্রজন্ম`, `${tGens.length} generations`)}</span>
            </summary>
            <div className="ml-3 space-y-1 border-l border-line pl-2">
              {t.makes.map((m) => (
                <details key={m.id} open={auto} className="group/m">
                  <summary className={summaryCls}>
                    <ChevronRight className="size-4 transition-transform group-open/m:rotate-90" />
                    <MakeLogo make={m} size="sm" />
                    <span className="font-bold">{lang === "bn" ? m.name_bn : m.name}</span>
                    {m.imported && <StatusPill tone="wait">{tx("নতুন ব্র্যান্ড", "new make")}</StatusPill>}
                    <span className="text-xs text-muted">{tx(`${d(m.models.length)} মডেল`, `${m.models.length} models`)}</span>
                  </summary>
                  <div className="ml-3 space-y-1 border-l border-line pl-2">
                    {m.models.map((md) => {
                      const zero = md.gens.filter((g) => (counts[g.id] ?? 0) === 0).length;
                      return (
                        <details key={md.id} open={auto} className="group/md">
                          <summary className={summaryCls}>
                            <ChevronRight className="size-4 transition-transform group-open/md:rotate-90" />
                            <span className="font-semibold">{md.name}</span>
                            <span className="text-sm text-muted">{md.name_bn}</span>
                            {md.imported && <StatusPill tone="wait">{tx("নতুন মডেল", "new model")}</StatusPill>}
                            {zero > 0 && <StatusPill tone="bad">{tx(`${d(zero)} ঘাটতি`, `${zero} gaps`)}</StatusPill>}
                          </summary>
                          <ul className="ml-3 grid gap-2 py-1 pl-2 md:grid-cols-2">
                            {md.gens.map((g) => (
                              <GenRow key={g.id} g={g} n={counts[g.id] ?? 0} />
                            ))}
                          </ul>
                        </details>
                      );
                    })}
                  </div>
                </details>
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}
