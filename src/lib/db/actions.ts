"use client";

// Core cross-panel actions (future server actions). Panel-specific helpers can
// live next to their screens and call `update` directly, but anything that
// moves money or status between customer, seller and admin belongs here so the
// three panels stay consistent.
import { settings } from "../mock/settings";
import {
  acceptBy, commissionFor, deliverBy, handoverBy, isManualAdvanceAllowed, maskContactInfo, pickupCode, returnWindowEnds, scoreQuotes,
  subOrderDeliveryCharge,
} from "../rules";
import type {
  Address, AppNotification, ChatMessage, ChatThread, Claim, ClaimType, Fulfillment, Listing, MediaItem, Order, OrderItem, PartRequest,
  PaymentMethod, Quote, StatusEvent, UserVehicle, Vendor, VendorOrder, VendorOrderStatus, VoiceNote,
} from "../types";
import { describeVehicle, fitsVehicle, getCategory, listingById, matchVendors, vendorById } from "./queries";
import { DAY, HOUR, iso, uid, type DB } from "./seed";
import { getDb, update } from "./store";

export { uid };

const ev = (from: string | null, to: string, actor: StatusEvent["actor"], note: string | null = null): StatusEvent => ({ from, to, actor, note, at: iso() });

const notify = (s: DB, n: Omit<AppNotification, "id" | "created_at" | "read">): AppNotification[] => [
  { ...n, id: uid(), created_at: iso(), read: false },
  ...s.notifications,
];

export const audit = (action: string, target: string) =>
  update((s) => ({ audit: [{ id: uid(), staff_id: s.session.staffId ?? "system", action, target, at: iso() }, ...s.audit] }));

// ======================================================================
// session & prefs
// ======================================================================
export const loginCustomer = (phone: string) =>
  update((s) => ({
    session: { ...s.session, customerPhone: phone },
    profiles: s.profiles.some((p) => p.phone === phone)
      ? s.profiles
      : [...s.profiles, { phone, full_name: null, customer_type: "personal", large_text: false, force_advance: false, is_blocked: false, followed_vendor_ids: [], notify_sms: true }],
  }));
export const logoutCustomer = () => update((s) => ({ session: { ...s.session, customerPhone: null } }));
export const switchVendor = (vendorId: string | null) => update((s) => ({ session: { ...s.session, vendorId } }));
export const switchStaff = (staffId: string | null) => update((s) => ({ session: { ...s.session, staffId } }));
export const setPrefs = (p: Partial<DB["prefs"]>) => update((s) => ({ prefs: { ...s.prefs, ...p } }));
export const markSeenVoiceNotice = () => update(() => ({ seenVoiceNotice: true }));
export const markNotificationsRead = (audience: AppNotification["audience"], target: string) =>
  update((s) => ({ notifications: s.notifications.map((n) => (n.audience === audience && n.target === target ? { ...n, read: true } : n)) }));

// ======================================================================
// customer: garage
// ======================================================================
export const addVehicle = (v: Partial<UserVehicle> & { generation_id: string | null }) => {
  const id = uid();
  update((s) => {
    const owner = s.session.customerPhone ?? "guest";
    const mine = s.vehicles.filter((x) => x.owner === owner);
    const vehicle: UserVehicle & { owner: string } = {
      id, owner, engine_id: null, chassis_number: null, registration_no: null, nickname: null, color: null, odometer_km: null,
      is_primary: mine.length === 0, needs_admin_setup: false, papers_photo_url: null, service_logs: [], expenses: [], drivers: [],
      documents: (["registration", "tax_token", "fitness", "insurance", "route_permit", "driving_license"] as const).map((doc_type) => ({ id: uid(), doc_type, expires_on: null, file_url: null, status: "missing" as const })),
      ...v,
    };
    return {
      vehicles: [...s.vehicles, vehicle],
      activeVehicleId: id,
      garageTasks: v.needs_admin_setup
        ? [{ id: uid(), user_phone: owner, user_vehicle_id: id, kind: "setup_from_papers", doc_type: "registration", status: "open", created_at: iso() }, ...s.garageTasks]
        : s.garageTasks,
    };
  });
  return id;
};
export const updateVehicle = (id: string, patch: Partial<UserVehicle>) =>
  update((s) => ({ vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)) }));
export const removeVehicle = (id: string) =>
  update((s) => ({ vehicles: s.vehicles.filter((v) => v.id !== id), activeVehicleId: s.activeVehicleId === id ? null : s.activeVehicleId }));
export const setActiveVehicle = (id: string | null) => update(() => ({ activeVehicleId: id }));

// ======================================================================
// customer: addresses, follows, cart
// ======================================================================
export const saveAddress = (a: Omit<Address, "id"> & { id?: string }) => {
  const id = a.id ?? uid();
  update((s) => {
    const owner = s.session.customerPhone ?? "guest";
    const rest = s.addresses.filter((x) => x.id !== id).map((x) => (a.is_default && x.owner === owner ? { ...x, is_default: false } : x));
    return { addresses: [...rest, { ...a, id, owner }] };
  });
  return id;
};
export const deleteAddress = (id: string) => update((s) => ({ addresses: s.addresses.filter((a) => a.id !== id) }));

