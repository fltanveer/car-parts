// Sensitive audit categories (file 03 §22), matched on the Bangla action text.
export interface AuditCategory {
  id: string;
  bn: string;
  en: string;
  icon: string;
  match: RegExp;
}

export const AUDIT_CATEGORIES: AuditCategory[] = [
  { id: "settings", bn: "কমিশন/সেটিংস", en: "Commission/settings", icon: "⚙️", match: /কমিশন|সেটিং|পলিসি|টেমপ্লেট|ওজন|ডেলিভারি রেট|fulfillment|নিষিদ্ধ|বাজার|অডিও গাইড|স্টাফ|রোল|চুক্তি/ },
  { id: "suspension", bn: "স্থগিত/যাচাই", en: "Suspension/verification", icon: "⛔", match: /স্থগিত|যাচাই|পুনরায় চালু|বন্ধ করা/ },
  { id: "moderation", bn: "মডারেশন", en: "Moderation", icon: "🛡️", match: /মডারেশন|লিস্টিং অনুমোদন|লিস্টিং বাতিল/ },
  { id: "dispute", bn: "বিরোধ", en: "Disputes", icon: "⚖️", match: /বিরোধ|দাবি|জরিমানা/ },
  { id: "refund", bn: "রিফান্ড", en: "Refunds", icon: "💸", match: /রিফান্ড/ },
  { id: "payout", bn: "পেআউট", en: "Payouts", icon: "🏦", match: /পেআউট/ },
  { id: "ledger", bn: "লেজার", en: "Ledger", icon: "📒", match: /লেজার|সমন্বয়/ },
  { id: "chat", bn: "চ্যাট দেখা", en: "Chat viewing", icon: "💬", match: /চ্যাট|মেসেজ দেখা|থ্রেড দেখা/ },
  { id: "docs", bn: "কাগজ দেখা", en: "Document viewing", icon: "📄", match: /কাগজ|ডকুমেন্ট|NID/ },
  { id: "impersonation", bn: "ছদ্মবেশে দেখা", en: "Impersonation", icon: "🕵️", match: /ছদ্মবেশ/ },
];

export const categoryOf = (action: string) => AUDIT_CATEGORIES.find((c) => c.match.test(action)) ?? null;
