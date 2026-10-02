// Bangla/English labels for every enum. Tone follows rule 10 (file 00 §2):
// ok = green (done/safe), wait = yellow (pending), bad = red (problem), info = neutral.
import type {
  ClaimStatus, ClaimType, Condition, ExpenseCategory, Fulfillment, Grade, ListingStatus, PaymentMethod, RequestStatus, Source,
  StaffRole, VehicleDocType, VendorOrderStatus, VendorStatus, VendorType,
} from "./types";

export type Tone = "ok" | "wait" | "bad" | "info";
export interface Label {
  bn: string;
  en: string;
  tone?: Tone;
  desc_bn?: string;
  desc_en?: string;
}

export const sourceLabel: Record<Source, Label> = {
  genuine: { bn: "জেনুইন", en: "Genuine", desc_bn: "গাড়ির কোম্পানির নিজস্ব (Toyota, Honda বক্স/লোগো)", desc_en: "Made by the car maker" },
  oem_brand: { bn: "নামী ব্র্যান্ড", en: "OEM brand", desc_bn: "যারা কোম্পানিকে সাপ্লাই দেয় (Denso, Aisin, NGK, KYB)", desc_en: "Supplier to car makers (Denso, Aisin, NGK)" },
  aftermarket: { bn: "অন্য ব্র্যান্ড", en: "Aftermarket", desc_bn: "চীন/তাইওয়ান/ভারত/থাইল্যান্ডের ব্র্যান্ডেড পার্ট", desc_en: "Branded part from other makers" },
  local_made: { bn: "দেশি তৈরি", en: "Locally made", desc_bn: "দেশে তৈরি বা মেরামত করা", desc_en: "Made or rebuilt in Bangladesh" },
  unknown: { bn: "জানা নেই", en: "Unknown", desc_bn: "বিক্রেতা নিশ্চিত নন", desc_en: "Seller isn't sure" },
};

export const conditionLabel: Record<Condition, Label> = {
  new: { bn: "নতুন", en: "New", desc_bn: "কখনো ব্যবহার হয়নি", desc_en: "Never used" },
  used_import: { bn: "জাপানি খোলা", en: "Used (import)", desc_bn: "বিদেশি গাড়ি থেকে খোলা", desc_en: "Taken from an imported car" },
  used_local: { bn: "দেশি পুরনো", en: "Used (local)", desc_bn: "দেশের গাড়ি থেকে খোলা", desc_en: "Taken from a local car" },
  refurbished: { bn: "মেরামত করা", en: "Refurbished", desc_bn: "নষ্ট ছিল, ঠিক করে বিক্রি", desc_en: "Repaired and resold" },
  for_parts: { bn: "নষ্ট / পার্টসের জন্য", en: "For parts", desc_bn: "কাজ করে না", desc_en: "Not working" },
};

export const gradeLabel: Record<Grade, Label> = {
  A: { bn: "খুব ভালো", en: "Very good", desc_bn: "প্রায় নতুনের মতো, দাগ নেই বা খুব সামান্য", desc_en: "Like new" },
  B: { bn: "ভালো", en: "Good", desc_bn: "ছোট দাগ/ঘষা, কাজে সমস্যা নেই", desc_en: "Minor marks, works fine" },
  C: { bn: "চলবে", en: "Fair", desc_bn: "স্পষ্ট দাগ/রং চটা, কাজ করে", desc_en: "Visible wear, works" },
  D: { bn: "মেরামত লাগবে", en: "Needs repair", desc_bn: "ছোট সমস্যা আছে", desc_en: "Has a small fault" },
};

export const requestStatusLabel: Record<RequestStatus, Label> = {
  new: { bn: "নতুন", en: "New", tone: "wait" },
  needs_clarification: { bn: "টিম দেখছে", en: "Team reviewing", tone: "wait" },
  open: { bn: "দোকানে পাঠানো", en: "Sent to shops", tone: "wait" },
  quotes_received: { bn: "দাম এসেছে", en: "Quotes in", tone: "ok" },
  accepted: { bn: "অর্ডার হয়েছে", en: "Ordered", tone: "ok" },
  expired: { bn: "মেয়াদ শেষ", en: "Expired", tone: "info" },
  cancelled: { bn: "বাতিল", en: "Cancelled", tone: "bad" },
  not_found: { bn: "পাওয়া যায়নি", en: "Not found", tone: "bad" },
};

