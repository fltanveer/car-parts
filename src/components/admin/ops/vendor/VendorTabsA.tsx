"use client";

import Link from "next/link";
import { useT } from "@/components/providers/LangProvider";
import { ConditionBadge, SourceBadge, Stars } from "@/components/shared/Badges";
import { MediaImage } from "@/components/ui/MediaImage";
import { StatusPill } from "@/components/ui/primitives";
import { getCategory, getMarket } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import { displayPhone } from "@/lib/format";
import { listingStatusLabel, vendorOrderStatusLabel, vendorTypeLabel } from "@/lib/labels";
import { vendorScoreBreakdown } from "@/lib/rules";
import type { Vendor } from "@/lib/types";
import { DataTable, Panel } from "../ui";

export function ProfileTab({ v }: { v: Vendor }) {
  const { tx, L, d, date } = useT();
  const agent = useDb((s) => s.staff.find((x) => x.id === v.onboarded_by)?.name ?? "—");
  const row = (k: string, val: React.ReactNode) => (
    <div className="grid grid-cols-[10rem_1fr] gap-2 border-b border-line py-2 text-sm last:border-0">
      <dt className="text-muted">{k}</dt>
      <dd className="font-medium">{val}</dd>
    </div>
  );
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title={tx("প্রোফাইল", "Profile")}>
        <dl>
          {row(tx("মালিক", "Owner"), `${v.owner_name} · ${d(displayPhone(v.owner_phone))}`)}
          {row(tx("বাজার / ঠিকানা", "Market / address"), `${L(getMarket(v.market_area))}${v.address ? ` · ${v.address}` : ""}`)}
          {row(tx("ধরন", "Types"), v.vendor_types.map((t) => `${vendorTypeLabel[t].icon} ${L(vendorTypeLabel[t])}`).join(", "))}
          {row(tx("বিশেষত্ব", "Specialty"), v.specialty_categories.map((c) => getCategory(c)?.name_bn ?? c).join(", ") || "—")}
          {row(tx("সময়", "Hours"), `${d(v.opening_hours.open)}–${d(v.opening_hours.close)} ${v.holiday_mode ? tx("· ছুটিতে", "· on holiday") : ""}`)}
          {row(tx("চুক্তি গ্রহণ", "Agreement accepted"), v.agreement_accepted_at ? `v1 · ${date(v.agreement_accepted_at)}` : tx("না", "No"))}
          {row(tx("যোগ", "Joined"), `${date(v.joined_at)} · ${agent}`)}
          {row(tx("রিকোয়েস্ট নেয়", "Takes requests"), v.accepts_requests ? `✅ ${tx("দৈনিক সীমা", "daily limit")} ${d(v.request_daily_limit)}` : "—")}
          {row(tx("পেআউট", "Payout"), v.payout_methods.map((p) => `${p.method} ••${p.last4}${p.verified ? " ✅" : ""}`).join(", ") || "—")}
        </dl>
      </Panel>
      <Panel title={tx("যাচাইয়ের কাগজ ও কর্মচারী", "Verification docs & staff")}>
        <ul className="mb-4 grid grid-cols-2 gap-2 text-sm">
          {v.verifications.map((x) => (
            <li key={x.id} className="flex items-center justify-between rounded-lg bg-surface px-2.5 py-1.5">
              <span>{x.doc_type}</span>
              <StatusPill tone={x.status === "approved" ? "ok" : x.status === "submitted" ? "wait" : x.status === "rejected" ? "bad" : "info"}>{x.status}</StatusPill>
            </li>
          ))}
        </ul>
        <Link href="/admin/vendors/verification" className="text-sm font-semibold text-brand">{tx("যাচাই কিউতে দেখুন →", "Open in verification queue →")}</Link>
        <p className="mb-1 mt-4 text-sm font-semibold">{tx("কর্মচারী", "Staff")}</p>
        <ul className="text-sm">
          {v.staff.map((s) => <li key={s.id}>{s.name} · {s.permissions.join(", ")} {s.accepted ? "" : tx("(আমন্ত্রিত)", "(invited)")}</li>)}
          {!v.staff.length && <li className="text-muted">—</li>}
        </ul>
      </Panel>
    </div>
  );
}

