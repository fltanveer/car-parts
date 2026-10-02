"use client";

import { AlertTriangle, Bike, Clock, MapPin, PhoneCall, RotateCcw, ShieldCheck, Truck, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useMemo, useState } from "react";
import { RequireLogin } from "@/components/auth/RequireLogin";
import { CopyButton } from "@/components/checkout/CopyButton";
import { ClaimProgress } from "@/components/orders/ClaimProgress";
import { DemoBox } from "@/components/orders/DemoBox";
import { Invoice } from "@/components/orders/Invoice";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { ReviewPrompt } from "@/components/orders/ReviewPrompt";
import { WarrantyCard } from "@/components/orders/WarrantyCard";
import {
  advanceDue,
  deliveryMethodLabel,
  hasPendingPayment,
  paymentMethodLabel,
  paymentStatusLabel,
} from "@/components/orders/helpers";
import { useNow } from "@/components/orders/useNow";
import { QualityBadge } from "@/components/part/QualityBadge";
import { useT } from "@/components/providers/LangProvider";
import { Button, ButtonLink, Card, Container, Notice, SectionTitle, buttonClass } from "@/components/ui/primitives";
import { getPartById } from "@/lib/api";
import { claimStatusLabel, claimTypeLabel, orderStatusLabel } from "@/lib/i18n";
import { telLink } from "@/lib/links";
import { addToCart, cancelOrder, demoAdvanceOrder, useStore } from "@/lib/store";
import type { Order, OrderStatus } from "@/lib/types";

// Statuses where the demo "next step" button (demoAdvanceOrder) does something.
const ADVANCEABLE: OrderStatus[] = ["pending_confirmation", "confirmed", "advance_verified", "sourcing", "qc", "packed", "shipped"];

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { tx } = useT();
  return (
    <RequireLogin reason={tx("অর্ডার দেখতে লগইন করুন", "Log in to see this order")}>
      <OrderDetail id={id} />
    </RequireLogin>
  );
}

