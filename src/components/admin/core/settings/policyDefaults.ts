// Seed policy texts (file 00 §9, §5, §6.3–6.4). Short plain Bangla; the
// numbers here are the launch defaults and must match `settings`.
import { settings } from "@/lib/mock/settings";

export type PolicyKey = "return" | "refund" | "warranty" | "delivery" | "buyer_protection" | "seller_agreement" | "privacy";

export interface PolicyVersion {
  v: number;
  text: string;
  at: string;
  by: string;
}

export const policyMeta: { key: PolicyKey; bn: string; en: string; icon: string }[] = [
  { key: "return", bn: "রিটার্ন", en: "Returns", icon: "↩️" },
  { key: "refund", bn: "রিফান্ড", en: "Refunds", icon: "💸" },
  { key: "warranty", bn: "ওয়ারেন্টি", en: "Warranty", icon: "🛡️" },
  { key: "delivery", bn: "ডেলিভারি", en: "Delivery", icon: "🚚" },
  { key: "buyer_protection", bn: "ক্রেতা সুরক্ষা", en: "Buyer protection", icon: "🤝" },
  { key: "seller_agreement", bn: "বিক্রেতা চুক্তি", en: "Seller agreement", icon: "📝" },
  { key: "privacy", bn: "প্রাইভেসি", en: "Privacy", icon: "🔒" },
];

const s = settings;

const texts: Record<PolicyKey, string> = {
  return: [
    `ভুল জিনিস বা বিবরণের সাথে না মিললে (উৎস, অবস্থা, গ্রেড, ফিটমেন্ট) পুরো টাকা ফেরত বা বদল পাবেন; দুই দিকের খরচ বিক্রেতার।`,
    `ভাঙা বা ত্রুটিপূর্ণ জিনিস পেলে ${s.damage_claim_hours} ঘণ্টার মধ্যে ছবি/ভিডিওসহ দাবি করুন।`,
    `মন বদলালে বা ভুল গাড়ি বেছে থাকলে: লিস্টিং "ফেরতযোগ্য" হলে ${s.return_window_days} দিনের মধ্যে, না লাগানো ও অক্ষত অবস্থায় ফেরত দেওয়া যাবে; খরচ কাস্টমারের।`,
    `ইলেকট্রিক্যাল/ইলেকট্রনিক পার্ট লাগানোর পর ফেরত হয় না, ত্রুটি প্রমাণিত হলে ছাড়া।`,
  ].join("\n"),
  refund: [
    `রিফান্ড যে মাধ্যমে টাকা দিয়েছেন সেই মাধ্যমেই যাবে (bKash/Nagad/কার্ড)।`,
    `বিক্রেতা জিনিস দিতে না পারলে ৪৮ ঘণ্টার মধ্যে জানানো হবে এবং ${s.refund_hours_unfulfillable} ঘণ্টার মধ্যে টাকা ফেরত।`,
    `সময়মতো ডেলিভারি না হলে ${s.refund_days_late} দিনের মধ্যে পুরো টাকা ফেরত।`,
    `ক্যাশ অন ডেলিভারি অর্ডারে টাকা না দিয়ে থাকলে রিফান্ড নেই, শুধু অর্ডার বাতিল।`,
  ].join("\n"),
  warranty: [
    `ওয়ারেন্টি বিক্রেতা দেন; কত দিন তা প্রতিটা জিনিসের পাশে লেখা থাকে।`,
    `ওয়ারেন্টি দাবিতে জিনিস পাঠানোর খরচ কাস্টমারের, ফেরত পাঠানোর খরচ বিক্রেতার।`,
    `বিক্রেতা রাজি না হলে গাড়িহাব মধ্যস্থতা করবে।`,
  ].join("\n"),
  delivery: [
    `টাকা নিশ্চিত হওয়ার ${s.handover_hours} ঘণ্টার মধ্যে বিক্রেতা জিনিস কুরিয়ারে দেবেন।`,
    `একই শহরে ${s.delivery_days_same_city} দিন, অন্য শহরে ${s.delivery_days_other} দিনের মধ্যে ডেলিভারি।`,
    `প্রতিটা দোকানের জিনিস আলাদা প্যাকেটে আসে, তাই ডেলিভারি চার্জ দোকান অনুযায়ী।`,
  ].join("\n"),
  buyer_protection: [
    `অ্যাপে টাকা দিলে টাকা আগে গাড়িহাবের কাছে থাকে।`,
    `ডেলিভারির পর ${s.return_window_days} দিন কোনো সমস্যা না জানালে তবেই বিক্রেতা টাকা পান।`,
    `অ্যাপের বাইরে লেনদেন করলে ক্রেতা সুরক্ষা পাবেন না।`,
  ].join("\n"),
  seller_agreement: [
    `প্রতিটা জিনিসের দাম লিখতে হবে; "দাম জানতে কল করুন" চলবে না।`,
    `অর্ডার ${s.vendor_accept_hours} ঘণ্টার মধ্যে গ্রহণ ও টাকা নিশ্চিতের ${s.handover_hours} ঘণ্টার মধ্যে কুরিয়ারে দিতে হবে।`,
    `কাস্টমারকে নিজের নম্বর দেওয়া বা অ্যাপের বাইরে বিক্রি নিষেধ।`,
    `বিক্রি সম্পন্ন হলে কমিশন কেটে টাকা ওয়ালেটে আসবে, সাপ্তাহিক পেআউট।`,
    `দাবি এলে ${s.vendor_dispute_response_hours} ঘণ্টার মধ্যে সাড়া দিতে হবে।`,
  ].join("\n"),
  privacy: [
    `কাস্টমারের নাম, নম্বর, ঠিকানা বিক্রেতা দেখেন না; শুধু এলাকা/জেলা।`,
    `বিক্রেতার নম্বর কাস্টমারকে দেখানো হয় না; কথা হয় অ্যাপের চ্যাটে।`,
    `ভয়েস রেকর্ডিং ${s.voice_retention_days} দিন পর মুছে ফেলা হয়।`,
    `গাড়ির কাগজ শুধু যাচাইয়ের কাজে দেখা হয়, প্রতিবার অডিট লগে থাকে।`,
  ].join("\n"),
};

export const defaultPolicies = (): Record<PolicyKey, PolicyVersion[]> =>
  Object.fromEntries(
    policyMeta.map((m) => [m.key, [{ v: 1, text: texts[m.key], at: "2026-01-01T00:00:00.000Z", by: "st-super" }]]),
  ) as Record<PolicyKey, PolicyVersion[]>;
