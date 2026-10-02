"use client";

import { MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CallLogForm } from "@/components/admin/ops/CallLogForm";
import { customerSummary } from "@/components/admin/ops/customerUtils";
import { DataTable, KpiTile, OpsPage, Panel } from "@/components/admin/ops/ui";
import { NotesTab } from "@/components/admin/ops/vendor/VendorTabsB";
import { useT } from "@/components/providers/LangProvider";
import { BackButton } from "@/components/shared/Misc";
import { Notice, StatusPill, Toggle } from "@/components/ui/primitives";
import { setCustomerFlag } from "@/lib/db/actions-admin-ops-trust";
import { describeVehicle } from "@/lib/db/queries";
import { useDb, useHydrated } from "@/lib/db/store";
import { displayPhone } from "@/lib/format";
import { claimStatusLabel, claimTypeLabel, docTypeLabel, paymentMethodLabel, requestStatusLabel } from "@/lib/labels";

export default function Customer360Page() {
  const params = useParams<{ phone: string }>();
  const phone = decodeURIComponent(params.phone);
  const { tx, L, d, taka, ago, date } = useT();
  const hydrated = useHydrated();
  const db = useDb((s) => s);
  if (!hydrated) return null;
  const sum = customerSummary(db, phone);
  const vehicles = db.vehicles.filter((v) => v.owner === phone);
  const addresses = db.addresses.filter((a) => a.owner === phone);
  const requests = db.requests.filter((r) => r.user_phone === phone);
  const orders = db.orders.filter((o) => o.user_phone === phone);
  const orderIds = new Set(orders.map((o) => o.id));
  const voIds = new Set(db.vendorOrders.filter((v) => orderIds.has(v.order_id)).map((v) => v.id));
  const claims = db.claims.filter((c) => c.user_phone === phone);
  const reviews = db.reviews.filter((r) => r.vendor_order_id && voIds.has(r.vendor_order_id));
  const reports = db.reports.filter((r) => r.reporter === phone);
  const complaints = db.complaints.filter((c) => c.user_phone === phone);
  const vn = (id: string) => db.vendors.find((v) => v.id === id)?.shop_name_bn ?? id;

  return (
    <OpsPage
      back={<BackButton href="/admin/customers" label={tx("কাস্টমার", "Customers")} />}
      title={<span className="flex flex-wrap items-center gap-2">{sum.name ?? tx("নাম নেই", "No name")} {sum.profile?.is_blocked && <StatusPill tone="bad">{tx("ব্লক", "Blocked")}</StatusPill>}</span>}
      subtitle={d(displayPhone(phone))}
      guide={tx("এখানে কাস্টমারের সব তথ্য। বারবার COD পার্সেল ফেরত দিলে অগ্রিম বাধ্যতামূলক চালু করুন। প্রতারণা হলে ব্লক করুন। দুটোই অডিট লগে যায়।", "Everything about this customer. Repeated COD refusals: turn on force advance. Fraud: block. Both are audited.")}
      actions={
        <>
          <a href={`tel:${phone}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-ok px-3 text-sm font-semibold text-white"><Phone className="size-4" /> {tx("কল", "Call")}</a>
          <a href={`https://wa.me/${phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border-2 border-ok/40 px-3 text-sm font-semibold text-ok"><MessageCircle className="size-4" /> WhatsApp</a>
        </>
      }
    >
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <KpiTile label={tx("অর্ডার", "Orders")} value={d(sum.orders)} sub={taka(sum.spent)} />
        <KpiTile label={tx("রিকোয়েস্ট", "Requests")} value={d(sum.requests)} sub={tx(`গ্রহণ ${d(requests.filter((r) => r.status === "accepted").length)}`, `${requests.filter((r) => r.status === "accepted").length} accepted`)} />
        <KpiTile label={tx("দাবি", "Claims")} value={d(sum.claims)} />
        <KpiTile label={tx("COD ফেরত", "COD refused")} value={d(sum.codRefusals)} />
        <KpiTile label={tx("ধরন", "Type")} value={sum.profile?.customer_type ?? tx("অতিথি", "Guest")} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-4">
          <Panel title={tx("রিকোয়েস্ট ও দাম গ্রহণের ইতিহাস", "Requests & quote acceptance")}>
            <DataTable
              rows={requests}
              rowKey={(r) => r.id}
              initialSort={{ key: "a", dir: "desc" }}
              columns={[
                { key: "n", header: "#", cell: (r) => <Link href={`/admin/requests/${r.id}`} className="font-semibold text-brand">{r.request_no}</Link> },
                { key: "s", header: tx("কী", "What"), cell: (r) => <span className="line-clamp-2">{r.summary_bn ?? r.description_text ?? "🎤"}</span> },
                { key: "q", header: tx("দাম", "Quotes"), cell: (r) => d(db.quotes.filter((q) => q.request_id === r.id).length) },
                { key: "acc", header: tx("গ্রহণ করা", "Accepted"), cell: (r) => r.accepted_quote_ids.map((id) => { const q = db.quotes.find((x) => x.id === id); return q ? `${vn(q.vendor_id)} · ${taka(q.price)}` : ""; }).join(", ") || "—" },
                { key: "st", header: tx("অবস্থা", "Status"), cell: (r) => <StatusPill tone={requestStatusLabel[r.status].tone}>{L(requestStatusLabel[r.status])}</StatusPill> },
                { key: "a", header: tx("কবে", "When"), sort: (r) => r.created_at, cell: (r) => ago(r.created_at) },
              ]}
            />
          </Panel>
          <Panel title={tx("অর্ডার", "Orders")}>
            <DataTable
              rows={orders}
              rowKey={(o) => o.id}
              initialSort={{ key: "a", dir: "desc" }}
              columns={[
                { key: "n", header: "#", cell: (o) => <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand">{o.order_no}</Link> },
                { key: "t", header: tx("মোট", "Total"), sort: (o) => o.grand_total, cell: (o) => taka(o.grand_total) },
                { key: "p", header: tx("পেমেন্ট", "Payment"), cell: (o) => `${L(paymentMethodLabel[o.payment_method])} · ${o.payment_status}` },
                { key: "v", header: tx("সাব-অর্ডার", "Sub-orders"), cell: (o) => db.vendorOrders.filter((v) => v.order_id === o.id).map((v) => `${v.sub_order_no} (${v.status})`).join(", ") },
                { key: "a", header: tx("কবে", "When"), sort: (o) => o.created_at, cell: (o) => ago(o.created_at) },
              ]}
            />
          </Panel>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title={tx("দাবি", "Claims")}>
              <ul className="space-y-2 text-sm">
                {claims.map((c) => <li key={c.id}><Link href={`/admin/disputes/${c.id}`} className="font-semibold text-brand">{c.claim_no}</Link> · {claimTypeLabel[c.type].icon} {L(claimTypeLabel[c.type])} · <StatusPill tone={claimStatusLabel[c.status].tone}>{L(claimStatusLabel[c.status])}</StatusPill></li>)}
                {!claims.length && <li className="text-muted">—</li>}
              </ul>
            </Panel>
            <Panel title={tx("রিভিউ, রিপোর্ট ও অভিযোগ", "Reviews, reports & complaints")}>
              <ul className="space-y-2 text-sm">
                {reviews.map((r) => <li key={r.id}>⭐ {d(r.rating)} · {vn(r.vendor_id)} {r.comment && `· ${r.comment}`}</li>)}
                {reports.map((r) => <li key={r.id}>🚩 {r.target_type} · {r.reason} · {r.status}</li>)}
                {complaints.map((c) => <li key={c.id}>📋 <Link href="/admin/complaints" className="font-semibold text-brand">{c.complaint_no}</Link> · {c.subject} · {c.status}</li>)}
                {!reviews.length && !reports.length && !complaints.length && <li className="text-muted">—</li>}
              </ul>
            </Panel>
          </div>
          <NotesTab target={`customer:${phone}`} />
        </div>

        <div className="space-y-4">
          <Panel title={tx("নিয়ন্ত্রণ", "Controls")}>
            {sum.codRefusals >= 2 && !sum.profile?.force_advance && <Notice tone="wait" className="mb-2">{tx("একাধিকবার COD ফেরত। অগ্রিম বাধ্যতামূলক করার কথা ভাবুন।", "Multiple COD refusals. Consider forcing advance.")}</Notice>}
            <Toggle checked={!!sum.profile?.force_advance} onChange={(v) => setCustomerFlag(phone, { force_advance: v })} label={tx("💳 অগ্রিম বাধ্যতামূলক (COD বন্ধ)", "💳 Force advance (no COD)")} />
            <Toggle checked={!!sum.profile?.is_blocked} onChange={(v) => setCustomerFlag(phone, { is_blocked: v })} label={tx("🚫 ব্লক", "🚫 Block")} />
          </Panel>
          <Panel title={tx(`আমার গাড়ি (${d(vehicles.length)})`, `Garage (${vehicles.length})`)} action={<Link href="/admin/garage-docs" className="text-sm font-semibold text-brand">{tx("কাগজ কিউ", "Docs queue")}</Link>}>
            <ul className="space-y-3 text-sm">
              {vehicles.map((v) => (
                <li key={v.id} className="rounded-lg bg-surface p-2.5">
                  <p className="font-semibold">🚗 {describeVehicle(v.generation_id, v.engine_id)?.full ?? tx("সেট হয়নি", "Not set")}</p>
                  <p className="text-xs text-muted">{v.registration_no ?? "—"} {v.nickname && `· ${v.nickname}`}</p>
                  <p className="text-xs">{v.documents.filter((x) => x.expires_on).map((x) => `${L(docTypeLabel[x.doc_type])}: ${date(x.expires_on!)}`).join(" · ")}</p>
                  {v.drivers.length > 0 && <p className="text-xs text-muted">{tx("ড্রাইভার", "Drivers")}: {v.drivers.map((x) => x.name ?? x.phone).join(", ")}</p>}
                </li>
              ))}
              {!vehicles.length && <li className="text-muted">—</li>}
            </ul>
          </Panel>
          <Panel title={tx("ঠিকানা", "Addresses")}>
            <ul className="space-y-2 text-sm">
              {addresses.map((a) => <li key={a.id}>📍 {a.label && <b>{a.label}: </b>}{a.address_line}, {a.area}, {a.district}</li>)}
              {!addresses.length && <li className="text-muted">—</li>}
            </ul>
          </Panel>
          <Panel title={tx("কল লগ", "Log a call")}>
            <CallLogForm phone={phone} />
          </Panel>
        </div>
      </div>
    </OpsPage>
  );
}
