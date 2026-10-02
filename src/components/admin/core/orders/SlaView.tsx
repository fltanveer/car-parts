"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useT } from "@/components/providers/LangProvider";
import { StatusPill } from "@/components/ui/primitives";
import { useDb } from "@/lib/db/store";
import { fulfillmentLabel, vendorOrderStatusLabel } from "@/lib/labels";
import type { VendorOrder } from "@/lib/types";
import { DataTable, KpiCard, KpiGrid } from "../index";
import { allSlas, type SlaInfo, type SlaKind } from "./sla";
import { SlaBadge } from "./SlaBadge";

interface Row {
  vo: VendorOrder;
  sla: SlaInfo;
  orderNo: string;
  shop: string;
}

/** SLA board: accept timer, 48h handover, 5/10-day delivery; red when breached. */
export function SlaView({ now, kind, onKind }: { now: number; kind: SlaKind | "all"; onKind: (k: SlaKind | "all") => void }) {
  const { tx, L, d } = useT();
  const vos = useDb((s) => s.vendorOrders);
  const orders = useDb((s) => s.orders);
  const vendors = useDb((s) => s.vendors);

  const rows = useMemo<Row[]>(
    () =>
      vos.flatMap((vo) =>
        allSlas(vo, now).map((sla) => ({
          vo,
          sla,
          orderNo: orders.find((o) => o.id === vo.order_id)?.order_no ?? "",
          shop: vendors.find((v) => v.id === vo.vendor_id)?.shop_name_bn ?? vo.vendor_id,
        })),
      ),
    [vos, orders, vendors, now],
  );

  const count = (k: SlaKind, late = false) => rows.filter((r) => r.sla.kind === k && (!late || r.sla.tone === "late")).length;
  const shown = rows.filter((r) => kind === "all" || r.sla.kind === kind);

  return (
    <div className="space-y-4">
      <KpiGrid>
        <KpiCard label={tx("গ্রহণ বাকি", "Awaiting accept")} value={d(count("accept"))} sub={tx(`${d(count("accept", true))}টা সময় পার`, `${count("accept", true)} breached`)} tone={count("accept", true) ? "bad" : "wait"} icon="⏰" onClick={() => onKind("accept")} active={kind === "accept"} />
        <KpiCard label={tx("হস্তান্তর (৪৮ ঘণ্টা)", "Handover (48h)")} value={d(count("handover"))} sub={tx(`${d(count("handover", true))}টা সময় পার`, `${count("handover", true)} breached`)} tone={count("handover", true) ? "bad" : "info"} icon="📦" onClick={() => onKind("handover")} active={kind === "handover"} />
        <KpiCard label={tx("ডেলিভারি (৫/১০ দিন)", "Delivery (5/10 days)")} value={d(count("deliver"))} sub={tx(`${d(count("deliver", true))}টা সময় পার`, `${count("deliver", true)} breached`)} tone={count("deliver", true) ? "bad" : "info"} icon="🚚" onClick={() => onKind("deliver")} active={kind === "deliver"} />
        <KpiCard label={tx("সব খোলা ঘড়ি", "All open clocks")} value={d(rows.length)} tone="info" icon="🕒" onClick={() => onKind("all")} active={kind === "all"} />
      </KpiGrid>
      <DataTable
        rows={shown}
        rowKey={(r) => `${r.vo.id}-${r.sla.kind}`}
        initialSort={{ key: "deadline", dir: "asc" }}
        search={(r) => `${r.vo.sub_order_no} ${r.orderNo} ${r.shop}`}
        rowClassName={(r) => (r.sla.tone === "late" ? "bg-bad-soft/40" : undefined)}
        columns={[
          { key: "no", header: tx("সাব-অর্ডার", "Sub-order"), cell: (r) => <Link className="font-semibold text-brand hover:underline" href={`/admin/orders/${r.vo.order_id}`}>{r.vo.sub_order_no}</Link>, sort: (r) => r.vo.sub_order_no },
          { key: "shop", header: tx("দোকান", "Shop"), cell: (r) => <Link className="hover:underline" href={`/admin/vendors/${r.vo.vendor_id}`}>{r.shop}</Link>, sort: (r) => r.shop },
          { key: "status", header: tx("অবস্থা", "Status"), cell: (r) => <StatusPill tone={vendorOrderStatusLabel[r.vo.status].tone}>{L(vendorOrderStatusLabel[r.vo.status])}</StatusPill> },
          { key: "ful", header: tx("পাঠানো", "Fulfillment"), cell: (r) => L(fulfillmentLabel[r.vo.fulfillment]), hideOnMobile: true },
          { key: "deadline", header: tx("সময়সীমা", "Deadline"), cell: (r) => <SlaBadge sla={r.sla} />, sort: (r) => new Date(r.sla.deadline).getTime() },
        ]}
        empty={tx("কোনো খোলা সময়সীমা নেই", "No open deadlines")}
      />
    </div>
  );
}
