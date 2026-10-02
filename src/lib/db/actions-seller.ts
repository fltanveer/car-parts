"use client";

// Seller-panel helpers built on the shared store. Anything that moves money or
// order status uses the core actions in ./actions; these only touch the
// seller's own shop data (docs, staff, listings, donors, chat cards).
import { settings } from "../mock/settings";
import { listingQuality, needsReview } from "../rules";
import type { DonorVehicle, Listing, PayoutMethod, Vendor, VendorStaff, VerificationDoc } from "../types";
import { requestPayout, saveListing, sendMessage } from "./actions";
import { getCategory, vendorBalance, vendorListings } from "./queries";
import { iso, uid } from "./seed";
import { getDb, update } from "./store";

const patchVendor = (id: string, fn: (v: Vendor) => Partial<Vendor>) =>
  update((s) => ({ vendors: s.vendors.map((v) => (v.id === id ? { ...v, ...fn(v) } : v)) }));

// ---------- activity log (kept per shop in localStorage; no table in the mock) ----------
export interface ActivityEntry {
  at: string;
  who: string;
  what: string;
}
const ACT_KEY = (vendorId: string) => `gaarihub:seller-activity:${vendorId}`;
export const readActivity = (vendorId: string): ActivityEntry[] => {
  try {
    const raw = localStorage.getItem(ACT_KEY(vendorId));
    if (raw) return JSON.parse(raw) as ActivityEntry[];
    // Demo history so the log isn't empty on first open.
    const staff = getDb().vendors.find((v) => v.id === vendorId)?.staff.filter((s) => s.accepted) ?? [];
    return staff.flatMap((s, i) => [
      { at: iso(-(i + 1) * 5 * 3_600_000), who: s.name, what: "৫টা পণ্য যোগ করেছে" },
      { at: iso(-(i + 1) * 26 * 3_600_000), who: s.name, what: "GH-4702-A প্যাক করেছে" },
    ]);
  } catch {
    return [];
  }
};
export const logActivity = (vendorId: string, what: string, who?: string) => {
  try {
    const v = getDb().vendors.find((x) => x.id === vendorId);
    const list = [{ at: iso(), who: who ?? v?.owner_name ?? "", what }, ...readActivity(vendorId)].slice(0, 100);
    localStorage.setItem(ACT_KEY(vendorId), JSON.stringify(list));
  } catch {
    /* storage blocked */
  }
};

// ---------- verification & payout ----------
export const submitVerificationDoc = (vendorId: string, docType: VerificationDoc, fileUrl: string) => {
  patchVendor(vendorId, (v) => {
    const exists = v.verifications.some((d) => d.doc_type === docType);
    const doc = { id: uid(), doc_type: docType, file_url: fileUrl, status: "submitted" as const, notes: null, submitted_at: iso() };
    return {
      verifications: exists ? v.verifications.map((d) => (d.doc_type === docType ? { ...d, file_url: fileUrl, status: "submitted", submitted_at: iso(), notes: null } : d)) : [...v.verifications, doc],
      status: v.status === "onboarding" ? "pending_verification" : v.status,
    };
  });
  update((s) => ({
    notifications: [
      { id: uid(), audience: "admin", target: "all", title: "বিক্রেতার কাগজ জমা", body: `${s.vendors.find((v) => v.id === vendorId)?.shop_name_bn ?? ""} · ${docType}`, link: `/admin/vendors/${vendorId}`, created_at: iso(), read: false },
      ...s.notifications,
    ],
  }));
  logActivity(vendorId, `যাচাইয়ের কাগজ জমা (${docType})`);
};

export const addPayoutMethod = (vendorId: string, m: Pick<PayoutMethod, "method" | "account_name"> & { number: string }) =>
  patchVendor(vendorId, (v) => ({
    payout_methods: [
      ...v.payout_methods.map((p) => ({ ...p, is_default: false })),
      { id: uid(), method: m.method, account_name: m.account_name, last4: m.number.replace(/\D/g, "").slice(-4), is_default: true, verified: false },
    ],
  }));

export const setDefaultPayout = (vendorId: string, methodId: string) =>
  patchVendor(vendorId, (v) => ({ payout_methods: v.payout_methods.map((p) => ({ ...p, is_default: p.id === methodId })) }));

