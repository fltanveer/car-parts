"use client";

import { Download, PackageCheck, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, ButtonLink, Notice, Select } from "@/components/ui/primitives";
import { adminSetStatus, bookCourier, logisticsOverlay } from "@/lib/db/actions-admin-core";
import { useDb } from "@/lib/db/store";
import { CsvImport, DataTable, downloadCsv, Panel } from "../index";
import { COURIERS } from "../orders/SubOrderActions";

/** Hub → courier: bulk CSV export, tracking entry, mark shipped (file 03 10.2). */
export function CourierBooking() {
  const { tx, taka, d, dateTime } = useT();
  const atHub = useDb((s) => s.vendorOrders.filter((v) => v.status === "picked_up" && v.fulfillment === "platform_pickup"));
  const toReceive = useDb((s) => s.vendorOrders.filter((v) => v.status === "picked_up" && v.fulfillment === "assured_hub"));
  const orders = useDb((s) => s.orders);
  const bookings = logisticsOverlay.useStore((o) => o.bookings);
  const [sel, setSel] = useState<string[]>([]);
  const [courier, setCourier] = useState(COURIERS[1]);
  const [tracking, setTracking] = useState<Record<string, string>>({});

  const chosen = atHub.filter((v) => sel.includes(v.id));
  const ready = chosen.length > 0 && chosen.every((v) => (tracking[v.id] ?? "").trim().length >= 4);
  const orderOf = (id: string) => orders.find((o) => o.id === id);

  const exportCsv = () =>
    downloadCsv(`${courier}-booking.csv`, [
      ["invoice", "recipient_name", "recipient_phone", "address", "district", "cod_amount", "note"],
      ...chosen.map((v) => {
        const o = orderOf(v.order_id)!;
        return [v.sub_order_no, o.address.recipient_name, o.address.phone, `${o.address.address_line}, ${o.address.area}`, o.address.district, v.cod_amount, v.items.map((i) => i.snapshot.title).join(" + ")];
      }),
    ]);

  return (
    <div className="space-y-4">
      {toReceive.length > 0 && (
        <Notice tone="wait">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{tx(`${d(toReceive.length)}টা Assured পার্সেল হাবে এসেছে — QC-তে নিন`, `${toReceive.length} Assured parcels arrived — move to QC`)}</span>
            <span className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { toReceive.forEach((v) => adminSetStatus(v.id, "at_hub_qc", "হাবে গ্রহণ")); toast(tx("QC-তে নেওয়া হয়েছে", "Moved to QC")); }}>
                <PackageCheck className="size-4" /> {tx("হাবে গ্রহণ", "Receive at hub")}
              </Button>
              <ButtonLink href="/admin/logistics/hub" size="sm" variant="ghost">{tx("হাব QC", "Hub QC")} →</ButtonLink>
            </span>
          </div>
        </Notice>
      )}
      <Panel
        title={tx("হাবে জমা → কুরিয়ার বুকিং", "At hub → courier booking")}
        actions={
          <>
            <Select value={courier} onChange={(e) => setCourier(e.target.value)} className="min-h-10 w-auto text-sm" aria-label={tx("কুরিয়ার", "Courier")}>
              {COURIERS.map((c) => <option key={c}>{c}</option>)}
            </Select>
            <Button size="sm" variant="outline" disabled={!chosen.length} onClick={exportCsv}>
              <Download className="size-4" /> {tx("বাল্ক CSV", "Bulk CSV")}
            </Button>
          </>
        }
      >
        {atHub.length === 0 ? (
          <p className="text-sm text-muted">{tx("হাবে কোনো পার্সেল বুকিংয়ের অপেক্ষায় নেই।", "No parcels waiting for booking at the hub.")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {atHub.map((v) => {
              const o = orderOf(v.order_id);
              const on = sel.includes(v.id);
              return (
                <li key={v.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                  <input type="checkbox" className="size-5" checked={on} onChange={() => setSel((x) => (on ? x.filter((i) => i !== v.id) : [...x, v.id]))} aria-label={v.sub_order_no} />
                  <Link href={`/admin/orders/${v.order_id}#${v.id}`} className="font-semibold hover:underline">{v.sub_order_no}</Link>
                  <span className="text-muted">{o?.address.district} · COD {taka(v.cod_amount)}</span>
                  {on && (
                    <input
                      value={tracking[v.id] ?? ""}
                      onChange={(e) => setTracking((t) => ({ ...t, [v.id]: e.target.value.toUpperCase() }))}
                      placeholder={tx("ট্র্যাকিং নম্বর", "Tracking no")}
                      className="ml-auto min-h-10 w-44 rounded-xl border border-line px-3"
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {chosen.length > 0 && (
          <div className="mt-3 space-y-3 border-t border-line pt-3">
            <CsvImport
              label={tx("কুরিয়ারের ট্র্যাকিং CSV", "Courier tracking CSV")}
              sampleName="tracking-sample.csv"
              sample={[["sub_order_no", "tracking_no"], ...chosen.map((v) => [v.sub_order_no, ""])]}
              onRows={(rows) => {
                const next: Record<string, string> = {};
                rows.forEach((r) => {
                  const v = chosen.find((x) => x.sub_order_no === r.sub_order_no);
                  if (v && r.tracking_no) next[v.id] = r.tracking_no.toUpperCase();
                });
                setTracking((t) => ({ ...t, ...next }));
              }}
            />
            <Button
              size="lg"
              variant="brand"
              disabled={!ready}
              onClick={() => {
                bookCourier(courier, chosen.map((v) => ({ voId: v.id, tracking: tracking[v.id].trim() })));
                setSel([]);
                toast(tx(`${d(chosen.length)}টা পার্সেল পাঠানো হয়েছে`, `${chosen.length} parcels shipped`));
              }}
            >
              <Send className="size-5" /> {tx(`${courier}-এ বুক করে পাঠানো হয়েছে চিহ্নিত করুন`, `Book with ${courier} & mark shipped`)}
            </Button>
          </div>
        )}
      </Panel>
      {bookings.length > 0 && (
        <DataTable
          caption={tx("বুকিং ইতিহাস", "Booking history")}
          rows={bookings}
          rowKey={(b) => b.id}
          columns={[
            { key: "at", header: tx("সময়", "When"), cell: (b) => dateTime(b.at), sort: (b) => b.at },
            { key: "c", header: tx("কুরিয়ার", "Courier"), cell: (b) => b.courier },
            { key: "n", header: tx("পার্সেল", "Parcels"), cell: (b) => d(b.vo_ids.length) },
          ]}
        />
      )}
    </div>
  );
}
