"use client";

// Admin ops actions (file 03: request desk, sellers, trust, customers).
// Built on the shared `update()` store; extra admin-only records that the DB
// document has no slot for (internal notes, dictionary words, payout holds,
// hidden request photos) live in a small side store below.
import { useRef, useSyncExternalStore } from "react";
import type { AppNotification, CallLog, PartRequest, UserVehicle, Vendor, VendorLead } from "../types";
import { audit, updateVendor } from "./actions";
import { iso, uid, type DB } from "./seed";
import { getDb, update } from "./store";

// ======================================================================
// side store
// ======================================================================
export interface OpsNote {
  id: string;
  target: string; // "vendor:<id>" | "customer:<phone>" | "request:<id>" | "complaint:<id>"
  text: string;
  kind: "note" | "warning" | "response" | "resolution" | "event";
  staff_id: string;
  at: string;
}
export interface DictionaryWord {
  id: string;
  heard: string;
  means: string;
  category_id: string | null;
  request_id: string | null;
  staff_id: string;
  at: string;
}
export interface OpsState {
  notes: OpsNote[];
  dictionary: DictionaryWord[];
  payoutHolds: string[];
  hiddenPhotos: Record<string, string[]>;
}

const OPS_KEY = "gaarihub:v2:ops";
const emptyOps = (): OpsState => ({ notes: [], dictionary: [], payoutHolds: [], hiddenPhotos: {} });
let ops: OpsState | null = null;
const serverOps = emptyOps();
const opsListeners = new Set<() => void>();

const loadOps = (): OpsState => {
  if (ops) return ops;
  try {
    const raw = localStorage.getItem(OPS_KEY);
    ops = raw ? { ...emptyOps(), ...(JSON.parse(raw) as OpsState) } : emptyOps();
  } catch {
    ops = emptyOps();
  }
  return ops!;
};
const opsUpdate = (fn: (s: OpsState) => Partial<OpsState>) => {
  const cur = loadOps();
  ops = { ...cur, ...fn(cur) };
  try {
    localStorage.setItem(OPS_KEY, JSON.stringify(ops));
  } catch {
    /* memory only */
  }
  opsListeners.forEach((l) => l());
};
const opsSubscribe = (l: () => void) => {
  opsListeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === OPS_KEY) {
      ops = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    opsListeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
};

export function useOps<T>(selector: (s: OpsState) => T): T {
  const cache = useRef<{ s: OpsState; f: (s: OpsState) => T; r: T } | null>(null);
  const read = (s: OpsState) => {
    const c = cache.current;
    if (c && c.s === s && c.f === selector) return c.r;
    const r = selector(s);
    cache.current = { s, f: selector, r };
    return r;
  };
  return useSyncExternalStore(opsSubscribe, () => read(loadOps()), () => read(serverOps));
}

const me = () => getDb().session.staffId ?? "system";

export const addNote = (target: string, text: string, kind: OpsNote["kind"] = "note") =>
  opsUpdate((s) => ({ notes: [{ id: uid(), target, text, kind, staff_id: me(), at: iso() }, ...s.notes] }));

export const addDictionaryWord = (w: { heard: string; means: string; category_id: string | null; request_id: string | null }) => {
  opsUpdate((s) => ({ dictionary: [{ ...w, id: uid(), staff_id: me(), at: iso() }, ...s.dictionary] }));
  if (w.request_id) addNote(`request:${w.request_id}`, `শব্দভাণ্ডার: "${w.heard}" = ${w.means}`, "event");
};

export const setPhotoHidden = (requestId: string, photoId: string, hidden: boolean) =>
  opsUpdate((s) => {
    const cur = s.hiddenPhotos[requestId] ?? [];
    return { hiddenPhotos: { ...s.hiddenPhotos, [requestId]: hidden ? [...new Set([...cur, photoId])] : cur.filter((x) => x !== photoId) } };
  });