export const toggleFollow = (vendorId: string) =>
  update((s) => ({
    profiles: s.profiles.map((p) =>
      p.phone === s.session.customerPhone
        ? { ...p, followed_vendor_ids: p.followed_vendor_ids.includes(vendorId) ? p.followed_vendor_ids.filter((x) => x !== vendorId) : [...p.followed_vendor_ids, vendorId] }
        : p,
    ),
  }));

export const addToCart = (line: { listing_id?: string; quote_id?: string }, qty = 1) =>
  update((s) => {
    const key = (l: DB["cart"][number]) => (line.listing_id ? l.listing_id === line.listing_id : l.quote_id === line.quote_id);
    const existing = s.cart.find(key);
    return {
      cart: existing
        ? s.cart.map((l) => (key(l) ? { ...l, qty: l.qty + qty } : l))
        : [...s.cart, { listing_id: line.listing_id ?? null, quote_id: line.quote_id ?? null, qty }],
    };
  });
export const setCartQty = (index: number, qty: number) =>
  update((s) => ({ cart: qty <= 0 ? s.cart.filter((_, i) => i !== index) : s.cart.map((l, i) => (i === index ? { ...l, qty } : l)) }));
export const clearCart = () => update(() => ({ cart: [] }));

// ======================================================================
// requests & quotes
// ======================================================================
export interface NewRequestInput {
  phone: string;
  contact_name: string | null;
  user_vehicle_id: string | null;
  generation_id: string | null;
  engine_id: string | null;
  vehicle_text: string | null;
  description_text: string | null;
  category_id: string | null;
  voice_notes: VoiceNote[];
  photos: MediaItem[];
  preferred_source: PartRequest["preferred_source"];
  preferred_condition: PartRequest["preferred_condition"];
  needed_by: PartRequest["needed_by"];
  district: string;
  area: string;
}

export const guestRequestsToday = (phone: string) => {
  const since = Date.now() - DAY;
  return getDb().requests.filter((r) => r.user_phone === phone && new Date(r.created_at).getTime() > since).length;
};

/**
 * Clear text requests (vehicle + category chosen) broadcast straight to
 * matching sellers; voice/photo-only or vague ones go to the request desk.
 */
export const createRequest = (input: NewRequestInput): PartRequest | { error: "rate_limited" } => {
  if (guestRequestsToday(input.phone) >= settings.guest_requests_per_day) return { error: "rate_limited" };
  const s = getDb();
  const clear = !!input.generation_id && !!input.category_id && !!input.description_text && input.voice_notes.length === 0;
  const matches = clear ? matchVendors(s, [input.category_id!], input.generation_id).slice(0, 25) : [];
  const vd = describeVehicle(input.generation_id, input.engine_id);
  const cat = getCategory(input.category_id);
  const req: PartRequest = {
    id: uid(),
    request_no: `R-${s.seq.request}`,
    created_at: iso(),
    user_phone: input.phone,
    contact_name: input.contact_name,
    user_vehicle_id: input.user_vehicle_id,
    generation_id: input.generation_id,
    engine_id: input.engine_id,
    vehicle_text: input.vehicle_text,
    description_text: input.description_text,
    voice_notes: input.voice_notes,
    photos: input.photos,
    preferred_source: input.preferred_source,
    preferred_condition: input.preferred_condition,
    needed_by: input.needed_by,
    items: cat ? [{ category_id: cat.id, name: cat.name_bn, qty: 1, position: [] }] : [],
    summary_bn: clear ? `${vd?.full ?? ""}, ${input.description_text}` : null,
    clarity: clear ? "clear" : null,
    district: input.district,
    area: input.area,
    status: clear && matches.length ? "open" : "needs_clarification",
    source: input.voice_notes.length ? "web_voice" : input.photos.length && !input.description_text ? "web_photo" : "web_text",
    expires_at: iso(settings.request_expiry_hours * HOUR),
    broadcast_at: clear && matches.length ? iso() : null,
    matches: matches.map((v) => ({ vendor_id: v.id, notified_at: iso(), seen_at: null, declined: false, decline_reason: null })),
    questions: [],
    assigned_admin: null,
    accepted_quote_ids: [],
    team_searching: false,
    cancel_reason: null,
  };
  update((st) => ({
    requests: [req, ...st.requests],
    seq: { ...st.seq, request: st.seq.request + 1 },
    notifications: matches.reduce(
      (acc, v) => [{ id: uid(), audience: "vendor" as const, target: v.id, title: "নতুন দাম চাওয়া", body: `${req.summary_bn ?? ""} · ${req.district}`, link: `/seller/requests/${req.id}`, created_at: iso(), read: false }, ...acc],
      notify(st, { audience: "admin", target: "all", title: clear ? "রিকোয়েস্ট পাঠানো হয়েছে" : "রিকোয়েস্ট পরিষ্কার করতে হবে", body: req.request_no, link: `/admin/requests/${req.id}` }),
    ),
  }));
  return req;
};

export const cancelRequest = (id: string, reason: string) =>
  update((s) => ({ requests: s.requests.map((r) => (r.id === id ? { ...r, status: "cancelled", cancel_reason: reason } : r)) }));
