"use client";

// Client-side mock of everything the user owns: garage, cart, login, requests,
// orders, claims, chat. Persisted to localStorage (try/catch, spec 7.2).
// Each action maps to a future server action / Supabase call.
import { useSyncExternalStore } from "react";
import { getPartById, settings } from "./api";
import { getDeliveryQuote } from "./rules";
import type {
  Address,
  AppNotification,
  CartLine,
  ChatMessage,
  Claim,
  ClaimType,
  MediaItem,
  Order,
  OrderItem,
  OrderStatus,
  Part,
  PartRequest,
  Profile,
  Quality,
  RequestQuote,
  UserVehicle,
  VoiceNote,
} from "./types";

export interface State {
  v: number;
  bnDigits: boolean;
  vehicles: UserVehicle[];
  activeVehicleId: string | null;
  cart: CartLine[];
  profile: Profile | null;
  addresses: Address[];
  requests: PartRequest[];
  orders: Order[];
  claims: Claim[];
  chat: ChatMessage[];
  notifications: AppNotification[];
  seenVoiceNotice: boolean;
  guestRequestLog: { phone: string; at: string }[];
  seq: { request: number; order: number; claim: number };
}

const KEY = "partsbd:v1";
const HOUR = 3_600_000;
const iso = (offsetMs = 0) => new Date(Date.now() + offsetMs).toISOString();
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// Demo data so every screen has something to show on first load.
const seed = (): State => {
  const demoAddress: Address = {
    id: "ad-demo",
    recipient_name: "রাকিব হাসান",
    phone: "+8801711000000",
    division: "ঢাকা",
    district: "ঢাকা সিটি",
    area: "মিরপুর",
    address_line: "বাড়ি ১২, রোড ৩, সেকশন ১০",
    landmark: "মিরপুর ১০ গোলচত্বরের কাছে",
    is_default: true,
  };
  const quotedRequest: PartRequest = {
    id: "rq-demo",
    request_no: "R-10231",
    created_at: iso(-5 * HOUR),
    guest_phone: null,
    contact_name: "রাকিব হাসান",
    vehicle_generation_id: "gn-axio-e140",
    vehicle_text: null,
    description_text: "সামনের ডান পাশের হেডলাইট ভেঙে গেছে, পুরো সেট লাগবে",
    voice_notes: [],
    photos: [],
    preferred_qualities: null,
    preferred_contact: "call",
    preferred_call_time: "any",
    status: "quoted",
    quotes: [
      {
        id: "qt-demo-1", part_id: null, title: "হেডলাইট (ডান পাশ) Axio E140", quality: "genuine", brand: "Koito",
        price: 14500, advance_percent: 40, advance_amount: 5800, warranty_months: 6,
        sourcing_days_min: 3, sourcing_days_max: 5, valid_until: iso(30 * HOUR), status: "offered",
      },
      {
        id: "qt-demo-2", part_id: null, title: "হেডলাইট (ডান পাশ) Axio E140", quality: "aftermarket", brand: "DEPO",
        price: 7500, advance_percent: 30, advance_amount: 2250, warranty_months: 0,
        sourcing_days_min: 1, sourcing_days_max: 2, valid_until: iso(30 * HOUR), status: "offered",
      },
    ],
    order_id: null,
    cancel_reason: null,
  };
  const deliveredItems: OrderItem[] = [
    item(getPartById("bp02")!, 1),
    item(getPartById("of01")!, 2),
    item(getPartById("ic01")!, 1),
  ];
  const deliveredSubtotal = deliveredItems.reduce((s, i) => s + i.unit_price * i.qty, 0);
  const delivered: Order = {
    id: "od-demo-1", order_no: "PB-240017", created_at: iso(-4 * 24 * HOUR), order_type: "stock", status: "delivered",
    address: demoAddress, items: deliveredItems, subtotal: deliveredSubtotal, delivery_charge: 80, packing_charge: 0, discount: 0,
    total: deliveredSubtotal + 80, advance_required: 80, advance_paid: 80, cod_amount: deliveredSubtotal,
    delivery_method: "home_dhaka", courier_name: "Pathao Courier", tracking_no: "PTH8837261", rider_phone: "01799000111",
    needs_confirmation_call: false, request_id: null,
    payments: [{ id: "pm-d1", method: "bkash", amount: 80, sender_number: "01711000000", transaction_id: "9KD7X2LQ1P", status: "verified", created_at: iso(-4 * 24 * HOUR) }],
    history: [
      { status: "pending_confirmation", at: iso(-4 * 24 * HOUR) },
      { status: "confirmed", at: iso(-4 * 24 * HOUR + HOUR) },
      { status: "qc", at: iso(-3 * 24 * HOUR) },
      { status: "packed", at: iso(-3 * 24 * HOUR + 2 * HOUR) },
      { status: "shipped", at: iso(-3 * 24 * HOUR + 5 * HOUR) },
      { status: "delivered", at: iso(-20 * HOUR) },
    ],
    delivered_at: iso(-20 * HOUR),
  };
  const shippedItems = [item(getPartById("sa01")!, 2)];
  const shippedSubtotal = shippedItems.reduce((s, i) => s + i.unit_price * i.qty, 0);
  const shipped: Order = {
    id: "od-demo-2", order_no: "PB-240021", created_at: iso(-1 * 24 * HOUR), order_type: "stock", status: "shipped",
    address: demoAddress, items: shippedItems, subtotal: shippedSubtotal, delivery_charge: 120, packing_charge: 0, discount: 0,
    total: shippedSubtotal + 120, advance_required: 120, advance_paid: 120, cod_amount: shippedSubtotal,
    delivery_method: "home_dhaka", courier_name: "Steadfast", tracking_no: "SF20931877", rider_phone: "01822000333",
    needs_confirmation_call: false, request_id: null, payments: [],
    history: [
      { status: "pending_confirmation", at: iso(-24 * HOUR) },
      { status: "confirmed", at: iso(-23 * HOUR) },
      { status: "qc", at: iso(-10 * HOUR) },
      { status: "packed", at: iso(-8 * HOUR) },
      { status: "shipped", at: iso(-3 * HOUR) },
    ],
    delivered_at: null,
  };
  return {
    v: 1,
    bnDigits: true,
    vehicles: [],
    activeVehicleId: null,
    cart: [],
    profile: null,
    addresses: [demoAddress],
    requests: [quotedRequest],
    orders: [shipped, delivered],
    claims: [],
    chat: [
      { id: "cm-1", sender_type: "admin", type: "text", body: "আসসালামু আলাইকুম! PartsBD-তে স্বাগতম। কোন পার্ট লাগবে বলুন, লিখে বা ভয়েসে।", created_at: iso(-2 * 24 * HOUR) },
    ],
    notifications: [
      { id: "nt-1", title: "দাম জানানো হয়েছে", body: "রিকোয়েস্ট R-10231: ২টি অপশন দেখুন", link: "/request/rq-demo", created_at: iso(-2 * HOUR), read: false },
      { id: "nt-2", title: "অর্ডার পাঠানো হয়েছে", body: "PB-240021 · Steadfast SF20931877", link: "/orders/od-demo-2", created_at: iso(-3 * HOUR), read: false },
    ],
    seenVoiceNotice: false,
    guestRequestLog: [],
    seq: { request: 10234, order: 240022, claim: 5012 },
  };
};

