// Types mirror the v2 DB schema (carparts-v2-00-foundation.md section 12).
// The mock layer (src/lib/mock + src/lib/db.ts) uses these so it can later be
// swapped for Supabase without touching screens.

export type Lang = "bn" | "en";
export type ID = string;
export type ISO = string;

// ---------- vehicles (12.2) ----------
export type VehicleTypeCode = "car" | "micro" | "suv" | "pickup" | "bike" | "cng" | "bus" | "truck";
export type FuelType = "petrol" | "diesel" | "hybrid" | "cng" | "ev";

export interface VehicleMake {
  id: ID;
  name: string;
  name_bn: string;
  slug: string;
  color: string; // logo tile colour in the mock (no logo files yet)
}

export interface VehicleModel {
  id: ID;
  make_id: ID;
  vehicle_type_code: VehicleTypeCode;
  name: string;
  name_bn: string;
  slug: string;
  is_popular: boolean;
}

export interface VehicleGeneration {
  id: ID;
  model_id: ID;
  label: string;
  year_from: number;
  year_to: number | null;
  chassis_codes: string[];
  facelift: "pre" | "post" | "na";
}

export interface VehicleEngine {
  id: ID;
  code: string;
  fuel_type: FuelType;
  displacement_cc: number;
  cylinders: number;
  aspiration: "na" | "turbo";
}

// ---------- my garage (12.3) ----------
export type VehicleDocType = "registration" | "tax_token" | "fitness" | "insurance" | "route_permit" | "driving_license";

export interface VehicleDocument {
  id: ID;
  doc_type: VehicleDocType;
  expires_on: ISO | null;
  file_url: string | null;
  status: "missing" | "pending_review" | "ok";
}

export interface ServiceLog {
  id: ID;
  date: ISO;
  odometer_km: number | null;
  type: string;
  cost: number;
  garage_name: string | null;
  order_no: string | null;
}

export type ExpenseCategory = "fuel" | "parts" | "service" | "papers" | "toll" | "parking" | "other";

export interface Expense {
  id: ID;
  date: ISO;
  category: ExpenseCategory;
  amount: number;
  note: string | null;
}

export interface UserVehicle {
  id: ID;
  generation_id: ID | null;
  engine_id: ID | null;
  chassis_number: string | null;
  registration_no: string | null;
  nickname: string | null;
  color: string | null;
  odometer_km: number | null;
  is_primary: boolean;
  needs_admin_setup: boolean;
  papers_photo_url: string | null;
  documents: VehicleDocument[];
  service_logs: ServiceLog[];
  expenses: Expense[];
  drivers: { phone: string; name: string | null; approval_required: boolean }[];
}

// ---------- catalog (12.4, file 04) ----------
export type Source = "genuine" | "oem_brand" | "aftermarket" | "local_made" | "unknown";
export type Condition = "new" | "used_import" | "used_local" | "refurbished" | "for_parts";
export type Grade = "A" | "B" | "C" | "D";
export type SizeClass = "small" | "medium" | "large_heavy";
export type Unit = "piece" | "pair" | "set" | "pack";

export type AttributeTemplate =
  | "ENGINE_ASSY" | "TRANSMISSION" | "BRAKE" | "SUSPENSION" | "TYRE" | "RIM" | "BATTERY" | "ROTATING_ELEC"
  | "ELECTRONIC_MODULE" | "LAMP_ASSY" | "BULB" | "FUSE" | "BODY_PANEL" | "MIRROR" | "GLASS" | "INTERIOR"
  | "AC_PART" | "FILTER" | "FLUID" | "BELT" | "WIPER" | "HARDWARE" | "IGNITION" | "GAS_KIT" | "HYBRID"
  | "ACCESSORY" | "GENERIC_PART";

export interface Category {
  id: ID;
  parent_id: ID | null;
  level: 1 | 2 | 3;
  name: string;
  name_bn: string;
  slug: string;
  icon: string; // key for CategoryIcon
  attribute_template: AttributeTemplate;
  needs_position: boolean;
  default_size_class: SizeClass;
  is_electrical: boolean;
  is_restricted: boolean;
  min_photos: number;
  requires_video: boolean;
  synonyms: string[];
}

