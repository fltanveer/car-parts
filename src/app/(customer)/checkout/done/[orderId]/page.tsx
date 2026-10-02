"use client";

import { CheckCircle2, Package } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { orderById, vendorById } from "@/lib/db/queries";
import type { DB } from "@/lib/db/seed";
import { useDb } from "@/lib/db/store";
import { fulfillmentLabel, paymentMethodLabel } from "@/lib/labels";
import { settings } from "@/lib/mock/settings";
import { AudioGuide } from "@/components/layout/AudioGuide";
import { HelpCall } from "@/components/shared/Misc";
import { useT } from "@/components/providers/LangProvider";
import { ButtonLink, Container, EmptyState, Notice } from "@/components/ui/primitives";

const whole = (s: DB) => s;

/** Order placed: big order number, each shop confirms within 12 hours (file 01 6.2). */
export default function OrderDonePage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { tx, lang, taka, d, L } = useT();
  const s = useDb(whole);
  const order = orderById(s, orderId);
  if (!order) {
    return (
      <Container>
        <EmptyState icon="🧾" title={tx("অর্ডার পাওয়া যায়নি", "Order not found")} action={<ButtonLink href="/my" variant="brand" size="lg">{tx("আমার কাজ", "My stuff")}</ButtonLink>} />
      </Container>
    );
  }
  const subs = s.vendorOrders.filter((v) => v.order_id === order.id);
  const pending = order.payments.some((p) => p.status === "submitted");
  const unpaidAdvance = order.advance_due > 0 && !order.payments.some((p) => p.status === "submitted" || p.status === "verified");
  const spoken = tx(
    `আপনার অর্ডার হয়েছে। অর্ডার নম্বর ${order.order_no}। প্রতিটা দোকান ${settings.vendor_accept_hours} ঘণ্টার মধ্যে নিশ্চিত করবে। SMS-এ জানাবো।`,
    `Your order is placed. Order number ${order.order_no}. Each shop confirms within ${settings.vendor_accept_hours} hours. We'll text you.`,
  );

  return (
    <Container className="space-y-5 text-center">
      <div className="flex flex-col items-center gap-3 pt-4">
        <span className="grid size-20 place-items-center rounded-full bg-ok-soft text-ok">
          <CheckCircle2 className="size-12" aria-hidden />
        </span>
        <h1 className="text-2xl font-bold">{tx("অর্ডার হয়েছে!", "Order placed!")}</h1>
        <p className="text-muted">{tx("অর্ডার নম্বর", "Order number")}</p>
        <p className="rounded-2xl bg-ink px-6 py-3 font-mono text-4xl font-black tracking-wider text-white">{order.order_no}</p>
        <AudioGuide text={spoken} />
      </div>

      <Notice tone="wait" className="text-left">
        ⏱ {tx(`প্রতিটা দোকান ${d(settings.vendor_accept_hours)} ঘণ্টার মধ্যে নিশ্চিত করবে। প্রতিটা ধাপে SMS পাবেন।`, `Each shop confirms within ${settings.vendor_accept_hours} hours. You'll get an SMS at every step.`)}
      </Notice>
      {pending && <Notice tone="wait" className="text-left">📲 {tx("আপনার পাঠানো টাকা আমাদের টিম মিলিয়ে দেখছে।", "Our team is verifying your payment.")}</Notice>}
      {unpaidAdvance && (
        <Notice tone="bad" className="text-left">
          {tx(`অগ্রিম ${taka(order.advance_due)} এখনো দেওয়া হয়নি। না দিলে দোকান পাঠাবে না।`, `Advance ${taka(order.advance_due)} not paid yet. Shops won't ship until it's paid.`)}{" "}
          <Link href={`/checkout/pay/${order.id}`} className="font-bold underline">{tx("এখন দিন", "Pay now")}</Link>
        </Notice>
      )}

      <ul className="space-y-2 text-left">
        {subs.map((v) => {
          const vendor = vendorById(s, v.vendor_id);
          return (
            <li key={v.id} className="flex items-start gap-3 rounded-2xl border border-line bg-card p-3">
              <Package className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{v.sub_order_no} · {lang === "bn" ? vendor?.shop_name_bn : vendor?.shop_name}</p>
                <p className="text-sm text-ink-2">{v.items.map((i) => i.snapshot.title).join(", ")}</p>
                <p className="text-sm text-muted">{L(fulfillmentLabel[v.fulfillment])}</p>
                {v.pickup_code && <p className="mt-1 text-sm">{tx("পিকআপ কোড", "Pickup code")}: <b className="font-mono text-lg">{d(v.pickup_code)}</b></p>}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-sm text-muted">
        {L(paymentMethodLabel[order.payment_method])} · {tx("মোট", "Total")} {taka(order.grand_total)}
      </p>

      <ButtonLink href={`/my/orders/${order.id}`} variant="ok" size="xl" full>
        📦 {tx("অর্ডার দেখুন", "Track order")}
      </ButtonLink>
      <ButtonLink href="/" variant="ghost" size="md" full>
        {tx("হোমে ফিরুন", "Back to home")}
      </ButtonLink>
      <HelpCall className="text-left" />
    </Container>
  );
}