export const extendRequest = (id: string) =>
  update((s) => ({ requests: s.requests.map((r) => (r.id === id ? { ...r, expires_at: iso(settings.request_expiry_hours * HOUR), status: r.status === "expired" ? "open" : r.status } : r)) }));

/** Request desk: write the seller-facing summary and broadcast (file 03 6.2). */
export const clarifyAndBroadcast = (id: string, patch: Pick<PartRequest, "generation_id" | "engine_id" | "items" | "summary_bn" | "clarity">, vendorIds: string[]) =>
  update((s) => ({
    requests: s.requests.map((r) =>
      r.id === id
        ? {
            ...r, ...patch, status: "open", broadcast_at: iso(), assigned_admin: s.session.staffId,
            matches: [...r.matches, ...vendorIds.filter((v) => !r.matches.some((m) => m.vendor_id === v)).map((v) => ({ vendor_id: v, notified_at: iso(), seen_at: null, declined: false, decline_reason: null }))],
          }
        : r,
    ),
    notifications: vendorIds.reduce(
      (acc, v) => [{ id: uid(), audience: "vendor" as const, target: v, title: "নতুন দাম চাওয়া", body: patch.summary_bn ?? "", link: `/seller/requests/${id}`, created_at: iso(), read: false }, ...acc],
      s.notifications,
    ),
  }));

export const markRequestSeen = (requestId: string, vendorId: string) =>
  update((s) => ({
    requests: s.requests.map((r) => (r.id === requestId ? { ...r, matches: r.matches.map((m) => (m.vendor_id === vendorId && !m.seen_at ? { ...m, seen_at: iso() } : m)) } : r)),
  }));

export const declineRequest = (requestId: string, vendorId: string, reason: string | null) =>
  update((s) => ({
    requests: s.requests.map((r) => (r.id === requestId ? { ...r, matches: r.matches.map((m) => (m.vendor_id === vendorId ? { ...m, declined: true, decline_reason: reason } : m)) } : r)),
  }));

export const askRequestQuestion = (requestId: string, vendorId: string, question: string) =>
  update((s) => {
    const r = s.requests.find((x) => x.id === requestId)!;
    return {
      requests: s.requests.map((x) => (x.id === requestId ? { ...x, questions: [...x.questions, { id: uid(), vendor_id: vendorId, question: maskContactInfo(question).masked, answer: null, asked_at: iso(), answered_at: null }] } : x)),
      notifications: notify(s, { audience: "customer", target: r.user_phone, title: "দোকান একটা প্রশ্ন করেছে", body: question, link: `/request/${requestId}` }),
    };
  });

export const answerRequestQuestion = (requestId: string, questionId: string, answer: string) =>
  update((s) => ({
    requests: s.requests.map((r) =>
      r.id === requestId ? { ...r, questions: r.questions.map((q) => (q.id === questionId ? { ...q, answer: maskContactInfo(answer).masked, answered_at: iso() } : q)) } : r,
    ),
  }));

export type QuoteInput = Omit<Quote, "id" | "request_id" | "vendor_id" | "quote_score" | "valid_until" | "status" | "withdraw_reason" | "created_at" | "delivery_charge_estimate">;

export const submitQuote = (requestId: string, vendorId: string, q: QuoteInput): Quote | { error: "limit" | "closed" } => {
  const s = getDb();
  const r = s.requests.find((x) => x.id === requestId);
  if (!r || !["open", "quotes_received"].includes(r.status)) return { error: "closed" };
  if (s.quotes.filter((x) => x.request_id === requestId && x.status === "submitted").length >= settings.max_quotes_per_request) return { error: "limit" };
  const listing = listingById(s, q.listing_id);
  const quote: Quote = {
    ...q,
    id: uid(),
    request_id: requestId,
    vendor_id: vendorId,
    note_bn: q.note_bn ? maskContactInfo(q.note_bn).masked : null,
    delivery_charge_estimate: subOrderDeliveryCharge(r.district, [listing?.size_class ?? getCategory(r.items[0]?.category_id ?? null)?.default_size_class ?? "medium"], "platform_pickup"),
    quote_score: 0,
    valid_until: r.expires_at,
    status: "submitted",
    withdraw_reason: null,
    created_at: iso(),
  };
  update((st) => {
    const all = [...st.quotes, quote];
    const scores = scoreQuotes(all.filter((x) => x.request_id === requestId), Object.fromEntries(st.vendors.map((v) => [v.id, v])));
    const first = !st.quotes.some((x) => x.request_id === requestId);
    return {
      quotes: all.map((x) => (scores.has(x.id) ? { ...x, quote_score: scores.get(x.id)! } : x)),
      requests: st.requests.map((x) => (x.id === requestId ? { ...x, status: "quotes_received" } : x)),
      notifications: first ? notify(st, { audience: "customer", target: r.user_phone, title: "প্রথম দাম এসেছে", body: `${r.request_no}: দেখে বেছে নিন`, link: `/request/${requestId}` }) : st.notifications,
    };
  });
  return quote;
};

