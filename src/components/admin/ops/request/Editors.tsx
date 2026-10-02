"use client";

import { Car, MapPin, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { CategoryPicker } from "@/components/shared/CategoryPicker";
import { PositionPicker } from "@/components/shared/PositionPicker";
import { VehiclePicker } from "@/components/shared/VehiclePicker";
import { Sheet } from "@/components/ui/Sheet";
import { Button, Input, Stepper } from "@/components/ui/primitives";
import { categoryPath, describeVehicle, getCategory } from "@/lib/db/queries";
import { positionLabel } from "@/lib/labels";
import type { RequestItem } from "@/lib/types";

/** Shows the chosen car and opens the VehiclePicker. */
export function VehicleField({ generationId, engineId, onChange, extra }: { generationId: string | null; engineId: string | null; onChange: (g: string | null, e: string | null) => void; extra?: React.ReactNode }) {
  const { tx } = useT();
  const [open, setOpen] = useState(false);
  const vd = describeVehicle(generationId, engineId);
  return (
    <div className="rounded-xl border-2 border-line p-3">
      <div className="flex items-center gap-3">
        <Car className="size-5 shrink-0 text-muted" />
        <p className="min-w-0 flex-1 font-semibold">{vd?.full ?? <span className="text-bad">{tx("গাড়ি সেট হয়নি", "Car not set")}</span>}</p>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          {vd ? tx("বদলান", "Change") : tx("বাছুন", "Choose")}
        </Button>
      </div>
      {extra}
      <Sheet open={open} onClose={() => setOpen(false)} title={tx("গাড়ি বাছুন", "Choose car")}>
        <VehiclePicker
          onDone={(v) => {
            onChange(v.generation_id, v.engine_id);
            setOpen(false);
          }}
        />
      </Sheet>
    </div>
  );
}

/** Multiple items: category (to item level), name, qty, position. */
export function ItemsEditor({ items, onChange }: { items: RequestItem[]; onChange: (items: RequestItem[]) => void }) {
  const { tx, lang, L } = useT();
  const [catFor, setCatFor] = useState<number | null>(null);
  const [posFor, setPosFor] = useState<number | null>(null);
  const set = (i: number, patch: Partial<RequestItem>) => onChange(items.map((x, k) => (k === i ? { ...x, ...patch } : x)));

  return (
    <div className="space-y-3">
      {items.map((it, i) => {
        const cat = getCategory(it.category_id);
        return (
          <div key={i} className="space-y-2 rounded-xl border-2 border-line p-3">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setCatFor(i)} className="flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-xl bg-surface px-3 text-left">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-ink">
                  <CategoryIcon icon={cat?.icon ?? "part"} className="size-4" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {cat ? categoryPath(cat.id).map((c) => (lang === "bn" ? c.name_bn : c.name)).join(" › ") : <span className="text-bad">{tx("ক্যাটাগরি বাছুন", "Choose category")}</span>}
                </span>
              </button>
              {items.length > 1 && (
                <button type="button" onClick={() => onChange(items.filter((_, k) => k !== i))} className="grid size-11 place-items-center rounded-xl text-bad hover:bg-bad-soft" aria-label={tx("মুছুন", "Remove")}>
                  <Trash2 className="size-5" />
                </button>
              )}
            </div>
            <Input value={it.name} onChange={(e) => set(i, { name: e.target.value })} placeholder={tx("নাম (যেমন: হেডলাইট ডান)", "Name (e.g. right headlight)")} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Stepper value={it.qty} min={1} onChange={(qty) => set(i, { qty })} />
              <Button size="sm" variant="outline" onClick={() => setPosFor(i)}>
                <MapPin className="size-4" />
                {it.position.length ? it.position.map((p) => L(positionLabel[p])).join(" · ") : tx("অবস্থান", "Position")}
              </Button>
            </div>
          </div>
        );
      })}
      <Button variant="ghost" onClick={() => onChange([...items, { category_id: null, name: "", qty: 1, position: [] }])}>
        <Plus className="size-4" /> {tx("আরেকটা আইটেম", "Add item")}
      </Button>

      <Sheet open={catFor != null} onClose={() => setCatFor(null)} title={tx("ক্যাটাগরি বাছুন", "Choose category")}>
        <CategoryPicker
          onPick={(c) => {
            if (catFor != null) set(catFor, { category_id: c.id, name: items[catFor].name || c.name_bn });
            setCatFor(null);
          }}
        />
      </Sheet>
      <Sheet open={posFor != null} onClose={() => setPosFor(null)} title={tx("কোন দিকে?", "Which side?")}>
        {posFor != null && <PositionPicker value={items[posFor].position} onChange={(position) => set(posFor, { position })} />}
        <Button full size="lg" className="mt-4" onClick={() => setPosFor(null)}>
          {tx("ঠিক আছে", "Done")}
        </Button>
      </Sheet>
    </div>
  );
}
