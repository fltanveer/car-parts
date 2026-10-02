// Builds the single "my stuff" list (file 01 §7): orders, requests, claims.
import { vendorById, vendorOrderById } from "@/lib/db/queries";
import type { DB } from "@/lib/db/seed";
import { claimStatusLabel, claimTypeLabel, requestStatusLabel, vendorOrderStatusLabel, type Label, type Tone } from "@/lib/labels";
import type { VendorOrderStatus } from "@/lib/types";

export type Bucket = "ongoing" | "finished" | "cancelled";

export interface MyItem {
  key: string;
  icon: string;
  title: Label;
  sub: string;
  state: Label & { tone: Tone };
  action: (Label & { href: string; tone: "ok" | "bad" | "wait" | "info" }) | null;
  href: string;
  at: string;
  bucket: Bucket;
}

const BAD: VendorOrderStatus[] = ["rejected_by_vendor", "cancelled", "qc_failed"];
const DONE: VendorOrderStatus[] = ["delivered", "completed", "returned"];

export const buildMyItems = (s: DB, phone: string | null, loggedIn: boolean, dg: (n: number | string) => string = String): MyItem[] => {
  if (!phone) return [];
  const items: MyItem[] = [];

  for (const r of s.requests.filter((x) => x.user_phone === phone)) {
    const n = s.quotes.filter((q) => q.request_id === r.id && q.status === "submitted").length;
    const bucket: Bucket = r.status === "cancelled" ? "cancelled" : ["accepted", "expired", "not_found"].includes(r.status) ? "finished" : "ongoing";
    const what = r.description_text ?? r.summary_bn ?? (r.voice_notes.length ? "ভয়েস রিকোয়েস্ট" : "ছবি রিকোয়েস্ট");
    let action: MyItem["action"] = null;
    if (r.status === "quotes_received" && n > 0) action = { bn: `${dg(n)}টা দাম এসেছে, বেছে নিন`, en: `${n} quotes in, choose one`, href: `/request/${r.id}`, tone: "ok" };
    if (r.status === "expired") action = { bn: "মেয়াদ বাড়ান", en: "Extend", href: `/request/${r.id}`, tone: "wait" };
    const st = requestStatusLabel[r.status];
    items.push({
      key: r.id, icon: "🙋", title: { bn: what, en: what }, sub: dg(r.request_no), state: { ...st, tone: st.tone ?? "info" }, action,
      href: `/request/${r.id}`, at: r.created_at, bucket,
    });
  }

  if (!loggedIn) return items.sort((a, b) => b.at.localeCompare(a.at));

  for (const o of s.orders.filter((x) => x.user_phone === phone)) {
    const vos = o.vendor_order_ids.map((id) => vendorOrderById(s, id)).filter((v) => !!v);
    const allBad = vos.length > 0 && vos.every((v) => BAD.includes(v.status));
    const allDone = vos.every((v) => DONE.includes(v.status) || BAD.includes(v.status));
    const bucket: Bucket = allBad ? "cancelled" : allDone ? "finished" : "ongoing";
    const statuses = [...new Set(vos.map((v) => v.status))];
    const st: MyItem["state"] =
      statuses.length === 1
        ? { ...vendorOrderStatusLabel[statuses[0]], tone: vendorOrderStatusLabel[statuses[0]].tone ?? "info" }
        : { bn: `${dg(vos.length)}টা প্যাকেট: ${statuses.map((x) => vendorOrderStatusLabel[x].bn).join(", ")}`, en: `${vos.length} parcels: ${statuses.map((x) => vendorOrderStatusLabel[x].en).join(", ")}`, tone: "wait" };
    const paymentPending = o.payments.some((p) => p.status === "submitted");
    const paymentSent = o.payments.some((p) => p.status === "submitted" || p.status === "verified");
    let action: MyItem["action"] = null;
    if (o.advance_due > 0 && o.payment_status !== "paid" && !paymentSent && !allBad) action = { bn: "অগ্রিম পাঠান", en: "Pay advance", href: `/checkout/pay/${o.id}`, tone: "bad" };
    else if (vos.some((v) => v.fulfillment === "store_pickup" && v.status === "ready_to_ship")) action = { bn: "পিকআপ কোড দেখুন", en: "See pickup code", href: `/my/orders/${o.id}`, tone: "ok" };
    else if (vos.some((v) => DONE.includes(v.status) && !v.reviewed)) action = { bn: "রিভিউ দিন", en: "Leave a review", href: `/my/orders/${o.id}#review`, tone: "ok" };
    const shops = vos.map((v) => vendorById(s, v.vendor_id)?.shop_name_bn ?? "").filter(Boolean).join(", ");
    const first = vos[0]?.items[0]?.snapshot.title ?? o.order_no;
    const more = vos.reduce((n, v) => n + v.items.length, 0) - 1;
    items.push({
      key: o.id, icon: "📦",
      title: { bn: more > 0 ? `${first} + আরও ${dg(more)}টা` : first, en: more > 0 ? `${first} + ${more} more` : first },
      sub: `${o.order_no} · ${shops}`,
      state: paymentPending ? { bn: "পেমেন্ট যাচাই হচ্ছে", en: "Payment being verified", tone: "wait" } : st,
      action, href: `/my/orders/${o.id}`, at: o.created_at, bucket,
    });
  }

  for (const c of s.claims.filter((x) => x.user_phone === phone)) {
    const vo = vendorOrderById(s, c.vendor_order_id);
    if (!vo) continue;
    const st = claimStatusLabel[c.status];
    const open = !["resolved_refund", "resolved_replace", "resolved_rejected", "closed"].includes(c.status);
    const t = claimTypeLabel[c.type];
    items.push({
      key: c.id, icon: "⚠️", title: { bn: `সমস্যা: ${t.bn}`, en: `Problem: ${t.en}` }, sub: `${c.claim_no} · ${vo.sub_order_no}`,
      state: { ...st, tone: st.tone ?? "info" },
      action: c.status === "vendor_disputed" ? { bn: "গাড়িহাবকে জানান", en: "Tell GaariHub", href: `/my/orders/${vo.order_id}/claim`, tone: "bad" } : null,
      href: `/my/orders/${vo.order_id}/claim`, at: c.created_at, bucket: open ? "ongoing" : "finished",
    });
  }

  return items.sort((a, b) => b.at.localeCompare(a.at));
};