export const withdrawQuote = (quoteId: string, reason: string) =>
  update((s) => ({ quotes: s.quotes.map((q) => (q.id === quoteId && q.status === "submitted" ? { ...q, status: "withdrawn", withdraw_reason: reason } : q)) }));

// ======================================================================
// checkout → parent order + one sub-order per vendor (file 00 8.1)
// ======================================================================
export interface CheckoutLine {
  vendor_id: string;
  listing: Listing | null;
  quote: Quote | null;
  qty: number;
}

export const lineSnapshot = (s: DB, line: CheckoutLine, generationId: string | null) => {
  const l = line.listing;
  const q = line.quote;
  const cat = getCategory(l?.category_id ?? null);
  return {
    title: l?.title_bn ?? q?.title ?? "",
    source: l?.source ?? q!.source,
    condition: l?.condition ?? q!.condition,
    grade: l?.grade ?? q?.grade ?? null,
    image: l?.media[0]?.url ?? q?.media[0] ?? "ph:part",
    warranty_days: l?.warranty_days ?? q?.warranty_days ?? 0,
    is_returnable: l?.is_returnable ?? q?.is_returnable ?? false,
    return_window_days: l?.return_window_days ?? settings.return_window_days,
    is_electrical: l?.is_electrical ?? cat?.is_electrical ?? false,
    // A quote was given for the customer's own car, so it counts as a declared fit.
    fits_user_vehicle: q ? true : l ? fitsVehicle(l.fitments, l.is_universal, generationId) : null,
  };
};

export const placeOrder = (a: {
  lines: CheckoutLine[];
  address: Address;
  customerName: string;
  fulfillment: Record<string, Fulfillment>; // per vendor
  paymentMethod: PaymentMethod;
  advance: number;
  userVehicleId: string | null;
  source: Order["source"];
}): Order | { error: "advance_cap" } => {
  const s = getDb();
  const phone = s.session.customerPhone ?? a.address.phone;
  const genId = s.vehicles.find((v) => v.id === a.userVehicleId)?.generation_id ?? null;
  const byVendor = new Map<string, CheckoutLine[]>();
  a.lines.forEach((l) => byVendor.set(l.vendor_id, [...(byVendor.get(l.vendor_id) ?? []), l]));
  const orderId = uid();
  const orderNo = `GH-${s.seq.order}`;
  const now = Date.now();
  const letters = "ABCDEFGHIJ";
  const vendorOrders: VendorOrder[] = [...byVendor.entries()].map(([vendorId, lines], i) => {
    const vendor = vendorById(s, vendorId)!;
    const fulfillment = a.fulfillment[vendorId] ?? "platform_pickup";
    const items: OrderItem[] = lines.map((l) => {
      const unit = l.listing?.price ?? l.quote!.price;
      return { id: uid(), listing_id: l.listing?.id ?? null, quote_id: l.quote?.id ?? null, snapshot: lineSnapshot(s, l, genId), unit_price: unit, qty: l.qty, line_total: unit * l.qty };
    });
    const subtotal = items.reduce((t, x) => t + x.line_total, 0);
    const delivery = subOrderDeliveryCharge(a.address.district, lines.map((l) => l.listing?.size_class ?? "medium"), fulfillment);
    const { commission, payable } = commissionFor(vendor, subtotal);
    return {
      id: uid(), order_id: orderId, vendor_id: vendorId, sub_order_no: `${orderNo}-${letters[i]}`, status: "pending_vendor", fulfillment, items, subtotal,
      delivery_charge: delivery, commission_amount: commission, vendor_payable: payable, cod_amount: 0, courier: null, tracking_no: null,
      pickup_code: fulfillment === "store_pickup" ? pickupCode() : null, packing_photo: null, accept_by: acceptBy(now), handover_by: null, deliver_by: null,
      delivered_at: null, return_window_ends_at: null, settled_at: null, reject_reason: null, qc: null, history: [ev(null, "pending_vendor", "system")], reviewed: false,
    };
  });
  const subtotal = vendorOrders.reduce((t, v) => t + v.subtotal, 0);
  const deliveryTotal = vendorOrders.reduce((t, v) => t + v.delivery_charge, 0);
  const grand = subtotal + deliveryTotal;
  if (a.paymentMethod === "manual_advance" && !isManualAdvanceAllowed(a.advance, grand)) return { error: "advance_cap" };
  const codTotal = a.paymentMethod === "online" ? 0 : grand - a.advance;
  // Split COD across parcels proportionally (courier collects per parcel).
  vendorOrders.forEach((v) => (v.cod_amount = Math.round(((v.subtotal + v.delivery_charge) / grand) * codTotal)));
  const order: Order = {
    id: orderId, order_no: orderNo, created_at: iso(), user_phone: phone, customer_name: a.customerName, address: a.address, user_vehicle_id: a.userVehicleId,
    subtotal, delivery_total: deliveryTotal, discount_total: 0, grand_total: grand, payment_method: a.paymentMethod,
    payment_status: a.advance > 0 || a.paymentMethod === "online" ? "unpaid" : "unpaid", advance_due: a.paymentMethod === "online" ? grand : a.advance,
    source: a.source, vendor_order_ids: vendorOrders.map((v) => v.id), payments: [],
  };
  const quoteIds = a.lines.map((l) => l.quote?.id).filter(Boolean) as string[];
  update((st) => ({
    orders: [order, ...st.orders],
    vendorOrders: [...vendorOrders, ...st.vendorOrders],
    seq: { ...st.seq, order: st.seq.order + 1 },
    cart: a.source === "cart" ? [] : st.cart,
    listings: st.listings.map((l) => {
      const qty = a.lines.filter((x) => x.listing?.id === l.id).reduce((t, x) => t + x.qty, 0);
      if (!qty) return l;
      const stock = Math.max(0, l.stock_qty - qty);
      return { ...l, stock_qty: stock, sold: l.sold + qty, status: stock === 0 ? "sold_out" : l.status };
    }),
    quotes: quoteIds.length
      ? st.quotes.map((q) => {
          const req = st.quotes.find((x) => quoteIds.includes(x.id));
          if (quoteIds.includes(q.id)) return { ...q, status: "accepted" };
          if (req && q.request_id === req.request_id && q.item_index === req.item_index && q.status === "submitted") return { ...q, status: "not_selected" };
          return q;
        })
      : st.quotes,
    requests: quoteIds.length
      ? st.requests.map((r) => (st.quotes.some((q) => quoteIds.includes(q.id) && q.request_id === r.id) ? { ...r, status: "accepted", accepted_quote_ids: [...r.accepted_quote_ids, ...quoteIds] } : r))
      : st.requests,
    notifications: vendorOrders.reduce(
      (acc, v) => [{ id: uid(), audience: "vendor" as const, target: v.vendor_id, title: `নতুন অর্ডার ${v.sub_order_no}`, body: `${v.items[0].snapshot.title} · ${settings.vendor_accept_hours} ঘণ্টার মধ্যে গ্রহণ করুন`, link: `/seller/orders/${v.id}`, created_at: iso(), read: false }, ...acc],
      st.notifications,
    ),
  }));
  return order;
};

