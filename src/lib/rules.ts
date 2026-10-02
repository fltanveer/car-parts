// Business rules from spec section 8, as pure functions. UI shows what these
// return; the backend must recompute with the same logic.
import { toBnDigits } from "./format";
import { deliveryDays, deliveryRates, fragilePackingCharge, settings, zoneForDistrict } from "./mock/settings";
import type { ClaimType, DeliveryMethod, Order, OrderItem, Part, SizeClass } from "./types";

const SIZE_RANK: Record<SizeClass, number> = { small: 0, medium: 1, large_heavy: 2 };

export interface DeliveryQuote {
  method: DeliveryMethod;
  charge: number;
  packing: number;
  days: [number, number];
}

export const getDeliveryQuote = (district: string, items: Pick<Part, "size_class" | "is_fragile">[]): DeliveryQuote => {
  const zone = zoneForDistrict(district);
  const size = items.reduce<SizeClass>((max, p) => (SIZE_RANK[p.size_class] > SIZE_RANK[max] ? p.size_class : max), "small");
  const rate = deliveryRates.find((r) => r.zone === zone && r.size_class === size)!;
  return {
    method: rate.method,
    charge: rate.charge,
    packing: items.some((p) => p.is_fragile) ? fragilePackingCharge : 0,
    days: deliveryDays[rate.method],
  };
};

export type PaymentOption = "cod" | "delivery_advance" | "full_advance" | "partial_advance";

export interface PaymentPlan {
  options: { id: PaymentOption; advance: number; cod: number }[];
  needsConfirmationCall: boolean;
}

// Spec 8.2
export const getPaymentPlan = (args: {
  orderType: "stock" | "sourcing";
  total: number;
  deliveryCharge: number;
  method: DeliveryMethod;
  isNewCustomer: boolean;
  forceAdvance?: boolean;
  advancePercent?: number;
}): PaymentPlan => {
  const { orderType, total, deliveryCharge, method, isNewCustomer, forceAdvance } = args;
  const needsConfirmationCall = (isNewCustomer && total > settings.new_customer_call_threshold) || !!forceAdvance;
  const full = { id: "full_advance" as const, advance: total, cod: 0 };

  if (orderType === "sourcing") {
    const pct = args.advancePercent ?? settings.sourcing_advance_percent_default;
    const adv = Math.round((total * pct) / 100);
    return { options: [{ id: "partial_advance", advance: adv, cod: total - adv }, full], needsConfirmationCall };
  }
  if (method === "branch_pickup") {
    const adv = Math.round((total * settings.heavy_advance_percent) / 100);
    return { options: [{ id: "partial_advance", advance: adv, cod: total - adv }, full], needsConfirmationCall };
  }
  if (forceAdvance) {
    return { options: [{ id: "delivery_advance", advance: deliveryCharge, cod: total - deliveryCharge }, full], needsConfirmationCall };
  }
  if (total <= settings.cod_limit) {
    return { options: [{ id: "cod", advance: 0, cod: total }, full], needsConfirmationCall };
  }
  return { options: [{ id: "delivery_advance", advance: deliveryCharge, cod: total - deliveryCharge }, full], needsConfirmationCall };
};

// Spec 8.1
export interface ClaimOption {
  type: ClaimType;
  eligible: boolean;
  rule_bn: string;
  rule_en: string;
  reason_bn?: string;
  reason_en?: string;
}

const DAY = 86_400_000;

export const getClaimOptions = (order: Order, item: OrderItem, now = Date.now()): ClaimOption[] => {
  const delivered = order.delivered_at ? new Date(order.delivered_at).getTime() : null;
  const sinceDelivery = delivered ? now - delivered : Infinity;
  const opts: ClaimOption[] = [];

  opts.push({
    type: "wrong_part_our_fault",
    eligible: delivered != null,
    rule_bn: "আমাদের ভুলে ভুল পার্ট গেলে ফ্রি রিপ্লেসমেন্ট বা পুরো টাকা ফেরত। আসা-যাওয়ার খরচ আমাদের।",
    rule_en: "If we sent the wrong part: free replacement or full refund. We pay shipping both ways.",
  });

  const damageWindow = settings.damage_claim_hours * 3_600_000;
  opts.push({
    type: "damaged_on_arrival",
    eligible: sinceDelivery <= damageWindow,
    rule_bn: `ডেলিভারির ${toBnDigits(settings.damage_claim_hours)} ঘণ্টার মধ্যে ছবি/ভিডিওসহ জানাতে হবে। খরচ আমাদের।`,
    rule_en: `Report within ${settings.damage_claim_hours} hours of delivery with photos/video. We cover the cost.`,
    reason_bn: `ডেলিভারির ${toBnDigits(settings.damage_claim_hours)} ঘণ্টা পার হয়ে গেছে।`,
    reason_en: `More than ${settings.damage_claim_hours} hours since delivery.`,
  });

  if (item.warranty_months_snapshot > 0) {
    const expires = (delivered ?? now) + item.warranty_months_snapshot * 30 * DAY;
    opts.push({
      type: "warranty",
      eligible: now <= expires,
      rule_bn: "মেয়াদের মধ্যে, সিল/স্টিকার অক্ষত থাকলে। ভুল ইনস্টলেশন বা দুর্ঘটনা কাভার নয়। পাঠানোর খরচ আপনার, ফেরত পাঠানো আমাদের।",
      rule_en: "Within warranty, seals intact. Bad installation and accidents not covered. You ship it in, we ship it back.",
      reason_bn: "ওয়ারেন্টির মেয়াদ শেষ।",
      reason_en: "Warranty has expired.",
    });
  }

  let mistakeEligible = true;
  let reason_bn: string | undefined;
  let reason_en: string | undefined;
  if (item.is_electrical_snapshot) {
    mistakeEligible = false;
    reason_bn = "ইলেকট্রিক্যাল পার্ট (সেন্সর, রিলে, বাল্ব ইত্যাদি) মন বদলালে ফেরত হয় না।";
    reason_en = "Electrical parts can't be returned for change of mind.";
  } else if (order.order_type === "sourcing") {
    mistakeEligible = false;
    reason_bn = "আনিয়ে দেওয়া পার্ট সাধারণত ফেরত হয় না। আমাদের সাথে কথা বলুন, বিশেষ ক্ষেত্রে ১০ থেকে ১৫% কেটে নেওয়া যেতে পারে।";
    reason_en = "Sourced parts are usually not returnable. Talk to us; in some cases we accept with a 10–15% deduction.";
  } else if (!item.is_returnable_snapshot || sinceDelivery > item.return_window_days_snapshot * DAY) {
    mistakeEligible = false;
    reason_bn = `ফেরতের সময়সীমা (${toBnDigits(item.return_window_days_snapshot)} দিন) পার হয়ে গেছে।`;
    reason_en = `Return window (${item.return_window_days_snapshot} days) has passed.`;
  }
  opts.push({
    type: "customer_mistake",
    eligible: mistakeEligible,
    rule_bn: `স্টকের পার্ট ${toBnDigits(item.return_window_days_snapshot)} দিনের মধ্যে, না লাগানো অবস্থায়, প্যাকেটসহ ফেরত নেওয়া যাবে। আসা-যাওয়ার খরচ আপনার।`,
    rule_en: `Stock parts: within ${item.return_window_days_snapshot} days, unfitted, in original packaging. You pay shipping both ways.`,
    reason_bn,
    reason_en,
  });

  return opts;
};

export const isOpenHours = (d = new Date()) => {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Dhaka" }).format(d));
  return h >= settings.business_hours.open && h < settings.business_hours.close;
};
