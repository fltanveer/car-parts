import { seedDonorVehicles, seedListings, seedVendors } from "../mock/catalog";
import type {
  Address, AppNotification, AuditLog, CallLog, CallRequest, ChatThread, Claim, Complaint, DonorVehicle, FieldVisit, GarageDocTask,
  LedgerEntry, Listing, ModerationItem, Order, PartRequest, Payout, PickupRound, Profile, Quote, Refund, Report, Review, Rider, Staff,
  UserVehicle, Vendor, VendorLead, VendorOrder, WhatsAppIntake, CartLine,
} from "../types";

export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;
export const iso = (offsetMs = 0) => new Date(Date.now() + offsetMs).toISOString();
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const DEMO_PHONE = "+8801711000000";

export interface Session {
  customerPhone: string | null;
  vendorId: string | null; // logged-in seller (demo: Rahman Motors)
  staffId: string | null; // logged-in admin staff
}

export interface DB {
  v: number;
  session: Session;
  prefs: { bnDigits: boolean; largeText: boolean };
  profiles: Profile[];
  addresses: (Address & { owner: string })[];
  vehicles: (UserVehicle & { owner: string })[];
  activeVehicleId: string | null;
  cart: CartLine[];
  vendors: Vendor[];
  listings: Listing[];
  donors: DonorVehicle[];
  requests: PartRequest[];
  quotes: Quote[];
  orders: Order[];
  vendorOrders: VendorOrder[];
  claims: Claim[];
  reviews: Review[];
  ledger: LedgerEntry[];
  payouts: Payout[];
  refunds: Refund[];
  threads: ChatThread[];
  callRequests: CallRequest[];
  notifications: AppNotification[];
  complaints: Complaint[];
  reports: Report[];
  staff: Staff[];
  moderation: ModerationItem[];
  leads: VendorLead[];
  fieldVisits: FieldVisit[];
  intake: WhatsAppIntake[];
  callLogs: CallLog[];
  riders: Rider[];
  pickupRounds: PickupRound[];
  audit: AuditLog[];
  garageTasks: GarageDocTask[];
  serviceInterest: { service: string; area: string; phone: string; at: string }[];
  seq: { request: number; order: number; claim: number; complaint: number };
  seenVoiceNotice: boolean;
}

const snap = (title: string, extra: Partial<VendorOrder["items"][number]["snapshot"]> = {}) => ({
  title,
  source: "genuine" as const,
  condition: "new" as const,
  grade: null,
  image: "ph:brake",
  warranty_days: 0,
  is_returnable: true,
  return_window_days: 3,
  is_electrical: false,
  fits_user_vehicle: true,
  ...extra,
});

