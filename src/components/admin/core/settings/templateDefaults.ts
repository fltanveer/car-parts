// SMS / notification templates (file 03 §21). Variables use {name} syntax.
export interface MsgTemplate {
  id: string;
  audience: "customer" | "vendor";
  name_bn: string;
  name_en: string;
  body: string;
  vars: string[];
  enabled: boolean;
}

/** Sample values for live preview. */
export const sampleVars: Record<string, string> = {
  order_no: "GH-4821",
  sub_order_no: "GH-4821-A",
  amount: "৳ ২,৪৫০",
  shop: "রহমান মোটরস",
  customer: "রাকিব",
  hours: "১২",
  request_no: "R-10231",
  part: "Axio ডান হেডলাইট",
  area: "মিরপুর, ঢাকা",
  courier: "Pathao",
  tracking: "PTH123456",
  claim_no: "CL-5012",
  date: "৫ অক্টোবর",
  link: "gaarihub.com/o/4821",
  count: "৩",
};

const t = (id: string, audience: MsgTemplate["audience"], name_bn: string, name_en: string, body: string, vars: string[]): MsgTemplate => ({
  id, audience, name_bn, name_en, body, vars, enabled: true,
});

export const defaultTemplates = (): MsgTemplate[] => [
  t("c-order-placed", "customer", "অর্ডার হয়েছে", "Order placed", "গাড়িহাব: আপনার অর্ডার {order_no} নেওয়া হয়েছে। মোট {amount}। দেখুন: {link}", ["order_no", "amount", "link"]),
  t("c-quote-first", "customer", "প্রথম দাম এসেছে", "First quote", "গাড়িহাব: {request_no} ({part}) এর জন্য {count}টা দোকান দাম দিয়েছে। তুলনা করুন: {link}", ["request_no", "part", "count", "link"]),
  t("c-shipped", "customer", "পাঠানো হয়েছে", "Shipped", "গাড়িহাব: {sub_order_no} {courier} দিয়ে পাঠানো হয়েছে। ট্র্যাকিং {tracking}।", ["sub_order_no", "courier", "tracking"]),
  t("c-delivered", "customer", "ডেলিভারি হয়েছে", "Delivered", "গাড়িহাব: {order_no} পৌঁছেছে। সমস্যা থাকলে অ্যাপে জানান। ধন্যবাদ!", ["order_no"]),
  t("c-refund-done", "customer", "রিফান্ড হয়েছে", "Refund done", "গাড়িহাব: {order_no} এর {amount} ফেরত পাঠানো হয়েছে।", ["order_no", "amount"]),
  t("c-claim-update", "customer", "দাবির সিদ্ধান্ত", "Claim decision", "গাড়িহাব: আপনার দাবি {claim_no} এর সিদ্ধান্ত হয়েছে। দেখুন: {link}", ["claim_no", "link"]),
  t("v-new-order", "vendor", "নতুন অর্ডার", "New order", "গাড়িহাব: নতুন অর্ডার {sub_order_no}, {amount}। {hours} ঘণ্টার মধ্যে গ্রহণ করুন।", ["sub_order_no", "amount", "hours"]),
  t("v-accept-reminder", "vendor", "গ্রহণের রিমাইন্ডার", "Accept reminder", "গাড়িহাব: {sub_order_no} এখনো গ্রহণ করেননি। সময় বাকি {hours} ঘণ্টা।", ["sub_order_no", "hours"]),
  t("v-new-request", "vendor", "নতুন দাম চাওয়া", "New request", "গাড়িহাব: {part} লাগবে ({area})। দাম দিন: {link}", ["part", "area", "link"]),
  t("v-payout-paid", "vendor", "পেআউট পাঠানো", "Payout paid", "গাড়িহাব: {shop}, আপনার {amount} পেআউট পাঠানো হয়েছে ({date})।", ["shop", "amount", "date"]),
  t("v-claim-filed", "vendor", "দাবি জমা", "Claim filed", "গাড়িহাব: {sub_order_no} এ কাস্টমার দাবি {claim_no} করেছে। {hours} ঘণ্টার মধ্যে উত্তর দিন।", ["sub_order_no", "claim_no", "hours"]),
];

/** GSM-7 vs UCS-2 segment count (Bangla → UCS-2: 70 / 67 per part). */
export const smsSegments = (text: string) => {
  const ucs = /[^\x00-\x7F]/.test(text);
  const len = Array.from(text).length;
  const single = ucs ? 70 : 160;
  const multi = ucs ? 67 : 153;
  const segments = len === 0 ? 0 : len <= single ? 1 : Math.ceil(len / multi);
  return { len, ucs, segments, limit: segments <= 1 ? single : multi * segments };
};

export const fillVars = (body: string, values: Record<string, string> = sampleVars) =>
  body.replace(/\{(\w+)\}/g, (m, k: string) => values[k] ?? m);
