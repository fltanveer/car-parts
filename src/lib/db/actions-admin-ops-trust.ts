"use client";

// Admin trust & customer actions (moderation, complaints, intake, support, customers, garage docs).
import { settings } from "../mock/settings";
import type { Complaint, Listing, ModerationItem, Profile, Report, UserVehicle, VehicleDocType } from "../types";
import { audit, sendMessage } from "./actions";
import { addNote, createVehicleFor, ensureProfile, notif } from "./actions-admin-ops";
import { getCategory } from "./queries";
import { iso, uid } from "./seed";
import { getDb, update } from "./store";

// ======================================================================
// moderation
// ======================================================================
export type ModerationDecision = "approve" | "changes" | "reject";
export const decideModeration = (itemId: string, decision: ModerationDecision, reason: string | null) => {
  const s = getDb();
  const m = s.moderation.find((x) => x.id === itemId)!;
  const status: ModerationItem["status"] = decision === "approve" ? "approved" : decision === "changes" ? "changes_requested" : "rejected";
  const listing = m.target_type === "listing" ? s.listings.find((l) => l.id === m.target_id) : null;
  update((st) => ({
    moderation: st.moderation.map((x) => (x.id === itemId ? { ...x, status, decision_note: reason } : x)),
    listings: listing
      ? st.listings.map((l) =>
          l.id === listing.id
            ? { ...l, status: decision === "approve" ? (l.stock_qty > 0 ? "active" : "sold_out") : decision === "changes" ? "draft" : "rejected", rejection_reason: decision === "approve" ? null : reason, updated_at: iso() }
            : l,
        )
      : st.listings,
    notifications: listing
      ? notif(st, {
          audience: "vendor", target: listing.vendor_id,
          title: decision === "approve" ? "পণ্য অনুমোদিত" : decision === "changes" ? "পণ্যে সংশোধন লাগবে" : "পণ্য বাতিল",
          body: `${listing.title_bn}${reason ? ` · ${reason}` : ""}`, link: `/seller/products/${listing.id}`,
        })
      : st.notifications,
  }));
  audit(`মডারেশন: ${decision}`, `${m.target_type}:${m.target_id}${reason ? ` · ${reason}` : ""}`);
};

/** Daily 2% random audit of directly-published listings from verified sellers (spec 8.3). */
export const sampleRandomAudit = () => {
  const s = getDb();
  const open = new Set(s.moderation.filter((m) => m.status === "open").map((m) => m.target_id));
  const pool = s.listings.filter((l) => l.status === "active" && !open.has(l.id) && (s.vendors.find((v) => v.id === l.vendor_id)?.verification_level ?? 0) >= 2);
  const n = Math.max(1, Math.round((pool.length * settings.random_audit_percent) / 100));
  const pick = [...pool].sort(() => Math.random() - 0.5).slice(0, n);
  update((st) => ({ moderation: [...pick.map((l): ModerationItem => ({ id: uid(), target_type: "listing", target_id: l.id, reason: "random_audit", priority: 3, status: "open", decision_note: null, created_at: iso() })), ...st.moderation] }));
  return pick.length;
};

// ======================================================================
// complaints & reports
// ======================================================================
export const createComplaint = (c: Pick<Complaint, "user_phone" | "subject" | "description">) =>
  update((s) => ({
    complaints: [{ ...c, id: uid(), complaint_no: `CMP-${s.seq.complaint}`, status: "open", first_response_by: iso(settings.complaint_first_response_hours * 3_600_000), first_response_at: null, assigned_to: null, created_at: iso() }, ...s.complaints],
    seq: { ...s.seq, complaint: s.seq.complaint + 1 },
  }));
export const assignComplaint = (id: string, staffId: string | null) => update((s) => ({ complaints: s.complaints.map((c) => (c.id === id ? { ...c, assigned_to: staffId } : c)) }));
export const respondComplaint = (id: string, text: string) => {
  update((s) => {
    const c = s.complaints.find((x) => x.id === id)!;
    return {
      complaints: s.complaints.map((x) => (x.id === id ? { ...x, status: "in_progress", first_response_at: x.first_response_at ?? iso(), assigned_to: x.assigned_to ?? s.session.staffId } : x)),
      notifications: notif(s, { audience: "customer", target: c.user_phone, title: `SMS: অভিযোগ ${c.complaint_no}`, body: text, link: "/my" }),
    };
  });
  addNote(`complaint:${id}`, text, "response");
  audit("অভিযোগে সাড়া", id);
};
export const resolveComplaint = (id: string, text: string, close = false) => {
  update((s) => ({ complaints: s.complaints.map((x) => (x.id === id ? { ...x, status: close ? "closed" : "resolved", first_response_at: x.first_response_at ?? iso() } : x)) }));
  addNote(`complaint:${id}`, text, "resolution");
  audit(close ? "অভিযোগ বন্ধ" : "অভিযোগ সমাধান", id);
};

export const reportToModeration = (reportId: string) =>
  update((s) => {
    const r = s.reports.find((x) => x.id === reportId)!;
    const exists = s.moderation.some((m) => m.target_id === r.target_id && m.status === "open");
    return exists
      ? {}
      : { moderation: [{ id: uid(), target_type: r.target_type, target_id: r.target_id, reason: "reported", priority: 1, status: "open", decision_note: null, created_at: iso() }, ...s.moderation] };
  });
export const closeReport = (reportId: string, outcome: Report["status"], message: string) => {
  update((s) => {
    const r = s.reports.find((x) => x.id === reportId)!;
    return {
      reports: s.reports.map((x) => (x.id === reportId ? { ...x, status: outcome } : x)),
      notifications: notif(s, { audience: "customer", target: r.reporter, title: "আপনার রিপোর্টের ফলাফল", body: message, link: "/my" }),
    };
  });
  audit(`রিপোর্ট ${outcome}`, reportId);
};