export const submitManualPayment = (orderId: string, p: { method: "bkash_manual" | "nagad_manual"; amount: number; sender: string; trx: string }) =>
  update((s) => ({
    orders: s.orders.map((o) =>
      o.id === orderId
        ? { ...o, payments: [...o.payments, { id: uid(), method: p.method, amount: p.amount, purpose: "advance", sender_number: p.sender, transaction_id: p.trx.toUpperCase(), status: "submitted", verified_by: null, created_at: iso() }] }
        : o,
    ),
  }));

/** Gateway stand-in: escrow payment succeeds immediately. */
export const payOnline = (orderId: string) =>
  update((s) => ({
    orders: s.orders.map((o) =>
      o.id === orderId
        ? { ...o, payment_status: "paid", advance_due: 0, payments: [...o.payments, { id: uid(), method: "gateway", amount: o.grand_total, purpose: "full", sender_number: null, transaction_id: `GW${Date.now().toString(36).toUpperCase()}`, status: "verified", verified_by: null, created_at: iso() }] }
        : o,
    ),
    vendorOrders: s.vendorOrders.map((v) => (v.order_id === orderId ? { ...v, cod_amount: 0, handover_by: handoverBy(Date.now()), deliver_by: deliverBy(Date.now(), s.orders.find((o) => o.id === orderId)!.address.district) } : v)),
  }));

/** Finance verifies a manual advance (file 03 13.1). */
export const verifyPayment = (orderId: string, paymentId: string, ok: boolean) => {
  update((s) => ({
    orders: s.orders.map((o) => {
      if (o.id !== orderId) return o;
      const payments = o.payments.map((p) => (p.id === paymentId ? { ...p, status: ok ? ("verified" as const) : ("rejected" as const), verified_by: s.session.staffId } : p));
      const paid = payments.filter((p) => p.status === "verified").reduce((t, p) => t + p.amount, 0);
      return { ...o, payments, payment_status: paid >= o.grand_total ? "paid" : paid > 0 ? "partial" : "unpaid", advance_due: ok ? 0 : o.advance_due };
    }),
    vendorOrders: ok
      ? s.vendorOrders.map((v) => (v.order_id === orderId && !v.handover_by ? { ...v, handover_by: handoverBy(Date.now()), deliver_by: deliverBy(Date.now(), s.orders.find((o) => o.id === orderId)!.address.district) } : v))
      : s.vendorOrders,
  }));
  audit(ok ? "পেমেন্ট যাচাই" : "পেমেন্ট বাতিল", orderId);
};

// ======================================================================
// sub-order lifecycle (file 00 13)
// ======================================================================
const NEXT: Record<VendorOrderStatus, VendorOrderStatus[]> = {
  pending_vendor: ["accepted", "rejected_by_vendor", "cancelled"],
  accepted: ["ready_to_ship", "cancelled"],
  rejected_by_vendor: [],
  ready_to_ship: ["picked_up", "shipped", "delivered", "cancelled"],
  picked_up: ["at_hub_qc", "shipped"],
  at_hub_qc: ["shipped", "qc_failed"],
  qc_failed: ["cancelled"],
  shipped: ["delivered"],
  delivered: ["completed", "return_requested"],
  cancelled: [],
  return_requested: ["returned"],
  returned: [],
  completed: [],
};
export const nextStatuses = (v: VendorOrder): VendorOrderStatus[] => {
  const n = NEXT[v.status];
  if (v.status !== "ready_to_ship") return n;
  // Only the valid hand-over for this fulfillment.
  return { vendor_ship: ["shipped"], platform_pickup: ["picked_up"], assured_hub: ["picked_up"], store_pickup: ["delivered"] }[v.fulfillment] as VendorOrderStatus[];
};