export const vendorOrderStatusLabel: Record<VendorOrderStatus, Label> = {
  pending_vendor: { bn: "দোকানের নিশ্চিতের অপেক্ষা", en: "Waiting for shop", tone: "wait" },
  accepted: { bn: "দোকান নিশ্চিত করেছে", en: "Confirmed", tone: "ok" },
  rejected_by_vendor: { bn: "দোকান দিতে পারেনি", en: "Shop declined", tone: "bad" },
  ready_to_ship: { bn: "প্যাক হয়েছে", en: "Packed", tone: "ok" },
  picked_up: { bn: "রাইডার নিয়েছে", en: "Picked up", tone: "ok" },
  at_hub_qc: { bn: "যাচাই হচ্ছে", en: "Quality check", tone: "wait" },
  qc_failed: { bn: "যাচাইয়ে বাতিল", en: "Failed QC", tone: "bad" },
  shipped: { bn: "পথে", en: "On the way", tone: "wait" },
  delivered: { bn: "পৌঁছেছে", en: "Delivered", tone: "ok" },
  cancelled: { bn: "বাতিল", en: "Cancelled", tone: "bad" },
  return_requested: { bn: "ফেরতের অনুরোধ", en: "Return requested", tone: "wait" },
  returned: { bn: "ফেরত এসেছে", en: "Returned", tone: "info" },
  completed: { bn: "সম্পন্ন", en: "Completed", tone: "ok" },
};

export const fulfillmentLabel: Record<Fulfillment, Label & { seller_bn: string; seller_en: string }> = {
  vendor_ship: { bn: "দোকান কুরিয়ারে পাঠাবে", en: "Shop ships by courier", seller_bn: "আপনি কুরিয়ারে দেবেন", seller_en: "You hand to courier" },
  platform_pickup: { bn: "বাসায় ডেলিভারি", en: "Home delivery", seller_bn: "রাইডার নেবে", seller_en: "Rider picks up" },
  assured_hub: { bn: "Assured (যাচাই করে পাঠানো)", en: "Assured (checked before sending)", seller_bn: "Assured হাব", seller_en: "Assured hub" },
  store_pickup: { bn: "দোকান থেকে নিজে নেবো", en: "I'll collect from the shop", seller_bn: "কাস্টমার নিজে আসবে", seller_en: "Customer collects" },
};

export const paymentMethodLabel: Record<PaymentMethod, Label> = {
  cod: { bn: "ক্যাশ অন ডেলিভারি", en: "Cash on delivery" },
  delivery_advance_cod: { bn: "ডেলিভারি চার্জ আগে, বাকি পৌঁছালে", en: "Delivery charge now, rest on delivery" },
  online: { bn: "অনলাইন (bKash/Nagad/কার্ড)", en: "Online (bKash/Nagad/card)" },
  manual_advance: { bn: "bKash/Nagad Send Money", en: "bKash/Nagad Send Money" },
};

export const claimTypeLabel: Record<ClaimType, Label & { icon: string }> = {
  not_as_described: { bn: "ভুল জিনিস / ছবির সাথে মেলে না", en: "Wrong item / not as pictured", icon: "❌" },
  wrong_fitment: { bn: "গাড়িতে লাগছে না", en: "Doesn't fit my car", icon: "🔧" },
  damaged_on_arrival: { bn: "ভাঙা এসেছে", en: "Arrived damaged", icon: "💥" },
  missing_item: { bn: "একটা জিনিস পাইনি", en: "Something missing", icon: "📭" },
  warranty: { bn: "ওয়ারেন্টিতে নষ্ট", en: "Warranty fault", icon: "🛡️" },
  change_of_mind: { bn: "মন বদলেছি", en: "Changed my mind", icon: "🔁" },
  not_delivered: { bn: "পাইনি", en: "Not delivered", icon: "🚫" },
};