// ======================================================================
// WhatsApp intake
// ======================================================================
export const setIntakeType = (id: string, type: "listing" | "request" | "support") => update((s) => ({ intake: s.intake.map((i) => (i.id === id ? { ...i, type } : i)) }));
export const markIntakeHandled = (id: string) => {
  update((s) => ({ intake: s.intake.map((i) => (i.id === id ? { ...i, status: "handled" } : i)) }));
  audit("WhatsApp ইনটেক সম্পন্ন", id);
};

/** Draft listing made by staff for a seller; the seller approves it in their panel. */
export const createDraftListingFor = (vendorId: string, f: { category_id: string; title_bn: string; price: number; stock_qty: number; condition: Listing["condition"]; source: Listing["source"]; media: string[] }) => {
  const cat = getCategory(f.category_id);
  const v = getDb().vendors.find((x) => x.id === vendorId)!;
  const id = `ls-${uid()}`;
  const listing: Listing = {
    id, vendor_id: vendorId, catalog_product_id: null, category_id: f.category_id, title: f.title_bn, title_bn: f.title_bn, source: f.source, condition: f.condition,
    grade: f.condition === "new" ? null : "B", brand_id: null, part_number: null, origin_country: null, attributes: {}, position: [], price: f.price, compare_at_price: null,
    stock_qty: f.stock_qty, unit: "piece", pack_size: 1, warranty_days: v.default_warranty_days, is_returnable: true, return_window_days: v.default_return_days,
    is_electrical: cat?.is_electrical ?? false, size_class: cat?.default_size_class ?? "medium", is_fragile: false, dispatch_days: 1, is_universal: false,
    is_assured_eligible: false, donor_vehicle_id: null, fitments: [], description_bn: null,
    media: (f.media.length ? f.media : ["ph:part"]).map((url, i) => ({ url, role: i === 0 ? "main" : "other" })),
    quality_score: 30, status: "draft", rejection_reason: null, views: 0, sold: 0, created_at: iso(), updated_at: iso(),
  };
  update((s) => ({
    listings: [listing, ...s.listings],
    notifications: notif(s, { audience: "vendor", target: vendorId, title: "গাড়িহাব আপনার পণ্য তুলে দিয়েছে", body: `${f.title_bn}: দেখে "অনুমোদন দিন"`, link: `/seller/products/${id}` }),
  }));
  audit("বিক্রেতার পক্ষে ড্রাফট লিস্টিং", `${v.shop_name_bn} · ${f.title_bn}`);
  return id;
};

// ======================================================================
// support chat
// ======================================================================
export const supportReply = (threadId: string, body: string | null, voice?: { id: string; url: string; mime_type: string; duration_sec: number; size_bytes: number }) => {
  sendMessage(threadId, "support", voice ? { type: "voice", voice, body: null } : { type: "text", body });
  update((s) => ({ threads: s.threads.map((t) => (t.id === threadId ? { ...t, unread_support: 0 } : t)) }));
};

// ======================================================================
// customers & garage
// ======================================================================
export const setCustomerFlag = (phone: string, patch: Partial<Pick<Profile, "force_advance" | "is_blocked">>) => {
  ensureProfile(phone, null);
  update((s) => ({ profiles: s.profiles.map((p) => (p.phone === phone ? { ...p, ...patch } : p)) }));
  audit(`কাস্টমার: ${Object.entries(patch).map(([k, v]) => `${k}=${v}`).join(", ")}`, phone);
};

export const completeGarageTask = (
  taskId: string,
  f: { generation_id: string | null; engine_id: string | null; registration_no: string; expiries: Partial<Record<VehicleDocType, string | null>> },
) => {
  const s = getDb();
  const t = s.garageTasks.find((x) => x.id === taskId)!;
  const docsPatch = (docs: UserVehicle["documents"]) =>
    docs.map((d) => (d.doc_type in f.expiries ? { ...d, expires_on: f.expiries[d.doc_type] ? new Date(f.expiries[d.doc_type]!).toISOString() : null, status: d.file_url || d.status === "pending_review" ? ("ok" as const) : d.status } : d));
  if (s.vehicles.some((v) => v.id === t.user_vehicle_id)) {
    update((st) => ({
      vehicles: st.vehicles.map((v) =>
        v.id === t.user_vehicle_id
          ? { ...v, generation_id: f.generation_id ?? v.generation_id, engine_id: f.engine_id ?? v.engine_id, registration_no: f.registration_no || v.registration_no, needs_admin_setup: false, documents: docsPatch(v.documents) }
          : v,
      ),
    }));
  } else {
    const id = createVehicleFor(t.user_phone, { generation_id: f.generation_id, engine_id: f.engine_id, registration_no: f.registration_no || null });
    update((st) => ({ vehicles: st.vehicles.map((v) => (v.id === id ? { ...v, documents: docsPatch(v.documents) } : v)), garageTasks: st.garageTasks.map((g) => (g.id === taskId ? { ...g, user_vehicle_id: id } : g)) }));
  }
  update((st) => ({
    garageTasks: st.garageTasks.map((g) => (g.id === taskId ? { ...g, status: "done" } : g)),
    notifications: notif(st, { audience: "customer", target: t.user_phone, title: "আপনার গাড়ি সেট করা হয়েছে", body: f.registration_no || "কাগজ দেখে গাড়ির তথ্য বসানো হয়েছে", link: "/garage" }),
  }));
  audit("কাগজ যাচাই সম্পন্ন", `${t.user_phone} · ${taskId}`);
};