export const setVendorOrderStatus = (id: string, to: VendorOrderStatus, actor: StatusEvent["actor"], note: string | null = null, patch: Partial<VendorOrder> = {}) =>
  update((s) => {
    const vo = s.vendorOrders.find((v) => v.id === id)!;
    const order = s.orders.find((o) => o.id === vo.order_id)!;
    const extra: Partial<VendorOrder> = {};
    let ledger = s.ledger;
    if (to === "delivered") {
      extra.delivered_at = iso();
      extra.return_window_ends_at = returnWindowEnds(Date.now());
      // Escrow: seller credit becomes available after the return window (6.4).
      ledger = [
        { id: uid(), vendor_id: vo.vendor_id, vendor_order_id: vo.id, entry_type: "sale_credit", amount: vo.subtotal, available_at: extra.return_window_ends_at, note: vo.sub_order_no, created_at: iso() },
        ...(vo.commission_amount ? [{ id: uid(), vendor_id: vo.vendor_id, vendor_order_id: vo.id, entry_type: "commission_debit" as const, amount: -vo.commission_amount, available_at: extra.return_window_ends_at, note: `কমিশন ${vo.sub_order_no}`, created_at: iso() }] : []),
        ...ledger,
      ];
    }
    if (to === "completed") extra.settled_at = iso();
    const refundNeeded = (to === "rejected_by_vendor" || to === "cancelled" || to === "qc_failed") && order.payments.some((p) => p.status === "verified");
    const tone = to === "rejected_by_vendor" || to === "cancelled" || to === "qc_failed" ? "সমস্যা" : "";
    return {
      vendorOrders: s.vendorOrders.map((v) => (v.id === id ? { ...v, ...extra, ...patch, status: to, history: [...v.history, ev(v.status, to, actor, note)] } : v)),
      ledger,
      refunds: refundNeeded
        ? [{ id: uid(), order_id: order.id, vendor_order_id: id, claim_id: null, amount: Math.min(vo.subtotal + vo.delivery_charge, order.payments.filter((p) => p.status === "verified").reduce((t, p) => t + p.amount, 0)), method: "bkash", destination: order.user_phone, status: "pending", due_by: iso(settings.refund_hours_unfulfillable * HOUR), processed_at: null, reference: null, created_at: iso() }, ...s.refunds]
        : s.refunds,
      notifications: notify(s, { audience: "customer", target: order.user_phone, title: `${vo.sub_order_no}: ${tone || "অবস্থা বদলেছে"}`, body: to, link: `/my/orders/${order.id}` }),
    };
  });

export const vendorAccept = (id: string) => setVendorOrderStatus(id, "accepted", "vendor");
export const vendorReject = (id: string, reason: string) => setVendorOrderStatus(id, "rejected_by_vendor", "vendor", reason, { reject_reason: reason });
export const vendorPacked = (id: string, packingPhoto: string) => setVendorOrderStatus(id, "ready_to_ship", "vendor", null, { packing_photo: packingPhoto });
export const vendorShipped = (id: string, courier: string, trackingNo: string) => setVendorOrderStatus(id, "shipped", "vendor", null, { courier, tracking_no: trackingNo });
/** Store pickup: code must match before handing over (file 02 8.2). */
export const confirmPickupCode = (id: string, code: string) => {
  const vo = getDb().vendorOrders.find((v) => v.id === id);
  if (!vo || vo.pickup_code !== code.trim()) return false;
  setVendorOrderStatus(id, "delivered", "vendor", "পিকআপ কোড মিলেছে");
  return true;
};

// ======================================================================
// claims & reviews
// ======================================================================
export const fileClaim = (a: { vendorOrderId: string; itemId: string; type: ClaimType; description: string | null; media: MediaItem[]; voice: VoiceNote[]; liability: Claim["liability"] }) => {
  const s = getDb();
  const vo = s.vendorOrders.find((v) => v.id === a.vendorOrderId)!;
  const order = s.orders.find((o) => o.id === vo.order_id)!;
  const claim: Claim = {
    id: uid(), claim_no: `C-${s.seq.claim}`, vendor_order_id: vo.id, order_item_id: a.itemId, user_phone: order.user_phone, vendor_id: vo.vendor_id,
    type: a.type, description: a.description, media: a.media, voice_notes: a.voice, status: "vendor_review", liability: a.liability, vendor_response: null,
    vendor_respond_by: iso(settings.vendor_dispute_response_hours * HOUR), resolution: null, refund_amount: null, decision_note: null, created_at: iso(),
    history: [ev(null, "submitted", "customer"), ev("submitted", "vendor_review", "system")],
  };
  update((st) => ({
    claims: [claim, ...st.claims],
    seq: { ...st.seq, claim: st.seq.claim + 1 },
    notifications: notify(st, { audience: "vendor", target: vo.vendor_id, title: "কাস্টমার সমস্যা জানিয়েছে", body: `${vo.sub_order_no} · ${settings.vendor_dispute_response_hours} ঘণ্টার মধ্যে উত্তর দিন`, link: `/seller/claims` }),
  }));
  return claim;
};

