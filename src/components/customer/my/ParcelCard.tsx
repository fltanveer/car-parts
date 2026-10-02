"use client";

import { AlertTriangle, MessageCircle, Receipt, RotateCcw, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addToCart, openThread } from "@/lib/db/actions";
import { getMarket, isPublic, isVendorOpenNow, listingById } from "@/lib/db/queries";
import { getDb } from "@/lib/db/store";
import { fulfillmentLabel, vendorOrderStatusLabel } from "@/lib/labels";
import type { Order, Vendor, VendorOrder } from "@/lib/types";
import { ConditionBadge, SourceBadge, VerifiedBadge } from "../../shared/Badges";
import { Countdown, ShopLogo, toast } from "../../shared/Misc";
import { useT } from "../../providers/LangProvider";
import { MediaImage } from "../../ui/MediaImage";
import { Button, ButtonLink, Card, Notice, StatusPill } from "../../ui/primitives";
import { InvoiceSheet } from "./InvoiceSheet";
import { ParcelTimeline } from "./ParcelTimeline";
import { ReviewPrompt } from "./ReviewPrompt";

const DAYS_BN = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"];
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** One shop's parcel inside an order: its own timeline, code, invoice, claim (file 01 §7.1). */
export function ParcelCard({ order, vo, vendor, index, total, now }: { order: Order; vo: VendorOrder; vendor: Vendor | null; index: number; total: number; now: number }) {
  const { tx, L, d, taka, lang, dateTime } = useT();
  const router = useRouter();
  const [invoice, setInvoice] = useState(false);
  const st = vendorOrderStatusLabel[vo.status];
  const shop = vendor ? (lang === "bn" ? vendor.shop_name_bn : vendor.shop_name) : "—";
  const delivered = ["delivered", "completed", "return_requested", "returned"].includes(vo.status);
  const bad = ["rejected_by_vendor", "cancelled", "qc_failed"].includes(vo.status);
  const returnOpen = !!vo.return_window_ends_at && new Date(vo.return_window_ends_at).getTime() > now;
  const pickupLive = vo.fulfillment === "store_pickup" && vo.pickup_code && !delivered && !bad;

  const buyAgain = () => {
    const s = getDb();
    const ok = vo.items.filter((it) => {
      const l = listingById(s, it.listing_id);
      return l && isPublic(s, l);
    });
    if (!ok.length) {
      toast(tx("এই জিনিস এখন স্টকে নেই, খুঁজে দেখুন", "Not in stock now, try searching"), "info");
      return router.push(`/search?q=${encodeURIComponent(vo.items[0]?.snapshot.title ?? "")}`);
    }
    ok.forEach((it) => addToCart({ listing_id: it.listing_id! }, it.qty));
    router.push("/cart");
  };
  const message = () => {
    const tid = openThread({ type: "customer_vendor", vendorId: vo.vendor_id, contextType: "vendor_order", contextId: vo.id });
    router.push(`/messages/${tid}`);
  };

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-start gap-3">
        <ShopLogo name={shop} color={vendor?.logo_color ?? "#64748b"} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-muted">
            {tx(`প্যাকেট ${d(index + 1)}/${d(total)}`, `Parcel ${index + 1}/${total}`)} · {d(vo.sub_order_no)}
          </p>
          <p className="flex flex-wrap items-center gap-1.5 font-bold">
            {shop} {vendor && <VerifiedBadge vendor={vendor} withLabel={false} />}
          </p>
          <p className="text-sm text-muted">{L(fulfillmentLabel[vo.fulfillment])}</p>
        </div>
        <StatusPill tone={st.tone}>{L(st)}</StatusPill>
      </div>

      <ul className="space-y-2">
        {vo.items.map((it) => (
          <li key={it.id} className="flex gap-3">
            <MediaImage src={it.snapshot.image} alt={it.snapshot.title} className="size-16 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{it.snapshot.title}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <SourceBadge source={it.snapshot.source} />
                <ConditionBadge condition={it.snapshot.condition} grade={it.snapshot.grade} />
              </div>
              <p className="mt-1 text-sm">
                {d(it.qty)} × {taka(it.unit_price)} = <b>{taka(it.line_total)}</b>
              </p>
            </div>
          </li>
        ))}
      </ul>

      {vo.status === "pending_vendor" && (
        <Notice tone="wait">
          ⏳ {tx("দোকান নিশ্চিত করার অপেক্ষা", "Waiting for the shop to confirm")} <Countdown to={vo.accept_by} warnHours={4} />
        </Notice>
      )}

      <ParcelTimeline vo={vo} />

      {vo.courier && (
        <div className="flex items-center gap-3 rounded-xl bg-surface p-3 text-sm">
          <Truck className="size-5 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">
              {vo.courier} · {tx("ট্র্যাকিং", "Tracking")} <span className="tabular-nums">{vo.tracking_no}</span>
            </p>
            {!delivered && <p className="text-muted">{tx("ডেলিভারিম্যান পৌঁছানোর আগে কল করবেন", "The delivery person will call before arriving")}</p>}
          </div>
        </div>
      )}
      {vo.deliver_by && !delivered && !bad && (
        <p className="text-sm text-muted">📅 {tx("সর্বোচ্চ পৌঁছানোর সময়:", "Latest delivery:")} {dateTime(vo.deliver_by)}</p>
      )}

      {pickupLive && vendor && (
        <div className="space-y-3 rounded-2xl border-2 border-ok/40 bg-ok-soft/50 p-4">
          <p className="text-center font-semibold">{tx("দোকানে গিয়ে এই কোড বলুন", "Tell this code at the shop")}</p>
          <p className="text-center text-6xl font-black tracking-[0.3em] tabular-nums text-ok">{d(vo.pickup_code!)}</p>
          {vo.status === "pending_vendor" && <p className="text-center text-sm text-wait">{tx("দোকান নিশ্চিত করলে নিতে যান", "Go after the shop confirms")}</p>}
          <div className="grid h-32 place-items-center rounded-xl bg-[repeating-linear-gradient(45deg,#e2e8f0_0_10px,#f1f5f9_10px_20px)] text-center text-sm font-semibold text-ink-2">
            🗺️ {vendor.address || (lang === "bn" ? getMarket(vendor.market_area).bn : getMarket(vendor.market_area).en)}
          </div>
          <p className="text-sm">
            🕘 {(lang === "bn" ? DAYS_BN : DAYS_EN).filter((_, i) => vendor.opening_hours.days.includes(i)).join(", ")} · {d(`${vendor.opening_hours.open}:00–${vendor.opening_hours.close}:00`)} ·{" "}
            {isVendorOpenNow(vendor, new Date(now)) ? <b className="text-ok">{tx("এখন খোলা", "Open now")}</b> : <b className="text-bad">{tx("এখন বন্ধ", "Closed now")}</b>}
          </p>
        </div>
      )}

      {bad && <Notice tone="bad">{tx("এই প্যাকেটের টাকা দিয়ে থাকলে ফেরত দেওয়া হবে। আমাদের টিম যোগাযোগ করবে।", "If you paid for this parcel it will be refunded. Our team will contact you.")}</Notice>}

      {delivered && (
        <div className="space-y-2">
          <ButtonLink href={`/my/orders/${order.id}/claim`} variant={returnOpen ? "danger" : "outline"} full>
            <AlertTriangle className="size-5" aria-hidden /> {tx("সমস্যা জানান", "Report a problem")}
          </ButtonLink>
          {returnOpen && (
            <p className="text-center text-sm">
              <Countdown to={vo.return_window_ends_at!} warnHours={24} prefix={tx("ফেরতের সময় ", "Return window ")} />
            </p>
          )}
        </div>
      )}

      {delivered && !vo.reviewed && <ReviewPrompt vendorOrderId={vo.id} shopName={shop} />}

      <div className="grid grid-cols-3 gap-2">
        <Button variant="outline" size="sm" className="min-h-12" onClick={() => setInvoice(true)}>
          <Receipt className="size-4" aria-hidden /> {tx("ইনভয়েস", "Invoice")}
        </Button>
        <Button variant="outline" size="sm" className="min-h-12" onClick={buyAgain}>
          <RotateCcw className="size-4" aria-hidden /> {tx("আবার কিনুন", "Buy again")}
        </Button>
        <Button variant="outline" size="sm" className="min-h-12" onClick={message}>
          <MessageCircle className="size-4" aria-hidden /> {tx("মেসেজ", "Message")}
        </Button>
      </div>

      {delivered && (
        <Link href="/services/mechanic" className="flex items-center gap-3 rounded-xl border border-dashed border-line p-3 text-sm hover:border-ink/30">
          <span className="text-2xl" aria-hidden>
            🧰
          </span>
          <span>
            <b>{tx("পার্টস তো এলো, লাগাবেন কে?", "Parts arrived. Who will fit them?")}</b>
            <span className="block text-muted">{tx("কাছের মেকানিক বুকিং শীঘ্রই আসছে। আগ্রহ জানান →", "Nearby mechanic booking is coming soon. Register interest →")}</span>
          </span>
        </Link>
      )}
      <InvoiceSheet open={invoice} onClose={() => setInvoice(false)} order={order} vo={vo} vendor={vendor} />
    </Card>
  );
}
