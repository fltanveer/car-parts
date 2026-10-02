"use client";

import { CheckCircle2, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { PhotoUploader } from "@/components/media/PhotoUploader";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, Input } from "@/components/ui/primitives";
import { riderPickup } from "@/lib/db/actions-admin-core";
import type { MediaItem, Vendor, VendorOrder } from "@/lib/types";

/** One shop on the rider's route: enter/scan the parcel code + photo → picked_up. */
export function RiderStop({ roundId, vendor, parcels, index }: { roundId: string; vendor: Vendor; parcels: VendorOrder[]; index: number }) {
  const { tx, d } = useT();
  const pending = parcels.filter((p) => p.status === "ready_to_ship");
  const done = pending.length === 0;
  return (
    <li className={done ? "rounded-2xl border-2 border-ok/40 bg-ok-soft/40 p-4" : "rounded-2xl border-2 border-line bg-card p-4"}>
      <div className="flex items-start gap-3">
        <span className={done ? "grid size-10 shrink-0 place-items-center rounded-full bg-ok text-lg font-bold text-white" : "grid size-10 shrink-0 place-items-center rounded-full bg-ink text-lg font-bold text-white"}>
          {done ? "✓" : d(index + 1)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold">{vendor.shop_name_bn}</p>
          <p className="text-sm text-muted">{vendor.address || vendor.market_area}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a href={`https://www.google.com/maps/search/?api=1&query=${vendor.lat},${vendor.lng}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border-2 border-line px-3 font-semibold">
              <MapPin className="size-4" /> {tx("ম্যাপ", "Map")}
            </a>
            <a href={`tel:${vendor.owner_phone}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border-2 border-line px-3 font-semibold">
              <Phone className="size-4" /> {tx("দোকানে কল", "Call shop")}
            </a>
          </div>
        </div>
      </div>
      <ul className="mt-3 space-y-3">
        {parcels.map((p) => (
          <Parcel key={p.id} roundId={roundId} vo={p} />
        ))}
      </ul>
    </li>
  );
}

function Parcel({ roundId, vo }: { roundId: string; vo: VendorOrder }) {
  const { tx } = useT();
  const [code, setCode] = useState("");
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [wrong, setWrong] = useState(false);
  if (vo.status !== "ready_to_ship")
    return (
      <li className="flex items-center gap-2 font-semibold text-ok">
        <CheckCircle2 className="size-5" /> {vo.sub_order_no} · {tx("তোলা হয়েছে", "Picked up")}
      </li>
    );
  return (
    <li className="space-y-2 rounded-xl bg-surface p-3">
      <p className="font-semibold">{vo.sub_order_no} · {vo.items.map((i) => i.snapshot.title).join(", ")}</p>
      <label className="block text-sm font-semibold">
        {tx("পার্সেলের লেবেলের কোড লিখুন বা স্ক্যান করুন", "Type or scan the parcel label code")}
        <Input value={code} onChange={(e) => { setCode(e.target.value); setWrong(false); }} placeholder="4805A" className="mt-1 font-mono text-lg uppercase" inputMode="text" />
      </label>
      {wrong && <p className="text-sm font-semibold text-bad">{tx("কোড মেলেনি। লেবেলটা আবার দেখুন।", "Code doesn't match. Check the label again.")}</p>}
      <PhotoUploader value={photos} onChange={setPhotos} max={1} />
      <Button
        full
        size="lg"
        variant="ok"
        disabled={code.trim().length < 3}
        onClick={() => {
          const ok = riderPickup(roundId, vo.id, code, photos[0]?.url ?? null);
          if (!ok) {
            setWrong(true);
            toast(tx("কোড মেলেনি", "Code mismatch"), "bad");
          } else toast(tx("পিকআপ নিশ্চিত", "Pickup confirmed"));
        }}
      >
        <CheckCircle2 className="size-5" /> {tx("তুলে নিয়েছি", "Picked up")}
      </Button>
    </li>
  );
}
