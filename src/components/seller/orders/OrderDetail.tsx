"use client";

import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { PhotoUploader } from "@/components/media/PhotoUploader";
import { vendorAccept, vendorPacked, vendorReject } from "@/lib/db/actions";
import { logActivity, setStock } from "@/lib/db/actions-seller";
import { orderById, vendorOrderById } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import { conditionLabel, fulfillmentLabel, vendorOrderStatusLabel } from "@/lib/labels";
import { slaTone } from "@/lib/rules";
import type { MediaItem, Vendor } from "@/lib/types";
import { useT } from "../../providers/LangProvider";
import { Countdown, toast, useNow } from "../../shared/Misc";
import { MediaImage } from "../../ui/MediaImage";
import { Sheet } from "../../ui/Sheet";
import { Button, Card, EmptyState, Notice, SectionTitle, StatusPill } from "../../ui/primitives";
import { ConfirmSheet } from "../Bits";
import { ReasonChips } from "../Choices";
import { SellerPage } from "../SellerPage";
import { Handover } from "./Handover";
import { CodeBox, FULFIL_ICON } from "./shared";

const DAY = 86_400_000;
const REJECT = { bn: ["স্টক শেষ", "ক্ষতিগ্রস্ত", "দাম ভুল ছিল", "অন্য কারণ"], en: ["Out of stock", "Damaged", "Price was wrong", "Other"] };