function item(p: Part, qty: number, unitPrice?: number): OrderItem {
  return {
    id: uid(),
    part_id: p.id,
    quote_id: null,
    title_snapshot: p.name_bn,
    quality_snapshot: p.quality,
    unit_price: unitPrice ?? p.price ?? 0,
    qty,
    warranty_months_snapshot: p.warranty_months,
    is_returnable_snapshot: p.is_returnable,
    is_electrical_snapshot: p.is_electrical,
    return_window_days_snapshot: p.return_window_days,
  };
}

// ---------- external store plumbing ----------
let state: State | null = null;
// Deterministic snapshot for SSR + hydration; client data arrives right after.
const serverState: State = {
  v: 1, bnDigits: true, vehicles: [], activeVehicleId: null, cart: [], profile: null, addresses: [], requests: [], orders: [],
  claims: [], chat: [], notifications: [], seenVoiceNotice: true, guestRequestLog: [], seq: { request: 0, order: 0, claim: 0 },
};
const listeners = new Set<() => void>();

const load = (): State => {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? { ...seed(), ...JSON.parse(raw) } : seed();
  } catch {
    state = seed();
  }
  return state!;
};

const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked: keep in memory */
  }
};

export const setState = (fn: (s: State) => Partial<State>) => {
  const cur = load();
  state = { ...cur, ...fn(cur) };
  persist();
  listeners.forEach((l) => l());
};

