"use client";

// Admin core (catalog, orders, logistics, disputes, finance, settings) helpers.
// 1) `createOverlay` — a tiny localStorage-backed store for admin-only edits of
//    static module data (categories, settings, templates…). Demo-only: the
//    customer/seller panels keep reading the static modules.
// 2) Cross-panel admin actions built on the core `update()` so money/status
//    logic stays consistent with actions.ts.
import { useRef, useSyncExternalStore } from "react";
import { settings } from "../mock/settings";
import type { CallLog, Order, StatusEvent, VendorOrder } from "../types";
import { audit, setVendorOrderStatus } from "./actions";
import { iso, uid } from "./seed";
import { getDb, update } from "./store";

// ======================================================================
// overlay store
// ======================================================================
export interface Overlay<T extends object> {
  get: () => T;
  set: (fn: (s: T) => Partial<T>) => void;
  useStore: <R>(selector: (s: T) => R) => R;
  reset: () => void;
}

export function createOverlay<T extends object>(name: string, defaults: () => T): Overlay<T> {
  const key = `gaarihub:v2:admin:${name}`;
  const serverState = defaults();
  let state: T | null = null;
  const listeners = new Set<() => void>();

  const load = (): T => {
    if (state) return state;
    try {
      const raw = localStorage.getItem(key);
      state = raw ? { ...defaults(), ...(JSON.parse(raw) as Partial<T>) } : defaults();
    } catch {
      state = defaults();
    }
    return state!;
  };
  const emit = () => listeners.forEach((l) => l());
  const set = (fn: (s: T) => Partial<T>) => {
    const cur = load();
    state = { ...cur, ...fn(cur) };
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* keep in memory */
    }
    emit();
  };
  const reset = () => {
    state = defaults();
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    emit();
  };
  const subscribe = (l: () => void) => {
    listeners.add(l);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        state = null;
        l();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(l);
      window.removeEventListener("storage", onStorage);
    };
  };

  function useStore<R>(selector: (s: T) => R): R {
    const cache = useRef<{ s: T; f: (s: T) => R; r: R } | null>(null);
    const read = (s: T) => {
      const c = cache.current;
      if (c && c.s === s && c.f === selector) return c.r;
      const r = selector(s);
      cache.current = { s, f: selector, r };
      return r;
    };
    return useSyncExternalStore(subscribe, () => read(load()), () => read(serverState));
  }

  return { get: load, set, useStore, reset };
}

// ======================================================================
// settings overlay (file 00 12.13) — every admin screen reads numbers here
// ======================================================================
export type AppSettings = typeof settings;
export const settingsOverlay = createOverlay("settings", () => ({ values: {} as Partial<AppSettings> }));

const mergeSettings = (s: { values: Partial<AppSettings> }): AppSettings => ({
  ...settings,
  ...s.values,
  feature_flags: { ...settings.feature_flags, ...(s.values.feature_flags ?? {}) },
  business_hours: { ...settings.business_hours, ...(s.values.business_hours ?? {}) },
});
export const useAdminSettings = () => settingsOverlay.useStore(mergeSettings);
export const getAdminSettings = () => mergeSettings(settingsOverlay.get());
export const setAdminSetting = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => {
  settingsOverlay.set((s) => ({ values: { ...s.values, [k]: v } }));
  audit("সেটিং পরিবর্তন", `${String(k)} = ${typeof v === "object" ? JSON.stringify(v) : String(v)}`);
};

// ======================================================================
// staff helpers
// ======================================================================
export const currentStaffId = () => getDb().session.staffId ?? "system";

export const logCall = (c: Omit<CallLog, "id" | "staff_id" | "created_at">) =>
  update((s) => ({ callLogs: [{ ...c, id: uid(), staff_id: s.session.staffId ?? "system", created_at: iso() }, ...s.callLogs] }));

const notifyCustomer = (phone: string, title: string, body: string, link: string) =>
  update((s) => ({ notifications: [{ id: uid(), audience: "customer", target: phone, title, body, link, created_at: iso(), read: false }, ...s.notifications] }));
const notifyVendor = (vendorId: string, title: string, body: string, link: string) =>
  update((s) => ({ notifications: [{ id: uid(), audience: "vendor", target: vendorId, title, body, link, created_at: iso(), read: false }, ...s.notifications] }));
export { notifyCustomer, notifyVendor };

// ======================================================================
// orders (file 03 10.1)
// ======================================================================
const subOrder = (id: string) => getDb().vendorOrders.find((v) => v.id === id)!;
const parentOf = (vo: VendorOrder) => getDb().orders.find((o) => o.id === vo.order_id)!;