export const setPayoutHold = (vendorId: string, hold: boolean) => {
  opsUpdate((s) => ({ payoutHolds: hold ? [...new Set([...s.payoutHolds, vendorId])] : s.payoutHolds.filter((x) => x !== vendorId) }));
  audit(hold ? "পেআউট আটকানো" : "পেআউট চালু", vendorId);
};

// ======================================================================
// helpers
// ======================================================================
export const notif = (s: DB, n: Omit<AppNotification, "id" | "created_at" | "read">): AppNotification[] => [{ ...n, id: uid(), created_at: iso(), read: false }, ...s.notifications];
const vendorName = (s: DB, id: string) => s.vendors.find((v) => v.id === id)?.shop_name_bn ?? id;

/** Create the customer profile if the phone is new (phone/WhatsApp entry). */
export const ensureProfile = (phone: string, name: string | null) =>
  update((s) =>
    s.profiles.some((p) => p.phone === phone)
      ? { profiles: name ? s.profiles.map((p) => (p.phone === phone && !p.full_name ? { ...p, full_name: name } : p)) : s.profiles }
      : { profiles: [...s.profiles, { phone, full_name: name, customer_type: "personal", large_text: false, force_advance: false, is_blocked: false, followed_vendor_ids: [], notify_sms: true }] },
  );

// ======================================================================
// calls
// ======================================================================
export const logCall = (c: { phone: string; channel: CallLog["channel"]; purpose: string; ref: string | null; summary: string; followUp?: string | null }) => {
  const id = uid();
  const summary = c.followUp ? `${c.summary} · ফলো-আপ: ${new Date(c.followUp).toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" })}` : c.summary;
  update((s) => ({ callLogs: [{ id, phone: c.phone, staff_id: me(), channel: c.channel, purpose: c.purpose, ref: c.ref, summary, created_at: iso() }, ...s.callLogs] }));
  return id;
};
export const markCallbackDone = (id: string) => update((s) => ({ callRequests: s.callRequests.map((c) => (c.id === id ? { ...c, status: "done" } : c)) }));

