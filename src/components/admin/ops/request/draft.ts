import { describeVehicle, getCategory } from "@/lib/db/queries";
import { positionLabel } from "@/lib/labels";
import type { PartRequest, RequestItem } from "@/lib/types";

export interface ClarifyDraft {
  clarity: NonNullable<PartRequest["clarity"]>;
  generation_id: string | null;
  engine_id: string | null;
  items: RequestItem[];
  summary: string;
}

export const draftFrom = (r: PartRequest): ClarifyDraft => ({
  clarity: r.clarity ?? "partly",
  generation_id: r.generation_id,
  engine_id: r.engine_id,
  items: r.items.length ? r.items : [{ category_id: null, name: "", qty: 1, position: [] }],
  summary: r.summary_bn ?? "",
});

/** Seller-facing summary: car + items, never customer details. */
export const autoSummary = (d: ClarifyDraft) => {
  const car = describeVehicle(d.generation_id, d.engine_id)?.full ?? "";
  const items = d.items
    .filter((i) => i.category_id || i.name)
    .map((i) => {
      const name = i.name || getCategory(i.category_id)?.name_bn || "";
      const pos = i.position.map((p) => positionLabel[p].bn).join("/");
      return `${name}${pos ? ` (${pos})` : ""}${i.qty > 1 ? ` × ${i.qty}` : ""}`;
    })
    .join(", ");
  return [car, items].filter(Boolean).join(", ");
};

export const draftPatch = (d: ClarifyDraft) => ({
  generation_id: d.generation_id,
  engine_id: d.engine_id,
  items: d.items.filter((i) => i.category_id || i.name.trim()),
  summary_bn: d.summary.trim() || null,
  clarity: d.clarity,
});