/** Accept on the seller's behalf: consent note is mandatory and logged as a call. */
export const adminAcceptOnBehalf = (voId: string, consentNote: string) => {
  const vo = subOrder(voId);
  setVendorOrderStatus(voId, "accepted", "admin", `বিক্রেতার পক্ষে গ্রহণ: ${consentNote}`);
  const vendor = getDb().vendors.find((v) => v.id === vo.vendor_id);
  logCall({ phone: vendor?.owner_phone ?? "", channel: "phone_out", purpose: "বিক্রেতার পক্ষে অর্ডার গ্রহণ", ref: vo.sub_order_no, summary: consentNote });
  notifyVendor(vo.vendor_id, `${vo.sub_order_no} আপনার পক্ষে গ্রহণ করা হয়েছে`, consentNote, `/seller/orders/${voId}`);
  audit("বিক্রেতার পক্ষে অর্ডার গ্রহণ", vo.sub_order_no);
};

/** Admin status change (only valid next statuses are offered by the screen). */
export const adminSetStatus = (voId: string, to: VendorOrder["status"], note: string | null, patch: Partial<VendorOrder> = {}) => {
  const vo = subOrder(voId);
  setVendorOrderStatus(voId, to, "admin", note, patch);
  audit(`সাব-অর্ডার স্ট্যাটাস → ${to}`, vo.sub_order_no);
};

/** Cancel with reason; refund is created automatically when money was received. */
export const adminCancelSubOrder = (voId: string, reason: string) => {
  const vo = subOrder(voId);
  setVendorOrderStatus(voId, "cancelled", "admin", reason, { reject_reason: reason });
  notifyVendor(vo.vendor_id, `${vo.sub_order_no} বাতিল করা হয়েছে`, reason, `/seller/orders/${voId}`);
  audit("সাব-অর্ডার বাতিল", `${vo.sub_order_no}: ${reason}`);
};

export const fixOrderAddress = (orderId: string, patch: Partial<Order["address"]>) => {
  update((s) => ({ orders: s.orders.map((o) => (o.id === orderId ? { ...o, address: { ...o.address, ...patch } } : o)) }));
  const o = getDb().orders.find((x) => x.id === orderId)!;
  audit("ঠিকানা সংশোধন", o.order_no);
};

/** Offer the customer another seller's listing of the same master product. */
export const offerAlternative = (voId: string, listingId: string, note: string) => {
  const vo = subOrder(voId);
  const order = parentOf(vo);
  const l = getDb().listings.find((x) => x.id === listingId)!;
  notifyCustomer(order.user_phone, `${vo.sub_order_no}: বিকল্প দোকান পাওয়া গেছে`, `${l.title_bn} · ${note}`, `/l/${l.id}`);
  logCall({ phone: order.user_phone, channel: "phone_out", purpose: "বিকল্প বিক্রেতা প্রস্তাব", ref: vo.sub_order_no, summary: `${l.title_bn} (${l.id}) · ${note}` });
  audit("বিকল্প বিক্রেতা প্রস্তাব", `${vo.sub_order_no} → ${l.id}`);
};

// ======================================================================
// logistics overlay (file 03 10.2–10.3)
// ======================================================================
export interface QcRecord {
  checklist: Record<string, boolean>;
  photos: string[];
  note: string | null;
  result: "pass" | "fail";
  by: string;
  at: string;
}
export const logisticsOverlay = createOverlay("logistics", () => ({
  picked: {} as Record<string, { at: string; photo: string | null; rider_id: string | null }>,
  qc: {} as Record<string, QcRecord>,
  bookings: [] as { id: string; courier: string; vo_ids: string[]; at: string; by: string }[],
}));

/** Parcel label code the rider types/scans: the sub-order number without "GH-" and dashes. */
export const parcelCode = (vo: Pick<VendorOrder, "sub_order_no">) => vo.sub_order_no.replace(/^GH-/i, "").replace(/-/g, "").toUpperCase();
export const codeMatches = (vo: Pick<VendorOrder, "sub_order_no">, input: string) =>
  input.toUpperCase().replace(/^GH-/, "").replace(/[\s-]/g, "") === parcelCode(vo);