// ======================================================================
// request desk
// ======================================================================
const patchRequest = (id: string, patch: Partial<PartRequest>) => update((s) => ({ requests: s.requests.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));

/** clarifyAndBroadcast always sets "open"; keep "quotes_received" when quotes already exist. */
export const syncRequestStatus = (id: string) =>
  update((s) => ({
    requests: s.requests.map((r) => (r.id === id && r.status === "open" && s.quotes.some((q) => q.request_id === id && q.status === "submitted") ? { ...r, status: "quotes_received" } : r)),
  }));

export const assignRequest = (id: string, staffId: string | null) => patchRequest(id, { assigned_admin: staffId });
export const setRequestSource = (id: string, source: PartRequest["source"]) => patchRequest(id, { source });

/** Clarity says "need a call": keep it in the desk column with the note. */
export const saveClarifyDraft = (id: string, patch: Pick<PartRequest, "generation_id" | "engine_id" | "items" | "summary_bn" | "clarity">) => {
  patchRequest(id, { ...patch, assigned_admin: me() });
  addNote(`request:${id}`, "পরিষ্কার নোট সেভ", "event");
};

export const markNotFound = (id: string) => {
  update((s) => {
    const r = s.requests.find((x) => x.id === id)!;
    return {
      requests: s.requests.map((x) => (x.id === id ? { ...x, status: "not_found", team_searching: false } : x)),
      notifications: notif(s, { audience: "customer", target: r.user_phone, title: "দুঃখিত, পার্টটি পাওয়া যায়নি", body: `${r.request_no}: আমরা বাজারে খুঁজেও পাইনি। নতুন করে চাইতে পারেন।`, link: `/request/${id}` }),
    };
  });
  audit("রিকোয়েস্ট: পাওয়া যায়নি", id);
};

export const sendFieldAgentToSearch = (id: string) => {
  patchRequest(id, { team_searching: true });
  addNote(`request:${id}`, "মাঠকর্মীকে বাজারে খুঁজতে পাঠানো হয়েছে", "event");
};

export const saveVehicleToCustomer = (requestId: string, generationId: string, engineId: string | null) => {
  const s = getDb();
  const r = s.requests.find((x) => x.id === requestId);
  if (!r) return;
  if (r.user_vehicle_id && s.vehicles.some((v) => v.id === r.user_vehicle_id)) {
    update((st) => ({ vehicles: st.vehicles.map((v) => (v.id === r.user_vehicle_id ? { ...v, generation_id: generationId, engine_id: engineId, needs_admin_setup: false } : v)) }));
  } else {
    const id = createVehicleFor(r.user_phone, { generation_id: generationId, engine_id: engineId });
    patchRequest(requestId, { user_vehicle_id: id });
  }
  audit("কাস্টমারের গাড়ি সেভ", r.request_no);
};

export const createVehicleFor = (owner: string, v: Partial<UserVehicle>) => {
  const id = uid();
  update((s) => {
    const mine = s.vehicles.filter((x) => x.owner === owner);
    const vehicle: UserVehicle & { owner: string } = {
      id, owner, generation_id: null, engine_id: null, chassis_number: null, registration_no: null, nickname: null, color: null, odometer_km: null,
      is_primary: mine.length === 0, needs_admin_setup: false, papers_photo_url: null, service_logs: [], expenses: [], drivers: [],
      documents: (["registration", "tax_token", "fitness", "insurance", "route_permit", "driving_license"] as const).map((doc_type) => ({ id: uid(), doc_type, expires_on: null, file_url: null, status: "missing" as const })),
      ...v,
    };
    return { vehicles: [...s.vehicles, vehicle] };
  });
  return id;
};

/**
 * Customer agreed on the phone: accept the quote on their behalf (file 03 6.2).
 * Call note is mandatory; customer gets an SMS to confirm and pay.
 */
export const acceptQuoteOnBehalf = (quoteId: string, callNote: string) => {
  const s = getDb();
  const q = s.quotes.find((x) => x.id === quoteId);
  if (!q) return;
  const r = s.requests.find((x) => x.id === q.request_id)!;
  update((st) => ({
    quotes: st.quotes.map((x) =>
      x.id === quoteId ? { ...x, status: "accepted" } : x.request_id === q.request_id && x.item_index === q.item_index && x.status === "submitted" ? { ...x, status: "not_selected" } : x,
    ),
    requests: st.requests.map((x) => (x.id === r.id ? { ...x, status: "accepted", accepted_quote_ids: [...new Set([...x.accepted_quote_ids, quoteId])] } : x)),
    notifications: [
      ...st.quotes
        .filter((x) => x.request_id === q.request_id && x.id !== quoteId && x.status === "submitted")
        .map((x): AppNotification => ({ id: uid(), audience: "vendor", target: x.vendor_id, title: "অন্য একজন নির্বাচিত হয়েছেন", body: r.request_no, link: `/seller/requests/${r.id}`, created_at: iso(), read: false })),
      { id: uid(), audience: "vendor", target: q.vendor_id, title: "আপনার দাম গ্রহণ হয়েছে", body: `${r.request_no} · ${q.title}`, link: `/seller/requests/${r.id}`, created_at: iso(), read: false },
      ...notif(st, { audience: "customer", target: r.user_phone, title: "SMS: আপনার পক্ষে দাম গ্রহণ করা হয়েছে", body: `${q.title} · ৳${q.price}। পেমেন্ট করে অর্ডার নিশ্চিত করুন।`, link: `/request/${r.id}` }),
    ],
  }));
  logCall({ phone: r.user_phone, channel: "phone_out", purpose: "কাস্টমারের পক্ষে দাম গ্রহণ", ref: r.request_no, summary: callNote });
  audit("কাস্টমারের পক্ষে দাম গ্রহণ", `${r.request_no} · ${vendorName(s, q.vendor_id)}`);
};

// ======================================================================
// sellers
// ======================================================================
const notifyVendor = (vendorId: string, title: string, body: string, link = "/seller") =>
  update((s) => ({ notifications: notif(s, { audience: "vendor", target: vendorId, title, body, link }) }));

export const LEVEL_DOCS: Record<1 | 2 | 3, Vendor["verifications"][number]["doc_type"][]> = {
  1: ["nid_front", "nid_back", "selfie"],
  2: ["trade_license", "shop_photo"],
  3: ["visit_report"],
};

export const approveVerification = (vendorId: string, level: 1 | 2 | 3) => {
  const v = getDb().vendors.find((x) => x.id === vendorId)!;
  const docs = ([1, 2, 3] as const).filter((l) => l <= level).flatMap((l) => LEVEL_DOCS[l]);
  const badges = new Set(v.badges);
  if (level >= 2) badges.add("verified");
  if (level >= 3) badges.add("trusted");
  updateVendor(vendorId, {
    verification_level: level,
    badges: [...badges],
    accepts_requests: level >= 2,
    status: v.status === "suspended" || v.status === "closed" ? v.status : "active",
    verifications: v.verifications.map((d) => (docs.includes(d.doc_type) && d.status !== "missing" ? { ...d, status: "approved" } : d)),
  });
  notifyVendor(vendorId, "যাচাই সম্পন্ন", `আপনি এখন স্তর ${level}`, "/seller/shop");
  audit(`বিক্রেতা যাচাই: স্তর ${level}`, v.shop_name_bn);
};

export const requestMoreInfo = (vendorId: string, docTypes: Vendor["verifications"][number]["doc_type"][], reason: string) => {
  const v = getDb().vendors.find((x) => x.id === vendorId)!;
  updateVendor(vendorId, { verifications: v.verifications.map((d) => (docTypes.includes(d.doc_type) ? { ...d, status: "rejected", notes: reason } : d)) });
  notifyVendor(vendorId, "SMS: আরও তথ্য লাগবে", reason, "/seller/shop");
  audit("যাচাই: আরও তথ্য চাওয়া", `${v.shop_name_bn} · ${reason}`);
};

export const rejectVerification = (vendorId: string, reason: string) => {
  const v = getDb().vendors.find((x) => x.id === vendorId)!;
  updateVendor(vendorId, { verifications: v.verifications.map((d) => (d.status === "submitted" ? { ...d, status: "rejected", notes: reason } : d)), status: v.verification_level === 0 ? "closed" : v.status });
  notifyVendor(vendorId, "SMS: যাচাই বাতিল", reason, "/seller/shop");
  audit("যাচাই বাতিল", `${v.shop_name_bn} · ${reason}`);
};

export const setCommission = (vendorId: string, pct: number) => {
  updateVendor(vendorId, { commission_percent: pct });
  audit(`কমিশন বদল: ${pct}%`, vendorName(getDb(), vendorId));
};
export const setTier = (vendorId: string, tier: Vendor["subscription_tier"]) => {
  updateVendor(vendorId, { subscription_tier: tier });
  audit(`সাবস্ক্রিপশন: ${tier}`, vendorName(getDb(), vendorId));
};
export const toggleBadge = (vendorId: string, badge: Vendor["badges"][number]) => {
  const v = getDb().vendors.find((x) => x.id === vendorId)!;
  const on = v.badges.includes(badge);
  updateVendor(vendorId, { badges: on ? v.badges.filter((b) => b !== badge) : [...v.badges, badge] });
  audit(`ব্যাজ ${on ? "সরানো" : "যোগ"}: ${badge}`, v.shop_name_bn);
};
export const warnVendor = (vendorId: string, text: string) => {
  notifyVendor(vendorId, "⚠️ গাড়িহাব থেকে সতর্কতা", text);
  addNote(`vendor:${vendorId}`, text, "warning");
  audit("বিক্রেতাকে সতর্কতা", vendorName(getDb(), vendorId));
};
export const penalizeVendor = (vendorId: string, amount: number, reason: string, ref: string | null = null) => {
  update((s) => ({
    ledger: [{ id: uid(), vendor_id: vendorId, vendor_order_id: null, entry_type: "penalty", amount: -Math.abs(amount), available_at: iso(), note: ref ? `${reason} (${ref})` : reason, created_at: iso() }, ...s.ledger],
  }));
  notifyVendor(vendorId, "জরিমানা", `${reason} · ৳${amount}`, "/seller/money");
  audit(`জরিমানা ৳${amount}`, `${vendorName(getDb(), vendorId)} · ${reason}`);
};

/** Suspend: listings disappear from search at once (isPublic checks vendor status). */
export const suspendVendor = (vendorId: string, reason: string, activeOrders: "let_finish" | "cancel_pending") => {
  const s = getDb();
  const pending = s.vendorOrders.filter((o) => o.vendor_id === vendorId && o.status === "pending_vendor");
  updateVendor(vendorId, { status: "suspended", accepts_requests: false });
  if (activeOrders === "cancel_pending") {
    update((st) => ({
      vendorOrders: st.vendorOrders.map((o) =>
        pending.some((p) => p.id === o.id) ? { ...o, status: "cancelled", reject_reason: "বিক্রেতা স্থগিত", history: [...o.history, { from: o.status, to: "cancelled", actor: "admin", note: "বিক্রেতা স্থগিত", at: iso() }] } : o,
      ),
    }));
  }
  notifyVendor(vendorId, "দোকান স্থগিত", reason);
  addNote(`vendor:${vendorId}`, `স্থগিত: ${reason} · সক্রিয় অর্ডার: ${activeOrders === "let_finish" ? "শেষ করতে দেওয়া" : `${pending.length}টা বাতিল`}`, "warning");
  audit("বিক্রেতা স্থগিত", `${vendorName(s, vendorId)} · ${reason}`);
};
export const reactivateVendor = (vendorId: string) => {
  const v = getDb().vendors.find((x) => x.id === vendorId)!;
  updateVendor(vendorId, { status: "active", accepts_requests: v.verification_level >= 2 });
  notifyVendor(vendorId, "দোকান আবার চালু", "আপনার দোকান আবার সক্রিয়।");
  audit("বিক্রেতা পুনরায় চালু", v.shop_name_bn);
};
export const closeVendor = (vendorId: string, reason: string) => {
  updateVendor(vendorId, { status: "closed", accepts_requests: false });
  addNote(`vendor:${vendorId}`, `বন্ধ: ${reason}`, "warning");
  audit("বিক্রেতা বন্ধ", `${vendorName(getDb(), vendorId)} · ${reason}`);
};

// ---- leads ----
export const LEAD_TARGETS: Record<string, number> = { dholaikhal: 50 }; // spec 7.4 launch goal

export const addLead = (l: Pick<VendorLead, "shop_name" | "market_area" | "phone" | "specialty" | "owner_agent">) =>
  update((s) => ({ leads: [{ ...l, id: uid(), status: "new", created_at: iso() }, ...s.leads] }));
export const setLeadStatus = (id: string, status: VendorLead["status"]) => update((s) => ({ leads: s.leads.map((l) => (l.id === id ? { ...l, status } : l)) }));

// ---- field ----
export const addFieldVisit = (v: { agent_id: string; vendor_id: string | null; lead_id: string | null; purpose: "onboarding" | "verification" | "assisted_upload" | "training" | "audit"; listings_created: number; report: string | null }) => {
  update((s) => ({
    fieldVisits: [{ ...v, id: uid(), at: iso() }, ...s.fieldVisits],
    vendors: v.vendor_id && v.purpose === "verification" && v.report
      ? s.vendors.map((x) => (x.id === v.vendor_id ? { ...x, verifications: x.verifications.map((d) => (d.doc_type === "visit_report" ? { ...d, status: "submitted", file_url: "ph:doc", submitted_at: iso(), notes: v.report } : d)) } : x))
      : s.vendors,
  }));
};

