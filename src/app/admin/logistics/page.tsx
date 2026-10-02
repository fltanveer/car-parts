"use client";

import { Bike, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { AdminPage, KpiCard, KpiGrid } from "@/components/admin/core";
import { CourierBooking } from "@/components/admin/core/logistics/CourierBooking";
import { waitingParcels } from "@/components/admin/core/logistics/helpers";
import { RidersPanel } from "@/components/admin/core/logistics/RidersPanel";
import { RoundsBoard } from "@/components/admin/core/logistics/RoundsBoard";
import { useT } from "@/components/providers/LangProvider";
import { useNow } from "@/components/shared/Misc";
import { ButtonLink, Tabs } from "@/components/ui/primitives";
import { useDb } from "@/lib/db/store";

export default function LogisticsPage() {
  const { tx, d } = useT();
  const now = useNow();
  const [tab, setTab] = useState<"rounds" | "riders" | "courier">("rounds");
  const waiting = useDb(waitingParcels).length;
  const atHub = useDb((s) => s.vendorOrders.filter((v) => v.status === "picked_up").length);
  const qc = useDb((s) => s.vendorOrders.filter((v) => v.status === "at_hub_qc").length);
  const riders = useDb((s) => s.riders.filter((r) => r.active).length);

  return (
    <AdminPage
      title={tx("পিকআপ ও হাব", "Pickup & hub")}
      subtitle={tx("বাজার অনুযায়ী পিকআপ রাউন্ড, রাইডার, কুরিয়ার বুকিং", "Pickup rounds per market, riders, courier booking")}
      guide={tx(
        "দোকান প্যাক করলে পার্সেল এখানে আসে। বড় বোতাম চাপলে প্যাক হওয়া পার্সেল আজকের রাউন্ডে উঠবে। প্রতিটা রাউন্ডে রাইডার বাছুন। রাইডার তুলে আনলে কুরিয়ার ট্যাবে ট্র্যাকিং বসিয়ে পাঠান।",
        "Packed parcels show up here. The big button puts them on today's rounds. Pick a rider per round. Once picked up, book the courier and enter tracking in the courier tab.",
      )}
      actions={
        <>
          <ButtonLink href="/admin/logistics/rider" variant="outline"><Bike className="size-4" /> {tx("রাইডার ভিউ", "Rider view")}</ButtonLink>
          <ButtonLink href="/admin/logistics/hub" variant="outline"><ShieldCheck className="size-4" /> {tx("Assured হাব QC", "Assured hub QC")}</ButtonLink>
        </>
      }
    >
      <KpiGrid>
        <KpiCard label={tx("রাইডারের অপেক্ষায়", "Waiting for rider")} value={d(waiting)} tone={waiting ? "wait" : "ok"} icon="📦" onClick={() => setTab("rounds")} />
        <KpiCard label={tx("হাবে (বুকিং বাকি)", "At hub (to book)")} value={d(atHub)} tone={atHub ? "wait" : "ok"} icon="🏬" onClick={() => setTab("courier")} />
        <KpiCard label={tx("QC বাকি", "QC pending")} value={d(qc)} tone={qc ? "wait" : "ok"} icon="🔍" href="/admin/logistics/hub" />
        <KpiCard label={tx("সক্রিয় রাইডার", "Active riders")} value={d(riders)} icon="🏍️" onClick={() => setTab("riders")} />
      </KpiGrid>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "rounds", label: tx("পিকআপ রাউন্ড", "Pickup rounds"), count: waiting },
          { value: "riders", label: tx("রাইডার", "Riders") },
          { value: "courier", label: tx("হাব → কুরিয়ার", "Hub → courier"), count: atHub },
        ]}
      />
      {tab === "rounds" && <RoundsBoard now={now} />}
      {tab === "riders" && <RidersPanel />}
      {tab === "courier" && <CourierBooking />}
    </AdminPage>
  );
}