export const claimStatusLabel: Record<ClaimStatus, Label> = {
  submitted: { bn: "জমা হয়েছে", en: "Submitted", tone: "wait" },
  vendor_review: { bn: "দোকানের উত্তরের অপেক্ষা", en: "Waiting for shop", tone: "wait" },
  vendor_accepted: { bn: "দোকান মেনে নিয়েছে", en: "Shop accepted", tone: "ok" },
  vendor_disputed: { bn: "দোকান একমত নয়", en: "Shop disputes", tone: "bad" },
  escalated: { bn: "গাড়িহাব দেখছে", en: "GaariHub reviewing", tone: "wait" },
  admin_review: { bn: "গাড়িহাব দেখছে", en: "GaariHub reviewing", tone: "wait" },
  resolved_refund: { bn: "টাকা ফেরত", en: "Refunded", tone: "ok" },
  resolved_replace: { bn: "বদলে দেওয়া হবে", en: "Replacement", tone: "ok" },
  resolved_rejected: { bn: "দাবি বাতিল", en: "Rejected", tone: "bad" },
  awaiting_return: { bn: "ফেরত পাঠানোর অপেক্ষা", en: "Awaiting return", tone: "wait" },
  closed: { bn: "বন্ধ", en: "Closed", tone: "info" },
};

export const listingStatusLabel: Record<ListingStatus, Label> = {
  draft: { bn: "ড্রাফট", en: "Draft", tone: "info" },
  pending_review: { bn: "অনুমোদনের অপেক্ষায়", en: "Pending review", tone: "wait" },
  active: { bn: "চলছে", en: "Live", tone: "ok" },
  paused: { bn: "বন্ধ", en: "Paused", tone: "info" },
  rejected: { bn: "বাতিল", en: "Rejected", tone: "bad" },
  sold_out: { bn: "স্টক শেষ", en: "Sold out", tone: "bad" },
  removed: { bn: "সরানো", en: "Removed", tone: "bad" },
};

export const vendorStatusLabel: Record<VendorStatus, Label> = {
  onboarding: { bn: "শুরু করছে", en: "Onboarding", tone: "wait" },
  pending_verification: { bn: "যাচাই বাকি", en: "Pending verification", tone: "wait" },
  active: { bn: "সক্রিয়", en: "Active", tone: "ok" },
  suspended: { bn: "স্থগিত", en: "Suspended", tone: "bad" },
  closed: { bn: "বন্ধ", en: "Closed", tone: "info" },
};

export const vendorTypeLabel: Record<VendorType, Label & { icon: string }> = {
  new_parts: { bn: "নতুন পার্টস", en: "New parts", icon: "🆕" },
  used_parts: { bn: "পুরনো-জাপানি পার্টস", en: "Used/Japanese parts", icon: "♻️" },
  halfcut: { bn: "হাফকাট", en: "Half-cut", icon: "🚗" },
  tyre_battery: { bn: "টায়ার-ব্যাটারি", en: "Tyres & batteries", icon: "🛞" },
  lubricant: { bn: "তেল-লুব্রিকেন্ট", en: "Oils & lubricants", icon: "🛢️" },
  accessories: { bn: "অ্যাক্সেসরিজ", en: "Accessories", icon: "✨" },
  car_dealer: { bn: "গাড়ি বিক্রি (ডিলার)", en: "Car dealer", icon: "🚙" },
  garage: { bn: "গ্যারেজ-সেবা", en: "Garage / service", icon: "🧰" },
};

export const docTypeLabel: Record<VehicleDocType, Label> = {
  registration: { bn: "রেজিস্ট্রেশন", en: "Registration" },
  tax_token: { bn: "ট্যাক্স টোকেন", en: "Tax token" },
  fitness: { bn: "ফিটনেস", en: "Fitness" },
  insurance: { bn: "ইন্স্যুরেন্স", en: "Insurance" },
  route_permit: { bn: "রুট পারমিট", en: "Route permit" },
  driving_license: { bn: "ড্রাইভিং লাইসেন্স", en: "Driving licence" },
};

