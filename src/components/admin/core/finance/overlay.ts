"use client";

// Finance (file 03 §13): admin-only state lives in an overlay (COD remittance
// batches, pending ledger adjustments, payout batches, refund notes, payout
// holds). Money that other panels must see is written to the main DB via
// `update()` (ledger, payouts, refunds, orders), consistent with actions.ts.
import { audit } from "@/lib/db/actions";
import { createOverlay, currentStaffId, getAdminSettings, notifyCustomer, notifyVendor } from "@/lib/db/actions-admin-core";
import { iso, uid } from "@/lib/db/seed";
import { getDb, update } from "@/lib/db/store";
import type { LedgerEntry, Order, Payout } from "@/lib/types";

export interface CodBatch {
  id: string;
  period: string;
  courier: string;
  expected: number;
  received: number;
  difference: number;
  status: "matched" | "mismatch" | "resolved";
  counts: { ok: number; short: number; returned: number; unknown: number; missing: number };
  file_name: string | null;
  by: string;
  at: string;
}

export interface PendingAdjustment {
  id: string;
  vendor_id: string;
  amount: number;
  reason: string;
  created_by: string;
  created_at: string;
  status: "pending" | "approved" | "rejected";
  decided_by: string | null;
  decided_at: string | null;
  decision_note: string | null;
}

export interface PayoutBatch {
  id: string;
  reference: string;
  items: { vendor_id: string; amount: number; payout_id: string }[];
  total: number;
  by: string;
  at: string;
}

export interface RefundNote {
  text: string;
  by: string;
  at: string;
}

export const financeOverlay = createOverlay("finance", () => ({
  codBatches: [] as CodBatch[],
  adjustments: [] as PendingAdjustment[],
  payoutBatches: [] as PayoutBatch[],
  refundNotes: {} as Record<string, RefundNote[]>,
  payoutHolds: {} as Record<string, { reason: string; by: string; at: string }>,
}));

// ======================================================================
// pure helpers
// ======================================================================
/** Legal cap for manual bKash/Nagad advance, recomputed with the admin settings overlay. */
export const manualAdvanceCap = (total: number, percent: number) => Math.floor((total * percent) / 100);

/** How a refund must go back: the channel the money came in through (file 03 13.3). */
export type RefundChannel = { kind: "gateway" } | { kind: "manual"; method: "bkash_manual" | "nagad_manual"; sender: string | null; trx: string | null } | { kind: "cod_not_collected" } | { kind: "cod_collected" };

export const refundChannel = (order: Order | null): RefundChannel => {
  if (!order) return { kind: "cod_not_collected" };
  const verified = order.payments.filter((p) => p.status === "verified" || p.status === "refunded");
  const gw = verified.find((p) => p.method === "gateway");
  if (gw) return { kind: "gateway" };
  const manual = verified.find((p) => p.method === "bkash_manual" || p.method === "nagad_manual");
  if (manual) return { kind: "manual", method: manual.method as "bkash_manual" | "nagad_manual", sender: manual.sender_number, trx: manual.transaction_id };
  if (verified.some((p) => p.method === "cod")) return { kind: "cod_collected" };
  return { kind: "cod_not_collected" };
};

const staffName = (id: string) => getDb().staff.find((s) => s.id === id)?.name ?? id;
export const isSuperAdmin = (staffId: string | null) => !!getDb().staff.find((s) => s.id === staffId)?.roles.includes("super_admin");

const ledgerEntry = (vendor_id: string, entry_type: LedgerEntry["entry_type"], amount: number, note: string): LedgerEntry => ({
  id: uid(), vendor_id, vendor_order_id: null, entry_type, amount, available_at: iso(), note, created_at: iso(),
});

// ======================================================================
// payments (13.1)
// ======================================================================
export const notifyPaymentResult = (orderId: string, ok: boolean, reason?: string) => {
  const o = getDb().orders.find((x) => x.id === orderId);
  if (!o) return;
  notifyCustomer(
    o.user_phone,
    ok ? `${o.order_no}: পেমেন্ট যাচাই হয়েছে` : `${o.order_no}: পেমেন্ট মেলেনি`,
    ok ? "আপনার bKash/Nagad পেমেন্ট পাওয়া গেছে। দোকান এখন পাঠাবে।" : `কারণ: ${reason ?? ""}। সঠিক Transaction ID দিয়ে আবার জমা দিন বা হেল্পলাইনে কল করুন।`,
    `/my/orders/${o.id}`,
  );
};

// ======================================================================
// COD remittance (13.2)
// ======================================================================
export const saveCodBatch = (b: Omit<CodBatch, "id" | "by" | "at">) => {
  financeOverlay.set((o) => ({ codBatches: [{ ...b, id: uid(), by: currentStaffId(), at: iso() }, ...o.codBatches] }));
  audit("COD রেমিট্যান্স ব্যাচ সংরক্ষণ", `${b.courier} · ${b.period} · পার্থক্য ${b.difference}`);
};