export const removePayoutMethod = (vendorId: string, methodId: string) =>
  patchVendor(vendorId, (v) => {
    const rest = v.payout_methods.filter((p) => p.id !== methodId);
    return { payout_methods: rest.some((p) => p.is_default) || !rest.length ? rest : rest.map((p, i) => ({ ...p, is_default: i === 0 })) };
  });

/** Ask the team to send a field agent (visit for level 3, training or photos). */
export const requestFieldAgent = (vendorId: string, purpose: string) => {
  update((s) => {
    const v = s.vendors.find((x) => x.id === vendorId);
    return {
      callRequests: [{ id: uid(), requester_phone: v?.owner_phone ?? "", target_type: "support", target_id: vendorId, context: `মাঠকর্মী: ${purpose} · ${v?.shop_name_bn ?? ""}`, status: "pending", created_at: iso() }, ...s.callRequests],
    };
  });
  logActivity(vendorId, `মাঠকর্মী অনুরোধ: ${purpose}`);
};

/** Seller withdraws money; enforces the platform minimum and available balance. */
export const withdrawMoney = (vendorId: string, amount: number): { error: "min" | "balance" | "method" } | { ok: true } => {
  const s = getDb();
  const v = s.vendors.find((x) => x.id === vendorId);
  const method = v?.payout_methods.find((p) => p.is_default) ?? v?.payout_methods[0];
  if (!method) return { error: "method" };
  if (amount < settings.payout_min) return { error: "min" };
  if (amount > vendorBalance(s, vendorId).available) return { error: "balance" };
  requestPayout(vendorId, amount, method.id);
  logActivity(vendorId, `টাকা তোলার অনুরোধ ৳${amount}`);
  return { ok: true };
};

// ---------- staff ----------
export const inviteStaff = (vendorId: string, name: string, phone: string) => {
  const staff: VendorStaff = { id: uid(), name, phone, permissions: ["listings", "orders"], invited_at: iso(), accepted: false };
  patchVendor(vendorId, (v) => ({ staff: [...v.staff, staff] }));
  logActivity(vendorId, `কর্মচারী আমন্ত্রণ: ${name}`);
};
export const setStaffPermission = (vendorId: string, staffId: string, perm: VendorStaff["permissions"][number], on: boolean) =>
  patchVendor(vendorId, (v) => ({
    staff: v.staff.map((st) => (st.id === staffId ? { ...st, permissions: on ? [...new Set([...st.permissions, perm])] : st.permissions.filter((p) => p !== perm) } : st)),
  }));
export const removeStaff = (vendorId: string, staffId: string) => {
  const name = getDb().vendors.find((v) => v.id === vendorId)?.staff.find((s) => s.id === staffId)?.name ?? "";
  patchVendor(vendorId, (v) => ({ staff: v.staff.filter((s) => s.id !== staffId) }));
  logActivity(vendorId, `কর্মচারী সরানো: ${name}`);
};

// ---------- listings ----------
/** Status a new/resubmitted listing should get (file 02 §5.1, file 00 §6.1). */
export const publishStatus = (vendor: Vendor, categoryId: string): { status: Listing["status"]; reason: "level0" | "limit" | "review" | null } => {
  if (vendor.verification_level === 0) return { status: "draft", reason: "level0" };
  if (vendor.verification_level === 1) {
    const live = vendorListings(getDb(), vendor.id).filter((l) => ["active", "pending_review", "sold_out", "paused"].includes(l.status)).length;
    if (live >= settings.verified_vendor_publish_limit_l1) return { status: "draft", reason: "limit" };
  }
  const restricted = !!getCategory(categoryId)?.is_restricted;
  return needsReview(vendor, restricted) ? { status: "pending_review", reason: "review" } : { status: "active", reason: null };
};

/** Blank listing for a vendor + category with the shop defaults filled in. */
export const blankListing = (vendor: Vendor, categoryId: string): Listing => {
  const c = getCategory(categoryId);
  return {
    id: `ls-${uid()}`, vendor_id: vendor.id, catalog_product_id: null, category_id: categoryId, title: c?.name ?? "", title_bn: c?.name_bn ?? "",
    source: "unknown", condition: "new", grade: null, brand_id: null, part_number: null, origin_country: null, attributes: {}, position: [],
    price: 0, compare_at_price: null, stock_qty: 1, unit: "piece", pack_size: 1, warranty_days: vendor.default_warranty_days,
    is_returnable: vendor.default_return_days > 0, return_window_days: Math.max(settings.return_window_days, vendor.default_return_days),
    is_electrical: c?.is_electrical ?? false, size_class: c?.default_size_class ?? "medium", is_fragile: c?.attribute_template === "GLASS" || c?.attribute_template === "LAMP_ASSY",
    dispatch_days: 0, is_universal: false, is_assured_eligible: false, donor_vehicle_id: null, fitments: [], description_bn: null, media: [],
    quality_score: 0, status: "draft", rejection_reason: null, views: 0, sold: 0, created_at: iso(), updated_at: iso(),
  };
};

