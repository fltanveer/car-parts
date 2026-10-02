"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { StatusPill } from "@/components/ui/primitives";
import { useDb } from "@/lib/db/store";
import { fulfillmentLabel, paymentMethodLabel, vendorOrderStatusLabel } from "@/lib/labels";
import type { Fulfillment, Order, PaymentStatus, VendorOrder, VendorOrderStatus } from "@/lib/types";
import { DataTable, FilterChip, FilterSelect } from "../index";
import { currentSla, isBreached } from "./sla";
import { SlaBadge } from "./SlaBadge";

export const paymentStatusLabel: Record<PaymentStatus, { bn: string; en: string; tone: "ok" | "wait" | "bad" | "info" }> = {
  unpaid: { bn: "বাকি", en: "Unpaid", tone: "wait" },
  partial: { bn: "আংশিক", en: "Partial", tone: "wait" },
  paid: { bn: "পরিশোধিত", en: "Paid", tone: "ok" },
  refunded: { bn: "ফেরত", en: "Refunded", tone: "info" },
  partially_refunded: { bn: "আংশিক ফেরত", en: "Part refunded", tone: "info" },
};

interface Row {
  order: Order;
  subs: VendorOrder[];
}

/** Parent orders with nested sub-orders, filterable (file 03 10.1). */
export function OrdersTable({ now, initialBreach }: { now: number; initialBreach: boolean }) {
  const { tx, L, taka, date, d } = useT();
  const orders = useDb((s) => s.orders);
  const vos = useDb((s) => s.vendorOrders);
  const vendors = useDb((s) => s.vendors);
  const [status, setStatus] = useState<VendorOrderStatus | "all">("all");
  const [vendor, setVendor] = useState("all");
  const [ful, setFul] = useState<Fulfillment | "all">("all");
  const [pay, setPay] = useState<PaymentStatus | "all">("all");
  const [area, setArea] = useState("all");
  const [breach, setBreach] = useState(initialBreach);

  const shopName = (id: string) => vendors.find((v) => v.id === id)?.shop_name_bn ?? id;
  const districts = useMemo(() => [...new Set(orders.map((o) => o.address.district))], [orders]);

  const rows = useMemo<Row[]>(() => {
    const subMatch = (v: VendorOrder) =>
      (status === "all" || v.status === status) && (vendor === "all" || v.vendor_id === vendor) && (ful === "all" || v.fulfillment === ful) && (!breach || isBreached(v, now));
    return orders
      .filter((o) => (pay === "all" || o.payment_status === pay) && (area === "all" || o.address.district === area))
      .map((o) => ({ order: o, subs: vos.filter((v) => v.order_id === o.id) }))
      .filter((r) => r.subs.some(subMatch) || (status === "all" && vendor === "all" && ful === "all" && !breach));
  }, [orders, vos, status, vendor, ful, pay, area, breach, now]);

  const statusOpts = (Object.keys(vendorOrderStatusLabel) as VendorOrderStatus[]).map((k) => ({ value: k, label: L(vendorOrderStatusLabel[k]) }));

  return (
    <DataTable
      rows={rows}
      rowKey={(r) => r.order.id}
      initialSort={{ key: "date", dir: "desc" }}
      search={(r) => `${r.order.order_no} ${r.order.user_phone} ${r.order.customer_name} ${r.subs.map((v) => `${v.sub_order_no} ${shopName(v.vendor_id)} ${v.tracking_no ?? ""}`).join(" ")}`}
      searchPlaceholder={tx("অর্ডার নম্বর, ফোন, নাম, দোকান, ট্র্যাকিং", "Order no, phone, name, shop, tracking")}
      toolbar={
        <>
          <FilterSelect label={tx("অবস্থা", "Status")} value={status} onChange={setStatus} options={[{ value: "all", label: tx("সব অবস্থা", "All statuses") }, ...statusOpts]} />
          <FilterSelect label={tx("দোকান", "Seller")} value={vendor} onChange={setVendor} options={[{ value: "all", label: tx("সব দোকান", "All sellers") }, ...vendors.map((v) => ({ value: v.id, label: v.shop_name_bn }))]} />
          <FilterSelect
            label={tx("পাঠানোর ধরন", "Fulfillment")}
            value={ful}
            onChange={setFul}
            options={[{ value: "all", label: tx("সব ধরন", "All fulfillment") }, ...(Object.keys(fulfillmentLabel) as Fulfillment[]).map((k) => ({ value: k, label: L(fulfillmentLabel[k]) }))]}
          />
          <FilterSelect
            label={tx("পেমেন্ট", "Payment")}
            value={pay}
            onChange={setPay}
            options={[{ value: "all", label: tx("সব পেমেন্ট", "All payments") }, ...(Object.keys(paymentStatusLabel) as PaymentStatus[]).map((k) => ({ value: k, label: L(paymentStatusLabel[k]) }))]}
          />
          <FilterSelect label={tx("এলাকা", "Area")} value={area} onChange={setArea} options={[{ value: "all", label: tx("সব জেলা", "All districts") }, ...districts.map((x) => ({ value: x, label: x }))]} />
          <FilterChip active={breach} onClick={() => setBreach((b) => !b)}>
            🔴 {tx("SLA লঙ্ঘন", "SLA breach")}
          </FilterChip>
        </>
      }
      columns={[
        {
          key: "no", header: tx("অর্ডার", "Order"), sort: (r) => r.order.order_no,
          cell: (r) => (
            <div>
              <Link href={`/admin/orders/${r.order.id}`} className="font-bold text-brand hover:underline">{r.order.order_no}</Link>
              {r.order.source === "admin_phone" && <span className="ml-1 text-xs" title={tx("ফোনে অর্ডার", "Phone order")}>📞</span>}
              {r.order.source === "request" && <span className="ml-1 text-xs" title={tx("রিকোয়েস্ট থেকে", "From request")}>🙋</span>}
            </div>
          ),
        },
        { key: "date", header: tx("তারিখ", "Date"), sort: (r) => r.order.created_at, cell: (r) => date(r.order.created_at), hideOnMobile: true },
        { key: "cust", header: tx("কাস্টমার", "Customer"), sort: (r) => r.order.customer_name, cell: (r) => <div><p className="font-medium">{r.order.customer_name}</p><p className="text-xs text-muted">{r.order.address.area}, {r.order.address.district}</p></div> },
        {
          key: "pay", header: tx("পেমেন্ট", "Payment"),
          cell: (r) => (
            <div className="space-y-1">
              <StatusPill tone={paymentStatusLabel[r.order.payment_status].tone}>{L(paymentStatusLabel[r.order.payment_status])}</StatusPill>
              <p className="text-xs text-muted">{L(paymentMethodLabel[r.order.payment_method])}</p>
            </div>
          ),
        },
        { key: "total", header: tx("মোট", "Total"), sort: (r) => r.order.grand_total, cell: (r) => <span className="font-semibold tabular-nums">{taka(r.order.grand_total)}</span> },
        { key: "subs", header: tx("সাব-অর্ডার", "Sub-orders"), cell: (r) => <span className="text-muted">{d(r.subs.length)}</span>, hideOnMobile: true },
      ]}
      expanded={(r) => (
        <ul className="divide-y divide-line rounded-xl border border-line bg-card">
          {r.subs.map((v) => {
            const sla = currentSla(v, now);
            return (
              <li key={v.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
                <Link href={`/admin/orders/${r.order.id}#${v.id}`} className="font-semibold hover:underline">{v.sub_order_no}</Link>
                <Link href={`/admin/vendors/${v.vendor_id}`} className="text-ink-2 hover:underline">{shopName(v.vendor_id)}</Link>
                <StatusPill tone={vendorOrderStatusLabel[v.status].tone}>{L(vendorOrderStatusLabel[v.status])}</StatusPill>
                <span className="text-xs text-muted">{L(fulfillmentLabel[v.fulfillment])}</span>
                <span className="text-xs tabular-nums text-muted">{taka(v.subtotal + v.delivery_charge)}</span>
                {sla && <SlaBadge sla={sla} />}
              </li>
            );
          })}
        </ul>
      )}
      empty={tx("এই ফিল্টারে কোনো অর্ডার নেই", "No orders for these filters")}
    />
  );
}
