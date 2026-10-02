import { slaTone, type SlaTone } from "@/lib/rules";
import type { VendorOrder } from "@/lib/types";

export type SlaKind = "accept" | "handover" | "deliver";

export interface SlaInfo {
  kind: SlaKind;
  deadline: string;
  tone: SlaTone;
}

const HANDOVER_OPEN = new Set<VendorOrder["status"]>(["accepted", "ready_to_ship"]);
const DELIVERY_OPEN = new Set<VendorOrder["status"]>(["accepted", "ready_to_ship", "picked_up", "at_hub_qc", "shipped"]);

/** The SLA clock that currently applies to a sub-order (file 00 9.3). */
export const currentSla = (vo: VendorOrder, now: number): SlaInfo | null => {
  if (vo.status === "pending_vendor") return { kind: "accept", deadline: vo.accept_by, tone: slaTone(vo.accept_by, now, 4) };
  if (HANDOVER_OPEN.has(vo.status) && vo.handover_by) return { kind: "handover", deadline: vo.handover_by, tone: slaTone(vo.handover_by, now, 12) };
  if (DELIVERY_OPEN.has(vo.status) && vo.deliver_by) return { kind: "deliver", deadline: vo.deliver_by, tone: slaTone(vo.deliver_by, now, 24) };
  return null;
};

/** All open SLA clocks (handover and delivery can run at the same time). */
export const allSlas = (vo: VendorOrder, now: number): SlaInfo[] => {
  const out: SlaInfo[] = [];
  if (vo.status === "pending_vendor") out.push({ kind: "accept", deadline: vo.accept_by, tone: slaTone(vo.accept_by, now, 4) });
  if (HANDOVER_OPEN.has(vo.status) && vo.handover_by) out.push({ kind: "handover", deadline: vo.handover_by, tone: slaTone(vo.handover_by, now, 12) });
  if (DELIVERY_OPEN.has(vo.status) && vo.deliver_by) out.push({ kind: "deliver", deadline: vo.deliver_by, tone: slaTone(vo.deliver_by, now, 24) });
  return out;
};

export const isBreached = (vo: VendorOrder, now: number) => allSlas(vo, now).some((x) => x.tone === "late");

export const slaLabel: Record<SlaKind, { bn: string; en: string }> = {
  accept: { bn: "গ্রহণ", en: "Accept" },
  handover: { bn: "হস্তান্তর ৪৮ ঘণ্টা", en: "Handover 48h" },
  deliver: { bn: "ডেলিভারি সময়সীমা", en: "Delivery deadline" },
};

export const toneOfSla = (t: SlaTone) => (t === "late" ? "bad" : t === "warn" ? "wait" : "ok") as "bad" | "wait" | "ok";
