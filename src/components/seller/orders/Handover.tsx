"use client";

import { useState } from "react";
import { PhotoUploader } from "@/components/media/PhotoUploader";
import { confirmPickupCode, vendorShipped } from "@/lib/db/actions";
import { logActivity } from "@/lib/db/actions-seller";
import { getMarket } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import type { MediaItem, Vendor, VendorOrder } from "@/lib/types";
import { useT } from "../../providers/LangProvider";
import { toast } from "../../shared/Misc";
import { Button, Card, Chip, Field, Input, Notice } from "../../ui/primitives";
import { CodeBox } from "./shared";

const COURIERS = ["Pathao", "Steadfast", "RedX", "Sundarban", "SA Paribahan"];

/** Step 3: hand-over depends on how the parcel leaves (file 02 §8.2). */
export function Handover({ o, vendor }: { o: VendorOrder; vendor: Vendor }) {
  const { tx, d, L } = useT();
  const round = useDb((s) => s.pickupRounds.find((r) => r.vendor_order_ids.includes(o.id)) ?? null);
  const [courier, setCourier] = useState(COURIERS[0]);
  const [tracking, setTracking] = useState("");
  const [receipt, setReceipt] = useState<MediaItem[]>([]);
  const [code, setCode] = useState("");
  const [wrong, setWrong] = useState(false);
  const market = getMarket(vendor.market_area);

  if (o.fulfillment === "platform_pickup" || o.fulfillment === "assured_hub") {
    const slot = round?.slot ?? market.slots[0];
    return (
      <Card className="space-y-3 p-4">
        <p className="text-lg font-bold">🛵 {tx("রাইডার এসে নেবে", "A rider will pick it up")}</p>
        {slot ? (
          <p className="rounded-xl bg-brand-soft/50 p-3 text-lg font-semibold">⏰ {tx(`আজ ${slot} পিকআপ রাউন্ড (${L(market)})`, `Today's pickup round: ${slot} (${L(market)})`)}</p>
        ) : (
          <p className="rounded-xl bg-surface p-3">{tx("পিকআপের সময় টিম ফোনে জানাবে।", "The team will call with the pickup time.")}</p>
        )}
        <CodeBox code={o.sub_order_no} label={tx("রাইডার এই কোড স্ক্যান করবে", "The rider scans this code")} />
        <p className="text-sm text-muted">{tx("রাইডার কোড স্ক্যান করলে নিজে থেকে 'রাইডার নিয়েছে' হয়ে যাবে।", "Once scanned, it changes to 'Picked up' automatically.")}</p>
        {o.fulfillment === "assured_hub" && <Notice>✔️ {tx("Assured: হাবে টিম যাচাই (QC) করবে। ছবি/গ্রেড না মিললে কারণসহ ফেরত আসবে।", "Assured: the hub team runs a quality check. If it doesn't match, it comes back with a reason.")}</Notice>}
      </Card>
    );
  }

  if (o.fulfillment === "vendor_ship") {
    return (
      <Card className="space-y-4 p-4">
        <p className="text-lg font-bold">📮 {tx("আপনি কুরিয়ারে দেবেন", "You hand it to a courier")}</p>
        <Field label={tx("কোন কুরিয়ার?", "Which courier?")}>
          <div className="flex flex-wrap gap-2">{COURIERS.map((c) => <Chip key={c} active={courier === c} onClick={() => setCourier(c)} className="min-h-11">{c}</Chip>)}</div>
        </Field>
        <Field label={tx("ট্র্যাকিং নম্বর", "Tracking number")}>
          <Input value={tracking} onChange={(e) => setTracking(e.target.value.toUpperCase())} placeholder="PTH12345678" className="font-mono text-lg" />
        </Field>
        <div>
          <p className="mb-2 font-semibold">{tx("রসিদের ছবি (ঐচ্ছিক)", "Receipt photo (optional)")}</p>
          <PhotoUploader value={receipt} onChange={setReceipt} max={1} />
        </div>
        <Button variant="ok" size="xl" full disabled={tracking.trim().length < 4} onClick={() => { vendorShipped(o.id, courier, tracking.trim()); logActivity(vendor.id, `${o.sub_order_no} কুরিয়ারে দেওয়া`); toast(tx("পাঠানো হয়েছে ✅", "Shipped ✅")); }}>
          🚚 {tx("কুরিয়ারে দিয়েছি", "Handed to courier")}
        </Button>
      </Card>
    );
  }

  // store_pickup
  return (
    <Card className="space-y-4 p-4">
      <p className="text-lg font-bold">🏪 {tx("কাস্টমার নিজে আসবে", "Customer collects")}</p>
      <p>{tx("কাস্টমার এলে তার কাছ থেকে ৪ সংখ্যার পিকআপ কোড শুনে এখানে লিখুন। কোড না মিললে পণ্য দেবেন না।", "When the customer arrives, ask for the 4-digit pickup code and enter it. Don't hand over if it doesn't match.")}</p>
      <Input
        inputMode="numeric"
        maxLength={4}
        value={code}
        onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 4)); setWrong(false); }}
        placeholder="••••"
        className="min-h-16 text-center font-mono text-4xl tracking-[0.5em]"
        aria-label={tx("পিকআপ কোড", "Pickup code")}
      />
      {wrong && <Notice tone="bad">⛔ {tx("কোড মেলেনি। পণ্য দেবেন না, সাহায্যে কল করুন।", "Code doesn't match. Don't hand over; call support.")}</Notice>}
      <Button
        variant="ok"
        size="xl"
        full
        disabled={code.length !== 4}
        onClick={() => {
          if (confirmPickupCode(o.id, code)) {
            logActivity(vendor.id, `${o.sub_order_no} দোকান থেকে দেওয়া`);
            toast(tx("কোড মিলেছে, পণ্য দিন ✅", "Code matched, hand it over ✅"));
          } else setWrong(true);
        }}
      >
        ✅ {tx("কোড মেলান", "Check code")} ({d(4)})
      </Button>
    </Card>
  );
}