export function ScoreTab({ v }: { v: Vendor }) {
  const { tx, L, d } = useT();
  const parts = vendorScoreBreakdown(v);
  return (
    <Panel title={tx(`স্কোর ${d(v.score)} / ১০০`, `Score ${v.score} / 100`)}>
      <ul className="space-y-3">
        {parts.map((p) => (
          <li key={p.key}>
            <div className="flex justify-between text-sm">
              <span>{L(p)}</span>
              <span className="font-semibold tabular-nums">{d(p.points)} / {d(p.weight)}</span>
            </div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-surface">
              <div className={`h-full ${p.value < 0.5 ? "bg-bad" : p.value < 0.75 ? "bg-wait-bg" : "bg-ok"}`} style={{ width: `${Math.round(p.value * 100)}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">{tx("সময়ের সাথে স্কোরের ইতিহাস রাতের হিসাব চালু হলে দেখা যাবে।", "Score history appears once nightly recalculation runs.")}</p>
    </Panel>
  );
}

export function ListingsTab({ v }: { v: Vendor }) {
  const { tx, L, taka, d } = useT();
  const rows = useDb((s) => s.listings.filter((l) => l.vendor_id === v.id));
  return (
    <DataTable
      rows={rows}
      rowKey={(r) => r.id}
      columns={[
        { key: "t", header: tx("পণ্য", "Item"), sort: (r) => r.title_bn, cell: (r) => <span className="flex items-center gap-2"><MediaImage src={r.media[0]?.url} alt="" className="size-10 rounded-lg" /><span className="font-semibold">{r.title_bn}</span></span> },
        { key: "src", header: tx("উৎস/অবস্থা", "Source/cond."), cell: (r) => <span className="flex flex-wrap gap-1"><SourceBadge source={r.source} /><ConditionBadge condition={r.condition} grade={r.grade} /></span> },
        { key: "p", header: tx("দাম", "Price"), sort: (r) => r.price, cell: (r) => taka(r.price) },
        { key: "s", header: tx("স্টক", "Stock"), sort: (r) => r.stock_qty, cell: (r) => d(r.stock_qty) },
        { key: "q", header: tx("মান", "Quality"), sort: (r) => r.quality_score, cell: (r) => d(r.quality_score) },
        { key: "sold", header: tx("বিক্রি", "Sold"), sort: (r) => r.sold, cell: (r) => d(r.sold) },
        { key: "st", header: tx("অবস্থা", "Status"), cell: (r) => <StatusPill tone={listingStatusLabel[r.status].tone}>{L(listingStatusLabel[r.status])}</StatusPill> },
      ]}
    />
  );
}

export function OrdersTab({ v }: { v: Vendor }) {
  const { tx, L, taka, ago } = useT();
  const rows = useDb((s) => s.vendorOrders.filter((o) => o.vendor_id === v.id));
  return (
    <DataTable
      rows={rows}
      rowKey={(r) => r.id}
      columns={[
        { key: "n", header: tx("সাব-অর্ডার", "Sub-order"), sort: (r) => r.sub_order_no, cell: (r) => <Link href={`/admin/orders/${r.order_id}`} className="font-semibold text-brand">{r.sub_order_no}</Link> },
        { key: "i", header: tx("আইটেম", "Items"), cell: (r) => r.items.map((i) => i.snapshot.title).join(", ") },
        { key: "t", header: tx("মোট", "Total"), sort: (r) => r.subtotal, cell: (r) => taka(r.subtotal) },
        { key: "s", header: tx("অবস্থা", "Status"), cell: (r) => <StatusPill tone={vendorOrderStatusLabel[r.status].tone}>{L(vendorOrderStatusLabel[r.status])}</StatusPill> },
        { key: "a", header: tx("কবে", "When"), sort: (r) => r.history[0]?.at ?? "", cell: (r) => ago(r.history[0]?.at ?? r.accept_by) },
      ]}
    />
  );
}

export function QuotesTab({ v, winRate, quoted }: { v: Vendor; winRate: number | null; quoted: number }) {
  const { tx, taka, d, ago } = useT();
  const rows = useDb((s) => s.quotes.filter((q) => q.vendor_id === v.id));
  const reqs = useDb((s) => s.requests);
  return (
    <div className="space-y-3">
      <p className="text-sm">
        {tx(`দাম দিয়েছে ${d(quoted)}টা রিকোয়েস্টে · জেতার হার ${winRate == null ? "—" : `${d(winRate)}%`} · গড় সাড়া ${d(v.response_minutes)} মিনিট`, `Quoted on ${quoted} requests · win rate ${winRate == null ? "—" : `${winRate}%`} · avg response ${v.response_minutes} min`)}
      </p>
      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        columns={[
          { key: "r", header: tx("রিকোয়েস্ট", "Request"), cell: (r) => <Link href={`/admin/requests/${r.request_id}`} className="font-semibold text-brand">{reqs.find((x) => x.id === r.request_id)?.request_no ?? r.request_id}</Link> },
          { key: "t", header: tx("পণ্য", "Item"), cell: (r) => r.title },
          { key: "p", header: tx("দাম", "Price"), sort: (r) => r.price, cell: (r) => taka(r.price) },
          { key: "s", header: tx("অবস্থা", "Status"), cell: (r) => <StatusPill tone={r.status === "accepted" ? "ok" : r.status === "submitted" ? "wait" : "info"}>{r.status}</StatusPill> },
          { key: "a", header: tx("কবে", "When"), sort: (r) => r.created_at, cell: (r) => ago(r.created_at) },
        ]}
      />
    </div>
  );
}

export function ReviewsTab({ v }: { v: Vendor }) {
  const { tx, ago } = useT();
  const rows = useDb((s) => s.reviews.filter((r) => r.vendor_id === v.id));
  return (
    <Panel title={<span className="flex items-center gap-2">{tx("রিভিউ", "Reviews")} <Stars value={v.rating_avg} count={v.rating_count} /></span>}>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="border-b border-line pb-3 text-sm last:border-0">
            <p className="flex items-center gap-2 font-semibold">{r.user_name} <Stars value={r.rating} /> <span className="text-xs font-normal text-muted">{ago(r.created_at)}</span></p>
            {r.comment && <p>{r.comment}</p>}
            {r.vendor_reply && <p className="mt-1 text-ink-2">↳ {r.vendor_reply}</p>}
          </li>
        ))}
        {!rows.length && <li className="text-muted">{tx("কোনো রিভিউ নেই", "No reviews")}</li>}
      </ul>
    </Panel>
  );
}
