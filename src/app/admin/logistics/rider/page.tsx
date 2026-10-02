"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AdminPage } from "@/components/admin/core";
import { activeRound, sameDay } from "@/components/admin/core/logistics/helpers";
import { RiderStop } from "@/components/admin/core/logistics/RiderStop";
import { useT } from "@/components/providers/LangProvider";
import { useNow } from "@/components/shared/Misc";
import { EmptyState, Select } from "@/components/ui/primitives";
import { useDb } from "@/lib/db/store";
import { markets } from "@/lib/mock/settings";
import type { Vendor, VendorOrder } from "@/lib/types";

function RiderScreen() {
  const { tx, L, d } = useT();
  const params = useSearchParams();
  const now = useNow();
  const riders = useDb((s) => s.riders.filter((r) => r.active));
  const [riderId, setRiderId] = useState(params.get("rider") ?? "");
  const rid = riderId || riders[0]?.id || "";
  const rounds = useDb((s) => s.pickupRounds.filter((r) => r.rider_id === rid && (activeRound(r) || sameDay(r.date, now))));
  const vos = useDb((s) => s.vendorOrders);
  const vendors = useDb((s) => s.vendors);

  const stops = (ids: string[]) => {
    const map = new Map<string, { vendor: Vendor; parcels: VendorOrder[] }>();
    ids.forEach((id) => {
      const vo = vos.find((v) => v.id === id);
      const vendor = vo && vendors.find((v) => v.id === vo.vendor_id);
      if (!vo || !vendor) return;
      const s = map.get(vendor.id) ?? { vendor, parcels: [] };
      s.parcels.push(vo);
      map.set(vendor.id, s);
    });
    // Unfinished shops first.
    return [...map.values()].sort((a, b) => Number(a.parcels.every((p) => p.status !== "ready_to_ship")) - Number(b.parcels.every((p) => p.status !== "ready_to_ship")));
  };

  return (
    <AdminPage
      narrow
      back="/admin/logistics"
      title={tx("রাইডারের আজকের রুট", "Rider's route today")}
      guide={tx(
        "প্রতিটা দোকানে গিয়ে পার্সেলের লেবেলের কোড লিখুন, একটা ছবি তুলুন, তারপর সবুজ 'তুলে নিয়েছি' বোতাম চাপুন। কোড না মিললে পার্সেল নেবেন না, অফিসে কল করুন।",
        "At each shop type the parcel label code, take a photo, then press the green 'Picked up' button. If the code doesn't match, don't take the parcel and call the office.",
      )}
    >
      <Select value={rid} onChange={(e) => setRiderId(e.target.value)} aria-label={tx("রাইডার", "Rider")}>
        {riders.map((r) => (
          <option key={r.id} value={r.id}>{r.name} · {r.area}</option>
        ))}
      </Select>
      {rounds.length === 0 && <EmptyState icon="🏍️" title={tx("আজ কোনো রাউন্ড নেই", "No rounds today")} body={tx("অফিস রাউন্ড দিলে এখানে দেখা যাবে।", "Rounds assigned by the office will show here.")} />}
      {rounds.map((r) => {
        const list = stops(r.vendor_order_ids);
        return (
          <section key={r.id} className="space-y-3">
            <h2 className="text-xl font-bold">
              {L(markets.find((m) => m.id === r.market_area))} · {r.slot}
              <span className="ml-2 text-sm font-semibold text-muted">{tx(`${d(list.length)}টা দোকান`, `${list.length} shops`)}</span>
            </h2>
            <ol className="space-y-3">
              {list.map((s, i) => (
                <RiderStop key={s.vendor.id} roundId={r.id} vendor={s.vendor} parcels={s.parcels} index={i} />
              ))}
            </ol>
          </section>
        );
      })}
    </AdminPage>
  );
}

export default function RiderPage() {
  return (
    <Suspense>
      <RiderScreen />
    </Suspense>
  );
}