export type AttributeInput = "chips" | "multi_chips" | "number" | "text" | "checklist" | "date";

export interface AttributeDefinition {
  template: AttributeTemplate;
  key: string;
  label_bn: string;
  label_en: string;
  input_type: AttributeInput;
  options?: { value: string; bn: string; en: string }[];
  unit?: string;
  required: boolean;
}

export interface Brand {
  id: ID;
  name: string;
  type: "oem_vehicle" | "oem_supplier" | "aftermarket" | "local";
  country: string;
}

export type PositionKey = "front" | "rear" | "driver" | "passenger" | "upper" | "lower" | "inner" | "outer";

export interface Fitment {
  make_id: ID | null;
  model_id: ID | null;
  generation_id: ID | null;
  engine_id: ID | null;
  notes: string | null;
}

export interface CatalogProduct {
  id: ID;
  category_id: ID;
  name: string;
  name_bn: string;
  slug: string;
  brand_id: ID | null;
  source: Source;
  part_number: string | null;
  cross_ref_numbers: string[];
  attributes: Record<string, string | string[] | number>;
  description_bn: string;
  image: string; // emoji/illustration key in the mock
  is_universal: boolean;
  fitments: Fitment[];
  status: "active" | "pending_review" | "merged" | "inactive";
}

export type ListingStatus = "draft" | "pending_review" | "active" | "paused" | "rejected" | "sold_out" | "removed";

export interface ListingMedia {
  url: string; // "ph:<key>" = generated placeholder, "idb:<id>" = uploaded blob
  role: "main" | "label" | "defect" | "running_video" | "other";
}

export interface Listing {
  id: ID;
  vendor_id: ID;
  catalog_product_id: ID | null;
  category_id: ID;
  title: string;
  title_bn: string;
  source: Source;
  condition: Condition;
  grade: Grade | null;
  brand_id: ID | null;
  part_number: string | null;
  origin_country: string | null;
  attributes: Record<string, string | string[] | number>;
  position: PositionKey[];
  price: number;
  compare_at_price: number | null;
  stock_qty: number;
  unit: Unit;
  pack_size: number;
  warranty_days: number;
  is_returnable: boolean;
  return_window_days: number;
  is_electrical: boolean;
  size_class: SizeClass;
  is_fragile: boolean;
  dispatch_days: number; // 0 = today
  is_universal: boolean;
  is_assured_eligible: boolean;
  donor_vehicle_id: ID | null;
  fitments: Fitment[];
  description_bn: string | null;
  media: ListingMedia[];
  quality_score: number;
  status: ListingStatus;
  rejection_reason: string | null;
  views: number;
  sold: number;
  created_at: ISO;
  updated_at: ISO;
}

export interface DonorVehicle {
  id: ID;
  vendor_id: ID;
  generation_id: ID;
  engine_id: ID | null;
  color: string;
  odometer_km: number | null;
  notes: string | null;
  created_at: ISO;
}

export interface PriceBenchmark {
  category_id: ID;
  condition: Condition;
  p25: number;
  median: number;
  p75: number;
}

// ---------- vendors (12.5) ----------
export type VendorType = "new_parts" | "used_parts" | "halfcut" | "tyre_battery" | "lubricant" | "accessories" | "car_dealer" | "garage";
export type VendorStatus = "onboarding" | "pending_verification" | "active" | "suspended" | "closed";
export type VerificationDoc = "nid_front" | "nid_back" | "selfie" | "trade_license" | "shop_photo" | "visit_report";
export type Fulfillment = "vendor_ship" | "platform_pickup" | "assured_hub" | "store_pickup";

export interface OpeningHours {
  days: number[]; // 0 = Sunday … 6 = Saturday
  open: number; // hour, Asia/Dhaka
  close: number;
}