/** Save with quality score recomputed and an activity line. */
export const saveSellerListing = (l: Listing, what?: string) => {
  const next = { ...l, quality_score: listingQuality({ ...l, updated_at: iso() }).score };
  saveListing(next);
  if (what) logActivity(l.vendor_id, what);
  return next;
};

export const setListingsStatus = (ids: string[], status: Listing["status"]) =>
  update((s) => ({ listings: s.listings.map((l) => (ids.includes(l.id) ? { ...l, status, updated_at: iso() } : l)) }));

export const adjustPrices = (ids: string[], percent: number) =>
  update((s) => ({
    listings: s.listings.map((l) => (ids.includes(l.id) ? { ...l, price: Math.max(1, Math.round((l.price * (100 + percent)) / 100 / 10) * 10), updated_at: iso() } : l)),
  }));

export const setStock = (id: string, qty: number) =>
  update((s) => ({
    listings: s.listings.map((l) => {
      if (l.id !== id) return l;
      const status = qty === 0 && l.status === "active" ? "sold_out" : qty > 0 && l.status === "sold_out" ? "active" : l.status;
      return { ...l, stock_qty: qty, status, updated_at: iso() };
    }),
  }));

/** "ভুল দেখলে জানান": report a wrong master-product fact to the catalog team. */
export const reportMasterError = (vendorId: string, listingId: string, details: string) =>
  update((s) => ({
    reports: [{ id: uid(), reporter: vendorId, target_type: "listing", target_id: listingId, reason: "wrong_info", details, status: "open", created_at: iso() }, ...s.reports],
  }));

export const reportReviewBySeller = (vendorId: string, reviewId: string, details: string) =>
  update((s) => ({
    reports: [{ id: uid(), reporter: vendorId, target_type: "review", target_id: reviewId, reason: "other", details, status: "open", created_at: iso() }, ...s.reports],
    moderation: [{ id: uid(), target_type: "review", target_id: reviewId, reason: "reported", priority: 2, status: "open", decision_note: null, created_at: iso() }, ...s.moderation],
  }));

// ---------- donor (half-cut) cars ----------
export const addDonor = (d: Omit<DonorVehicle, "id" | "created_at">) => {
  const donor: DonorVehicle = { ...d, id: `dv-${uid()}`, created_at: iso() };
  update((s) => ({ donors: [donor, ...s.donors] }));
  return donor;
};

// ---------- chat cards ----------
export const sendListingCard = (threadId: string, listing: Listing) =>
  sendMessage(threadId, "vendor", { type: "listing_card", body: listing.title_bn, ref_id: listing.id });

export const sendOfferCard = (threadId: string, listing: Listing, price: number) =>
  sendMessage(threadId, "vendor", { type: "offer_card", body: listing.title_bn, ref_id: listing.id, offer_price: price });

/**
 * Seller-side thread with a specific customer (claims/orders). The core
 * openThread() keys on the logged-in customer, so the seller needs its own.
 */
export const openCustomerThread = (vendorId: string, customerPhone: string, contextType: "vendor_order" | "listing", contextId: string) => {
  const s = getDb();
  const existing = s.threads.find((t) => t.type === "customer_vendor" && t.vendor_id === vendorId && t.customer_phone === customerPhone);
  if (existing) return existing.id;
  const id = uid();
  const name = s.orders.find((o) => o.user_phone === customerPhone)?.customer_name ?? null;
  update((st) => ({
    threads: [
      { id, type: "customer_vendor", customer_phone: customerPhone, customer_name: name, vendor_id: vendorId, context_type: contextType, context_id: contextId, messages: [], unread_customer: 0, unread_vendor: 0, unread_support: 0, last_message_at: iso() },
      ...st.threads,
    ],
  }));
  return id;
};

export const markNotificationRead =(id: string) => update((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));

export const registerInterest = (service: string, area: string, phone: string) =>
  update((s) => ({ serviceInterest: [{ service, area, phone, at: iso() }, ...s.serviceInterest] }));