export const buildSeed = (): DB => {
  const address: Address & { owner: string } = {
    id: "ad-1", owner: DEMO_PHONE, label: "বাসা", recipient_name: "রাকিব হাসান", phone: DEMO_PHONE, division: "ঢাকা", district: "ঢাকা",
    area: "মিরপুর", address_line: "বাড়ি ১২, রোড ৩, সেকশন ১০", landmark: "মিরপুর ১০ গোলচত্বরের কাছে", is_default: true,
  };

  const vehicle: UserVehicle & { owner: string } = {
    id: "uv-1", owner: DEMO_PHONE, generation_id: "gn-axio-e140", engine_id: "en-1nzfe", chassis_number: "NZE141-6012345",
    registration_no: "ঢাকা মেট্রো-গ ১২-৩৪৫৬", nickname: "সাদা এক্সিও", color: "সাদা", odometer_km: 142300, is_primary: true,
    needs_admin_setup: false, papers_photo_url: null,
    documents: [
      { id: "vd-1", doc_type: "registration", expires_on: null, file_url: "ph:doc", status: "ok" },
      { id: "vd-2", doc_type: "tax_token", expires_on: iso(5 * DAY), file_url: "ph:doc", status: "ok" },
      { id: "vd-3", doc_type: "fitness", expires_on: iso(64 * DAY), file_url: "ph:doc", status: "ok" },
      { id: "vd-4", doc_type: "insurance", expires_on: iso(-3 * DAY), file_url: null, status: "ok" },
      { id: "vd-5", doc_type: "driving_license", expires_on: iso(400 * DAY), file_url: null, status: "missing" },
    ],
    service_logs: [
      { id: "sl-1", date: iso(-40 * DAY), odometer_km: 139200, type: "অয়েল চেঞ্জ", cost: 4800, garage_name: "মিরপুর অটো সার্ভিস", order_no: null },
      { id: "sl-2", date: iso(-6 * DAY), odometer_km: 142100, type: "ব্রেক প্যাড বদল", cost: 2350, garage_name: null, order_no: "GH-4790" },
    ],
    expenses: [
      { id: "ex-1", date: iso(-2 * DAY), category: "fuel", amount: 2000, note: "অকটেন" },
      { id: "ex-2", date: iso(-9 * DAY), category: "fuel", amount: 2500, note: null },
      { id: "ex-3", date: iso(-6 * DAY), category: "parts", amount: 2420, note: "ব্রেক প্যাড + ডেলিভারি" },
      { id: "ex-4", date: iso(-12 * DAY), category: "parking", amount: 300, note: null },
    ],
    drivers: [{ phone: "+8801812000000", name: "জামাল (ড্রাইভার)", approval_required: true }],
  };

  // ---- requests & quotes ----
  const reqQuoted: PartRequest = {
    id: "rq-1", request_no: "R-10231", created_at: iso(-22 * HOUR), user_phone: DEMO_PHONE, contact_name: "রাকিব হাসান",
    user_vehicle_id: "uv-1", generation_id: "gn-axio-e140", engine_id: "en-1nzfe", vehicle_text: null,
    description_text: "সামনের ডান পাশের হেডলাইট ভেঙে গেছে, পুরো সেট লাগবে", voice_notes: [], photos: [],
    preferred_source: "genuine", preferred_condition: "used_ok", needed_by: "2_3_days",
    items: [{ category_id: "c-lamps--headlight", name: "হেডলাইট (ডান)", qty: 1, position: ["front", "driver"] }],
    summary_bn: "Toyota Axio 2010 (E140), 1NZ-FE, সামনের ডান হেডলাইট, সম্পূর্ণ সেট", clarity: "clear",
    district: "ঢাকা", area: "মিরপুর", status: "quotes_received", source: "web_text", expires_at: iso(50 * HOUR), broadcast_at: iso(-21 * HOUR),
    matches: ["v-rahman", "v-japanhalf", "v-bismillah", "v-store"].map((v, i) => ({ vendor_id: v, notified_at: iso(-21 * HOUR), seen_at: i < 3 ? iso(-20 * HOUR) : null, declined: v === "v-bismillah", decline_reason: v === "v-bismillah" ? "এই জিনিস রাখি না" : null })),
    questions: [{ id: "qq-1", vendor_id: "v-japanhalf", question: "হেডলাইট HID নাকি হ্যালোজেন?", answer: "হ্যালোজেন, পুরনোটা হলুদ আলো", asked_at: iso(-19 * HOUR), answered_at: iso(-18 * HOUR) }],
    assigned_admin: null, accepted_quote_ids: [], team_searching: false, cancel_reason: null,
  };
  const quote = (id: string, vendor_id: string, p: Partial<Quote>): Quote => ({
    id, request_id: "rq-1", vendor_id, item_index: 0, listing_id: null, title: "Axio E140 ডান হেডলাইট", source: "genuine", condition: "used_import",
    grade: "A", brand_id: "br-koito", part_number: null, price: 14500, delivery_charge_estimate: 120, dispatch_days: 1, warranty_days: 30,
    is_returnable: true, media: ["ph:light"], note_bn: null, quote_score: 0, valid_until: iso(50 * HOUR), status: "submitted",
    withdraw_reason: null, created_at: iso(-18 * HOUR), ...p,
  });
  const quotes: Quote[] = [
    quote("qt-1", "v-rahman", { listing_id: "ls-20", price: 14200, note_bn: "HID ব্যালাস্টসহ, গ্লাস একদম পরিষ্কার।", media: ["ph:light", "ph:light"] }),
    quote("qt-2", "v-japanhalf", { price: 12000, grade: "B", dispatch_days: 0, warranty_days: 7, note_bn: "হ্যালোজেন, একটা কানে হালকা দাগ।" }),
    quote("qt-3", "v-store", { price: 21500, condition: "new", grade: null, source: "oem_brand", brand_id: "br-depo", dispatch_days: 2, warranty_days: 180, title: "Axio E140 ডান হেডলাইট (নতুন, DEPO)", is_returnable: true }),
    quote("qt-4", "v-fast", { price: 5900, grade: "A", source: "genuine", warranty_days: 0, is_returnable: false, note_bn: "একদম নতুনের মতো", dispatch_days: 0 }),
  ];

  const reqVoice: PartRequest = {
    ...reqQuoted, id: "rq-2", request_no: "R-10232", created_at: iso(-35 * 60_000), user_phone: "+8801912000000", contact_name: null,
    user_vehicle_id: null, generation_id: null, engine_id: null, vehicle_text: "নোয়া ২০১০", description_text: null,
    voice_notes: [{ id: "vn-demo", url: "", mime_type: "audio/webm", duration_sec: 23, size_bytes: 41000 }],
    preferred_source: "cheapest", preferred_condition: "any", needed_by: "today", items: [], summary_bn: null, clarity: null,
    district: "গাজীপুর", area: "টঙ্গী", status: "needs_clarification", source: "web_voice", broadcast_at: null, matches: [], questions: [],
    expires_at: iso(71 * HOUR),
  };
  const reqOpen: PartRequest = {
    ...reqQuoted, id: "rq-3", request_no: "R-10233", created_at: iso(-3 * HOUR), user_phone: "+8801612000000", contact_name: "সুমন",
    user_vehicle_id: null, generation_id: "gn-noah-r80", engine_id: "en-3zrfae", vehicle_text: null,
    description_text: "নোয়া ২০১৬ এর সামনের বাম্পার, রং ছাড়া হলেও চলবে",
    preferred_source: "you_decide", preferred_condition: "used_ok", needed_by: "no_rush",
    items: [{ category_id: "c-panels--front-bumper", name: "সামনের বাম্পার", qty: 1, position: ["front"] }],
    summary_bn: "Toyota Noah R80 (2014-2021), সামনের বাম্পার, রং করা/না করা দুটোই চলবে", clarity: "clear",
    district: "চট্টগ্রাম", area: "আগ্রাবাদ", status: "open", source: "web_text", broadcast_at: iso(-2.5 * HOUR), expires_at: iso(69 * HOUR),
    matches: ["v-rahman", "v-japanhalf"].map((v) => ({ vendor_id: v, notified_at: iso(-2.5 * HOUR), seen_at: null, declined: false, decline_reason: null })),
    questions: [],
  };
  const reqNoQuote: PartRequest = {
    ...reqQuoted, id: "rq-4", request_no: "R-10229", created_at: iso(-30 * HOUR), user_phone: "+8801512000000", contact_name: "মাহফুজ",
    user_vehicle_id: null, generation_id: "gn-pajero-v90", engine_id: null, vehicle_text: null,
    description_text: "পাজেরো স্পোর্টের পেছনের ডিফারেনশিয়াল", items: [{ category_id: "c-axle", name: "ডিফারেনশিয়াল (পেছনে)", qty: 1, position: ["rear"] }],
    summary_bn: "Mitsubishi Pajero V90, পেছনের ডিফারেনশিয়াল", status: "open", broadcast_at: iso(-29 * HOUR), expires_at: iso(42 * HOUR),
    matches: [{ vendor_id: "v-japanhalf", notified_at: iso(-29 * HOUR), seen_at: iso(-28 * HOUR), declined: true, decline_reason: "এই মডেলের নেই" }],
    questions: [], district: "সিলেট", area: "সিলেট সদর",
  };

  // ---- orders ----
  const delivered: Order = {
    id: "od-1", order_no: "GH-4790", created_at: iso(-6 * DAY), user_phone: DEMO_PHONE, customer_name: "রাকিব হাসান", address,
    user_vehicle_id: "uv-1", subtotal: 3220, delivery_total: 190, discount_total: 0, grand_total: 3410, payment_method: "cod",
    payment_status: "paid", advance_due: 0, source: "cart", vendor_order_ids: ["vo-1", "vo-2"],
    payments: [{ id: "py-1", method: "cod", amount: 3410, purpose: "cod_collection", sender_number: null, transaction_id: null, status: "verified", verified_by: "st-fin", created_at: iso(-4 * DAY) }],
  };
  const vo1: VendorOrder = {
    id: "vo-1", order_id: "od-1", vendor_id: "v-bismillah", sub_order_no: "GH-4790-A", status: "completed", fulfillment: "platform_pickup",
    items: [{ id: "oi-1", listing_id: "ls-1", quote_id: null, snapshot: snap("টয়োটা সামনের ব্রেক প্যাড"), unit_price: 2350, qty: 1, line_total: 2350 }],
    subtotal: 2350, delivery_charge: 120, commission_amount: 0, vendor_payable: 2350, cod_amount: 2470, courier: "Pathao", tracking_no: "PTH8837261",
    pickup_code: null, packing_photo: "ph:box", accept_by: iso(-5.5 * DAY), handover_by: iso(-4 * DAY), deliver_by: iso(-1 * DAY),
    delivered_at: iso(-4 * DAY), return_window_ends_at: iso(-1 * DAY), settled_at: iso(-1 * DAY), reject_reason: null, qc: null,
    history: [
      { from: null, to: "pending_vendor", actor: "system", note: null, at: iso(-6 * DAY) },
      { from: "pending_vendor", to: "accepted", actor: "vendor", note: null, at: iso(-5.8 * DAY) },
      { from: "accepted", to: "ready_to_ship", actor: "vendor", note: null, at: iso(-5.5 * DAY) },
      { from: "ready_to_ship", to: "picked_up", actor: "admin", note: null, at: iso(-5.2 * DAY) },
      { from: "picked_up", to: "shipped", actor: "admin", note: null, at: iso(-5 * DAY) },
      { from: "shipped", to: "delivered", actor: "system", note: null, at: iso(-4 * DAY) },
      { from: "delivered", to: "completed", actor: "system", note: null, at: iso(-1 * DAY) },
    ],
    reviewed: true,
  };
  const vo2: VendorOrder = {
    ...vo1, id: "vo-2", vendor_id: "v-store", sub_order_no: "GH-4790-B", status: "delivered", fulfillment: "assured_hub",
    items: [{ id: "oi-2", listing_id: "ls-5", quote_id: null, snapshot: snap("টয়োটা মবিল ফিল্টার", { image: "ph:filter" }), unit_price: 450, qty: 1, line_total: 450 },
      { id: "oi-3", listing_id: "ls-8", quote_id: null, snapshot: snap("ডেনসো ইরিডিয়াম স্পার্ক প্লাগ", { image: "ph:engine", source: "oem_brand", is_electrical: true, is_returnable: true }), unit_price: 105, qty: 4, line_total: 420 }],
    subtotal: 870, delivery_charge: 70, cod_amount: 940, vendor_payable: 870, courier: "Steadfast", tracking_no: "SF20931877", delivered_at: iso(-20 * HOUR),
    return_window_ends_at: iso(52 * HOUR), settled_at: null, qc: { result: "pass", note: "পার্ট নম্বর মিলেছে", at: iso(-2 * DAY) }, reviewed: false,
    history: [
      { from: null, to: "pending_vendor", actor: "system", note: null, at: iso(-6 * DAY) },
      { from: "pending_vendor", to: "accepted", actor: "vendor", note: null, at: iso(-5.9 * DAY) },
      { from: "accepted", to: "ready_to_ship", actor: "vendor", note: null, at: iso(-3 * DAY) },
      { from: "ready_to_ship", to: "picked_up", actor: "admin", note: null, at: iso(-2.5 * DAY) },
      { from: "picked_up", to: "at_hub_qc", actor: "admin", note: null, at: iso(-2.2 * DAY) },
      { from: "at_hub_qc", to: "shipped", actor: "admin", note: null, at: iso(-2 * DAY) },
      { from: "shipped", to: "delivered", actor: "system", note: null, at: iso(-20 * HOUR) },
    ],
  };

  const active: Order = {
    id: "od-2", order_no: "GH-4821", created_at: iso(-2 * HOUR), user_phone: DEMO_PHONE, customer_name: "রাকিব হাসান", address,
    user_vehicle_id: "uv-1", subtotal: 15180, delivery_total: 190, discount_total: 0, grand_total: 15370, payment_method: "delivery_advance_cod",
    payment_status: "partial", advance_due: 190, source: "cart", vendor_order_ids: ["vo-3", "vo-4"],
    payments: [{ id: "py-2", method: "bkash_manual", amount: 190, purpose: "delivery_charge", sender_number: "01711000000", transaction_id: "BK8X2LQ91P", status: "submitted", verified_by: null, created_at: iso(-1.5 * HOUR) }],
  };
  const vo3: VendorOrder = {
    ...vo1, id: "vo-3", order_id: "od-2", vendor_id: "v-rahman", sub_order_no: "GH-4821-A", status: "pending_vendor", fulfillment: "platform_pickup",
    items: [{ id: "oi-4", listing_id: "ls-29", quote_id: null, snapshot: snap("Premio T260 ডান ব্যাকলাইট", { image: "ph:light", condition: "used_import", grade: "A", is_electrical: true, fits_user_vehicle: false }), unit_price: 5500, qty: 1, line_total: 5500 }],
    subtotal: 5500, delivery_charge: 120, commission_amount: 0, vendor_payable: 5500, cod_amount: 5430, courier: null, tracking_no: null, packing_photo: null,
    accept_by: iso(10 * HOUR), handover_by: null, deliver_by: null, delivered_at: null, return_window_ends_at: null, settled_at: null, qc: null, reviewed: false,
    history: [{ from: null, to: "pending_vendor", actor: "system", note: null, at: iso(-2 * HOUR) }],
  };
  const vo4: VendorOrder = {
    ...vo3, id: "vo-4", vendor_id: "v-japanhalf", sub_order_no: "GH-4821-B", status: "accepted", fulfillment: "vendor_ship",
    items: [{ id: "oi-5", listing_id: "ls-24", quote_id: null, snapshot: snap("Axio E160 ডান সাইড মিরর", { image: "ph:mirror", condition: "used_import", grade: "A" }), unit_price: 6500, qty: 1, line_total: 6500 }],
    subtotal: 6500, delivery_charge: 70, vendor_payable: 6500, cod_amount: 6500,
    history: [{ from: null, to: "pending_vendor", actor: "system", note: null, at: iso(-2 * HOUR) }, { from: "pending_vendor", to: "accepted", actor: "vendor", note: null, at: iso(-1 * HOUR) }],
  };
  // Rahman's other orders for the seller panel.
  const other: Order = {
    ...active, id: "od-3", order_no: "GH-4805", created_at: iso(-2 * DAY), user_phone: "+8801612000000", customer_name: "সুমন আহমেদ",
    address: { ...address, id: "ad-x", recipient_name: "সুমন আহমেদ", phone: "+8801612000000", district: "চট্টগ্রাম", area: "আগ্রাবাদ", address_line: "সিডিএ আবাসিক, রোড ৫" },
    user_vehicle_id: null, payment_method: "cod", payment_status: "unpaid", advance_due: 0, vendor_order_ids: ["vo-5"], payments: [], subtotal: 11800, delivery_total: 200, grand_total: 12000,
  };
  const vo5: VendorOrder = {
    ...vo3, id: "vo-5", order_id: "od-3", sub_order_no: "GH-4805-A", status: "ready_to_ship", fulfillment: "platform_pickup",
    items: [{ id: "oi-6", listing_id: "ls-21", quote_id: null, snapshot: snap("Axio E140 বাম হেডলাইট", { image: "ph:light", condition: "used_import", grade: "B", is_electrical: true }), unit_price: 11800, qty: 1, line_total: 11800 }],
    subtotal: 11800, delivery_charge: 200, vendor_payable: 11800, cod_amount: 12000, packing_photo: "ph:box",
    accept_by: iso(-1.6 * DAY), handover_by: iso(4 * HOUR), deliver_by: iso(8 * DAY),
    history: [
      { from: null, to: "pending_vendor", actor: "system", note: null, at: iso(-2 * DAY) },
      { from: "pending_vendor", to: "accepted", actor: "vendor", note: null, at: iso(-1.9 * DAY) },
      { from: "accepted", to: "ready_to_ship", actor: "vendor", note: null, at: iso(-6 * HOUR) },
    ],
  };
  const old: Order = { ...other, id: "od-4", order_no: "GH-4702", created_at: iso(-12 * DAY), user_phone: "+8801512000000", customer_name: "মাহফুজ", vendor_order_ids: ["vo-6"], payment_status: "paid", subtotal: 9000, grand_total: 9350 };
  const vo6: VendorOrder = {
    ...vo1, id: "vo-6", order_id: "od-4", vendor_id: "v-rahman", sub_order_no: "GH-4702-A", status: "delivered",
    items: [{ id: "oi-7", listing_id: "ls-25", quote_id: null, snapshot: snap("Noah R80 সামনের বাম্পার", { image: "ph:body", condition: "used_import", grade: "C" }), unit_price: 9000, qty: 1, line_total: 9000 }],
    subtotal: 9000, delivery_charge: 350, vendor_payable: 9000, cod_amount: 9350, delivered_at: iso(-1 * DAY), return_window_ends_at: iso(2 * DAY), settled_at: null, reviewed: false,
  };

  const claims: Claim[] = [
    {
      id: "cl-1", claim_no: "C-5012", vendor_order_id: "vo-6", order_item_id: "oi-7", user_phone: "+8801512000000", vendor_id: "v-rahman", type: "damaged_on_arrival",
      description: "বাম্পারের নিচের কোণা ফাটা এসেছে, ছবিতে ছিল না।", media: [{ id: "m1", url: "ph:body", kind: "image", name: "crack.jpg" }], voice_notes: [],
      status: "vendor_review", liability: "vendor", vendor_response: null, vendor_respond_by: iso(36 * HOUR), resolution: null, refund_amount: null, decision_note: null,
      created_at: iso(-12 * HOUR), history: [{ from: null, to: "submitted", actor: "customer", note: null, at: iso(-12 * HOUR) }, { from: "submitted", to: "vendor_review", actor: "system", note: null, at: iso(-12 * HOUR) }],
    },
    {
      id: "cl-2", claim_no: "C-5008", vendor_order_id: "vo-2", order_item_id: "oi-3", user_phone: DEMO_PHONE, vendor_id: "v-store", type: "not_as_described",
      description: "৪টা প্লাগের একটার প্যাকেট খোলা ছিল, ইরিডিয়াম না সাধারণ মনে হচ্ছে।", media: [{ id: "m2", url: "ph:engine", kind: "image", name: "plug.jpg" }], voice_notes: [],
      status: "escalated", liability: "vendor", vendor_response: "সব প্লাগ সিল করা অবস্থায় হাবে QC পাস করেছে।", vendor_respond_by: iso(-2 * HOUR), resolution: null, refund_amount: null,
      decision_note: null, created_at: iso(-18 * HOUR),
      history: [
        { from: null, to: "submitted", actor: "customer", note: null, at: iso(-18 * HOUR) },
        { from: "submitted", to: "vendor_review", actor: "system", note: null, at: iso(-18 * HOUR) },
        { from: "vendor_review", to: "vendor_disputed", actor: "vendor", note: "QC পাস", at: iso(-10 * HOUR) },
        { from: "vendor_disputed", to: "escalated", actor: "customer", note: null, at: iso(-4 * HOUR) },
      ],
    },
  ];

  const ledger: LedgerEntry[] = [
    { id: "lg-1", vendor_id: "v-rahman", vendor_order_id: null, entry_type: "sale_credit", amount: 32400, available_at: iso(-20 * DAY), note: "GH-4511-A, GH-4530-A, GH-4588-B", created_at: iso(-25 * DAY) },
    { id: "lg-2", vendor_id: "v-rahman", vendor_order_id: null, entry_type: "payout_debit", amount: -24200, available_at: iso(-14 * DAY), note: "পেআউট P-221", created_at: iso(-14 * DAY) },
    { id: "lg-3", vendor_id: "v-rahman", vendor_order_id: null, entry_type: "sale_credit", amount: 14800, available_at: iso(-3 * DAY), note: "GH-4655-A", created_at: iso(-8 * DAY) },
    { id: "lg-4", vendor_id: "v-rahman", vendor_order_id: null, entry_type: "penalty", amount: -200, available_at: iso(-5 * DAY), note: "দেরিতে হস্তান্তর (GH-4630-A)", created_at: iso(-5 * DAY) },
    { id: "lg-5", vendor_id: "v-rahman", vendor_order_id: "vo-6", entry_type: "sale_credit", amount: 9000, available_at: iso(2 * DAY), note: "GH-4702-A", created_at: iso(-1 * DAY) },
    { id: "lg-6", vendor_id: "v-bismillah", vendor_order_id: "vo-1", entry_type: "sale_credit", amount: 2350, available_at: iso(-1 * DAY), note: "GH-4790-A", created_at: iso(-4 * DAY) },
    { id: "lg-7", vendor_id: "v-store", vendor_order_id: "vo-2", entry_type: "sale_credit", amount: 870, available_at: iso(52 * HOUR), note: "GH-4790-B", created_at: iso(-20 * HOUR) },
  ];
  const payouts: Payout[] = [
    { id: "po-1", vendor_id: "v-rahman", amount: 24200, method_id: "pm-v-rahman", status: "paid", reference: "BKB-88213", created_at: iso(-14 * DAY), paid_at: iso(-14 * DAY) },
    { id: "po-2", vendor_id: "v-rahman", amount: 18300, method_id: "pm-v-rahman", status: "paid", reference: "BKB-87102", created_at: iso(-21 * DAY), paid_at: iso(-21 * DAY) },
  ];

  const reviews: Review[] = [
    { id: "rv-1", vendor_order_id: null, user_name: "সাইফুল", vendor_id: "v-rahman", listing_id: null, rating: 5, tags: ["as_described", "packing"], comment: "হেডলাইট একদম ছবির মতো, ভালো প্যাকিং।", vendor_reply: "ধন্যবাদ ভাই!", created_at: iso(-9 * DAY) },
    { id: "rv-2", vendor_order_id: null, user_name: "নাঈম", vendor_id: "v-rahman", listing_id: null, rating: 4, tags: ["fast"], comment: null, vendor_reply: null, created_at: iso(-15 * DAY) },
    { id: "rv-3", vendor_order_id: "vo-1", user_name: "রাকিব হাসান", vendor_id: "v-bismillah", listing_id: "ls-1", rating: 5, tags: ["as_described", "fair_price"], comment: "জেনুইন প্যাড, বক্স সিল করা।", vendor_reply: null, created_at: iso(-3 * DAY) },
    { id: "rv-4", vendor_order_id: null, user_name: "তারেক", vendor_id: "v-rahman", listing_id: null, rating: 3, tags: [], comment: "জিনিস ভালো কিন্তু একদিন দেরি।", vendor_reply: null, created_at: iso(-20 * DAY) },
  ];

  const threads: ChatThread[] = [
    {
      id: "th-support", type: "customer_support", customer_phone: DEMO_PHONE, customer_name: "রাকিব হাসান", vendor_id: null, context_type: null, context_id: null,
      messages: [{ id: "m-s1", sender: "support", type: "text", body: "আসসালামু আলাইকুম! গাড়িহাবে স্বাগতম। কিছু লাগলে লিখুন বা ভয়েসে বলুন।", contains_contact_info: false, created_at: iso(-3 * DAY) }],
      unread_customer: 0, unread_vendor: 0, unread_support: 0, last_message_at: iso(-3 * DAY),
    },
    {
      id: "th-rahman", type: "customer_vendor", customer_phone: DEMO_PHONE, customer_name: "রাকিব হাসান", vendor_id: "v-rahman", context_type: "quote", context_id: "qt-1",
      messages: [
        { id: "m-r1", sender: "customer", type: "text", body: "ভাই, হেডলাইটের লেভেলিং মোটর আছে?", contains_contact_info: false, created_at: iso(-5 * HOUR) },
        { id: "m-r2", sender: "vendor", type: "text", body: "জি আছে, সব ঠিকমতো কাজ করে। চাইলে ভিডিও দিতে পারি।", contains_contact_info: false, created_at: iso(-4.5 * HOUR) },
        { id: "m-r3", sender: "vendor", type: "text", body: "আমার নম্বর •••• •••• এ কল দেন", contains_contact_info: true, created_at: iso(-4.4 * HOUR) },
        { id: "m-r4", sender: "system", type: "system", body: "নম্বর শেয়ার করা যায় না। অ্যাপের বাইরে কিনলে টাকা ফেরতের সুরক্ষা পাবেন না।", contains_contact_info: false, created_at: iso(-4.4 * HOUR) },
      ],
      unread_customer: 2, unread_vendor: 0, unread_support: 0, last_message_at: iso(-4.4 * HOUR),
    },
    {
      id: "th-vsupport", type: "vendor_support", customer_phone: null, customer_name: null, vendor_id: "v-rahman", context_type: null, context_id: null,
      messages: [{ id: "m-v1", sender: "support", type: "text", body: "রহমান ভাই, আপনার স্কোর এই সপ্তাহে বেড়েছে। দাম চাওয়ায় আরও দ্রুত উত্তর দিলে আরও অর্ডার পাবেন।", contains_contact_info: false, created_at: iso(-1 * DAY) }],
      unread_customer: 0, unread_vendor: 1, unread_support: 0, last_message_at: iso(-1 * DAY),
    },
  ];

  const notifications: AppNotification[] = [
    { id: "nt-1", audience: "customer", target: DEMO_PHONE, title: "৩টা দোকান দাম দিয়েছে", body: "R-10231 হেডলাইট: দাম তুলনা করে বেছে নিন", link: "/request/rq-1", created_at: iso(-18 * HOUR), read: false },
    { id: "nt-2", audience: "customer", target: DEMO_PHONE, title: "ট্যাক্স টোকেনের মেয়াদ ৫ দিন পর শেষ", body: "সাদা এক্সিও", link: "/garage/uv-1", created_at: iso(-2 * HOUR), read: false },
    { id: "nt-3", audience: "vendor", target: "v-rahman", title: "নতুন অর্ডার GH-4821-A", body: "Premio T260 ডান ব্যাকলাইট · ১২ ঘণ্টার মধ্যে গ্রহণ করুন", link: "/seller/orders/vo-3", created_at: iso(-2 * HOUR), read: false },
    { id: "nt-4", audience: "vendor", target: "v-rahman", title: "নতুন দাম চাওয়া", body: "Noah R80 সামনের বাম্পার · চট্টগ্রাম", link: "/seller/requests/rq-3", created_at: iso(-2.5 * HOUR), read: false },
  ];

  const staff: Staff[] = [
    { id: "st-super", name: "তানভীর (সুপার অ্যাডমিন)", phone: "+8801700000001", roles: ["super_admin"], active: true },
    { id: "st-desk", name: "নুসরাত", phone: "+8801700000002", roles: ["request_desk"], active: true },
    { id: "st-vs", name: "ফাহিম", phone: "+8801700000003", roles: ["vendor_success"], active: true },
    { id: "st-field1", name: "জসিম (মাঠকর্মী)", phone: "+8801700000004", roles: ["field_agent"], active: true },
    { id: "st-cat", name: "সাবরিনা", phone: "+8801700000005", roles: ["catalog_manager"], active: true },
    { id: "st-ts", name: "আরিফ", phone: "+8801700000006", roles: ["trust_safety"], active: true },
    { id: "st-fin", name: "মিতু", phone: "+8801700000007", roles: ["finance"], active: true },
    { id: "st-logi", name: "রাজু", phone: "+8801700000008", roles: ["logistics"], active: true },
    { id: "st-ops", name: "শাহেদ", phone: "+8801700000009", roles: ["ops_manager"], active: true },
  ];

  return {
    v: 2,
    session: { customerPhone: null, vendorId: "v-rahman", staffId: "st-super" },
    prefs: { bnDigits: true, largeText: false },
    profiles: [{ phone: DEMO_PHONE, full_name: "রাকিব হাসান", customer_type: "personal", large_text: false, force_advance: false, is_blocked: false, followed_vendor_ids: ["v-rahman"], notify_sms: true }],
    addresses: [address],
    vehicles: [vehicle],
    activeVehicleId: null,
    cart: [],
    vendors: seedVendors,
    listings: seedListings,
    donors: seedDonorVehicles,
    requests: [reqVoice, reqOpen, reqQuoted, reqNoQuote],
    quotes,
    orders: [active, other, delivered, old],
    vendorOrders: [vo3, vo4, vo5, vo1, vo2, vo6],
    claims,
    reviews,
    ledger,
    payouts,
    refunds: [{ id: "rf-1", order_id: "od-3", vendor_order_id: null, claim_id: null, amount: 450, method: "bkash", destination: "01612•••000", status: "pending", due_by: iso(30 * HOUR), processed_at: null, reference: null, created_at: iso(-42 * HOUR) }],
    threads,
    callRequests: [{ id: "cr-1", requester_phone: "+8801912000000", target_type: "support", target_id: null, context: "R-10232 ভয়েস রিকোয়েস্ট", status: "pending", created_at: iso(-20 * 60_000) }],
    notifications,
    complaints: [
      { id: "cp-1", complaint_no: "CMP-118", user_phone: "+8801512000000", subject: "দোকান ফোনে বেশি দাম চেয়েছে", description: "অর্ডারের পর দোকান ফোন করে বলেছে দাম ৫০০ টাকা বেশি দিতে হবে।", status: "open", first_response_by: iso(60 * HOUR), first_response_at: null, assigned_to: null, created_at: iso(-12 * HOUR) },
    ],
    reports: [{ id: "rp-1", reporter: DEMO_PHONE, target_type: "listing", target_id: "ls-30", reason: "stolen_suspect", details: "একই দিনে অনেকগুলো সাইড মিরর", status: "open", created_at: iso(-1 * DAY) }],
    staff,
    moderation: [
      { id: "md-1", target_type: "listing", target_id: "ls-31", reason: "new_vendor", priority: 2, status: "open", decision_note: null, created_at: iso(-3 * HOUR) },
      { id: "md-2", target_type: "listing", target_id: "ls-30", reason: "stolen_risk", priority: 1, status: "open", decision_note: null, created_at: iso(-1 * DAY) },
      { id: "md-3", target_type: "listing", target_id: "ls-22", reason: "restricted_category", priority: 2, status: "open", decision_note: null, created_at: iso(-5 * HOUR) },
      { id: "md-4", target_type: "vendor", target_id: "v-fast", reason: "contact_sharing", priority: 1, status: "open", decision_note: null, created_at: iso(-2 * DAY) },
      { id: "md-5", target_type: "listing", target_id: "ls-3", reason: "random_audit", priority: 3, status: "open", decision_note: null, created_at: iso(-6 * HOUR) },
    ],
    leads: [
      { id: "ld-1", shop_name: "নিউ ঢাকা অটো", market_area: "dholaikhal", phone: "+8801788000001", specialty: "Honda পার্টস", status: "new", owner_agent: "st-field1", created_at: iso(-2 * DAY) },
      { id: "ld-2", shop_name: "সোনালী মোটরস", market_area: "dholaikhal", phone: "+8801788000002", specialty: "হাফকাট", status: "contacted", owner_agent: "st-field1", created_at: iso(-5 * DAY) },
      { id: "ld-3", shop_name: "মডার্ন টায়ার", market_area: "tejgaon", phone: "+8801788000003", specialty: "টায়ার", status: "visit_scheduled", owner_agent: "st-field1", created_at: iso(-6 * DAY) },
      { id: "ld-4", shop_name: "আল-আমিন পার্টস", market_area: "nawabpur", phone: "+8801788000004", specialty: "ইঞ্জিন", status: "not_interested", owner_agent: null, created_at: iso(-12 * DAY) },
    ],
    fieldVisits: [
      { id: "fv-1", agent_id: "st-field1", vendor_id: "v-karim", lead_id: null, purpose: "onboarding", at: iso(-2 * DAY), listings_created: 1, report: "দোকান আছে, সাইনবোর্ড আছে, স্টক দেখা গেছে।" },
      { id: "fv-2", agent_id: "st-field1", vendor_id: "v-rahman", lead_id: null, purpose: "assisted_upload", at: iso(-8 * DAY), listings_created: 14, report: null },
    ],
    intake: [
      { id: "wi-1", from_phone: "+8801733333333", sender_kind: "vendor", vendor_id: "v-japanhalf", text: "এই ৩টা পার্টস তুলে দেন", media_count: 3, has_voice: true, type: "listing", status: "new", created_at: iso(-50 * 60_000) },
      { id: "wi-2", from_phone: "+8801400000000", sender_kind: "unknown", vendor_id: null, text: null, media_count: 1, has_voice: true, type: null, status: "new", created_at: iso(-15 * 60_000) },
    ],
    callLogs: [{ id: "cl-a", phone: "+8801612000000", staff_id: "st-desk", channel: "phone_in", purpose: "রিকোয়েস্টের অবস্থা", ref: "R-10233", summary: "জানানো হয়েছে ২টা দোকানে গেছে।", created_at: iso(-1 * HOUR) }],
    riders: [
      { id: "rd-1", name: "সোহেল", phone: "+8801900000001", area: "ধোলাইখাল", active: true },
      { id: "rd-2", name: "বাবু", phone: "+8801900000002", area: "তেজগাঁও", active: true },
    ],
    pickupRounds: [{ id: "pr-1", market_area: "dholaikhal", date: iso(0), slot: "বিকাল ৪টা", rider_id: "rd-1", status: "planned", vendor_order_ids: ["vo-5"] }],
    audit: [{ id: "au-1", staff_id: "st-ts", action: "বিক্রেতা স্থগিত", target: "Fast Parts BD", at: iso(-2 * DAY) }],
    garageTasks: [{ id: "gt-1", user_phone: "+8801612000000", user_vehicle_id: "uv-x", kind: "setup_from_papers", doc_type: "registration", status: "open", created_at: iso(-4 * HOUR) }],
    serviceInterest: [],
    seq: { request: 10234, order: 4822, claim: 5013, complaint: 119 },
    seenVoiceNotice: false,
  };
};