const setClaim = (id: string, to: Claim["status"], actor: StatusEvent["actor"], patch: Partial<Claim> = {}, note: string | null = null) =>
  update((s) => ({ claims: s.claims.map((c) => (c.id === id ? { ...c, ...patch, status: to, history: [...c.history, ev(c.status, to, actor, note)] } : c)) }));

export const escalateClaim = (id: string) => setClaim(id, "escalated", "customer");
export const vendorAcceptClaim = (id: string, resolution: "refund" | "replace" | "partial_refund", amount: number | null) =>
  setClaim(id, resolution === "replace" ? "resolved_replace" : "resolved_refund", "vendor", { resolution, refund_amount: amount, vendor_response: "মেনে নিয়েছে" });
export const vendorDisputeClaim = (id: string, response: string) => setClaim(id, "vendor_disputed", "vendor", { vendor_response: response }, response);

/** Admin decision (file 03 11): money moves from escrow or the seller wallet. */
export const decideClaim = (id: string, resolution: "refund" | "replace" | "partial_refund" | "rejected", amount: number | null, note: string) => {
  const s = getDb();
  const c = s.claims.find((x) => x.id === id)!;
  const vo = s.vendorOrders.find((v) => v.id === c.vendor_order_id)!;
  update((st) => ({
    claims: st.claims.map((x) => (x.id === id ? { ...x, status: resolution === "rejected" ? "resolved_rejected" : resolution === "replace" ? "resolved_replace" : "resolved_refund", resolution, refund_amount: amount, decision_note: note, history: [...x.history, ev(x.status, "resolved", "admin", note)] } : x)),
    refunds: amount ? [{ id: uid(), order_id: vo.order_id, vendor_order_id: vo.id, claim_id: id, amount, method: "bkash", destination: c.user_phone, status: "pending", due_by: iso(settings.refund_hours_unfulfillable * HOUR), processed_at: null, reference: null, created_at: iso() }, ...st.refunds] : st.refunds,
    ledger: amount ? [{ id: uid(), vendor_id: vo.vendor_id, vendor_order_id: vo.id, entry_type: "refund_debit", amount: -amount, available_at: iso(), note: `দাবি ${c.claim_no}`, created_at: iso() }, ...st.ledger] : st.ledger,
  }));
  audit("বিরোধের সিদ্ধান্ত", c.claim_no);
};

export const submitReview = (vendorOrderId: string, rating: number, tags: string[], comment: string | null) =>
  update((s) => {
    const vo = s.vendorOrders.find((v) => v.id === vendorOrderId)!;
    const order = s.orders.find((o) => o.id === vo.order_id)!;
    return {
      reviews: [{ id: uid(), vendor_order_id: vo.id, user_name: order.customer_name, vendor_id: vo.vendor_id, listing_id: vo.items[0].listing_id, rating, tags, comment, vendor_reply: null, created_at: iso() }, ...s.reviews],
      vendorOrders: s.vendorOrders.map((v) => (v.id === vendorOrderId ? { ...v, reviewed: true } : v)),
      vendors: s.vendors.map((v) => (v.id === vo.vendor_id ? { ...v, rating_count: v.rating_count + 1, rating_avg: Math.round(((v.rating_avg * v.rating_count + rating) / (v.rating_count + 1)) * 10) / 10 } : v)),
    };
  });

// ======================================================================
// chat (numbers masked, file 00 6.3)
// ======================================================================
export const openThread = (a: { type: ChatThread["type"]; vendorId: string | null; contextType?: ChatThread["context_type"]; contextId?: string | null }) => {
  const s = getDb();
  const phone = s.session.customerPhone;
  const existing = s.threads.find((t) => t.type === a.type && t.vendor_id === a.vendorId && (a.type === "vendor_support" || t.customer_phone === phone));
  if (existing) return existing.id;
  const id = uid();
  update((st) => ({
    threads: [
      { id, type: a.type, customer_phone: phone, customer_name: st.profiles.find((p) => p.phone === phone)?.full_name ?? null, vendor_id: a.vendorId, context_type: a.contextType ?? null, context_id: a.contextId ?? null, messages: [], unread_customer: 0, unread_vendor: 0, unread_support: 0, last_message_at: iso() },
      ...st.threads,
    ],
  }));
  return id;
};