export interface VendorVerification {
  id: ID;
  doc_type: VerificationDoc;
  file_url: string | null;
  status: "submitted" | "approved" | "rejected" | "missing";
  notes: string | null;
  submitted_at: ISO | null;
}

export interface PayoutMethod {
  id: ID;
  method: "bkash" | "nagad" | "bank";
  account_name: string;
  last4: string;
  is_default: boolean;
  verified: boolean;
}

export interface VendorStaff {
  id: ID;
  name: string;
  phone: string;
  permissions: ("listings" | "orders" | "requests" | "chat" | "finance")[];
  invited_at: ISO;
  accepted: boolean;
}

export interface Vendor {
  id: ID;
  owner_name: string;
  owner_phone: string;
  shop_name: string;
  shop_name_bn: string;
  slug: string;
  logo_color: string;
  vendor_types: VendorType[];
  market_area: string;
  address: string;
  district: string;
  lat: number;
  lng: number;
  specialty_makes: ID[];
  specialty_categories: ID[];
  opening_hours: OpeningHours;
  holiday_mode: boolean;
  is_open: boolean; // manual open/closed toggle from the seller home
  verification_level: 0 | 1 | 2 | 3;
  badges: ("verified" | "trusted" | "assured_partner")[];
  score: number;
  rating_avg: number;
  rating_count: number;
  sales_count: number;
  on_time_rate: number; // 0..1
  response_minutes: number;
  commission_percent: number;
  subscription_tier: "free" | "basic" | "pro";
  accepts_requests: boolean;
  request_daily_limit: number;
  default_return_days: number;
  default_warranty_days: number;
  default_fulfillment: Fulfillment;
  allows_store_pickup: boolean;
  status: VendorStatus;
  agreement_accepted_at: ISO | null;
  joined_at: ISO;
  onboarded_by: ID | null;
  verifications: VendorVerification[];
  payout_methods: PayoutMethod[];
  staff: VendorStaff[];
  description_bn: string | null;
  contact_attempts: number; // phone-number sharing attempts caught in chat
}

// ---------- requests & quotes (12.6) ----------
export type RequestStatus = "new" | "needs_clarification" | "open" | "quotes_received" | "accepted" | "expired" | "cancelled" | "not_found";
export type RequestSource = "web_voice" | "web_photo" | "web_text" | "phone" | "whatsapp";
export type SourcePreference = "genuine" | "good_brand" | "cheapest" | "you_decide";
export type ConditionPreference = "new_only" | "used_ok" | "any";
export type NeededBy = "today" | "2_3_days" | "no_rush";

export interface VoiceNote {
  id: ID;
  url: string;
  mime_type: string;
  duration_sec: number;
  size_bytes: number;
}

export interface MediaItem {
  id: ID;
  url: string;
  kind: "image" | "video";
  name: string;
}

export interface RequestItem {
  category_id: ID | null;
  name: string;
  qty: number;
  position: PositionKey[];
}

export interface RequestQuestion {
  id: ID;
  vendor_id: ID;
  question: string;
  answer: string | null;
  asked_at: ISO;
  answered_at: ISO | null;
}

export interface VendorMatch {
  vendor_id: ID;
  notified_at: ISO;
  seen_at: ISO | null;
  declined: boolean;
  decline_reason: string | null;
}

export interface PartRequest {
  id: ID;
  request_no: string;
  created_at: ISO;
  user_phone: string; // guest or logged-in phone
  contact_name: string | null;
  user_vehicle_id: ID | null;
  generation_id: ID | null;
  engine_id: ID | null;
  vehicle_text: string | null;
  description_text: string | null;
  voice_notes: VoiceNote[];
  photos: MediaItem[];
  preferred_source: SourcePreference;
  preferred_condition: ConditionPreference;
  needed_by: NeededBy;
  items: RequestItem[];
  summary_bn: string | null; // what vendors see (request desk writes this)
  clarity: "clear" | "partly" | "need_call" | null;
  district: string;
  area: string;
  status: RequestStatus;
  source: RequestSource;
  expires_at: ISO;
  broadcast_at: ISO | null;
  matches: VendorMatch[];
  questions: RequestQuestion[];
  assigned_admin: ID | null;
  accepted_quote_ids: ID[];
  team_searching: boolean;
  cancel_reason: string | null;
}