export const getState = () => load();

const subscribe = (l: () => void) => {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
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

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(load()),
    () => selector(serverState),
  );
}

const noopSubscribe = () => () => {};
export const useHydrated = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

export const resetDemo = () => {
  state = seed();
  persist();
  listeners.forEach((l) => l());
};

// ---------- garage ----------
export const useActiveVehicle = () =>
  useStore((s) => s.vehicles.find((v) => v.id === s.activeVehicleId) ?? null);

export const addVehicle = (v: Omit<UserVehicle, "id" | "is_primary">) => {
  const id = uid();
  setState((s) => ({
    vehicles: [...s.vehicles, { ...v, id, is_primary: s.vehicles.length === 0 }],
    activeVehicleId: id,
  }));
  return id;
};

export const setActiveVehicle = (id: string | null) => setState(() => ({ activeVehicleId: id }));

export const setPrimaryVehicle = (id: string) =>
  setState((s) => ({ vehicles: s.vehicles.map((v) => ({ ...v, is_primary: v.id === id })) }));

export const removeVehicle = (id: string) =>
  setState((s) => {
    const vehicles = s.vehicles.filter((v) => v.id !== id);
    if (vehicles.length && !vehicles.some((v) => v.is_primary)) vehicles[0] = { ...vehicles[0], is_primary: true };
    return {
      vehicles,
      activeVehicleId: s.activeVehicleId === id ? (vehicles[0]?.id ?? null) : s.activeVehicleId,
    };
  });

// ---------- cart ----------
export const addToCart = (partId: string, qty = 1) =>
  setState((s) => {
    const line = s.cart.find((l) => l.part_id === partId);
    return {
      cart: line ? s.cart.map((l) => (l.part_id === partId ? { ...l, qty: l.qty + qty } : l)) : [...s.cart, { part_id: partId, qty }],
    };
  });

export const setCartQty = (partId: string, qty: number) =>
  setState((s) => ({
    cart: qty <= 0 ? s.cart.filter((l) => l.part_id !== partId) : s.cart.map((l) => (l.part_id === partId ? { ...l, qty } : l)),
  }));

export const clearCart = () => setState(() => ({ cart: [] }));

// ---------- auth (mock OTP: any 6 digits work, 123456 shown as hint) ----------
export const login = (phone: string) =>
  setState((s) => ({
    profile: s.profile?.phone === phone ? s.profile : { phone, full_name: null, account_type: "personal" },
    // Spec 7.14: guest requests with the same phone attach to the account.
    requests: s.requests.map((r) => (r.guest_phone === phone ? { ...r, guest_phone: null } : r)),
  }));

export const logout = () => setState(() => ({ profile: null }));

export const updateProfile = (p: Partial<Profile>) =>
  setState((s) => ({ profile: s.profile ? { ...s.profile, ...p } : s.profile }));

export const setBnDigits = (on: boolean) => setState(() => ({ bnDigits: on }));

// ---------- addresses ----------
export const saveAddress = (a: Omit<Address, "id"> & { id?: string }) => {
  const id = a.id ?? uid();
  setState((s) => {
    const rest = s.addresses.filter((x) => x.id !== id).map((x) => (a.is_default ? { ...x, is_default: false } : x));
    return { addresses: [...rest, { ...a, id }] };
  });
  return id;
};

export const deleteAddress = (id: string) => setState((s) => ({ addresses: s.addresses.filter((a) => a.id !== id) }));

