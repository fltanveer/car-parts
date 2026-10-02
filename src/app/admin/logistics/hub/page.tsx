"use client";

import { PackageCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AdminPage, Panel } from "@/components/admin/core";
import { QcPanel } from "@/components/admin/core/logistics/QcPanel";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, ButtonLink, EmptyState, StatusPill, Tabs } from "@/components/ui/primitives";
import { adminSetStatus } from "@/lib/db/actions-admin-core";
import { useDb } from "@/lib/db/store";
import { vendorOrderStatusLabel } from "@/lib/labels";
import type { VendorOrder } from "@/lib/types";

export default function HubQcPage() {
  const { tx, L, d, ago } = useT();
  const [tab, setTab] = useState<"qc" | "incoming" | "failed">("qc");
  const [sel, setSel] = useState<string | null>(null);
  const qc = useDb((s) => s.vendorOrders.filter((v) => v.status === "at_hub_qc"));
  const incoming = useDb((s) => s.vendorOrders.filter((v) => v.fulfillment === "assured_hub" && ["ready_to_ship", "picked_up"].includes(v.status)));
  const failed = useDb((s) => s.vendorOrders.filter((v) => v.status === "qc_failed"));
  const vendors = useDb((s) => s.vendors);
  const selected = qc.find((v) => v.id === sel) ?? null;

  const lastEvent = (v: VendorOrder) => v.history[v.history.length - 1]?.at ?? v.accept_by;
  const row = (v: VendorOrder, action: React.ReactNode) => (
    <li key={v.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
      <Link href={`/admin/orders/${v.order_id}#${v.id}`} className="font-semibold hover:underline">{v.sub_order_no}</Link>
      <span>{vendors.find((x) => x.id === v.vendor_id)?.shop_name_bn}</span>
      <span className="text-muted">{v.items.map((i) => i.snapshot.title).join(", ")}</span>
      <StatusPill tone={vendorOrderStatusLabel[v.status].tone}>{L(vendorOrderStatusLabel[v.status])}</StatusPill>
      <span className="text-xs text-muted">{ago(lastEvent(v))}</span>
      <span className="ml-auto">{action}</span>
    </li>
  );

  return (
    <AdminPage
      back="/admin/logistics"
      title={tx("Assured হাব QC", "Assured hub QC")}
      subtitle={tx("বিক্রেতার লিস্টিংয়ের সাথে হাতের পণ্য মিলিয়ে দেখা", "Compare the item in hand with the seller's listing")}
      guide={tx(
        "একটা পার্সেল বাছুন। বাম পাশে বিক্রেতা যা বলেছে, ডান পাশে চেকলিস্ট। সব ঠিক থাকলে অন্তত দুটো ছবি তুলে সবুজ পাস চাপুন। কিছু না মিললে কারণ লিখে লাল ফেল চাপুন।",
        "Pick a parcel. Left: what the seller claimed; right: the checklist. If everything matches, take at least two photos and press the green Pass. If not, write the reason and press the red Fail.",
      )}
    >
      <Tabs
        value={tab}
        onChange={(v) => { setTab(v); setSel(null); }}
        items={[
          { value: "qc", label: tx("QC বাকি", "QC pending"), count: qc.length },
          { value: "incoming", label: tx("আসছে", "Incoming"), count: incoming.filter((v) => v.status === "picked_up").length },
          { value: "failed", label: tx("QC ফেল", "Failed"), count: failed.length },
        ]}
      />
      {tab === "qc" &&
        (qc.length === 0 ? (
          <EmptyState icon="🔍" title={tx("QC-র অপেক্ষায় কিছু নেই", "Nothing waiting for QC")} />
        ) : (
          <>
            <Panel title={tx(`${d(qc.length)}টা পার্সেল`, `${qc.length} parcels`)}>
              <ul className="divide-y divide-line">
                {qc.map((v) => row(v, <Button size="sm" variant={sel === v.id ? "primary" : "outline"} onClick={() => setSel(v.id)}>{tx("যাচাই করুন", "Inspect")}</Button>))}
              </ul>
            </Panel>
            {selected && <QcPanel key={selected.id} vo={selected} />}
          </>
        ))}
      {tab === "incoming" && (
        <Panel title={tx("হাবে আসছে", "Coming to the hub")}>
          <ul className="divide-y divide-line">
            {incoming.map((v) =>
              row(
                v,
                v.status === "picked_up" ? (
                  <Button size="sm" variant="brand" onClick={() => { adminSetStatus(v.id, "at_hub_qc", "হাবে গ্রহণ"); toast(tx("QC-তে নেওয়া হয়েছে", "Moved to QC")); }}>
                    <PackageCheck className="size-4" /> {tx("হাবে গ্রহণ", "Receive")}
                  </Button>
                ) : (
                  <span className="text-xs text-muted">{tx("রাইডার পিকআপের অপেক্ষা", "Awaiting rider")}</span>
                ),
              ),
            )}
            {!incoming.length && <li className="py-4 text-sm text-muted">{tx("কিছু আসছে না", "Nothing incoming")}</li>}
          </ul>
        </Panel>
      )}
      {tab === "failed" && (
        <Panel title={tx("QC ফেল: রিফান্ড বা বিকল্প", "Failed QC: refund or alternative")}>
          <ul className="divide-y divide-line">
            {failed.map((v) =>
              row(
                v,
                <span className="flex gap-2">
                  <ButtonLink size="sm" variant="outline" href={`/admin/orders/${v.order_id}#${v.id}`}>{tx("বিকল্প / বাতিল", "Alternative / cancel")}</ButtonLink>
                  <ButtonLink size="sm" variant="ghost" href="/admin/finance/refunds">{tx("রিফান্ড", "Refunds")}</ButtonLink>
                </span>,
              ),
            )}
            {!failed.length && <li className="py-4 text-sm text-muted">{tx("কোনো ফেল নেই", "No failures")}</li>}
          </ul>
        </Panel>
      )}
    </AdminPage>
  );
}