export const createRound = (market_area: string, slot: string, date: string, vo_ids: string[], rider_id: string | null) => {
  const id = uid();
  update((s) => ({ pickupRounds: [{ id, market_area, date, slot, rider_id, status: "planned", vendor_order_ids: vo_ids }, ...s.pickupRounds] }));
  audit("পিকআপ রাউন্ড তৈরি", `${market_area} · ${slot}`);
  return id;
};
export const patchRound = (id: string, patch: Partial<DbRound>) =>
  update((s) => ({ pickupRounds: s.pickupRounds.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
type DbRound = ReturnType<typeof getDb>["pickupRounds"][number];

export const addRider = (name: string, phone: string, area: string) => {
  update((s) => ({ riders: [...s.riders, { id: `rd-${uid()}`, name, phone, area, active: true }] }));
  audit("রাইডার যোগ", name);
};

/** Rider confirms pickup at the shop: code must match the parcel label. */
export const riderPickup = (roundId: string, voId: string, code: string, photo: string | null): boolean => {
  const vo = subOrder(voId);
  if (!codeMatches(vo, code)) return false;
  const round = getDb().pickupRounds.find((r) => r.id === roundId);
  setVendorOrderStatus(voId, "picked_up", "admin", `রাইডার পিকআপ (কোড ${parcelCode(vo)})`);
  logisticsOverlay.set((o) => ({ picked: { ...o.picked, [voId]: { at: iso(), photo, rider_id: round?.rider_id ?? null } } }));
  if (round) {
    const left = round.vendor_order_ids.filter((id) => id !== voId && getDb().vendorOrders.find((v) => v.id === id)?.status === "ready_to_ship");
    patchRound(roundId, { status: left.length ? "in_progress" : "done" });
  }
  return true;
};

/** Hub → courier: bulk booking writes courier + tracking and moves to shipped. */
export const bookCourier = (courier: string, rows: { voId: string; tracking: string }[]) => {
  rows.forEach((r) => setVendorOrderStatus(r.voId, "shipped", "admin", `${courier} ${r.tracking}`, { courier, tracking_no: r.tracking }));
  logisticsOverlay.set((o) => ({ bookings: [{ id: uid(), courier, vo_ids: rows.map((r) => r.voId), at: iso(), by: currentStaffId() }, ...o.bookings] }));
  audit("কুরিয়ার বুকিং", `${courier} · ${rows.length}`);
};

/** Assured hub QC (file 03 10.3). Pass → shipped; fail → qc_failed (refund auto if paid) + seller score note. */
export const recordQc = (voId: string, rec: Omit<QcRecord, "by" | "at">, ship?: { courier: string; tracking: string }) => {
  const vo = subOrder(voId);
  logisticsOverlay.set((o) => ({ qc: { ...o.qc, [voId]: { ...rec, by: currentStaffId(), at: iso() } } }));
  const qc = { result: rec.result, note: rec.note, at: iso() } as VendorOrder["qc"];
  if (rec.result === "pass") {
    setVendorOrderStatus(voId, "shipped", "admin", `QC পাস${ship ? ` · ${ship.courier} ${ship.tracking}` : ""}`, { qc, courier: ship?.courier ?? null, tracking_no: ship?.tracking ?? null });
  } else {
    setVendorOrderStatus(voId, "qc_failed", "admin", rec.note, { qc });
    update((s) => ({ vendors: s.vendors.map((v) => (v.id === vo.vendor_id ? { ...v, score: Math.max(0, v.score - 3) } : v)) }));
    notifyVendor(vo.vendor_id, `${vo.sub_order_no} QC-তে বাতিল`, rec.note ?? "", `/seller/orders/${voId}`);
  }
  audit(rec.result === "pass" ? "QC পাস" : "QC ফেল", vo.sub_order_no);
};

// ======================================================================
// disputes (file 03 11)
// ======================================================================
const claimEv = (from: string, to: string, note: string | null): StatusEvent => ({ from, to, actor: "admin", note, at: iso() });

export const takeClaimForReview = (claimId: string) => {
  update((s) => ({
    claims: s.claims.map((c) => (c.id === claimId && c.status !== "admin_review" ? { ...c, status: "admin_review", history: [...c.history, claimEv(c.status, "admin_review", null)] } : c)),
  }));
  audit("দাবি পর্যালোচনায় নেওয়া", getDb().claims.find((c) => c.id === claimId)?.claim_no ?? claimId);
};

/** Seller penalty from a dispute decision: wallet deduction and/or score points. */
export const penalizeVendor = (vendorId: string, amount: number, scorePoints: number, ref: string) => {
  update((s) => ({
    ledger: amount > 0 ? [{ id: uid(), vendor_id: vendorId, vendor_order_id: null, entry_type: "penalty", amount: -amount, available_at: iso(), note: `জরিমানা ${ref}`, created_at: iso() }, ...s.ledger] : s.ledger,
    vendors: scorePoints > 0 ? s.vendors.map((v) => (v.id === vendorId ? { ...v, score: Math.max(0, v.score - scorePoints) } : v)) : s.vendors,
  }));
  audit("বিক্রেতা জরিমানা", `${vendorId} · ${amount} · -${scorePoints}`);
};
