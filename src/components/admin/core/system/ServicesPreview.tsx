"use client";

import { MapPin } from "lucide-react";
import { useT } from "@/components/providers/LangProvider";
import { StatusPill } from "@/components/ui/primitives";
import { DataTable, type Column } from "../DataTable";
import { KpiCard, KpiGrid, Panel } from "../Panel";
import { PhaseNotice } from "../PhaseNotice";
import { bookingLabel, bookingTone, sampleProviders, sampleServiceBookings } from "./phaseSamples";
import { SampleTag } from "./SampleTag";

type Provider = (typeof sampleProviders)[number];
type Booking = (typeof sampleServiceBookings)[number];

const pct = (x: number) => Math.round(x * 100);

export function ServicesPreview() {
  const { tx, d, taka } = useT();
  const totalB = sampleProviders.reduce((a, p) => a + p.bookings, 0);
  const avgCancel = sampleProviders.reduce((a, p) => a + p.cancel * p.bookings, 0) / totalB;
  const avgNoShow = sampleProviders.reduce((a, p) => a + p.no_show * p.bookings, 0) / totalB;

  const pCols: Column<Provider>[] = [
    { key: "name", header: tx("প্রোভাইডার", "Provider"), sort: (p) => p.name, cell: (p) => <span className="font-semibold">{p.name}<span className="block text-xs font-normal text-muted">{tx(p.type_bn, p.type_en)} · {p.area}</span></span> },
    { key: "ver", header: tx("যাচাই", "Verified"), cell: (p) => <StatusPill tone={p.verified ? "ok" : "wait"}>{p.verified ? tx("যাচাইকৃত", "Verified") : tx("যাচাই বাকি", "Pending")}</StatusPill> },
    { key: "rating", header: tx("রেটিং", "Rating"), sort: (p) => p.rating, cell: (p) => `★ ${d(p.rating.toFixed(1))}` },
    { key: "bk", header: tx("বুকিং", "Bookings"), sort: (p) => p.bookings, cell: (p) => d(p.bookings) },
    { key: "cancel", header: tx("বাতিল", "Cancel"), sort: (p) => p.cancel, cell: (p) => <StatusPill tone={p.cancel > 0.15 ? "bad" : p.cancel > 0.08 ? "wait" : "ok"}>{d(pct(p.cancel))}%</StatusPill> },
    { key: "noshow", header: tx("আসেনি", "No-show"), sort: (p) => p.no_show, cell: (p) => <StatusPill tone={p.no_show > 0.1 ? "bad" : p.no_show > 0.05 ? "wait" : "ok"}>{d(pct(p.no_show))}%</StatusPill> },
  ];
  const bCols: Column<Booking>[] = [
    { key: "id", header: tx("বুকিং", "Booking"), cell: (b) => <span className="font-semibold">{b.id}</span> },
    { key: "svc", header: tx("সেবা", "Service"), cell: (b) => tx(b.service_bn, b.service_en) },
    { key: "prov", header: tx("প্রোভাইডার", "Provider"), hideOnMobile: true, cell: (b) => sampleProviders.find((p) => p.id === b.provider)?.name },
    { key: "slot", header: tx("সময়", "Slot"), cell: (b) => tx(b.slot_bn, b.slot_en) },
    { key: "price", header: tx("দাম", "Price"), cell: (b) => <span className="tabular-nums">{taka(b.price)}</span> },
    { key: "st", header: tx("অবস্থা", "Status"), cell: (b) => <StatusPill tone={bookingTone[b.status]}>{tx(...bookingLabel[b.status])}</StatusPill> },
  ];

  return (
    <>
      <KpiGrid>
        <KpiCard label={<>{tx("প্রোভাইডার", "Providers")}<SampleTag /></>} value={d(sampleProviders.length)} />
        <KpiCard label={tx("যাচাই বাকি", "To verify")} value={d(sampleProviders.filter((p) => !p.verified).length)} tone="wait" />
        <KpiCard label={tx("গড় বাতিলের হার", "Avg cancel rate")} value={`${d(pct(avgCancel))}%`} tone={avgCancel > 0.1 ? "wait" : "ok"} />
        <KpiCard label={tx("গড় না আসার হার", "Avg no-show rate")} value={`${d(pct(avgNoShow))}%`} tone={avgNoShow > 0.05 ? "wait" : "ok"} />
      </KpiGrid>
      <DataTable caption={<>{tx("প্রোভাইডার অনবোর্ডিং ও যাচাই", "Provider onboarding & verification")}<SampleTag /></>} rows={sampleProviders} columns={pCols} rowKey={(p) => p.id} />
      <DataTable caption={<>{tx("বুকিং মনিটর", "Booking monitor")}<SampleTag /></>} rows={sampleServiceBookings} columns={bCols} rowKey={(b) => b.id} />
      <Panel title={tx("সেবা ক্যাটাগরি ও দাম নির্দেশিকা", "Service categories & price guide")}>
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {[["অয়েল চেঞ্জ", "Oil change", 800, 1500], ["এসি সার্ভিস", "AC service", 1500, 3500], ["পার্টস ফিটিং", "Part fitting", 300, 1500], ["কার ওয়াশ", "Car wash", 400, 1200]].map(([bn, en, a, b]) => (
            <li key={String(en)} className="flex justify-between rounded-xl border border-line p-2.5">
              <span className="font-semibold">{tx(String(bn), String(en))}</span>
              <span className="tabular-nums">{taka(Number(a))} – {taka(Number(b))}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">{tx("নমুনা দাম; চালুর আগে বাজার যাচাই করে বসানো হবে।", "Sample prices; to be set after market research.")}</p>
      </Panel>
      <Panel title={tx("রাস্তায় সাহায্যের লাইভ ম্যাপ", "Roadside assistance live map")}>
        <PhaseNotice phase={3}>{tx("টো, জাম্প স্টার্ট, টায়ার, জ্বালানি, লক খোলা: অনুরোধ ও প্রোভাইডারের অবস্থান ম্যাপে।", "Tow, jump start, flat tyre, fuel, lockout: requests and provider locations on a map.")}</PhaseNotice>
        <div className="mt-3 grid h-56 place-items-center rounded-2xl border-2 border-dashed border-line bg-surface text-muted">
          <span className="flex flex-col items-center gap-2 text-center">
            <MapPin className="size-8" aria-hidden />
            {tx("ম্যাপ এখানে দেখাবে (ফেজ ৩)", "Map appears here (phase 3)")}
          </span>
        </div>
      </Panel>
    </>
  );
}