export const sendMessage = (threadId: string, sender: ChatMessage["sender"], m: Partial<ChatMessage>) => {
  const { masked, found } = m.body ? maskContactInfo(m.body) : { masked: null, found: false };
  update((s) => ({
    threads: s.threads.map((t) => {
      if (t.id !== threadId) return t;
      const msg: ChatMessage = { id: uid(), sender, type: m.type ?? "text", body: masked, contains_contact_info: found, created_at: iso(), ...m, ...(m.body ? { body: masked } : {}) };
      const warn: ChatMessage[] = found
        ? [{ id: uid(), sender: "system", type: "system", body: "নম্বর বা লিংক শেয়ার করা যায় না। অ্যাপের বাইরে কিনলে টাকা ফেরতের সুরক্ষা পাবেন না।", contains_contact_info: false, created_at: iso() }]
        : [];
      return {
        ...t,
        messages: [...t.messages, msg, ...warn],
        last_message_at: iso(),
        unread_customer: sender === "customer" ? t.unread_customer : t.unread_customer + 1,
        unread_vendor: sender === "vendor" || t.type === "customer_support" ? t.unread_vendor : t.unread_vendor + 1,
        unread_support: sender === "support" || t.type === "customer_vendor" ? t.unread_support : t.unread_support + 1,
      };
    }),
    vendors: found && sender === "vendor" ? s.vendors.map((v) => (v.id === s.threads.find((t) => t.id === threadId)?.vendor_id ? { ...v, contact_attempts: v.contact_attempts + 1 } : v)) : s.vendors,
  }));
};

export const markThreadRead = (threadId: string, who: "customer" | "vendor" | "support") =>
  update((s) => ({ threads: s.threads.map((t) => (t.id === threadId ? { ...t, [`unread_${who}`]: 0 } : t)) }));

export const requestCallback = (target_type: "vendor" | "support", target_id: string | null, context: string) =>
  update((s) => ({ callRequests: [{ id: uid(), requester_phone: s.session.customerPhone ?? "guest", target_type, target_id, context, status: "pending", created_at: iso() }, ...s.callRequests] }));

export const reportTarget = (target_type: "listing" | "vendor" | "review" | "message", target_id: string, reason: "fake" | "stolen_suspect" | "wrong_info" | "scam" | "other", details: string | null) =>
  update((s) => ({
    reports: [{ id: uid(), reporter: s.session.customerPhone ?? "guest", target_type, target_id, reason, details, status: "open", created_at: iso() }, ...s.reports],
    moderation: [{ id: uid(), target_type, target_id, reason: "reported", priority: 1, status: "open", decision_note: null, created_at: iso() }, ...s.moderation],
  }));

// ======================================================================
// seller: shop & listings
// ======================================================================
export const updateVendor = (id: string, patch: Partial<Vendor>) => update((s) => ({ vendors: s.vendors.map((v) => (v.id === id ? { ...v, ...patch } : v)) }));

export const saveListing = (l: Listing) =>
  update((s) => {
    const exists = s.listings.some((x) => x.id === l.id);
    const next = { ...l, updated_at: iso() };
    return {
      listings: exists ? s.listings.map((x) => (x.id === l.id ? next : x)) : [next, ...s.listings],
      moderation:
        !exists && l.status === "pending_review"
          ? [{ id: uid(), target_type: "listing", target_id: l.id, reason: getCategory(l.category_id)?.is_restricted ? "restricted_category" : "new_vendor", priority: 2, status: "open", decision_note: null, created_at: iso() }, ...s.moderation]
          : s.moderation,
    };
  });
export const patchListing = (id: string, patch: Partial<Listing>) =>
  update((s) => ({ listings: s.listings.map((l) => (l.id === id ? { ...l, ...patch, updated_at: iso() } : l)) }));

export const requestPayout = (vendorId: string, amount: number, methodId: string) =>
  update((s) => ({ payouts: [{ id: uid(), vendor_id: vendorId, amount, method_id: methodId, status: "requested", reference: null, created_at: iso(), paid_at: null }, ...s.payouts] }));

export const vendorReplyReview = (reviewId: string, reply: string) =>
  update((s) => ({ reviews: s.reviews.map((r) => (r.id === reviewId ? { ...r, vendor_reply: maskContactInfo(reply).masked } : r)) }));

/** New seller from onboarding (file 02 section 3). */
export const createVendor = (v: Partial<Vendor> & Pick<Vendor, "shop_name" | "shop_name_bn" | "owner_phone" | "market_area" | "vendor_types">) => {
  const id = `v-${uid()}`;
  const base = getDb().vendors[0];
  const vendor: Vendor = {
    ...base,
    id, slug: id.slice(2), owner_name: v.owner_name ?? v.shop_name_bn, logo_color: "#0e7490", address: "", district: "ঢাকা",
    specialty_makes: [], specialty_categories: [], verification_level: 0, badges: [], score: 50, rating_avg: 0, rating_count: 0, sales_count: 0,
    on_time_rate: 1, response_minutes: 60, commission_percent: settings.promo_commission_percent, accepts_requests: false, status: "onboarding",
    agreement_accepted_at: iso(), joined_at: iso(), onboarded_by: null, payout_methods: [], staff: [], description_bn: null, contact_attempts: 0,
    verifications: (["nid_front", "nid_back", "selfie", "trade_license", "shop_photo", "visit_report"] as const).map((doc_type) => ({ id: uid(), doc_type, file_url: null, status: "missing" as const, notes: null, submitted_at: null })),
    ...v,
  };
  update((s) => ({ vendors: [...s.vendors, vendor], session: { ...s.session, vendorId: id } }));
  return vendor;
};