export const expenseLabel: Record<ExpenseCategory, Label & { icon: string }> = {
  fuel: { bn: "জ্বালানি", en: "Fuel", icon: "⛽" },
  parts: { bn: "পার্টস", en: "Parts", icon: "🔧" },
  service: { bn: "সার্ভিস", en: "Service", icon: "🧰" },
  papers: { bn: "কাগজ", en: "Papers", icon: "📄" },
  toll: { bn: "টোল", en: "Toll", icon: "🛣️" },
  parking: { bn: "পার্কিং", en: "Parking", icon: "🅿️" },
  other: { bn: "অন্য", en: "Other", icon: "•" },
};

export const staffRoleLabel: Record<StaffRole, Label> = {
  super_admin: { bn: "সুপার অ্যাডমিন", en: "Super admin" },
  ops_manager: { bn: "অপারেশনস", en: "Ops manager" },
  request_desk: { bn: "রিকোয়েস্ট ডেস্ক", en: "Request desk" },
  vendor_success: { bn: "বিক্রেতা সাপোর্ট", en: "Vendor success" },
  field_agent: { bn: "মাঠকর্মী", en: "Field agent" },
  catalog_manager: { bn: "ক্যাটালগ", en: "Catalog manager" },
  trust_safety: { bn: "ট্রাস্ট ও সেফটি", en: "Trust & safety" },
  finance: { bn: "ফাইন্যান্স", en: "Finance" },
  logistics: { bn: "লজিস্টিকস", en: "Logistics" },
  car_desk: { bn: "গাড়ি ডেস্ক", en: "Car desk" },
};

export const sourcePrefLabel = {
  genuine: { bn: "জেনুইন", en: "Genuine" },
  good_brand: { bn: "যেকোনো ভালো ব্র্যান্ড", en: "Any good brand" },
  cheapest: { bn: "সবচেয়ে কম দাম", en: "Cheapest" },
  you_decide: { bn: "আপনারা বলুন", en: "You suggest" },
};
export const conditionPrefLabel = {
  new_only: { bn: "শুধু নতুন", en: "New only" },
  used_ok: { bn: "পুরনো চলবে", en: "Used is fine" },
  any: { bn: "যেকোনো", en: "Any" },
};
export const neededByLabel = {
  today: { bn: "আজই", en: "Today" },
  "2_3_days": { bn: "২-৩ দিনে", en: "2–3 days" },
  no_rush: { bn: "সময় আছে", en: "No rush" },
};

export const positionLabel = {
  front: { bn: "সামনে", en: "Front" },
  rear: { bn: "পেছনে", en: "Rear" },
  driver: { bn: "চালকের দিক (ডান)", en: "Driver side (right)" },
  passenger: { bn: "যাত্রীর দিক (বাম)", en: "Passenger side (left)" },
  upper: { bn: "উপরে", en: "Upper" },
  lower: { bn: "নিচে", en: "Lower" },
  inner: { bn: "ভেতরে", en: "Inner" },
  outer: { bn: "বাইরে", en: "Outer" },
};

export const warrantyLabel = (days: number, lang: "bn" | "en") => {
  if (!days) return lang === "bn" ? "ওয়ারেন্টি নেই" : "No warranty";
  if (days < 30) return lang === "bn" ? `${days} দিন ওয়ারেন্টি` : `${days}-day warranty`;
  const m = Math.round(days / 30);
  return lang === "bn" ? `${m} মাস ওয়ারেন্টি` : `${m}-month warranty`;
};

export const dispatchLabel = (days: number, lang: "bn" | "en") =>
  days === 0 ? (lang === "bn" ? "আজই পাঠাবে" : "Ships today") : days === 1 ? (lang === "bn" ? "কাল পাঠাবে" : "Ships tomorrow") : lang === "bn" ? `${days} দিনে পাঠাবে` : `Ships in ${days} days`;