export type QuoteStatus = "submitted" | "withdrawn" | "accepted" | "not_selected" | "expired";

export interface Quote {
  id: ID;
  request_id: ID;
  vendor_id: ID;
  item_index: number;
  listing_id: ID | null;
  title: string;
  source: Source;
  condition: Condition;
  grade: Grade | null;
  brand_id: ID | null;
  part_number: string | null;
  price: number;
  delivery_charge_estimate: number;
  dispatch_days: number;
  warranty_days: number;
  is_returnable: boolean;
  media: string[];
  note_bn: string | null;
  quote_score: number;
  valid_until: ISO;
  status: QuoteStatus;
  withdraw_reason: string | null;
  created_at: ISO;
}

// ---------- cart & orders (12.7) ----------
export interface CartLine {
  listing_id: ID | null;
  quote_id: ID | null;
  qty: number;
}

export interface Address {
  id: ID;
  label: string | null;
  recipient_name: string;
  phone: string;
  division: string;
  district: string;
  area: string;
  address_line: string;
  landmark: string | null;
  voice_note?: VoiceNote | null;
  is_default: boolean;
}

export type PaymentMethod = "cod" | "delivery_advance_cod" | "online" | "manual_advance";
export type PaymentStatus = "unpaid" | "partial" | "paid" | "refunded" | "partially_refunded";

export type VendorOrderStatus =
  | "pending_vendor" | "accepted" | "rejected_by_vendor" | "ready_to_ship" | "picked_up" | "at_hub_qc" | "qc_failed"
  | "shipped" | "delivered" | "cancelled" | "return_requested" | "returned" | "completed";

export interface OrderItemSnapshot {
  title: string;
  source: Source;
  condition: Condition;
  grade: Grade | null;
  image: string;
  warranty_days: number;
  is_returnable: boolean;
  return_window_days: number;
  is_electrical: boolean;
  fits_user_vehicle: boolean | null; // was "my car" set and did the listing claim a fit?
}

export interface OrderItem {
  id: ID;
  listing_id: ID | null;
  quote_id: ID | null;
  snapshot: OrderItemSnapshot;
  unit_price: number;
  qty: number;
  line_total: number;
}

export interface StatusEvent {
  from: string | null;
  to: string;
  actor: "customer" | "vendor" | "admin" | "system";
  note: string | null;
  at: ISO;
}

export interface VendorOrder {
  id: ID;
  order_id: ID;
  vendor_id: ID;
  sub_order_no: string; // e.g. GH-4821-B
  status: VendorOrderStatus;
  fulfillment: Fulfillment;
  items: OrderItem[];
  subtotal: number;
  delivery_charge: number;
  commission_amount: number;
  vendor_payable: number;
  cod_amount: number;
  courier: string | null;
  tracking_no: string | null;
  pickup_code: string | null;
  packing_photo: string | null;
  accept_by: ISO;
  handover_by: ISO | null;
  deliver_by: ISO | null;
  delivered_at: ISO | null;
  return_window_ends_at: ISO | null;
  settled_at: ISO | null;
  reject_reason: string | null;
  qc: { result: "pass" | "fail"; note: string | null; at: ISO } | null;
  history: StatusEvent[];
  reviewed: boolean;
}

export interface Payment {
  id: ID;
  method: "cod" | "bkash_manual" | "nagad_manual" | "gateway";
  amount: number;
  purpose: "advance" | "full" | "delivery_charge" | "cod_collection";
  sender_number: string | null;
  transaction_id: string | null;
  status: "initiated" | "submitted" | "verified" | "failed" | "rejected" | "refunded";
  verified_by: ID | null;
  created_at: ISO;
}

