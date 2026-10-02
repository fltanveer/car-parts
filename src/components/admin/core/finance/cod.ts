// COD remittance matching (file 03 13.2): courier report rows vs sub-order COD amounts.
import type { CsvCell } from "@/components/admin/core";
import type { DB } from "@/lib/db/seed";
import type { VendorOrder } from "@/lib/types";

export type CodKind = "ok" | "short" | "returned" | "unknown" | "missing";

export interface CodResult {
  idx: number;
  kind: CodKind;
  courier: string;
  tracking: string;
  subOrderNo: string;
  vo: VendorOrder | null;
  expected: number;
  collected: number;
  fileStatus: string;
}

const HANDED: VendorOrder["status"][] = ["shipped", "delivered", "completed"];
const norm = (s: string | null | undefined) => (s ?? "").trim().toUpperCase();
const amount = (s: string | undefined) => Number(String(s ?? "").replace(/[^\d.-]/g, "")) || 0;

/** Sub-orders the courier should have collected cash for. */
export const codExpected = (s: DB) => s.vendorOrders.filter((v) => v.cod_amount > 0 && !!v.courier && HANDED.includes(v.status));

/** Sample file from real sub-orders: one fine, one short, one returned, one unknown; the last couriered one is left out (missing). */
export const codSample = (s: DB): CsvCell[][] => {
  const head = ["courier", "tracking_no", "sub_order_no", "collected_amount", "status"];
  const handed = codExpected(s);
  const others = s.vendorOrders.filter((v) => v.cod_amount > 0 && !handed.includes(v));
  const included = [...handed.slice(0, -1), ...others].slice(0, 3);
  const rows: CsvCell[][] = included.map((v, i) => {
    const courier = v.courier ?? handed[0]?.courier ?? "Pathao";
    if (i === 0) return [courier, v.tracking_no ?? "", v.sub_order_no, v.cod_amount, "delivered"];
    if (i === 1) return [courier, v.tracking_no ?? "", v.sub_order_no, Math.max(0, v.cod_amount - 200), "partial"];
    return [courier, v.tracking_no ?? "", v.sub_order_no, 0, "returned"];
  });
  rows.push([handed[0]?.courier ?? "Pathao", "PTH0000000", "GH-9999-Z", 1500, "delivered"]);
  return [head, ...rows];
};

/** Auto-match by sub-order number first (tracking numbers can repeat), then tracking number. */
export const matchCod = (s: DB, rows: Record<string, string>[]): CodResult[] => {
  const used = new Set<string>();
  const out: CodResult[] = rows.map((r, idx) => {
    const sub = norm(r.sub_order_no);
    const trk = norm(r.tracking_no);
    const vo =
      (sub && s.vendorOrders.find((v) => norm(v.sub_order_no) === sub && !used.has(v.id))) ||
      (trk && s.vendorOrders.find((v) => norm(v.tracking_no) === trk && !used.has(v.id))) ||
      null;
    if (vo) used.add(vo.id);
    const collected = amount(r.collected_amount);
    const status = (r.status ?? "").trim().toLowerCase();
    const expected = vo?.cod_amount ?? 0;
    const kind: CodKind = !vo ? "unknown" : status === "returned" ? "returned" : collected < expected ? "short" : "ok";
    return { idx, kind, courier: (r.courier ?? "").trim(), tracking: r.tracking_no ?? "", subOrderNo: r.sub_order_no ?? "", vo, expected, collected, fileStatus: status };
  });
  const couriers = new Set(out.map((r) => r.courier.toLowerCase()).filter(Boolean));
  const missing = codExpected(s)
    .filter((v) => couriers.has((v.courier ?? "").toLowerCase()) && !used.has(v.id))
    .map<CodResult>((v, i) => ({ idx: rows.length + i, kind: "missing", courier: v.courier ?? "", tracking: v.tracking_no ?? "", subOrderNo: v.sub_order_no, vo: v, expected: v.cod_amount, collected: 0, fileStatus: "" }));
  return [...out, ...missing];
};

export const codTotals = (res: CodResult[]) => {
  // Returned parcels carry no cash, so they are not expected in the remittance.
  const expected = res.filter((r) => r.vo && r.kind !== "returned").reduce((t, r) => t + r.expected, 0);
  const received = res.reduce((t, r) => t + r.collected, 0);
  const counts = { ok: 0, short: 0, returned: 0, unknown: 0, missing: 0 };
  res.forEach((r) => counts[r.kind]++);
  return { expected, received, difference: received - expected, counts };
};