export const resolveCodBatch = (id: string, note: string) => {
  financeOverlay.set((o) => ({ codBatches: o.codBatches.map((b) => (b.id === id ? { ...b, status: "resolved" } : b)) }));
  audit("COD গরমিল মীমাংসা", `${id}: ${note}`);
};

// ======================================================================
// refunds (13.3)
// ======================================================================
export const addRefundNote = (refundId: string, text: string) =>
  financeOverlay.set((o) => ({ refundNotes: { ...o.refundNotes, [refundId]: [...(o.refundNotes[refundId] ?? []), { text, by: currentStaffId(), at: iso() }] } }));

export const markRefundProcessing = (refundId: string) => {
  update((s) => ({ refunds: s.refunds.map((r) => (r.id === refundId && r.status === "pending" ? { ...r, status: "processing" } : r)) }));
  addRefundNote(refundId, "প্রক্রিয়া শুরু");
  const r = getDb().refunds.find((x) => x.id === refundId);
  const o = getDb().orders.find((x) => x.id === r?.order_id);
  audit("রিফান্ড প্রক্রিয়া শুরু", `${o?.order_no ?? r?.order_id} · ${r?.amount}`);
};

export const COD_NOT_COLLECTED = "COD-NOT-COLLECTED";

/** Refund sent: reference recorded, order payment status updated, customer told. */
export const completeRefund = (refundId: string, reference: string, withoutMoney = false) => {
  const s0 = getDb();
  const r = s0.refunds.find((x) => x.id === refundId);
  if (!r) return;
  update((s) => {
    const refunds = s.refunds.map((x) => (x.id === refundId ? { ...x, status: "done" as const, processed_at: iso(), reference } : x));
    return {
      refunds,
      orders: withoutMoney
        ? s.orders
        : s.orders.map((o) => {
            if (o.id !== r.order_id) return o;
            const paid = o.payments.filter((p) => p.status === "verified" || p.status === "refunded").reduce((t, p) => t + p.amount, 0);
            const refunded = refunds.filter((x) => x.order_id === o.id && x.status === "done" && x.reference !== COD_NOT_COLLECTED).reduce((t, x) => t + x.amount, 0);
            return { ...o, payment_status: refunded >= paid && paid > 0 ? "refunded" : "partially_refunded" };
          }),
    };
  });
  addRefundNote(refundId, withoutMoney ? "টাকা নেওয়া হয়নি, শুধু বাতিল" : `পাঠানো হয়েছে · রেফারেন্স ${reference}`);
  const o = getDb().orders.find((x) => x.id === r.order_id);
  if (o) {
    notifyCustomer(
      o.user_phone,
      withoutMoney ? `${o.order_no}: অর্ডার বাতিল হয়েছে` : `${o.order_no}: টাকা ফেরত পাঠানো হয়েছে`,
      withoutMoney ? "আপনার কাছ থেকে টাকা নেওয়া হয়নি, তাই ফেরতের কিছু নেই।" : `৳ ${r.amount} · রেফারেন্স ${reference}`,
      `/my/orders/${o.id}`,
    );
  }
  audit(withoutMoney ? "রিফান্ড বন্ধ (COD টাকা নেওয়া হয়নি)" : "রিফান্ড সম্পন্ন", `${o?.order_no ?? r.order_id} · ${r.amount} · ${reference}`);
};

// ======================================================================
// payouts (13.4)
// ======================================================================
export const setPayoutHold = (vendorId: string, hold: boolean, reason: string) => {
  financeOverlay.set((o) => {
    const next = { ...o.payoutHolds };
    if (hold) next[vendorId] = { reason, by: currentStaffId(), at: iso() };
    else delete next[vendorId];
    return { payoutHolds: next };
  });
  const v = getDb().vendors.find((x) => x.id === vendorId);
  audit(hold ? "পেআউট আটকানো" : "পেআউট চালু", `${v?.shop_name ?? vendorId}${reason ? ` · ${reason}` : ""}`);
};

/** Weekly batch paid: one payout + one ledger debit per seller, SMS, audit. */
export const payBatch = (items: { vendor_id: string; amount: number; method_id: string }[], reference: string) => {
  const rows = items.map((it) => ({ ...it, payout_id: uid() }));
  update((s) => ({
    payouts: [
      ...rows.map<Payout>((it) => ({ id: it.payout_id, vendor_id: it.vendor_id, amount: it.amount, method_id: it.method_id, status: "paid", reference, created_at: iso(), paid_at: iso() })),
      ...s.payouts,
    ],
    ledger: [...rows.map((it) => ledgerEntry(it.vendor_id, "payout_debit", -it.amount, `পেআউট ${reference}`)), ...s.ledger],
  }));
  rows.forEach((it) => notifyVendor(it.vendor_id, "পেআউট পাঠানো হয়েছে", `৳ ${it.amount} · রেফারেন্স ${reference}`, "/seller/money"));
  financeOverlay.set((o) => ({
    payoutBatches: [{ id: uid(), reference, items: rows.map(({ vendor_id, amount, payout_id }) => ({ vendor_id, amount, payout_id })), total: rows.reduce((t, r) => t + r.amount, 0), by: currentStaffId(), at: iso() }, ...o.payoutBatches],
  }));
  audit("পেআউট ব্যাচ পরিশোধ", `${reference} · ${rows.length} বিক্রেতা · ৳ ${rows.reduce((t, r) => t + r.amount, 0)}`);
};