export interface Order {
  id: ID;
  order_no: string;
  created_at: ISO;
  user_phone: string;
  customer_name: string;
  address: Address;
  user_vehicle_id: ID | null;
  subtotal: number;
  delivery_total: number;
  discount_total: number;
  grand_total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  advance_due: number;
  source: "cart" | "request" | "admin_phone";
  vendor_order_ids: ID[];
  payments: Payment[];
}

// ---------- money (12.8) ----------
export type LedgerEntryType = "sale_credit" | "commission_debit" | "delivery_debit" | "refund_debit" | "payout_debit" | "adjustment" | "penalty";

export interface LedgerEntry {
  id: ID;
  vendor_id: ID;
  vendor_order_id: ID | null;
  entry_type: LedgerEntryType;
  amount: number;
  available_at: ISO;
  note: string;
  created_at: ISO;
}

export interface Payout {
  id: ID;
  vendor_id: ID;
  amount: number;
  method_id: ID;
  status: "requested" | "processing" | "paid" | "failed";
  reference: string | null;
  created_at: ISO;
  paid_at: ISO | null;
}

export interface Refund {
  id: ID;
  order_id: ID;
  vendor_order_id: ID | null;
  claim_id: ID | null;
  amount: number;
  method: string;
  destination: string;
  status: "pending" | "processing" | "done";
  due_by: ISO;
  processed_at: ISO | null;
  reference: string | null;
  created_at: ISO;
}

// ---------- claims, reviews, complaints (12.9) ----------
export type ClaimType = "not_as_described" | "wrong_fitment" | "damaged_on_arrival" | "missing_item" | "warranty" | "change_of_mind" | "not_delivered";
export type ClaimStatus =
  | "submitted" | "vendor_review" | "vendor_accepted" | "vendor_disputed" | "escalated" | "admin_review"
  | "resolved_refund" | "resolved_replace" | "resolved_rejected" | "awaiting_return" | "closed";

export interface Claim {
  id: ID;
  claim_no: string;
  vendor_order_id: ID;
  order_item_id: ID;
  user_phone: string;
  vendor_id: ID;
  type: ClaimType;
  description: string | null;
  media: MediaItem[];
  voice_notes: VoiceNote[];
  status: ClaimStatus;
  liability: "vendor" | "customer" | "review"; // rule suggestion (file 00 9.1)
  vendor_response: string | null;
  vendor_respond_by: ISO;
  resolution: "refund" | "replace" | "partial_refund" | "rejected" | null;
  refund_amount: number | null;
  decision_note: string | null;
  created_at: ISO;
  history: StatusEvent[];
}

export interface Review {
  id: ID;
  vendor_order_id: ID | null;
  user_name: string;
  vendor_id: ID;
  listing_id: ID | null;
  rating: number;
  tags: string[];
  comment: string | null;
  vendor_reply: string | null;
  created_at: ISO;
}

export interface Complaint {
  id: ID;
  complaint_no: string;
  user_phone: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  first_response_by: ISO;
  first_response_at: ISO | null;
  assigned_to: ID | null;
  created_at: ISO;
}

export interface Report {
  id: ID;
  reporter: string;
  target_type: "listing" | "vendor" | "review" | "message";
  target_id: ID;
  reason: "fake" | "stolen_suspect" | "wrong_info" | "scam" | "other";
  details: string | null;
  status: "open" | "actioned" | "dismissed";
  created_at: ISO;
}

// ---------- messaging (12.10) ----------
export type ThreadType = "customer_vendor" | "customer_support" | "vendor_support";

export interface ChatMessage {
  id: ID;
  sender: "customer" | "vendor" | "support" | "system";
  type: "text" | "voice" | "image" | "listing_card" | "quote_card" | "order_card" | "offer_card" | "system";
  body: string | null;
  contains_contact_info: boolean;
  voice?: VoiceNote;
  image?: MediaItem;
  ref_id?: ID;
  offer_price?: number;
  created_at: ISO;
}

