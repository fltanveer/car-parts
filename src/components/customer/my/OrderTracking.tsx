"use client";

import { CreditCard, MapPin } from "lucide-react";
import Link from "next/link";
import { orderById, vendorById, vendorOrderById } from "@/lib/db/queries";
import { useDb, useHydrated } from "@/lib/db/store";
import { claimStatusLabel, claimTypeLabel, paymentMethodLabel, type Tone } from "@/lib/labels";
import type { PaymentStatus } from "@/lib/types";
import { AudioGuide } from "../../layout/AudioGuide";
import { BackButton, HelpCall, useNow } from "../../shared/Misc";
import { useT } from "../../providers/LangProvider";
import { ButtonLink, Card, Container, EmptyState, Notice, SectionTitle, StatusPill } from "../../ui/primitives";
import { LoginNeeded } from "./common";
import { ParcelCard } from "./ParcelCard";

const PAY: Record<PaymentStatus, { bn: string; en: string; tone: Tone }> = {
  unpaid: { bn: "পেমেন্ট বাকি", en: "Unpaid", tone: "wait" },
  partial: { bn: "আংশিক পরিশোধ", en: "Partly paid", tone: "wait" },
  paid: { bn: "পরিশোধিত", en: "Paid", tone: "ok" },
  refunded: { bn: "টাকা ফেরত", en: "Refunded", tone: "info" },
  partially_refunded: { bn: "আংশিক ফেরত", en: "Partly refunded", tone: "info" },
};

