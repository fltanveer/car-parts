"use client";

import { useMemo, useState } from "react";
import { ColumnChart, HBarChart } from "@/components/admin/ops/charts";
import { FilterChips, KpiTile, OpsPage, Panel, UrgentTile } from "@/components/admin/ops/ui";
import { useT } from "@/components/providers/LangProvider";
import { useNow } from "@/components/shared/Misc";
import { categoryPath, getMarket, markets } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import { slaTone } from "@/lib/rules";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
type Period = "today" | "week" | "month";

export default function AdminDashboard() {
  const { tx, d, taka, num, lang } = useT();
  const now = useNow();
  const db = useDb((s) => s);
  const [period, setPeriod] = useState<Period>("today");

  const urgent = useMemo(() => {
    const clarify = db.requests.filter((r) => r.status === "needs_clarification" || r.status === "new");
    const oldest = clarify.reduce((m, r) => Math.max(m, now - new Date(r.created_at).getTime()), 0);
    const noQuote = db.requests.filter((r) => r.status === "open" && r.broadcast_at && now - new Date(r.broadcast_at).getTime() > DAY && !db.quotes.some((q) => q.request_id === r.id));
    const acceptSla = db.vendorOrders.filter((v) => v.status === "pending_vendor" && slaTone(v.accept_by, now) !== "ok").length;
    const handoverSla = db.vendorOrders.filter((v) => ["accepted", "ready_to_ship"].includes(v.status) && slaTone(v.handover_by, now) === "late").length;
    const deliverySla = db.vendorOrders.filter((v) => !["delivered", "completed", "cancelled", "rejected_by_vendor", "returned"].includes(v.status) && slaTone(v.deliver_by, now) === "late").length;
    const escalated = db.claims.filter((c) => ["escalated", "admin_review", "vendor_disputed"].includes(c.status)).length;
    const sellerPending = db.claims.filter((c) => c.status === "vendor_review").length;
    const refunds = db.refunds.filter((r) => r.status !== "done");
    const refundsHot = refunds.filter((r) => slaTone(r.due_by, now, 24) !== "ok").length;
    const complaints = db.complaints.filter((c) => !c.first_response_at && c.status === "open");
    const verify = db.vendors.filter((v) => v.status === "pending_verification" || v.verifications.some((x) => x.status === "submitted")).length;
    const mod = db.moderation.filter((m) => m.status === "open");
    const payments = db.orders.reduce((n, o) => n + o.payments.filter((p) => p.status === "submitted").length, 0);
    const intake = db.intake.filter((i) => i.status === "new").length;
    return { clarify: clarify.length, oldest, noQuote: noQuote.length, acceptSla, handoverSla, deliverySla, escalated, sellerPending, refunds: refunds.length, refundsHot, complaints: complaints.length, verify, mod, payments, intake };
  }, [db, now]);

  const kpi = useMemo(() => {
    const span = period === "today" ? DAY : period === "week" ? 7 * DAY : 30 * DAY;
    const since = now - span;
    const inRange = (iso: string) => new Date(iso).getTime() >= since;
    const orders = db.orders.filter((o) => inRange(o.created_at));
    const ids = new Set(orders.map((o) => o.id));
    const subs = db.vendorOrders.filter((v) => ids.has(v.order_id));
    const reqs = db.requests.filter((r) => inRange(r.created_at));
    const firstQuoteMins = reqs
      .map((r) => {
        const qs = db.quotes.filter((q) => q.request_id === r.id).map((q) => new Date(q.created_at).getTime());
        return qs.length && r.broadcast_at ? (Math.min(...qs) - new Date(r.broadcast_at).getTime()) / 60_000 : null;
      })
      .filter((x): x is number => x != null && x >= 0);
    const delivered = db.vendorOrders.filter((v) => v.delivered_at && inRange(v.delivered_at)).length;
    const nad = db.claims.filter((c) => c.type === "not_as_described" && inRange(c.created_at)).length;
    return {
      gmv: orders.reduce((t, o) => t + o.grand_total, 0),
      orders: orders.length,
      commission: subs.reduce((t, v) => t + v.commission_amount, 0),
      active: db.vendors.filter((v) => v.status === "active").length,
      newSellers: db.vendors.filter((v) => inRange(v.joined_at)).length,
      conversion: reqs.length ? Math.round((reqs.filter((r) => r.status === "accepted").length / reqs.length) * 100) : 0,
      firstQuote: firstQuoteMins.length ? Math.round(firstQuoteMins.reduce((a, b) => a + b, 0) / firstQuoteMins.length) : null,
      nadRate: delivered ? Math.round((nad / delivered) * 1000) / 10 : nad ? 100 : 0,
      zeroSearch: { today: 8.4, week: 7.1, month: 6.6 }[period], // mock until search logging exists
    };
  }, [db, now, period]);

  const charts = useMemo(() => {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 14 }, (_, i) => {
      const from = start.getTime() - (13 - i) * DAY;
      const to = from + DAY;
      const within = (iso: string) => {
        const t = new Date(iso).getTime();
        return t >= from && t < to;
      };
      return {
        label: new Date(from).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short" }),
        values: [db.orders.filter((o) => within(o.created_at)).length, db.requests.filter((r) => within(r.created_at)).length],
      };
    });
    const byMarket = markets
      .map((m) => ({ label: lang === "bn" ? m.bn : m.en, value: db.vendors.filter((v) => v.status === "active" && getMarket(v.market_area).id === m.id).length }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);
    const cat = new Map<string, number>();
    db.listings.forEach((l) => {
      const top = categoryPath(l.category_id)[0];
      if (top && l.sold) cat.set(lang === "bn" ? top.name_bn : top.name, (cat.get(lang === "bn" ? top.name_bn : top.name) ?? 0) + l.sold * l.price);
    });
    const byCat = [...cat.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8);
    return { days, byMarket, byCat };
  }, [db, now, lang]);

  const mins = Math.round(urgent.oldest / 60_000);
  const age = mins < 60 ? tx(`সবচেয়ে পুরনো ${d(mins)} মিনিট`, `Oldest ${mins} min`) : tx(`সবচেয়ে পুরনো ${d(Math.round(mins / 60))} ঘণ্টা`, `Oldest ${Math.round(mins / 60)} h`);
  const p = (n: 1 | 2 | 3) => urgent.mod.filter((m) => m.priority === n).length;

  return (
    <OpsPage
      title={tx("ড্যাশবোর্ড", "Dashboard")}
      subtitle={tx("আজকের জরুরি কাজ আগে। টাইলে চাপলে সেই কিউ খুলবে।", "Urgent work first. Tap a tile to open that queue.")}
      guide={tx("উপরের রঙিন টাইলগুলো জরুরি কাজ। লাল মানে এখনই দেখুন, হলুদ মানে শীঘ্রই। টাইলে চাপলে ফিল্টার করা তালিকা খুলবে। নিচে আজ, সপ্তাহ বা মাসের হিসাব দেখুন।", "Coloured tiles are urgent work. Red = now, yellow = soon. Tap a tile to open the filtered queue. Below: numbers for today, week or month.")}
    >
      <h2 className="mb-2 text-lg font-bold">{tx("জরুরি কাজ", "Urgent work")}</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <UrgentTile icon="🔴" tone="bad" label={tx("পরিষ্কার করতে হবে", "Requests to clarify")} count={urgent.clarify} sub={urgent.clarify ? age : undefined} href="/admin/requests?col=clarify" />
        <UrgentTile icon="🟠" tone="wait" label={tx("২৪ ঘণ্টায় দাম আসেনি", "No quote in 24h")} count={urgent.noQuote} href="/admin/requests?col=noquote" />
        <UrgentTile
          icon="⏰" tone="bad" label={tx("SLA লঙ্ঘন", "SLA breaches")} count={urgent.acceptSla + urgent.handoverSla + urgent.deliverySla} href="/admin/orders?sla=1"
          sub={tx(`গ্রহণ ${d(urgent.acceptSla)} · হস্তান্তর ${d(urgent.handoverSla)} · ডেলিভারি ${d(urgent.deliverySla)}`, `Accept ${urgent.acceptSla} · Handover ${urgent.handoverSla} · Delivery ${urgent.deliverySla}`)}
        />
        <UrgentTile icon="⚖️" tone="bad" label={tx("এসকেলেট বিরোধ", "Escalated disputes")} count={urgent.escalated} sub={tx(`বিক্রেতার উত্তর বাকি ${d(urgent.sellerPending)}`, `Seller reply pending ${urgent.sellerPending}`)} href="/admin/disputes" />
        <UrgentTile icon="💸" tone={urgent.refundsHot ? "bad" : "wait"} label={tx("রিফান্ড বাকি", "Refunds due")} count={urgent.refunds} sub={urgent.refundsHot ? tx(`${d(urgent.refundsHot)}টা সময়সীমার কাছে`, `${urgent.refundsHot} near deadline`) : undefined} href="/admin/finance/refunds" />
        <UrgentTile icon="📋" tone="wait" label={tx("অভিযোগ: ৭২ ঘণ্টায় সাড়া বাকি", "Complaints: 72h reply due")} count={urgent.complaints} href="/admin/complaints" />
        <UrgentTile icon="🏪" tone="wait" label={tx("যাচাইয়ের অপেক্ষায় বিক্রেতা", "Sellers awaiting verification")} count={urgent.verify} href="/admin/vendors/verification" />
        <UrgentTile icon="🛡️" tone={p(1) ? "bad" : "wait"} label={tx("মডারেশন কিউ", "Moderation queue")} count={urgent.mod.length} sub={tx(`জরুরি ${d(p(1))} · মাঝারি ${d(p(2))} · সাধারণ ${d(p(3))}`, `P1 ${p(1)} · P2 ${p(2)} · P3 ${p(3)}`)} href="/admin/moderation" />
        <UrgentTile icon="💳" tone="wait" label={tx("যাচাই বাকি পেমেন্ট", "Payments to verify")} count={urgent.payments} href="/admin/finance/payments" />
        <UrgentTile icon="📲" tone="wait" label={tx("WhatsApp ইনটেক", "WhatsApp intake")} count={urgent.intake} href="/admin/intake" />
      </div>

      <div className="mb-2 mt-8 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{tx("সংখ্যা", "Numbers")}</h2>
        <FilterChips<Period>
          value={period}
          onChange={setPeriod}
          items={[
            { value: "today", label: tx("আজ", "Today") },
            { value: "week", label: tx("৭ দিন", "7 days") },
            { value: "month", label: tx("৩০ দিন", "30 days") },
          ]}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiTile label="GMV" value={taka(kpi.gmv)} />
        <KpiTile label={tx("অর্ডার", "Orders")} value={num(kpi.orders)} />
        <KpiTile label={tx("কমিশন আয়", "Commission")} value={taka(kpi.commission)} />
        <KpiTile label={tx("সক্রিয় বিক্রেতা", "Active sellers")} value={num(kpi.active)} sub={tx(`নতুন ${d(kpi.newSellers)}`, `${kpi.newSellers} new`)} />
        <KpiTile label={tx("রিকোয়েস্ট → অর্ডার", "Request → order")} value={`${d(kpi.conversion)}%`} />
        <KpiTile label={tx("প্রথম দামের গড় সময়", "Avg first quote")} value={kpi.firstQuote == null ? "—" : tx(`${d(kpi.firstQuote)} মিনিট`, `${kpi.firstQuote} min`)} />
        <KpiTile label={tx("\"বিবরণের সাথে মেলে না\" হার", "Not-as-described rate")} value={`${d(kpi.nadRate)}%`} sub={tx("ডেলিভারির তুলনায়", "of deliveries")} />
        <KpiTile label={tx("শূন্য ফলাফলের সার্চ", "Zero-result searches")} value={`${d(kpi.zeroSearch)}%`} sub={tx("নমুনা ডেটা", "mock data")} />
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-2">
        <Panel title={tx("দৈনিক অর্ডার ও রিকোয়েস্ট (১৪ দিন)", "Daily orders & requests (14 days)")} className="xl:col-span-2">
          <ColumnChart days={charts.days} series={[tx("অর্ডার", "Orders"), tx("রিকোয়েস্ট", "Requests")]} yLabel={tx("সংখ্যা", "Count")} />
        </Panel>
        <Panel title={tx("বাজার অনুযায়ী সক্রিয় বিক্রেতা", "Active sellers by market")}>
          <HBarChart rows={charts.byMarket} />
        </Panel>
        <Panel title={tx("ক্যাটাগরি অনুযায়ী বিক্রি (মোট টাকা)", "Sales by category (total ৳)")}>
          <HBarChart rows={charts.byCat} format={taka} />
        </Panel>
      </div>
    </OpsPage>
  );
}
