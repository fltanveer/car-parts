// View helpers shared by the checkout, order and claim screens.
import type { ClaimStatus, DeliveryMethod, Order, OrderItem, OrderStatus, Payment, PartRequest } from "@/lib/types";
import type { PaymentOption } from "@/lib/rules";

type L = { bn: string; en: string };

export const deliveryMethodLabel: Record<DeliveryMethod, L & { desc_bn: string; desc_en: string }> = {
  home_dhaka: {
    bn: "ঢাকার ভেতরে হোম ডেলিভারি",
    en: "Home delivery inside Dhaka",
    desc_bn: "কুরিয়ার বা আমাদের রাইডার বাসায় পৌঁছে দেবে।",
    desc_en: "A courier or our own rider brings it to your door.",
  },
  home_outside: {
    bn: "ঢাকার বাইরে হোম ডেলিভারি",
    en: "Home delivery outside Dhaka",
    desc_bn: "ছোট পার্ট, তাই কুরিয়ার বাসায় পৌঁছে দেবে।",
    desc_en: "Small part, so the courier delivers to your door.",
  },
  branch_pickup: {
    bn: "কুরিয়ার শাখা থেকে সংগ্রহ",
    en: "Collect from courier branch",
    desc_bn: "বড়/ভারী পার্ট বাসায় যায় না। আপনার কাছের কুরিয়ার অফিস থেকে নিতে হবে, পৌঁছালে SMS পাবেন।",
    desc_en: "Large/heavy parts can't go door to door. Collect from your nearest courier office; we'll SMS you.",
  },
};

export const paymentMethodLabel: Record<Payment["method"], L> = {
  bkash: { bn: "bKash", en: "bKash" },
  nagad: { bn: "Nagad", en: "Nagad" },
  cod: { bn: "ক্যাশ অন ডেলিভারি", en: "Cash on delivery" },
};

export const paymentStatusLabel: Record<Payment["status"], L> = {
  submitted: { bn: "যাচাই হচ্ছে", en: "Being verified" },
  verified: { bn: "যাচাই হয়েছে", en: "Verified" },
  rejected: { bn: "মেলেনি", en: "Rejected" },
  refunded: { bn: "ফেরত দেওয়া হয়েছে", en: "Refunded" },
};

export const paymentOptionLabel: Record<PaymentOption, L> = {
  cod: { bn: "ক্যাশ অন ডেলিভারি", en: "Cash on delivery" },
  delivery_advance: { bn: "শুধু ডেলিভারি চার্জ আগে, বাকিটা হাতে পেয়ে", en: "Delivery charge now, rest on delivery" },
  partial_advance: { bn: "কিছু টাকা আগে, বাকিটা হাতে পেয়ে", en: "Part advance, rest on delivery" },
  full_advance: { bn: "পুরো টাকা আগে (bKash / Nagad)", en: "Pay everything now (bKash / Nagad)" },
};

export type Bucket = "active" | "done" | "cancelled";

export const orderBucket = (s: OrderStatus): Bucket =>
  s === "delivered" || s === "returned" ? "done" : s === "cancelled" ? "cancelled" : "active";

export const requestBucket = (r: PartRequest): Bucket =>
  r.status === "delivered" ? "done" : r.status === "cancelled" || r.status === "not_found" || r.status === "expired" ? "cancelled" : "active";

// Same 30-day month the claim rules use (lib/rules getClaimOptions), so the
// date on the warranty card matches what the claim screen allows.
export const warrantyExpiry = (order: Order, item: OrderItem): string | null =>
  order.delivered_at && item.warranty_months_snapshot > 0
    ? new Date(new Date(order.delivered_at).getTime() + item.warranty_months_snapshot * 30 * 86_400_000).toISOString()
    : null;

export const advanceDue = (o: Order) => Math.max(0, o.advance_required - o.advance_paid);
export const hasPendingPayment = (o: Order) => o.payments.some((p) => p.status === "submitted");

// Timeline steps for an order (spec 11). Stock orders that needed an advance
// start at advance_pending instead of pending_confirmation.
export const orderFlow = (o: Order): OrderStatus[] => {
  if (o.order_type === "sourcing")
    return ["advance_pending", "advance_verified", "sourcing", "qc", "packed", "shipped", "delivered"];
  if (o.history.some((h) => h.status === "advance_pending") || o.status === "advance_pending" || o.status === "advance_verified")
    return ["advance_pending", "advance_verified", "qc", "packed", "shipped", "delivered"];
  return ["pending_confirmation", "confirmed", "qc", "packed", "shipped", "delivered"];
};

// Claim progress steps shown to the customer (spec 7.13 step 4).
export const claimSteps: { key: string; bn: string; en: string }[] = [
  { key: "submitted", bn: "জমা হয়েছে", en: "Submitted" },
  { key: "under_review", bn: "যাচাই হচ্ছে", en: "Under review" },
  { key: "decision", bn: "অনুমোদিত / বাতিল", en: "Approved / rejected" },
  { key: "awaiting_item", bn: "পার্ট পাঠান (ঠিকানা ও নির্দেশনা দেওয়া হবে)", en: "Send the part (we'll give address & instructions)" },
  { key: "item_received", bn: "পার্ট পেয়েছি", en: "Part received" },
  { key: "resolved", bn: "বদলে দেওয়া হয়েছে / টাকা ফেরত", en: "Replaced / refunded" },
];

export const claimStepIndex = (s: ClaimStatus): number =>
  ({ submitted: 1, under_review: 1, approved: 3, rejected: 2, awaiting_item: 3, item_received: 5, replaced: 6, refunded: 6, closed: 6 })[s];
