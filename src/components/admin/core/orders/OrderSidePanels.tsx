"use client";

import { MapPin, Phone, PhoneCall } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Sheet } from "@/components/ui/Sheet";
import { Button, ButtonLink, Chip, Field, Input, Select, StatusPill, Textarea } from "@/components/ui/primitives";
import { audit } from "@/lib/db/actions";
import { fixOrderAddress, logCall } from "@/lib/db/actions-admin-core";
import { describeVehicle } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import { displayPhone } from "@/lib/format";
import { paymentMethodLabel } from "@/lib/labels";
import { locations } from "@/lib/mock/settings";
import type { Order } from "@/lib/types";
import { KV, Panel } from "../index";
import { paymentStatusLabel } from "./OrdersTable";

export function CustomerPanel({ order }: { order: Order }) {
  const { tx, d, lang } = useT();
  const vehicle = useDb((s) => s.vehicles.find((v) => v.id === order.user_vehicle_id) ?? null);
  const prevOrders = useDb((s) => s.orders.filter((o) => o.user_phone === order.user_phone).length);
  const profile = useDb((s) => s.profiles.find((p) => p.phone === order.user_phone) ?? null);
  const vd = vehicle ? describeVehicle(vehicle.generation_id, vehicle.engine_id, lang) : null;
  return (
    <Panel title={tx("কাস্টমার", "Customer")} actions={<Link href={`/admin/customers/${encodeURIComponent(order.user_phone)}`} className="text-sm font-semibold text-brand hover:underline">{tx("৩৬০ ভিউ", "360 view")}</Link>}>
      <KV
        rows={[
          [tx("নাম", "Name"), order.customer_name],
          [tx("ফোন", "Phone"), <a key="p" href={`tel:${order.user_phone}`} className="inline-flex items-center gap-1 text-brand hover:underline"><Phone className="size-3.5" />{displayPhone(order.user_phone)}</a>],
          [tx("আমার গাড়ি", "My car"), vd ? vd.full : <span key="v" className="text-wait">{tx("সেট করা নেই", "Not set")}</span>],
          [tx("মোট অর্ডার", "Orders"), d(prevOrders)],
          [tx("অগ্রিম বাধ্যতামূলক", "Force advance"), profile?.force_advance ? tx("হ্যাঁ", "Yes") : tx("না", "No")],
        ]}
      />
    </Panel>
  );
}

export function AddressPanel({ order }: { order: Order }) {
  const { tx } = useT();
  const a = order.address;
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(a);
  const districts = locations.flatMap((x) => x.districts.map((dd) => ({ ...dd, division: x.division })));
  const district = districts.find((x) => x.name === f.district);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  return (
    <Panel
      title={tx("ঠিকানা", "Address")}
      actions={
        <Button size="sm" variant="outline" onClick={() => { setF(order.address); setOpen(true); }}>
          <MapPin className="size-4" /> {tx("সংশোধন", "Fix")}
        </Button>
      }
    >
      <p className="font-semibold">{a.recipient_name} · {displayPhone(a.phone)}</p>
      <p className="text-sm">{a.address_line}</p>
      <p className="text-sm text-muted">{a.area}, {a.district}, {a.division}{a.landmark ? ` · ${a.landmark}` : ""}</p>
      <Sheet open={open} onClose={() => setOpen(false)} title={tx("ঠিকানা সংশোধন", "Fix address")}>
        <div className="space-y-3 pb-2">
          <Field label={tx("প্রাপকের নাম", "Recipient")}><Input value={f.recipient_name} onChange={(e) => set("recipient_name", e.target.value)} /></Field>
          <Field label={tx("ফোন", "Phone")}><Input value={f.phone} onChange={(e) => set("phone", e.target.value)} inputMode="tel" /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label={tx("জেলা", "District")}>
              <Select value={f.district} onChange={(e) => { const dd = districts.find((x) => x.name === e.target.value)!; setF((x) => ({ ...x, district: dd.name, division: dd.division, area: dd.areas[0] })); }}>
                {districts.map((x) => <option key={x.name}>{x.name}</option>)}
              </Select>
            </Field>
            <Field label={tx("এলাকা", "Area")}>
              <Select value={f.area} onChange={(e) => set("area", e.target.value)}>
                {(district?.areas ?? [f.area]).map((x) => <option key={x}>{x}</option>)}
              </Select>
            </Field>
          </div>
          <Field label={tx("বাড়ি/রাস্তা", "House/road")}><Textarea value={f.address_line} onChange={(e) => set("address_line", e.target.value)} className="min-h-20" /></Field>
          <Field label={tx("চেনার জায়গা", "Landmark")}><Input value={f.landmark ?? ""} onChange={(e) => set("landmark", e.target.value || null)} /></Field>
          <Button full size="lg" variant="brand" onClick={() => { fixOrderAddress(order.id, f); setOpen(false); toast(tx("ঠিকানা সংশোধন হয়েছে", "Address updated")); }}>
            {tx("সেভ করুন", "Save")}
          </Button>
        </div>
      </Sheet>
    </Panel>
  );
}