// ---------- notifications ----------
const notify = (s: State, title: string, body: string, link: string): AppNotification[] => [
  { id: uid(), title, body, link, created_at: iso(), read: false },
  ...s.notifications,
];

export const markNotificationsRead = () =>
  setState((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) }));

// ---------- requests ----------
export const guestRequestsToday = (phone: string) => {
  const since = Date.now() - 24 * HOUR;
  return getState().guestRequestLog.filter((g) => g.phone === phone && new Date(g.at).getTime() > since).length;
};

export interface NewRequestInput {
  phone: string;
  contact_name: string | null;
  vehicle_generation_id: string | null;
  vehicle_text: string | null;
  description_text: string | null;
  voice_notes: VoiceNote[];
  photos: MediaItem[];
  preferred_qualities: Quality[] | null;
  preferred_contact: PartRequest["preferred_contact"];
  preferred_call_time: PartRequest["preferred_call_time"];
}

export const createRequest = (input: NewRequestInput): PartRequest | { error: "rate_limited" } => {
  const s = getState();
  const isGuest = !s.profile;
  if (isGuest && guestRequestsToday(input.phone) >= settings.guest_requests_per_day) return { error: "rate_limited" };
  const req: PartRequest = {
    id: uid(),
    request_no: `R-${s.seq.request}`,
    created_at: iso(),
    guest_phone: isGuest ? input.phone : null,
    contact_name: input.contact_name,
    vehicle_generation_id: input.vehicle_generation_id,
    vehicle_text: input.vehicle_text,
    description_text: input.description_text,
    voice_notes: input.voice_notes,
    photos: input.photos,
    preferred_qualities: input.preferred_qualities,
    preferred_contact: input.preferred_contact,
    preferred_call_time: input.preferred_call_time,
    status: "new",
    quotes: [],
    order_id: null,
    cancel_reason: null,
  };
  setState((st) => ({
    requests: [req, ...st.requests],
    seq: { ...st.seq, request: st.seq.request + 1 },
    guestRequestLog: isGuest ? [...st.guestRequestLog, { phone: input.phone, at: iso() }] : st.guestRequestLog,
    notifications: notify(st, "রিকোয়েস্ট পেয়েছি", `${req.request_no}: আমরা শিগগিরই দাম জানাবো`, `/request/${req.id}`),
  }));
  return req;
};

export const cancelRequest = (id: string, reason: string | null) =>
  setState((s) => ({
    requests: s.requests.map((r) => (r.id === id ? { ...r, status: "cancelled", cancel_reason: reason } : r)),
  }));

export const requoteRequest = (id: string) =>
  setState((s) => ({
    requests: s.requests.map((r) => (r.id === id ? { ...r, status: "searching", quotes: r.quotes.map((q) => ({ ...q, status: "expired" })) } : r)),
  }));

// Demo-only: what the admin panel will do (admin spec 6.3).
export const demoSendQuote = (id: string) =>
  setState((s) => {
    const r = s.requests.find((x) => x.id === id);
    if (!r) return {};
    const base = 2000 + Math.round(Math.random() * 6) * 500;
    const mk = (quality: Quality, brand: string, price: number, pct: number, w: number, d: [number, number]): RequestQuote => ({
      id: uid(), part_id: null, title: r.description_text?.slice(0, 40) || "আপনার চাওয়া পার্ট", quality, brand, price,
      advance_percent: pct, advance_amount: Math.round((price * pct) / 100), warranty_months: w,
      sourcing_days_min: d[0], sourcing_days_max: d[1], valid_until: iso(settings.quote_validity_hours * HOUR), status: "offered",
    });
    return {
      requests: s.requests.map((x) =>
        x.id === id
          ? { ...x, status: "quoted", quotes: [mk("genuine", "Toyota", base * 2, 40, 6, [3, 5]), mk("oem_equivalent", "Denso", base, 30, 0, [2, 4])] }
          : x,
      ),
      notifications: notify(s, "দাম জানানো হয়েছে", `${r.request_no}: ২টি অপশন দেখুন`, `/request/${id}`),
    };
  });