export interface ChatThread {
  id: ID;
  type: ThreadType;
  customer_phone: string | null;
  customer_name: string | null;
  vendor_id: ID | null;
  context_type: "listing" | "quote" | "request" | "vendor_order" | null;
  context_id: ID | null;
  messages: ChatMessage[];
  unread_customer: number;
  unread_vendor: number;
  unread_support: number;
  last_message_at: ISO;
}

export interface CallRequest {
  id: ID;
  requester_phone: string;
  target_type: "vendor" | "support";
  target_id: ID | null;
  context: string;
  status: "pending" | "done";
  created_at: ISO;
}

export interface AppNotification {
  id: ID;
  audience: "customer" | "vendor" | "admin";
  target: string; // phone for customer, vendor id, or "all" for admin
  title: string;
  body: string;
  link: string;
  created_at: ISO;
  read: boolean;
}

// ---------- admin-side (file 03 section 3) ----------
export type StaffRole =
  | "super_admin" | "ops_manager" | "request_desk" | "vendor_success" | "field_agent" | "catalog_manager"
  | "trust_safety" | "finance" | "logistics" | "car_desk";

export interface Staff {
  id: ID;
  name: string;
  phone: string;
  roles: StaffRole[];
  active: boolean;
}

export type ModerationReason = "new_vendor" | "restricted_category" | "reported" | "duplicate_image" | "price_anomaly" | "stolen_risk" | "contact_sharing" | "random_audit";

export interface ModerationItem {
  id: ID;
  target_type: "listing" | "vendor" | "review" | "message";
  target_id: ID;
  reason: ModerationReason;
  priority: 1 | 2 | 3; // 1 = highest
  status: "open" | "approved" | "changes_requested" | "rejected";
  decision_note: string | null;
  created_at: ISO;
}

export interface VendorLead {
  id: ID;
  shop_name: string;
  market_area: string;
  phone: string;
  specialty: string;
  status: "new" | "contacted" | "visit_scheduled" | "onboarded" | "not_interested";
  owner_agent: ID | null;
  created_at: ISO;
}

export interface FieldVisit {
  id: ID;
  agent_id: ID;
  vendor_id: ID | null;
  lead_id: ID | null;
  purpose: "onboarding" | "verification" | "assisted_upload" | "training" | "audit";
  at: ISO;
  listings_created: number;
  report: string | null;
}

export interface WhatsAppIntake {
  id: ID;
  from_phone: string;
  sender_kind: "vendor" | "customer" | "unknown";
  vendor_id: ID | null;
  text: string | null;
  media_count: number;
  has_voice: boolean;
  type: "listing" | "request" | "support" | null;
  status: "new" | "handled";
  created_at: ISO;
}

export interface CallLog {
  id: ID;
  phone: string;
  staff_id: ID;
  channel: "phone_in" | "phone_out" | "whatsapp";
  purpose: string;
  ref: string | null;
  summary: string;
  created_at: ISO;
}

export interface PickupRound {
  id: ID;
  market_area: string;
  date: ISO;
  slot: string;
  rider_id: ID | null;
  status: "planned" | "in_progress" | "done";
  vendor_order_ids: ID[];
}

export interface Rider {
  id: ID;
  name: string;
  phone: string;
  area: string;
  active: boolean;
}

export interface AuditLog {
  id: ID;
  staff_id: ID;
  action: string;
  target: string;
  at: ISO;
}

export interface GarageDocTask {
  id: ID;
  user_phone: string;
  user_vehicle_id: ID;
  kind: "setup_from_papers" | "doc_expiry";
  doc_type: VehicleDocType | null;
  status: "open" | "done";
  created_at: ISO;
}

export interface Profile {
  phone: string;
  full_name: string | null;
  customer_type: "personal" | "driver" | "mechanic" | "fleet";
  large_text: boolean;
  force_advance: boolean;
  is_blocked: boolean;
  followed_vendor_ids: ID[];
  notify_sms: boolean;
}
