"use client";

import { audit, loginCustomer, placeOrder, saveAddress, submitManualPayment } from "@/lib/db/actions";
import { logCall, notifyCustomer } from "@/lib/db/actions-admin-core";
import { getDb, update } from "@/lib/db/store";
import type { Address, Fulfillment, Order, PaymentMethod } from "@/lib/types";
import type { AddressDraft } from "./AddressPayment";

/**
 * Phone order (file 03 6.3): placeOrder attributes the order to the session
 * customer, so we briefly act as that customer and then restore the session.
 */
export const placePhoneOrder = (a: {
  phone: string;
  name: string;
  address: AddressDraft;
  lines: { listingId: string; qty: number }[];
  fulfillment: Record<string, Fulfillment>;
  paymentMethod: PaymentMethod;
  advance: number;
  userVehicleId: string | null;
  trx: { id: string; sender: string } | null;
}): Order | { error: string } => {
  const prev = getDb().session.customerPhone;
  try {
    loginCustomer(a.phone);
    if (a.name) update((s) => ({ profiles: s.profiles.map((p) => (p.phone === a.phone && !p.full_name ? { ...p, full_name: a.name } : p)) }));
    const addrId = a.address.id ?? saveAddress({ ...a.address, label: null, is_default: !getDb().addresses.some((x) => x.owner === a.phone), id: undefined });
    const address: Address = { ...a.address, id: addrId, label: null, is_default: false };
    const s = getDb();
    const lines = a.lines.map((c) => {
      const listing = s.listings.find((l) => l.id === c.listingId)!;
      return { vendor_id: listing.vendor_id, listing, quote: null, qty: c.qty };
    });
    const res = placeOrder({
      lines, address, customerName: a.name || a.address.recipient_name, fulfillment: a.fulfillment, paymentMethod: a.paymentMethod, advance: a.advance,
      userVehicleId: a.userVehicleId, source: "admin_phone",
    });
    if ("error" in res) return { error: res.error };
    if (a.trx && a.advance > 0) submitManualPayment(res.id, { method: "bkash_manual", amount: a.advance, sender: a.trx.sender, trx: a.trx.id });
    logCall({ phone: a.phone, channel: "phone_in", purpose: "ফোনে অর্ডার", ref: res.order_no, summary: `${lines.length}টা পণ্য · ${res.grand_total} টাকা` });
    notifyCustomer(
      a.phone,
      `অর্ডার ${res.order_no} নেওয়া হয়েছে`,
      a.paymentMethod === "online" ? "অনলাইনে পেমেন্ট করতে লিংকে যান" : "দোকান নিশ্চিত করলে জানানো হবে",
      `/my/orders/${res.id}`,
    );
    audit("ফোনে অর্ডার এন্ট্রি", res.order_no);
    return res;
  } finally {
    update((st) => ({ session: { ...st.session, customerPhone: prev } }));
  }
};