// ---------- orders ----------
const pushStatus = (o: Order, status: OrderStatus): Order => ({ ...o, status, history: [...o.history, { status, at: iso() }] });

export const acceptQuote = (requestId: string, quoteId: string, address: Address): Order | null => {
  const s = getState();
  const r = s.requests.find((x) => x.id === requestId);
  const q = r?.quotes.find((x) => x.id === quoteId);
  if (!r || !q) return null;
  const part = q.part_id ? getPartById(q.part_id) : null;
  const dq = getDeliveryQuote(address.district, [part ?? { size_class: "small", is_fragile: false }]);
  const delivery = dq.charge + dq.packing;
  const oi: OrderItem = {
    id: uid(), part_id: q.part_id, quote_id: q.id, title_snapshot: q.title, quality_snapshot: q.quality, unit_price: q.price, qty: 1,
    warranty_months_snapshot: q.warranty_months, is_returnable_snapshot: false, is_electrical_snapshot: false, return_window_days_snapshot: 0,
  };
  const total = q.price + delivery;
  const order: Order = {
    id: uid(), order_no: `PB-${s.seq.order}`, created_at: iso(), order_type: "sourcing", status: "advance_pending",
    address, items: [oi], subtotal: q.price, delivery_charge: delivery, packing_charge: 0, discount: 0, total,
    advance_required: q.advance_amount, advance_paid: 0, cod_amount: total - q.advance_amount,
    delivery_method: dq.method,
    courier_name: null, tracking_no: null, rider_phone: null, needs_confirmation_call: false, request_id: r.id, payments: [],
    history: [{ status: "advance_pending", at: iso() }], delivered_at: null,
  };
  setState((st) => ({
    orders: [order, ...st.orders],
    seq: { ...st.seq, order: st.seq.order + 1 },
    requests: st.requests.map((x) =>
      x.id === requestId
        ? { ...x, status: "advance_pending", order_id: order.id, quotes: x.quotes.map((qq) => ({ ...qq, status: qq.id === quoteId ? "accepted" : "rejected" })) }
        : x,
    ),
  }));
  return order;
};

export interface PlaceOrderInput {
  lines: { part: Part; qty: number }[];
  address: Address;
  delivery_method: Order["delivery_method"];
  delivery_charge: number;
  packing_charge: number;
  advance: number;
  needs_confirmation_call: boolean;
}

export const placeOrder = (i: PlaceOrderInput): Order => {
  const s = getState();
  const subtotal = i.lines.reduce((sum, l) => sum + (l.part.price ?? 0) * l.qty, 0);
  const total = subtotal + i.delivery_charge + i.packing_charge;
  const status: OrderStatus = i.advance > 0 ? "advance_pending" : "pending_confirmation";
  const order: Order = {
    id: uid(), order_no: `PB-${s.seq.order}`, created_at: iso(), order_type: "stock", status,
    address: i.address, items: i.lines.map((l) => item(l.part, l.qty)), subtotal, delivery_charge: i.delivery_charge,
    packing_charge: i.packing_charge, discount: 0, total, advance_required: i.advance, advance_paid: 0, cod_amount: total - i.advance,
    delivery_method: i.delivery_method, courier_name: null, tracking_no: null, rider_phone: null,
    needs_confirmation_call: i.needs_confirmation_call, request_id: null, payments: [], history: [{ status, at: iso() }], delivered_at: null,
  };
  setState((st) => ({
    orders: [order, ...st.orders],
    seq: { ...st.seq, order: st.seq.order + 1 },
    cart: [],
    notifications: notify(st, "অর্ডার পেয়েছি", `${order.order_no}: মোট ৳ ${total}`, `/orders/${order.id}`),
  }));
  return order;
};

export const submitPayment = (
  orderId: string,
  p: { method: "bkash" | "nagad"; sender_number: string; transaction_id: string; amount: number; screenshot_url?: string | null },
) =>
  setState((s) => ({
    orders: s.orders.map((o) =>
      o.id === orderId ? { ...o, payments: [...o.payments, { id: uid(), ...p, status: "submitted", created_at: iso() }] } : o,
    ),
  }));