/** /my/orders/[id]: parent order with one tracked parcel per shop (file 01 §7.1). */
export function OrderTracking({ id }: { id: string }) {
  const { tx, L, d, taka, dateTime } = useT();
  const hydrated = useHydrated();
  const now = useNow();
  const db = useDb((s) => s);
  if (!hydrated) return <Container className="h-96 animate-pulse" />;
  const phone = db.session.customerPhone;
  if (!phone)
    return (
      <Container>
        <BackButton href="/my" />
        <LoginNeeded next={`/my/orders/${id}`} />
      </Container>
    );
  const order = orderById(db, id);
  if (!order || order.user_phone !== phone)
    return (
      <Container>
        <BackButton href="/my" />
        <EmptyState icon="🔎" title={tx("অর্ডার পাওয়া যায়নি", "Order not found")} action={<ButtonLink href="/my" variant="brand">{tx("আমার কাজ", "My stuff")}</ButtonLink>} />
      </Container>
    );

  const vos = order.vendor_order_ids.map((v) => vendorOrderById(db, v)).filter((v) => !!v);
  const claims = db.claims.filter((c) => order.vendor_order_ids.includes(c.vendor_order_id));
  const submitted = order.payments.find((p) => p.status === "submitted");
  const verifiedAmt = order.payments.filter((p) => p.status === "verified").reduce((t, p) => t + p.amount, 0);
  const advanceOwed = order.advance_due > 0 && order.payment_status !== "paid" && !submitted && verifiedAmt < order.advance_due;
  const pay = PAY[order.payment_status];

  return (
    <Container className="space-y-5">
      <div>
        <BackButton href="/my" />
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm text-muted">{tx("অর্ডার নম্বর", "Order number")}</p>
            <h1 className="text-3xl font-black tabular-nums">{d(order.order_no)}</h1>
          </div>
          <p className="text-right text-sm text-muted">
            {dateTime(order.created_at)}
            <br />
            <b className="text-lg text-ink">{taka(order.grand_total)}</b>
          </p>
        </div>
      </div>
      <AudioGuide
        text={tx(
          "প্রতিটা দোকানের প্যাকেট আলাদা আসবে। প্রতিটা প্যাকেটের নিচে দেখবেন এখন কোথায় আছে। সমস্যা হলে লাল 'সমস্যা জানান' বাটন চাপুন।",
          "Each shop's parcel comes separately. Under each parcel you can see where it is now. Press the red 'Report a problem' button if something is wrong.",
        )}
      />

      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 font-bold">
            <CreditCard className="size-5" aria-hidden /> {L(paymentMethodLabel[order.payment_method])}
          </p>
          <StatusPill tone={pay.tone}>{L(pay)}</StatusPill>
        </div>
        {advanceOwed && (
          <>
            <Notice tone="bad">
              {tx(`অর্ডার নিশ্চিত করতে ${taka(order.advance_due)} অগ্রিম পাঠান।`, `Send ${taka(order.advance_due)} advance to confirm the order.`)}
            </Notice>
            <ButtonLink href={`/checkout/pay/${order.id}`} variant="ok" size="lg" full>
              💳 {tx("অগ্রিম পাঠান", "Pay advance")}
            </ButtonLink>
          </>
        )}
        {submitted && (
          <Notice tone="wait">
            ⏳ {tx(`আপনার ${taka(submitted.amount)} পেমেন্ট (TrxID ${submitted.transaction_id ?? ""}) যাচাই হচ্ছে।`, `Your ${taka(submitted.amount)} payment (TrxID ${submitted.transaction_id ?? ""}) is being verified.`)}
          </Notice>
        )}
        <dl className="grid grid-cols-2 gap-y-1 text-sm">
          <dt className="text-muted">{tx("জিনিসের দাম", "Items")}</dt>
          <dd className="text-right">{taka(order.subtotal)}</dd>
          <dt className="text-muted">{tx(`ডেলিভারি (${d(vos.length)}টা প্যাকেট)`, `Delivery (${vos.length} parcels)`)}</dt>
          <dd className="text-right">{taka(order.delivery_total)}</dd>
          {verifiedAmt > 0 && (
            <>
              <dt className="text-muted">{tx("পরিশোধ হয়েছে", "Paid")}</dt>
              <dd className="text-right text-ok">− {taka(verifiedAmt)}</dd>
            </>
          )}
          <dt className="font-bold">{tx("মোট", "Total")}</dt>
          <dd className="text-right font-bold">{taka(order.grand_total)}</dd>
        </dl>
        <p className="text-xs text-muted">🛡️ {tx("টাকা নিরাপদ: জিনিস ঠিক না হলে টাকা ফেরত।", "Money safe: refund if the item isn't right.")}</p>
      </Card>

      {vos.length > 1 && <Notice>📦 {tx(`${d(vos.length)}টা দোকান = ${d(vos.length)}টা আলাদা প্যাকেট। প্রতিটা আলাদা সময়ে আসতে পারে।`, `${vos.length} shops = ${vos.length} separate parcels. They may arrive at different times.`)}</Notice>}

      {vos.map((vo, i) => (
        <ParcelCard key={vo.id} order={order} vo={vo} vendor={vendorById(db, vo.vendor_id)} index={i} total={vos.length} now={now} />
      ))}

      {claims.length > 0 && (
        <section>
          <SectionTitle>⚠️ {tx("জানানো সমস্যা", "Reported problems")}</SectionTitle>
          <div className="space-y-2">
            {claims.map((c) => (
              <Link key={c.id} href={`/my/orders/${order.id}/claim`} className="flex items-center justify-between gap-2 rounded-2xl border border-line bg-card p-4 hover:border-ink/30">
                <span>
                  <b>
                    {claimTypeLabel[c.type].icon} {L(claimTypeLabel[c.type])}
                  </b>
                  <span className="block text-sm text-muted">{d(c.claim_no)}</span>
                </span>
                <StatusPill tone={claimStatusLabel[c.status].tone}>{L(claimStatusLabel[c.status])}</StatusPill>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Card className="flex gap-3 p-4">
        <MapPin className="size-5 shrink-0 text-brand" aria-hidden />
        <div className="text-sm">
          <p className="font-bold">{order.address.recipient_name}</p>
          <p>
            {order.address.address_line}, {order.address.area}, {order.address.district}
          </p>
          {order.address.landmark && <p className="text-muted">{order.address.landmark}</p>}
        </div>
      </Card>
      <HelpCall />
    </Container>
  );
}