export function PaymentsPanel({ order }: { order: Order }) {
  const { tx, L, taka, dateTime } = useT();
  const refunds = useDb((s) => s.refunds.filter((r) => r.order_id === order.id));
  const pending = order.payments.some((p) => p.status === "submitted");
  return (
    <Panel title={tx("পেমেন্ট", "Payment")} actions={<StatusPill tone={paymentStatusLabel[order.payment_status].tone}>{L(paymentStatusLabel[order.payment_status])}</StatusPill>}>
      <KV
        rows={[
          [tx("পদ্ধতি", "Method"), L(paymentMethodLabel[order.payment_method])],
          [tx("পণ্য", "Items"), taka(order.subtotal)],
          [tx("ডেলিভারি", "Delivery"), taka(order.delivery_total)],
          [tx("মোট", "Total"), <b key="t">{taka(order.grand_total)}</b>],
          [tx("অগ্রিম বাকি", "Advance due"), taka(order.advance_due)],
        ]}
      />
      <ul className="mt-3 space-y-1.5 text-sm">
        {order.payments.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2">
            <span>{p.method} · {p.transaction_id ?? "—"} · {dateTime(p.created_at)}</span>
            <span className="flex items-center gap-2"><b className="tabular-nums">{taka(p.amount)}</b><StatusPill tone={p.status === "verified" ? "ok" : p.status === "submitted" ? "wait" : "bad"}>{p.status}</StatusPill></span>
          </li>
        ))}
        {!order.payments.length && <li className="text-muted">{tx("এখনো কোনো পেমেন্ট নেই", "No payments yet")}</li>}
      </ul>
      {pending && <ButtonLink href="/admin/finance/payments" size="sm" variant="outline" className="mt-2">{tx("পেমেন্ট যাচাই কিউতে যান", "Open payment queue")}</ButtonLink>}
      {refunds.map((r) => (
        <p key={r.id} className="mt-2 text-sm">
          💸 {tx("রিফান্ড", "Refund")} {taka(r.amount)} · <StatusPill tone={r.status === "done" ? "ok" : "wait"}>{r.status}</StatusPill>{" "}
          <Link href="/admin/finance/refunds" className="text-brand hover:underline">{tx("রিফান্ড কিউ", "Refund queue")}</Link>
        </p>
      ))}
    </Panel>
  );
}

const OUTCOMES = [
  { bn: "কাস্টমার নিশ্চিত করেছেন", en: "Customer confirmed" },
  { bn: "ফোন ধরেননি", en: "No answer" },
  { bn: "ঠিকানা বদলাতে চান", en: "Wants address change" },
  { bn: "বাতিল করতে চান", en: "Wants to cancel" },
];

export function ConfirmCallPanel({ order }: { order: Order }) {
  const { tx, L, dateTime } = useT();
  const [outcome, setOutcome] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const refs = useDb((s) => s.vendorOrders.filter((v) => v.order_id === order.id).map((v) => v.sub_order_no));
  const calls = useDb((s) => s.callLogs.filter((c) => c.ref === order.order_no || (c.ref && refs.includes(c.ref))));
  return (
    <Panel title={tx("কনফার্মেশন কল", "Confirmation call")}>
      <a href={`tel:${order.user_phone}`} className="mb-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-ok px-4 font-semibold text-white">
        <PhoneCall className="size-4" /> {tx("কাস্টমারকে কল করুন", "Call customer")}
      </a>
      <div className="mb-2 flex flex-wrap gap-2">
        {OUTCOMES.map((o) => (
          <Chip key={o.en} active={outcome === o.bn} onClick={() => setOutcome(o.bn)}>{L(o)}</Chip>
        ))}
      </div>
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={tx("কলের সারাংশ", "Call summary")} className="min-h-20" />
      <Button
        className="mt-2"
        variant="brand"
        disabled={!outcome}
        onClick={() => {
          logCall({ phone: order.user_phone, channel: "phone_out", purpose: "অর্ডার কনফার্মেশন কল", ref: order.order_no, summary: `${outcome}${note ? ` · ${note}` : ""}` });
          audit("কনফার্মেশন কল লগ", order.order_no);
          setOutcome(null);
          setNote("");
          toast(tx("কল লগ সেভ হয়েছে", "Call logged"));
        }}
      >
        {tx("কল লগ সেভ", "Save call log")}
      </Button>
      {calls.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {calls.map((c) => (
            <li key={c.id} className="rounded-lg bg-surface px-3 py-2">
              <span className="text-xs text-muted">{dateTime(c.created_at)} · {c.purpose}</span>
              <p>{c.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