export function OrderDetail({ id, vendor }: { id: string; vendor: Vendor }) {
  const { tx, taka, d, L, lang, dateTime } = useT();
  const now = useNow(30_000);
  const o = useDb((s) => vendorOrderById(s, id));
  const order = useDb((s) => (o ? orderById(s, o.order_id) : null));
  const claims = useDb((s) => s.claims.filter((c) => c.vendor_order_id === id));
  const [accept, setAccept] = useState(false);
  const [reject, setReject] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [packPhoto, setPackPhoto] = useState<MediaItem[]>([]);

  if (!o || o.vendor_id !== vendor.id || !order) {
    return (
      <SellerPage title={tx("অর্ডার", "Order")} back="/seller/orders">
        <EmptyState icon="📦" title={tx("অর্ডার পাওয়া যায়নি", "Order not found")} />
      </SellerPage>
    );
  }

  const f = fulfillmentLabel[o.fulfillment];
  const stepNo = o.status === "pending_vendor" ? 1 : o.status === "accepted" ? 2 : o.status === "ready_to_ship" ? 3 : ["picked_up", "at_hub_qc", "shipped", "delivered", "completed"].includes(o.status) ? 4 : 0;
  // Customer address only for self-shipped parcels after accepting, hidden 7 days after delivery (file 00 §14).
  const showAddress = o.fulfillment === "vendor_ship" && ["accepted", "ready_to_ship", "shipped", "delivered"].includes(o.status) && (!o.delivered_at || now - new Date(o.delivered_at).getTime() < 7 * DAY);
  const legal = (o.status === "accepted" || o.status === "ready_to_ship") && o.handover_by ? slaTone(o.handover_by, now, 12) : null;

  return (
    <SellerPage
      title={<span className="font-mono">{o.sub_order_no}</span>}
      subtitle={<StatusPill tone={vendorOrderStatusLabel[o.status].tone}>{L(vendorOrderStatusLabel[o.status])}</StatusPill>}
      back="/seller/orders"
      guide={tx(
        "চারটা ধাপ: গ্রহণ, প্যাক, হস্তান্তর, পৌঁছানো। এখন যে ধাপ সেটার বড় বাটন চাপুন।",
        "Four steps: accept, pack, hand over, delivered. Tap the big button for the current step.",
      )}
    >
      {stepNo > 0 && (
        <div className="grid grid-cols-4 gap-1 text-center text-xs font-semibold">
          {[tx("গ্রহণ", "Accept"), tx("প্যাক", "Pack"), tx("হস্তান্তর", "Hand over"), tx("পৌঁছানো", "Delivered")].map((s, i) => (
            <div key={s} className="space-y-1">
              <div className={clsx("h-2 rounded-full", i + 1 < stepNo ? "bg-ok" : i + 1 === stepNo ? "bg-seller" : "bg-line")} />
              <p className={i + 1 === stepNo ? "text-seller" : "text-muted"}>{d(i + 1)}. {s}</p>
            </div>
          ))}
        </div>
      )}

      {legal === "warn" && <Notice tone="wait">⚠️ {tx("আইনি সময়সীমা: পেমেন্টের ৪৮ ঘণ্টার মধ্যে হস্তান্তর করতে হবে, সময় কম।", "Legal deadline: hand over within 48h of payment. Time is short.")} <Countdown to={o.handover_by!} /></Notice>}
      {legal === "late" && <Notice tone="bad">⛔ {tx("৪৮ ঘণ্টার আইনি সময় পার হয়েছে। অ্যাডমিনকে জানানো হয়েছে, এখনই পাঠান।", "The 48-hour legal deadline has passed. Admin has been alerted; ship now.")}</Notice>}

      <Card className="space-y-3 p-4">
        {o.items.map((it) => (
          <div key={it.id} className="flex gap-3">
            <MediaImage src={it.snapshot.image} alt={it.snapshot.title} className="size-20 shrink-0 rounded-xl" />
            <div className="min-w-0">
              <p className="font-bold">{it.snapshot.title}</p>
              <p className="text-sm text-muted">{L(conditionLabel[it.snapshot.condition])}{it.snapshot.grade && ` · ${tx("গ্রেড", "Grade")} ${it.snapshot.grade}`}</p>
              <p className="text-sm">{d(it.qty)} × {taka(it.unit_price)}</p>
            </div>
          </div>
        ))}
        <div className="space-y-1 rounded-xl bg-surface p-3 text-sm">
          <p className="flex justify-between"><span>{tx("বিক্রি", "Sale")}</span><b>{taka(o.subtotal)}</b></p>
          <p className="flex justify-between"><span>− {tx("কমিশন", "Commission")} ({d(vendor.commission_percent)}%)</span><b>{taka(o.commission_amount)}</b></p>
          <p className="flex justify-between"><span>− {tx("ডেলিভারি", "Delivery")}</span><b>{taka(0)} <span className="font-normal text-muted">({tx("কাস্টমার দিয়েছে", "paid by customer")})</span></b></p>
          <p className="flex justify-between border-t border-line pt-1 text-lg text-ok"><span>= {tx("আপনি পাবেন", "You get")}</span><b>{taka(o.vendor_payable)}</b></p>
        </div>
        <p className="font-semibold">{FULFIL_ICON[o.fulfillment]} {lang === "bn" ? f.seller_bn : f.seller_en}</p>
        {o.cod_amount > 0 && <p className="text-sm text-muted">💵 {tx(`কুরিয়ার কাস্টমারের কাছ থেকে ${taka(o.cod_amount)} তুলবে (গাড়িহাবের কাছে যাবে)`, `Courier collects ${taka(o.cod_amount)} from the customer (goes to GaariHub)`)}</p>}
      </Card>

      {claims.length > 0 && <Link href="/seller/claims" className="block"><Notice tone="bad">⚠️ {tx("এই অর্ডারে কাস্টমার সমস্যা জানিয়েছে। দেখুন →", "The customer reported a problem on this order. See →")}</Notice></Link>}

      {/* Step 1: accept within the SLA */}
      {o.status === "pending_vendor" && (
        <section className="space-y-3">
          <Countdown to={o.accept_by} prefix={tx("গ্রহণের সময় বাকি: ", "Accept within: ")} warnHours={2} />
          <Button variant="ok" size="xl" full onClick={() => setAccept(true)}>✅ {tx("গ্রহণ করুন", "Accept")}</Button>
          <Button variant="danger" size="lg" full onClick={() => setReject(true)}>❌ {tx("দিতে পারবো না", "Can't supply")}</Button>
        </section>
      )}

      {/* Step 2: pack + label + photo */}
      {o.status === "accepted" && (
        <section className="space-y-4">
          <SectionTitle>📦 {tx("প্যাক করুন", "Pack it")}</SectionTitle>
          <Card className="space-y-2 p-4">
            <p>🫧 {tx("ভাঙার ভয় থাকলে (লাইট, গ্লাস) ডাবল প্যাকিং ও বাবল র‍্যাপ দিন।", "Fragile items (lights, glass): double pack with bubble wrap.")}</p>
            <p>🛢️ {tx("তেল/তরল হলে মুখ সিল করে পলিথিনে মুড়ুন।", "Liquids: seal the cap and wrap in plastic.")}</p>
            <p>📏 {tx("বাক্সে নড়াচড়া যেন না করে, ফাঁকা জায়গা কাগজ দিয়ে ভরুন।", "Fill gaps so nothing moves inside.")}</p>
          </Card>
          <div className="print-area">
            <CodeBox code={o.sub_order_no} label={tx("প্যাকেটে মার্কার দিয়ে বড় করে লিখুন:", "Write big on the parcel with a marker:")} />
            {showAddress && (
              <Card className="mt-3 space-y-1 p-4">
                <p className="text-sm text-muted">{tx("কাস্টমারের ঠিকানা (প্যাকেটে লেখার জন্য)", "Customer address (for the label)")}</p>
                <p className="text-lg font-bold">{order.address.recipient_name}</p>
                <p>{order.address.phone}</p>
                <p>{order.address.address_line}, {order.address.area}, {order.address.district}</p>
                {order.address.landmark && <p className="text-sm text-muted">{order.address.landmark}</p>}
              </Card>
            )}
          </div>
          <Button variant="outline" full onClick={() => window.print()}>🖨️ {tx("লেবেল প্রিন্ট (প্রিন্টার থাকলে)", "Print label (if you have a printer)")}</Button>
          <div className="space-y-2">
            <p className="font-semibold">📷 {tx("প্যাক করা পণ্যের ছবি (বাধ্যতামূলক)", "Photo of the packed parcel (required)")}</p>
            <p className="text-sm text-muted">{tx("পরে কোনো সমস্যা হলে এটাই আপনার প্রমাণ।", "This is your proof if there's a dispute later.")}</p>
            <PhotoUploader value={packPhoto} onChange={setPackPhoto} max={1} />
          </div>
          <Button variant="ok" size="xl" full disabled={!packPhoto.length} onClick={() => { vendorPacked(o.id, packPhoto[0].url); logActivity(vendor.id, `${o.sub_order_no} প্যাক হয়েছে`); toast(tx("প্যাক হয়েছে ✅", "Packed ✅")); }}>
            ✅ {tx("প্যাক হয়েছে, তৈরি", "Packed and ready")}
          </Button>
        </section>
      )}

      {/* Step 3: hand-over */}
      {o.status === "ready_to_ship" && <Handover o={o} vendor={vendor} />}

      {["picked_up", "at_hub_qc", "shipped"].includes(o.status) && (
        <Card className="space-y-2 p-4">
          <p className="text-lg font-bold">🚚 {tx("পথে আছে", "On the way")}</p>
          {o.courier && <p>{o.courier} · <span className="font-mono">{o.tracking_no}</span></p>}
          {o.status === "at_hub_qc" && <p>✔️ {tx("হাবে যাচাই চলছে", "Quality check at hub")}</p>}
          {o.deliver_by && <Countdown to={o.deliver_by} prefix={tx("পৌঁছানোর শেষ সময়: ", "Deliver by: ")} />}
        </Card>
      )}

      {o.status === "delivered" && (
        <Card className="space-y-2 bg-ok-soft p-4 text-ok">
          <p className="text-lg font-bold">🎉 {tx("পৌঁছেছে", "Delivered")}</p>
          <p>{tx("রিটার্ন সময় শেষ হলে টাকা আপনার ওয়ালেটে আসবে।", "Money reaches your wallet after the return window.")}</p>
          {o.return_window_ends_at && <Countdown to={o.return_window_ends_at} prefix={tx("টাকা আসবে: ", "Money in: ")} />}
        </Card>
      )}
      {o.status === "completed" && <Link href="/seller/money"><Notice tone="ok">💰 {tx(`${taka(o.vendor_payable)} ওয়ালেটে এসেছে। টাকা দেখুন →`, `${taka(o.vendor_payable)} is in your wallet. See money →`)}</Notice></Link>}
      {o.status === "qc_failed" && <Notice tone="bad">❌ {tx("হাবে যাচাইয়ে বাতিল", "Failed hub QC")}: {o.qc?.note ?? "—"}. {tx("পণ্য ফেরত আসবে।", "The item will be returned.")}</Notice>}
      {(o.status === "rejected_by_vendor" || o.status === "cancelled") && <Notice tone="bad">❌ {L(vendorOrderStatusLabel[o.status])}{o.reject_reason && `: ${o.reject_reason}`}</Notice>}
      {o.packing_photo && o.status !== "accepted" && (
        <div className="flex items-center gap-3">
          <MediaImage src={o.packing_photo} alt={tx("প্যাকিং ছবি", "Packing photo")} className="size-16 rounded-xl" />
          <p className="text-sm text-muted">📷 {tx("প্যাকিং ছবি জমা আছে", "Packing photo on file")}</p>
        </div>
      )}

      <section>
        <SectionTitle>{tx("ইতিহাস", "History")}</SectionTitle>
        <ol className="space-y-1 text-sm">
          {o.history.map((h, i) => (
            <li key={i} className="flex justify-between gap-2 border-b border-line py-1.5">
              <span>{vendorOrderStatusLabel[h.to as keyof typeof vendorOrderStatusLabel] ? L(vendorOrderStatusLabel[h.to as keyof typeof vendorOrderStatusLabel]) : h.to}{h.note && ` · ${h.note}`}</span>
              <span className="shrink-0 text-muted">{dateTime(h.at)}</span>
            </li>
          ))}
        </ol>
      </section>

      <ConfirmSheet
        open={accept}
        onClose={() => setAccept(false)}
        title={tx("গ্রহণ করবেন?", "Accept order?")}
        body={tx("পণ্যটা হাতে আছে, ছবির মতোই আছে?", "Is the item in hand and exactly as pictured?")}
        confirmLabel={tx("✅ হ্যাঁ, আছে", "✅ Yes, I have it")}
        onConfirm={() => { vendorAccept(o.id); logActivity(vendor.id, `${o.sub_order_no} গ্রহণ`); setAccept(false); toast(tx("গ্রহণ করা হয়েছে, এবার প্যাক করুন", "Accepted, now pack it")); }}
      />
      <Sheet open={reject} onClose={() => setReject(false)} title={tx("দিতে পারবেন না?", "Can't supply?")}>
        <div className="space-y-4 pb-2">
          <Notice tone="bad">{tx("অর্ডার বাতিল করলে স্কোর কমবে। বারবার হলে সতর্কতা দেওয়া হবে।", "Cancelling lowers your score. Repeated cancellations get a warning.")}</Notice>
          <ReasonChips reasons={lang === "bn" ? REJECT.bn : REJECT.en} value={reason} onChange={setReason} />
          <Button
            variant="danger"
            size="xl"
            full
            disabled={!reason}
            onClick={() => {
              vendorReject(o.id, reason!);
              if (reason === REJECT.bn[0] || reason === REJECT.en[0]) o.items.forEach((it) => it.listing_id && setStock(it.listing_id, 0));
              logActivity(vendor.id, `${o.sub_order_no} বাতিল: ${reason}`);
              setReject(false);
              toast(tx("অর্ডার বাতিল করা হয়েছে", "Order declined"), "info");
            }}
          >
            ❌ {tx("বাতিল করুন", "Decline")}
          </Button>
        </div>
      </Sheet>
    </SellerPage>
  );
}