export const approvePayoutRequest = (payoutId: string) => {
  update((s) => ({ payouts: s.payouts.map((p) => (p.id === payoutId && p.status === "requested" ? { ...p, status: "processing" } : p)) }));
  const p = getDb().payouts.find((x) => x.id === payoutId);
  if (p) notifyVendor(p.vendor_id, "পেআউট অনুরোধ অনুমোদিত", `৳ ${p.amount} · শিগগির পাঠানো হবে`, "/seller/money");
  audit("পেআউট অনুরোধ অনুমোদন", `${p?.vendor_id} · ${p?.amount}`);
};

export const payPayoutRequest = (payoutId: string, reference: string) => {
  const p = getDb().payouts.find((x) => x.id === payoutId);
  if (!p) return;
  update((s) => ({
    payouts: s.payouts.map((x) => (x.id === payoutId ? { ...x, status: "paid", reference, paid_at: iso() } : x)),
    ledger: [ledgerEntry(p.vendor_id, "payout_debit", -p.amount, `পেআউট ${reference}`), ...s.ledger],
  }));
  notifyVendor(p.vendor_id, "পেআউট পাঠানো হয়েছে", `৳ ${p.amount} · রেফারেন্স ${reference}`, "/seller/money");
  audit("পেআউট পরিশোধ", `${p.vendor_id} · ${p.amount} · ${reference}`);
};

export const rejectPayoutRequest = (payoutId: string, reason: string) => {
  update((s) => ({ payouts: s.payouts.map((x) => (x.id === payoutId ? { ...x, status: "failed", reference: `বাতিল: ${reason}` } : x)) }));
  const p = getDb().payouts.find((x) => x.id === payoutId);
  if (p) notifyVendor(p.vendor_id, "পেআউট অনুরোধ বাতিল", reason, "/seller/money");
  audit("পেআউট অনুরোধ বাতিল", `${p?.vendor_id} · ${reason}`);
};

// ======================================================================
// ledger adjustments (13.5): creator + a different super_admin
// ======================================================================
export const proposeAdjustment = (vendorId: string, amount: number, reason: string) => {
  const by = currentStaffId();
  financeOverlay.set((o) => ({
    adjustments: [{ id: uid(), vendor_id: vendorId, amount, reason, created_by: by, created_at: iso(), status: "pending", decided_by: null, decided_at: null, decision_note: null }, ...o.adjustments],
  }));
  audit("লেজার সমন্বয় প্রস্তাব", `${vendorId} · ${amount} · ${reason}`);
};

export type ApproveError = "not_super" | "same_person" | "not_pending";
export const canDecideAdjustment = (a: PendingAdjustment, staffId: string | null): ApproveError | null => {
  if (a.status !== "pending") return "not_pending";
  if (staffId === a.created_by) return "same_person";
  if (!isSuperAdmin(staffId)) return "not_super";
  return null;
};

export const approveAdjustment = (id: string): ApproveError | null => {
  const a = financeOverlay.get().adjustments.find((x) => x.id === id);
  if (!a) return "not_pending";
  const me = getDb().session.staffId;
  const err = canDecideAdjustment(a, me);
  if (err) return err;
  update((s) => ({ ledger: [ledgerEntry(a.vendor_id, "adjustment", a.amount, `সমন্বয়: ${a.reason} (প্রস্তাব ${staffName(a.created_by)}, অনুমোদন ${staffName(me ?? "")})`), ...s.ledger] }));
  financeOverlay.set((o) => ({ adjustments: o.adjustments.map((x) => (x.id === id ? { ...x, status: "approved", decided_by: me, decided_at: iso() } : x)) }));
  notifyVendor(a.vendor_id, "ব্যালেন্স সমন্বয়", `${a.amount > 0 ? "+" : ""}৳ ${a.amount} · ${a.reason}`, "/seller/money");
  audit("লেজার সমন্বয় অনুমোদন", `${a.vendor_id} · ${a.amount} · ${a.reason}`);
  return null;
};

export const rejectAdjustment = (id: string, note: string): ApproveError | null => {
  const a = financeOverlay.get().adjustments.find((x) => x.id === id);
  if (!a) return "not_pending";
  const me = getDb().session.staffId;
  const err = canDecideAdjustment(a, me);
  if (err) return err;
  financeOverlay.set((o) => ({ adjustments: o.adjustments.map((x) => (x.id === id ? { ...x, status: "rejected", decided_by: me, decided_at: iso(), decision_note: note } : x)) }));
  audit("লেজার সমন্বয় বাতিল", `${a.vendor_id} · ${a.amount} · ${note}`);
  return null;
};

/** Business numbers for non-React callers. */
export const financeSettings = () => {
  const s = getAdminSettings();
  return { payoutMin: s.payout_min, advancePercent: s.manual_advance_max_percent };
};
