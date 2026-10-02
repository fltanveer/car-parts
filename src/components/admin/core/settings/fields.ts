import type { FieldDef } from "./SettingField";

const tk = { unit_bn: "৳", unit_en: "৳" };
const hr = { unit_bn: "ঘণ্টা", unit_en: "hours" };
const dy = { unit_bn: "দিন", unit_en: "days" };
const pc = { unit_bn: "%", unit_en: "%" };

export const SETTING_GROUPS: { id: string; bn: string; en: string; icon: string; fields: FieldDef[] }[] = [
  {
    id: "money", bn: "টাকা ও পেমেন্ট", en: "Money & payment", icon: "💳",
    fields: [
      { k: "cod_limit", bn: "ক্যাশ অন ডেলিভারির সীমা", en: "COD limit", kind: "number", min: 0, ...tk },
      { k: "manual_advance_max_percent", bn: "ম্যানুয়াল অগ্রিম সর্বোচ্চ", en: "Manual advance max", kind: "number", min: 0, max: 10, ...pc, hint_bn: "আইন অনুযায়ী ১০% এর বেশি নয়", hint_en: "Legal cap: 10%" },
      { k: "min_order_value", bn: "সর্বনিম্ন অর্ডার", en: "Minimum order value", kind: "number", min: 0, ...tk },
      { k: "small_order_surcharge", bn: "ছোট অর্ডারের বাড়তি চার্জ", en: "Small order surcharge", kind: "number", min: 0, ...tk },
      { k: "default_commission_percent", bn: "ডিফল্ট কমিশন", en: "Default commission", kind: "number", min: 0, max: 30, ...pc },
      { k: "promo_commission_percent", bn: "প্রচারমূলক কমিশন", en: "Promo commission", kind: "number", min: 0, max: 30, ...pc },
    ],
  },
  {
    id: "sla", bn: "সময় ও SLA", en: "Timing & SLA", icon: "⏱️",
    fields: [
      { k: "vendor_accept_hours", bn: "বিক্রেতার গ্রহণের সময়", en: "Seller accept window", kind: "number", min: 1, ...hr },
      { k: "handover_hours", bn: "কুরিয়ারে হস্তান্তর", en: "Handover to courier", kind: "number", min: 1, max: 48, ...hr, hint_bn: "আইনি সীমা ৪৮ ঘণ্টা", hint_en: "Legal max 48 h" },
      { k: "delivery_days_same_city", bn: "ডেলিভারি (একই শহর)", en: "Delivery (same city)", kind: "number", min: 1, max: 5, ...dy },
      { k: "delivery_days_other", bn: "ডেলিভারি (অন্য শহর)", en: "Delivery (other city)", kind: "number", min: 1, max: 10, ...dy },
      { k: "damage_claim_hours", bn: "ভাঙা জিনিসের দাবি", en: "Damage claim window", kind: "number", min: 1, ...hr },
      { k: "vendor_dispute_response_hours", bn: "দাবিতে বিক্রেতার উত্তর", en: "Seller dispute response", kind: "number", min: 1, ...hr },
      { k: "complaint_first_response_hours", bn: "অভিযোগে প্রথম সাড়া", en: "Complaint first response", kind: "number", min: 1, max: 72, ...hr },
      { k: "refund_hours_unfulfillable", bn: "রিফান্ড (দেওয়া সম্ভব না)", en: "Refund (unfulfillable)", kind: "number", min: 1, max: 72, ...hr },
      { k: "refund_days_late", bn: "রিফান্ড (দেরিতে ডেলিভারি)", en: "Refund (late delivery)", kind: "number", min: 1, max: 10, ...dy },
    ],
  },
  {
    id: "requests", bn: "রিকোয়েস্ট ও ভয়েস", en: "Requests & voice", icon: "🎤",
    fields: [
      { k: "request_expiry_hours", bn: "রিকোয়েস্টের মেয়াদ", en: "Request expiry", kind: "number", min: 1, ...hr },
      { k: "max_quotes_per_request", bn: "প্রতি রিকোয়েস্টে সর্বোচ্চ দাম", en: "Max quotes per request", kind: "number", min: 1, max: 50 },
      { k: "quotes_shown_first", bn: "প্রথমে কয়টা দাম দেখাবে", en: "Quotes shown first", kind: "number", min: 1, max: 10 },
      { k: "guest_requests_per_day", bn: "অতিথির দৈনিক রিকোয়েস্ট", en: "Guest requests per day", kind: "number", min: 0 },
      { k: "max_voice_seconds", bn: "ভয়েস সর্বোচ্চ দৈর্ঘ্য", en: "Max voice length", kind: "number", min: 10, unit_bn: "সেকেন্ড", unit_en: "sec" },
      { k: "voice_warn_seconds", bn: "ভয়েস সতর্কতা", en: "Voice warning at", kind: "number", min: 5, unit_bn: "সেকেন্ড", unit_en: "sec" },
      { k: "voice_retention_days", bn: "ভয়েস রাখা হবে", en: "Voice retention", kind: "number", min: 1, ...dy },
    ],
  },
  {
    id: "returns", bn: "রিটার্ন", en: "Returns", icon: "↩️",
    fields: [{ k: "return_window_days", bn: "রিটার্ন উইন্ডো", en: "Return window", kind: "number", min: 0, ...dy }],
  },
  {
    id: "payouts", bn: "পেআউট", en: "Payouts", icon: "🏦",
    fields: [
      { k: "payout_min", bn: "সর্বনিম্ন পেআউট", en: "Minimum payout", kind: "number", min: 0, ...tk },
      { k: "payout_day", bn: "সাপ্তাহিক পেআউটের দিন", en: "Weekly payout day", kind: "weekday" },
    ],
  },
  {
    id: "trust", bn: "বিশ্বাস ও নিরাপত্তা", en: "Trust & safety", icon: "🛡️",
    fields: [
      { k: "vendor_score_warn", bn: "স্কোর সতর্কতার সীমা", en: "Score warning below", kind: "number", min: 0, max: 100 },
      { k: "vendor_score_suspend", bn: "স্থগিত পর্যালোচনার সীমা", en: "Suspension review below", kind: "number", min: 0, max: 100 },
      { k: "random_audit_percent", bn: "দৈনিক র‍্যান্ডম অডিট", en: "Daily random audit", kind: "number", min: 0, max: 100, ...pc },
      { k: "verified_vendor_publish_limit_l1", bn: "স্তর ১ বিক্রেতার পণ্যের সীমা", en: "Level 1 publish limit", kind: "number", min: 0 },
      { k: "used_airbag_allowed", bn: "ডিপ্লয় না হওয়া পুরনো এয়ারব্যাগ বিক্রি", en: "Undeployed used airbags allowed", kind: "bool" },
    ],
  },
  {
    id: "contact", bn: "যোগাযোগ", en: "Contact", icon: "☎️",
    fields: [
      { k: "hotline", bn: "হটলাইন (কল)", en: "Hotline (dial)", kind: "text" },
      { k: "hotline_display", bn: "হটলাইন (দেখানো)", en: "Hotline (display)", kind: "text" },
      { k: "whatsapp_number", bn: "WhatsApp নম্বর", en: "WhatsApp number", kind: "text" },
      { k: "bkash_number", bn: "bKash নম্বর", en: "bKash number", kind: "text" },
      { k: "nagad_number", bn: "Nagad নম্বর", en: "Nagad number", kind: "text" },
    ],
  },
];

export const FLAGS: { k: "cars" | "services" | "assured" | "gateway"; bn: string; en: string; desc_bn: string; desc_en: string }[] = [
  { k: "cars", bn: "গাড়ি কেনাবেচা", en: "Car marketplace", desc_bn: "ফেজ ২ মডিউল", desc_en: "Phase 2 module" },
  { k: "services", bn: "সেবা ও বুকিং", en: "Services & bookings", desc_bn: "ফেজ ২/৩ মডিউল", desc_en: "Phase 2/3 module" },
  { k: "assured", bn: "Assured হাব QC", en: "Assured hub QC", desc_bn: "হাবে যাচাই করে পাঠানো", desc_en: "QC at the hub before shipping" },
  { k: "gateway", bn: "পেমেন্ট গেটওয়ে", en: "Payment gateway", desc_bn: "চালু হলে অনলাইন এসক্রো পেমেন্ট", desc_en: "Online escrow payments" },
];