// Demo-only: admin verifies the advance (admin spec 6.7).
export const demoVerifyPayment = (orderId: string) =>
  setState((s) => {
    const o = s.orders.find((x) => x.id === orderId);
    if (!o) return {};
    const paid = o.payments.filter((p) => p.status === "submitted").reduce((a, p) => a + p.amount, 0);
    let next = pushStatus({ ...o, advance_paid: o.advance_paid + paid, payments: o.payments.map((p) => (p.status === "submitted" ? { ...p, status: "verified" as const } : p)) }, "advance_verified");
    // Stock orders still pass through "confirmed"; sourcing moves on to sourcing.
    next = pushStatus(next, o.order_type === "sourcing" ? "sourcing" : "confirmed");
    return {
      orders: s.orders.map((x) => (x.id === orderId ? next : x)),
      requests: s.requests.map((r) => (r.order_id === orderId ? { ...r, status: o.order_type === "sourcing" ? "sourcing" : "advance_verified" } : r)),
      notifications: notify(s, "অগ্রিম যাচাই হয়েছে", `${o.order_no}: ধন্যবাদ, কাজ শুরু হয়েছে`, `/orders/${orderId}`),
    };
  });

// Demo-only: advance the order one step so tracking can be tried end to end.
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  pending_confirmation: "confirmed",
  confirmed: "qc",
  advance_verified: "qc",
  sourcing: "qc",
  qc: "packed",
  packed: "shipped",
  shipped: "delivered",
};

export const demoAdvanceOrder = (orderId: string) =>
  setState((s) => {
    const o = s.orders.find((x) => x.id === orderId);
    const to = o && NEXT[o.status];
    if (!o || !to) return {};
    let next = pushStatus(o, to);
    if (to === "shipped") next = { ...next, courier_name: "Pathao Courier", tracking_no: `PTH${Math.floor(Math.random() * 1e7)}`, rider_phone: "01799000111" };
    if (to === "delivered") next = { ...next, delivered_at: iso() };
    return {
      orders: s.orders.map((x) => (x.id === orderId ? next : x)),
      requests: s.requests.map((r) => (r.order_id === orderId && (to === "qc" || to === "shipped" || to === "delivered") ? { ...r, status: to } : r)),
    };
  });

export const cancelOrder = (orderId: string) =>
  setState((s) => ({ orders: s.orders.map((o) => (o.id === orderId ? pushStatus(o, "cancelled") : o)) }));

// ---------- claims ----------
export const createClaim = (c: { order_id: string; order_item_id: string; type: ClaimType; description_text: string | null; photos: MediaItem[]; voice_notes: VoiceNote[] }): Claim => {
  const s = getState();
  const claim: Claim = { id: uid(), claim_no: `C-${s.seq.claim}`, status: "submitted", created_at: iso(), ...c };
  setState((st) => ({
    claims: [claim, ...st.claims],
    seq: { ...st.seq, claim: st.seq.claim + 1 },
    notifications: notify(st, "দাবি জমা হয়েছে", `${claim.claim_no}: আমরা যাচাই করে জানাবো`, `/orders/${c.order_id}`),
  }));
  return claim;
};

// ---------- chat ----------
export const sendChat = (m: Omit<ChatMessage, "id" | "created_at" | "sender_type">) => {
  setState((s) => ({ chat: [...s.chat, { ...m, id: uid(), created_at: iso(), sender_type: "user" }] }));
  // Demo auto-reply so the thread feels alive.
  setTimeout(() => {
    setState((s) => ({
      chat: [
        ...s.chat,
        {
          id: uid(),
          created_at: iso(),
          sender_type: "admin",
          type: "text",
          body: m.type === "voice" ? "আপনার ভয়েস পেয়েছি, শুনে এখনই জানাচ্ছি।" : "ধন্যবাদ! আমাদের টিম একটু পরেই উত্তর দিচ্ছে।",
        },
      ],
    }));
  }, 1800);
};

export { uid };
