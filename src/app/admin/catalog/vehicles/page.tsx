"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AdminPage, FilterChip, KpiCard, KpiGrid, Panel } from "@/components/admin/core";
import { useVehicleImports } from "@/components/admin/core/catalog/overlay";
import { buildVehicleTree, selectGenCounts } from "@/components/admin/core/catalog/vehicleData";
import { VehicleImport } from "@/components/admin/core/catalog/VehicleImport";
import { VehicleTree } from "@/components/admin/core/catalog/VehicleTree";
import { useT } from "@/components/providers/LangProvider";
import { engines } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";

export default function VehiclesPage() {
  const { tx, d } = useT();
  const imports = useVehicleImports();
  const counts = useDb(selectGenCounts);
  const tree = useMemo(() => buildVehicleTree(imports), [imports]);
  const [gapsOnly, setGapsOnly] = useState(false);
  const [q, setQ] = useState("");

  const gens = tree.flatMap((t) => t.makes.flatMap((m) => m.models.flatMap((md) => md.gens)));
  const makeCount = new Set(tree.flatMap((t) => t.makes.map((m) => m.id))).size;
  const modelCount = new Set(tree.flatMap((t) => t.makes.flatMap((m) => m.models.map((x) => x.id)))).size;
  const zero = gens.filter((g) => (counts[g.id] ?? 0) === 0).length;
  const low = gens.filter((g) => {
    const n = counts[g.id] ?? 0;
    return n > 0 && n < 3;
  }).length;
  const extraEngines = new Set(imports.flatMap((i) => i.engines.map((e) => e.code)).filter((c) => !engines.some((e) => e.code === c))).size;

  return (
    <AdminPage
      back="/admin/catalog"
      title={tx("গাড়ির ডেটা", "Vehicle data")}
      subtitle={tx("ধরন → ব্র্যান্ড → মডেল → প্রজন্ম → ইঞ্জিন, প্রতিটা প্রজন্মে কতগুলো লিস্টিং আছে", "Type → make → model → generation → engines, with listings per generation")}
      guide={tx(
        "লাল ঘর মানে ওই গাড়ির জন্য একটাও লিস্টিং নেই, হলুদ মানে খুব কম। এসব গাড়ির পার্টস বিক্রেতাদের দিয়ে তোলান। নতুন গাড়ির তথ্য CSV ফাইল দিয়ে নিচে ইমপোর্ট করুন, আগে নমুনা ফাইল নামিয়ে দেখুন।",
        "Red means no listings fit that generation, yellow means very few. Ask sellers to list parts for these. Import new vehicles with a CSV below; download the sample first.",
      )}
    >
      <KpiGrid>
        <KpiCard label={tx("ব্র্যান্ড", "Makes")} value={d(makeCount)} />
        <KpiCard label={tx("মডেল", "Models")} value={d(modelCount)} />
        <KpiCard label={tx("প্রজন্ম", "Generations")} value={d(gens.length)} sub={imports.length ? tx(`${d(imports.length)}টা ইমপোর্ট করা`, `${imports.length} imported`) : undefined} />
        <KpiCard label={tx("ইঞ্জিন", "Engines")} value={d(engines.length + extraEngines)} />
        <KpiCard label={tx("লিস্টিং নেই (ঘাটতি)", "No listings (gap)")} value={d(zero)} tone="bad" onClick={() => setGapsOnly(true)} active={gapsOnly} />
        <KpiCard label={tx("খুব কম লিস্টিং (১–২)", "Few listings (1–2)")} value={d(low)} tone="wait" />
      </KpiGrid>

      <Panel
        title={tx("গাড়ির ট্রি", "Vehicle tree")}
        actions={
          <>
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={tx("মডেল, চেসিস, ইঞ্জিন…", "Model, chassis, engine…")}
                className="min-h-10 w-56 max-w-full rounded-xl border border-line bg-surface pl-9 pr-3 text-sm outline-none focus:border-brand"
              />
            </label>
            <FilterChip active={gapsOnly} onClick={() => setGapsOnly((v) => !v)}>
              {tx("শুধু ঘাটতি", "Gaps only")}
            </FilterChip>
          </>
        }
      >
        <VehicleTree tree={tree} counts={counts} gapsOnly={gapsOnly} q={q} />
      </Panel>

      <VehicleImport imports={imports} />
    </AdminPage>
  );
}
