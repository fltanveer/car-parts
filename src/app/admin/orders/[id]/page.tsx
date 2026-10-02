"use client";

import { useParams } from "next/navigation";
import { AdminPage, Panel, Timeline, type TimelineItem } from "@/components/admin/core";
import { AddressPanel, ConfirmCallPanel, CustomerPanel, PaymentsPanel } from "@/components/admin/core/orders/OrderSidePanels";
import { SubOrderCard } from "@/components/admin/core/orders/SubOrderCard";
import { useT } from "@/components/providers/LangProvider";
import { useNow } from "@/components/shared/Misc";
import { EmptyState, StatusPill } from "@/components/ui/primitives";
import { useDb } from "@/lib/db/store";
import { vendorOrderStatusLabel } from "@/lib/labels";
import type { VendorOrderStatus } from "@/lib/types";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { tx, L, dateTime } = useT();
  const now = useNow();
  const order = useDb((s) => s.orders.find((o) => o.id === id) ?? null);
  const subs = useDb((s) => s.vendorOrders.filter((v) => v.order_id === id));
  const calls = useDb((s) => s.callLogs);

  if (!order)
    return (
      <AdminPage title={tx("অর্ডার পাওয়া যায়নি", "Order not found")} back="/admin/orders">
        <EmptyState icon="📦" title={tx("এই অর্ডার নেই", "No such order")} />
      </AdminPage>
    );

  const refs = new Set([order.order_no, ...subs.map((v) => v.sub_order_no)]);
  const timeline: TimelineItem[] = [
    { at: order.created_at, title: tx(`অর্ডার তৈরি (${order.source})`, `Order placed (${order.source})`), tone: "info" },
    ...subs.flatMap((v) =>
      v.history.map((h) => ({
        at: h.at,
        title: `${v.sub_order_no}: ${L(vendorOrderStatusLabel[h.to as VendorOrderStatus]) || h.to}`,
        note: h.note ?? undefined,
        actor: h.actor,
        tone: vendorOrderStatusLabel[h.to as VendorOrderStatus]?.tone,
      })),
    ),
    ...order.payments.map((p) => ({ at: p.created_at, title: tx(`পেমেন্ট ${p.method} · ${p.status}`, `Payment ${p.method} · ${p.status}`), note: p.transaction_id ?? undefined, tone: p.status === "verified" ? ("ok" as const) : ("wait" as const) })),
    ...calls.filter((c) => c.ref && refs.has(c.ref)).map((c) => ({ at: c.created_at, title: `📞 ${c.purpose}`, note: c.summary, actor: c.staff_id })),
  ];

  return (
    <AdminPage
      back="/admin/orders"
      title={
        <span className="flex flex-wrap items-center gap-2">
          {order.order_no}
          {order.source === "admin_phone" && <StatusPill tone="info">📞 {tx("ফোন অর্ডার", "Phone order")}</StatusPill>}
        </span>
      }
      subtitle={`${dateTime(order.created_at)} · ${order.customer_name}`}
      guide={tx(
        "উপরে কাস্টমার, ঠিকানা আর পেমেন্ট। নিচে প্রতিটা দোকানের সাব-অর্ডার আলাদা। প্রতিটায় শুধু পরের বৈধ ধাপের বোতাম দেখা যাবে। দোকান না পারলে 'বিকল্প বিক্রেতা খুঁজুন' চাপুন।",
        "Customer, address and payment are on top. Each seller's sub-order is below with only the valid next-step buttons. If a seller can't fulfil, use 'Find alternative seller'.",
      )}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <CustomerPanel order={order} />
        <AddressPanel order={order} />
        <PaymentsPanel order={order} />
      </div>
      {subs.map((v) => (
        <SubOrderCard key={v.id} vo={v} now={now} />
      ))}
      <div className="grid gap-4 lg:grid-cols-2">
        <ConfirmCallPanel order={order} />
        <Panel title={tx("টাইমলাইন", "Timeline")}>
          <Timeline items={timeline} />
        </Panel>
      </div>
    </AdminPage>
  );
}