function OrderDetail({ id }: { id: string }) {
  const { tx, lang, taka, d, date, dateTime } = useT();
  const router = useRouter();
  const now = useNow();
  const order = useStore((s) => s.orders.find((o) => o.id === id));
  const allClaims = useStore((s) => s.claims);
  const claims = useMemo(() => allClaims.filter((c) => c.order_id === id), [allClaims, id]);
  const [reorderMsg, setReorderMsg] = useState<string | null>(null);

  // RequireLogin already waited for hydration, so "not found" is real.
  if (!order)
    return (
      <Container className="max-w-md">
        <Card className="mt-6 p-6 text-center">
          <h1 className="text-xl font-bold">{tx("অর্ডার পাওয়া যায়নি", "Order not found")}</h1>
          <ButtonLink href="/orders" variant="primary" size="lg" full className="mt-4">
            {tx("আমার অর্ডার", "My orders")}
          </ButtonLink>
        </Card>
      </Container>
    );

  const due = advanceDue(order);
  const paymentPending = hasPendingPayment(order);
  const delivered = order.status === "delivered";
  const warrantyItems = order.items.filter((i) => i.warranty_months_snapshot > 0);
  const canCancel = (order.status === "pending_confirmation" || order.status === "advance_pending") && !order.payments.length;

  const reorder = () => {
    let added = 0;
    for (const i of order.items) {
      const p = i.part_id ? getPartById(i.part_id) : null;
      if (p && p.availability === "in_stock" && p.stock_qty > 0 && p.price != null) {
        addToCart(p.id, Math.min(i.qty, p.stock_qty));
        added++;
      }
    }
    if (added) router.push("/cart");
    else setReorderMsg(tx("এই পার্টগুলো এখন স্টকে নেই। রিকোয়েস্ট দিলে আমরা এনে দেবো।", "These parts are out of stock now. Send a request and we'll source them."));
  };

  return (
    <Container className="max-w-xl">
      <div className="no-print mb-4">
        <Link href="/orders" className="text-sm font-semibold text-muted">
          ← {tx("আমার অর্ডার", "My orders")}
        </Link>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold">{d(order.order_no)}</h1>
            <p className="text-sm text-muted">
              {date(order.created_at)} · {order.order_type === "sourcing" ? tx("আনিয়ে দেওয়া পার্ট", "Sourced part") : tx("স্টকের পার্ট", "Stock part")}
            </p>
          </div>
          <span className="rounded-full bg-ink px-3 py-1 text-sm font-semibold text-white">{orderStatusLabel[order.status][lang]}</span>
        </div>
      </div>

      <div className="no-print space-y-3">
        {order.status === "advance_pending" && due > 0 && (
          <Notice tone="warn">
            {paymentPending ? (
              <span className="flex items-start gap-2 font-semibold">
                <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
                {tx("আপনার অগ্রিম পেমেন্ট যাচাই হচ্ছে। হলে SMS পাবেন।", "Your advance payment is being verified. You'll get an SMS.")}
              </span>
            ) : (
              <>
                <p className="font-semibold">{tx(`${taka(due)} অগ্রিম বাকি। অগ্রিম পেলে কাজ শুরু হবে।`, `${taka(due)} advance pending. We start once it arrives.`)}</p>
                <ButtonLink href={`/checkout/payment/${order.id}`} variant="accent" size="lg" full className="mt-3">
                  <Wallet className="size-5" aria-hidden /> {tx("অগ্রিম দিন", "Pay advance")}
                </ButtonLink>
              </>
            )}
          </Notice>
        )}
        {order.needs_confirmation_call && order.status === "pending_confirmation" && (
          <Notice>
            <span className="flex items-start gap-2">
              <PhoneCall className="mt-0.5 size-4 shrink-0" aria-hidden />
              {tx("আমরা একবার কল করে অর্ডারটি নিশ্চিত করবো।", "We'll call you once to confirm this order.")}
            </span>
          </Notice>
        )}

        <Card className="p-4">
          <SectionTitle>{tx("অর্ডারের অবস্থা", "Order status")}</SectionTitle>
          <OrderTimeline order={order} />
        </Card>

        {/* Delivery & tracking */}
        <Card className="space-y-3 p-4">
          <SectionTitle>{tx("ডেলিভারি", "Delivery")}</SectionTitle>
          <p className="flex items-start gap-2">
            <Truck className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden />
            <span>
              <b>{deliveryMethodLabel[order.delivery_method][lang]}</b>
              <span className="block text-sm text-muted">{deliveryMethodLabel[order.delivery_method][`desc_${lang}`]}</span>
            </span>
          </p>
          <p className="flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden />
            <span>
              <b>{order.address.recipient_name}</b> · {d(order.address.phone.replace("+88", ""))}
              <span className="block text-ink-2">
                {order.address.address_line}, {order.address.area}, {order.address.district}
                {order.address.landmark && ` (${order.address.landmark})`}
              </span>
            </span>
          </p>
          {order.courier_name ? (
            <div className="rounded-2xl bg-surface p-3">
              <p className="text-sm text-muted">{tx("কুরিয়ার", "Courier")}</p>
              <p className="font-bold">{order.courier_name}</p>
              {order.tracking_no && (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm text-muted">{tx("ট্র্যাকিং নম্বর", "Tracking no.")}</p>
                    <p className="truncate font-mono font-semibold">{order.tracking_no}</p>
                  </div>
                  <CopyButton value={order.tracking_no} />
                </div>
              )}
              <p className="mt-1 text-xs text-muted">
                {tx("কুরিয়ারের ওয়েবসাইট বা অ্যাপে এই নম্বর দিয়ে খুঁজুন।", "Search this number on the courier's website or app.")}
              </p>
              {order.rider_phone && !delivered && (
                <a href={`tel:${order.rider_phone}`} className={`${buttonClass("outline", "lg", true)} mt-3`}>
                  <Bike className="size-5" aria-hidden /> {tx("ডেলিভারিম্যানকে কল করুন", "Call the rider")} · {d(order.rider_phone)}
                </a>
              )}
            </div>
          ) : (
            !delivered &&
            order.status !== "cancelled" && (
              <p className="text-sm text-muted">{tx("পাঠানোর পর কুরিয়ার ও ট্র্যাকিং নম্বর এখানে দেখাবে।", "Courier and tracking number appear here once shipped.")}</p>
            )
          )}
        </Card>

        {/* Items */}
        <Card className="p-4">
          <SectionTitle>{tx("পার্টস", "Parts")}</SectionTitle>
          <ul className="divide-y divide-line">
            {order.items.map((i) => {
              const part = i.part_id ? getPartById(i.part_id) : null;
              return (
                <li key={i.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      {part ? (
                        <Link href={`/part/${part.slug}`} className="font-semibold underline-offset-2 hover:underline">
                          {i.title_snapshot}
                        </Link>
                      ) : (
                        <p className="font-semibold">{i.title_snapshot}</p>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                        <QualityBadge quality={i.quality_snapshot} lang={lang} />
                        <span className={i.warranty_months_snapshot > 0 ? "inline-flex items-center gap-1 font-medium text-q-genuine" : "text-muted"}>
                          <ShieldCheck className="size-3.5" aria-hidden />
                          {tx("ওয়ারেন্টি", "Warranty")}:{" "}
                          {i.warranty_months_snapshot > 0 ? `${d(i.warranty_months_snapshot)} ${tx("মাস", "months")}` : tx("নেই", "none")}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm text-muted">
                        {d(i.qty)} × {taka(i.unit_price)}
                      </p>
                      <p className="font-bold">{taka(i.qty * i.unit_price)}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Payments */}
        <Card className="p-4">
          <SectionTitle>{tx("পেমেন্ট", "Payments")}</SectionTitle>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">{tx("মোট", "Total")}</dt>
              <dd className="font-bold">{taka(order.total)}</dd>
            </div>
            {order.advance_required > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">{tx("অগ্রিম", "Advance")}</dt>
                <dd>
                  {taka(order.advance_paid)} / {taka(order.advance_required)}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">{delivered ? tx("ডেলিভারিতে দেওয়া", "Paid on delivery") : tx("ডেলিভারিতে দিতে হবে", "Due on delivery")}</dt>
              <dd className="font-semibold">{taka(Math.max(0, order.total - order.advance_paid - order.discount))}</dd>
            </div>
          </dl>
          {order.payments.length > 0 && (
            <ul className="mt-3 space-y-2">
              {order.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 text-sm">
                  <span className="min-w-0">
                    <b>{paymentMethodLabel[p.method][lang]}</b> {taka(p.amount)}
                    <span className="block truncate text-xs text-muted">
                      {p.transaction_id && `TrxID ${p.transaction_id} · `}
                      {dateTime(p.created_at)}
                    </span>
                  </span>
                  <span className={p.status === "verified" ? "shrink-0 font-semibold text-ok" : "shrink-0 font-semibold text-accent-ink"}>
                    {paymentStatusLabel[p.status][lang]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Claims for this order */}
        {claims.length > 0 && (
          <Card className="p-4">
            <SectionTitle>{tx("আপনার দাবি", "Your claims")}</SectionTitle>
            <ul className="space-y-4">
              {claims.map((c) => (
                <li key={c.id}>
                  <details className="group rounded-2xl border border-line p-3">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                      <span className="min-w-0">
                        <b>{d(c.claim_no)}</b> · {claimTypeLabel[c.type][lang]}
                        <span className="block truncate text-xs text-muted">
                          {order.items.find((i) => i.id === c.order_item_id)?.title_snapshot} · {date(c.created_at)}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-q-oem-soft px-2.5 py-0.5 text-xs font-semibold text-q-oem">{claimStatusLabel[c.status][lang]}</span>
                    </summary>
                    <div className="mt-3">
                      <ClaimProgress claim={c} />
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {delivered && <ReviewPrompt orderId={order.id} />}

        {/* Actions */}
        <div className="space-y-2">
          {delivered && (
            <ButtonLink href={`/orders/${order.id}/claim`} variant="outline" size="lg" full>
              <AlertTriangle className="size-5" aria-hidden /> {tx("সমস্যা জানান", "Report a problem")}
            </ButtonLink>
          )}
          {order.items.some((i) => i.part_id) && (
            <Button variant="primary" size="lg" full onClick={reorder}>
              <RotateCcw className="size-5" aria-hidden /> {tx("আবার অর্ডার দিন", "Order again")}
            </Button>
          )}
          {reorderMsg && (
            <Notice tone="warn">
              {reorderMsg}{" "}
              <Link href="/request" className="font-semibold underline">
                {tx("রিকোয়েস্ট দিন", "Send a request")}
              </Link>
            </Notice>
          )}
          <a href={telLink()} className={buttonClass("ghost", "md", true)}>
            <PhoneCall className="size-5" aria-hidden /> {tx("এই অর্ডার নিয়ে কল করুন", "Call about this order")}
          </a>
          {canCancel && <CancelButton order={order} />}
        </div>

        {ADVANCEABLE.includes(order.status) && (
          <DemoBox>
            <Button variant="outline" full onClick={() => demoAdvanceOrder(order.id)}>
              {tx("ডেমো: অর্ডার পরের ধাপে নিন", "Demo: move order to next step")}
            </Button>
          </DemoBox>
        )}
      </div>

      {/* Printable */}
      <div className="mt-6 space-y-3">
        <Invoice order={order} />
        {warrantyItems.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold">{tx("ওয়ারেন্টি কার্ড", "Warranty cards")}</h2>
            {warrantyItems.map((i) => (
              <WarrantyCard key={i.id} order={order} item={i} now={now} />
            ))}
          </section>
        )}
      </div>
    </Container>
  );
}

function CancelButton({ order }: { order: Order }) {
  const { tx } = useT();
  const [ask, setAsk] = useState(false);
  if (!ask)
    return (
      <Button variant="ghost" full className="text-danger" onClick={() => setAsk(true)}>
        {tx("অর্ডার বাতিল করুন", "Cancel order")}
      </Button>
    );
  return (
    <Notice tone="danger">
      <p className="font-semibold">{tx("সত্যিই বাতিল করবেন?", "Cancel this order?")}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button variant="danger" onClick={() => cancelOrder(order.id)}>
          {tx("হ্যাঁ, বাতিল", "Yes, cancel")}
        </Button>
        <Button variant="outline" onClick={() => setAsk(false)}>
          {tx("না", "No")}
        </Button>
      </div>
    </Notice>
  );
}
