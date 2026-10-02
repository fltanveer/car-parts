import type { DB } from "@/lib/db/seed";
import { settings } from "@/lib/mock/settings";
import type { Vendor } from "@/lib/types";

const DAY = 86_400_000;

/** Derived seller numbers for the admin tables (mock where history is missing). */
export const vendorMetrics = (s: DB, v: Vendor, now: number) => {
  const listings = s.listings.filter((l) => l.vendor_id === v.id);
  const orders = s.vendorOrders.filter((o) => o.vendor_id === v.id);
  const recent = orders.filter((o) => now - new Date(o.history[0]?.at ?? 0).getTime() < 30 * DAY && o.status !== "cancelled" && o.status !== "rejected_by_vendor");
  // Mock: seed has little history, so fold in a monthly share of lifetime sales.
  const sales30 = recent.length + Math.round(v.sales_count / 12);
  const sales30Value = recent.reduce((t, o) => t + o.subtotal, 0) + Math.round(v.sales_count / 12) * 2500;
  const matched = s.requests.filter((r) => r.matches.some((m) => m.vendor_id === v.id)).length;
  const quoted = new Set(s.quotes.filter((q) => q.vendor_id === v.id).map((q) => q.request_id)).size;
  const won = s.quotes.filter((q) => q.vendor_id === v.id && q.status === "accepted").length;
  const claims = s.claims.filter((c) => c.vendor_id === v.id).length;
  const delivered = orders.filter((o) => o.delivered_at).length + v.sales_count;
  return {
    activeListings: listings.filter((l) => l.status === "active").length,
    totalListings: listings.length,
    sales30,
    sales30Value,
    quoteResponse: matched ? Math.round((quoted / matched) * 100) : null,
    winRate: quoted ? Math.round((won / quoted) * 100) : null,
    quoted,
    claimRate: delivered ? Math.round((claims / delivered) * 1000) / 10 : 0,
    claims,
    pendingVerification: v.status === "pending_verification" || v.verifications.some((x) => x.status === "submitted"),
    // No score history in the mock: "falling" = below warn line + buffer or slipping on-time rate.
    scoreFalling: v.status === "active" && (v.score < settings.vendor_score_warn + 15 || v.on_time_rate < 0.85),
  };
};

export const nextLevel = (v: Vendor): 1 | 2 | 3 | null => (v.verification_level >= 3 ? null : ((v.verification_level + 1) as 1 | 2 | 3));
