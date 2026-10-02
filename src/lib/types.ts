// Types mirror the DB schema in carparts-01-user-plan.md section 10,
// so the mock layer in src/lib/api.ts can later be swapped for Supabase.

export type Quality = "genuine" | "oem_equivalent" | "aftermarket" | "reconditioned";
export type Availability = "in_stock" | "sourcing" | "unavailable";
export type SizeClass = "small" | "medium" | "large_heavy";
export type Lang = "bn" | "en";

export interface VehicleMake {
  id: string;
  name: string;
  name_bn: string;
  slug: string;
}

export interface VehicleModel {
  id: string;
  make_id: string;
  name: string;
  name_bn: string;
  slug: string;
  is_popular: boolean;
}

export interface VehicleGeneration {
  id: string;
  model_id: string;
  label: string;
  year_from: number;
  year_to: number | null;
  chassis_codes: string[];
}

export interface VehicleEngine {
  id: string;
  generation_id: string;
  code: string;
  displacement_cc: number;
  fuel_type: "petrol" | "diesel" | "hybrid" | "cng";
}

export interface UserVehicle {
  id: string;
  generation_id: string | null;
  engine_id: string | null;
  chassis_number: string | null;
  nickname: string | null;
  registration_doc_url: string | null;
  is_primary: boolean;
  needs_admin_setup: boolean;
}

export interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  name_bn: string;
  slug: string;
  icon: string; // lucide icon key, see components/ui/CategoryIcon
  is_electrical: boolean;
}

export interface Fitment {
  generation_id: string;
  engine_id: string | null;
  notes: string | null;
}

export interface Part {
  id: string;
  sku: string;
  part_number: string;
  part_number_normalized: string;
  name: string;
  name_bn: string;
  slug: string;
  description: string;
  description_bn: string;
  category_id: string;
  brand: string;
  quality: Quality;
  price: number | null;
  compare_at_price: number | null;
  stock_qty: number;
  availability: Availability;
  sourcing_days_min: number;
  sourcing_days_max: number;
  warranty_months: number;
  warranty_terms: string | null;
  is_returnable: boolean;
  return_window_days: number;
  is_electrical: boolean;
  size_class: SizeClass;
  is_fragile: boolean;
  weight_kg: number;
  fitments: Fitment[];
  rating: number | null;
  review_count: number;
}

export interface Synonym {
  term: string;
  maps_to_keyword: string;
  maps_to_category_slug: string | null;
}

export interface Review {
  id: string;
  part_id: string | null;
  name: string;
  rating: number;
  comment: string;
  vehicle: string;
}

// ---------- user-owned, mutable (client store) ----------

export type PreferredContact = "call" | "whatsapp" | "chat";
export type CallTime = "morning" | "afternoon" | "evening" | "any";

export type RequestStatus =
  | "new"
  | "in_review"
  | "searching"
  | "quoted"
  | "accepted"
  | "advance_pending"
  | "advance_verified"
  | "sourcing"
  | "qc"
  | "shipped"
  | "delivered"
  | "not_found"
  | "cancelled"
  | "expired";

export interface VoiceNote {
  id: string;
  url: string; // object URL in the mock; signed URL later
  mime_type: string;
  duration_sec: number;
  size_bytes: number;
}

export interface MediaItem {
  id: string;
  url: string;
  kind: "image" | "video";
  name: string;
}

export interface RequestQuote {
  id: string;
  part_id: string | null;
  title: string;
  quality: Quality;
  brand: string;
  price: number;
  advance_percent: number;
  advance_amount: number;
  warranty_months: number;
  sourcing_days_min: number;
  sourcing_days_max: number;
  valid_until: string;
  status: "offered" | "accepted" | "rejected" | "expired";
}

export interface PartRequest {
  id: string;
  request_no: string;
  created_at: string;
  guest_phone: string | null;
  contact_name: string | null;
  vehicle_generation_id: string | null;
  vehicle_text: string | null;
  description_text: string | null;
  voice_notes: VoiceNote[];
  photos: MediaItem[];
  preferred_qualities: Quality[] | null;
  preferred_contact: PreferredContact;
  preferred_call_time: CallTime;
  status: RequestStatus;
  quotes: RequestQuote[];
  order_id: string | null;
  cancel_reason: string | null;
}

export type OrderStatus =
  | "pending_confirmation"
  | "confirmed"
  | "advance_pending"
  | "advance_verified"
  | "sourcing"
  | "qc"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export type DeliveryMethod = "home_dhaka" | "home_outside" | "branch_pickup";

export interface Address {
  id: string;
  recipient_name: string;
  phone: string;
  division: string;
  district: string;
  area: string;
  address_line: string;
  landmark: string | null;
  voice_note?: VoiceNote | null; // spoken address / landmark (spec 7.10)
  is_default: boolean;
}

export interface OrderItem {
  id: string;
  part_id: string | null;
  quote_id: string | null;
  title_snapshot: string;
  quality_snapshot: Quality;
  unit_price: number;
  qty: number;
  warranty_months_snapshot: number;
  is_returnable_snapshot: boolean;
  is_electrical_snapshot: boolean;
  return_window_days_snapshot: number;
}

export interface Payment {
  id: string;
  method: "bkash" | "nagad" | "cod";
  amount: number;
  sender_number: string | null;
  transaction_id: string | null;
  screenshot_url?: string | null;
  status: "submitted" | "verified" | "rejected" | "refunded";
  created_at: string;
}

export interface StatusEvent {
  status: string;
  at: string;
}

export interface Order {
  id: string;
  order_no: string;
  created_at: string;
  order_type: "stock" | "sourcing";
  status: OrderStatus;
  address: Address;
  items: OrderItem[];
  subtotal: number;
  delivery_charge: number;
  packing_charge: number;
  discount: number;
  total: number;
  advance_required: number;
  advance_paid: number;
  cod_amount: number;
  delivery_method: DeliveryMethod;
  courier_name: string | null;
  tracking_no: string | null;
  rider_phone: string | null;
  needs_confirmation_call: boolean;
  request_id: string | null;
  payments: Payment[];
  history: StatusEvent[];
  delivered_at: string | null;
}

export type ClaimType = "wrong_part_our_fault" | "damaged_on_arrival" | "warranty" | "customer_mistake";
export type ClaimStatus =
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "awaiting_item"
  | "item_received"
  | "replaced"
  | "refunded"
  | "closed";

export interface Claim {
  id: string;
  claim_no: string;
  order_id: string;
  order_item_id: string;
  type: ClaimType;
  description_text: string | null;
  photos: MediaItem[];
  voice_notes: VoiceNote[];
  status: ClaimStatus;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  sender_type: "user" | "admin" | "system";
  type: "text" | "voice" | "image" | "part_card" | "order_card" | "request_card";
  body: string | null;
  voice?: VoiceNote;
  image?: MediaItem;
  ref_id?: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  link: string;
  created_at: string;
  read: boolean;
}

export interface Profile {
  phone: string;
  full_name: string | null;
  account_type: "personal" | "mechanic" | "fleet";
}

export interface CartLine {
  part_id: string;
  qty: number;
}
