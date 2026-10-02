"use client";

import clsx from "clsx";
import { AlertTriangle, CheckCircle2, MapPin, MessageSquareText, Package, PhoneCall, Plus, ShieldCheck, Truck, Wallet } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AddressForm } from "@/components/auth/AddressForm";
import { LoginForm } from "@/components/auth/LoginForm";
import { StepCard, type StepState } from "@/components/checkout/StepCard";
import { AudioGuide } from "@/components/layout/AudioGuide";
import { deliveryMethodLabel, paymentOptionLabel } from "@/components/orders/helpers";
import { PartImage } from "@/components/part/PartImage";
import { QualityBadge } from "@/components/part/QualityBadge";
import { useT } from "@/components/providers/LangProvider";
import { Button, ButtonLink, Card, ChoiceCard, Container, Notice, PageHeader, buttonClass } from "@/components/ui/primitives";
import { getPartById, settings } from "@/lib/api";
import { telLink } from "@/lib/links";
import { getDeliveryQuote, getPaymentPlan, type PaymentOption } from "@/lib/rules";
import { placeOrder, saveAddress, useHydrated, useStore } from "@/lib/store";
import type { Order, Part } from "@/lib/types";

type Step = 2 | 3 | 4 | 5;

export default function CheckoutPage() {
  const { t, tx, lang, taka, d, range } = useT();
  const hydrated = useHydrated();
  const cart = useStore((s) => s.cart);
  const profile = useStore((s) => s.profile);
  const addresses = useStore((s) => s.addresses);
  const orders = useStore((s) => s.orders);

  const [step, setStep] = useState<Step>(2);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [payId, setPayId] = useState<PaymentOption | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [placed, setPlaced] = useState<Order | null>(null);

  // Only in-stock parts are sold through checkout (spec 7.10).
  const lines = useMemo(() => {
    const out: { part: Part; qty: number }[] = [];
    for (const l of cart) {
      const part = getPartById(l.part_id);
      if (part && part.availability === "in_stock" && part.price != null && part.stock_qty > 0)
        out.push({ part, qty: Math.min(l.qty, part.stock_qty) });
    }
    return out;
  }, [cart]);

  const address = addresses.find((a) => a.id === addressId) ?? addresses.find((a) => a.is_default) ?? addresses[0] ?? null;
  const subtotal = lines.reduce((s, l) => s + (l.part.price ?? 0) * l.qty, 0);
  const quote = address && lines.length ? getDeliveryQuote(address.district, lines.map((l) => l.part)) : null;
  const total = subtotal + (quote ? quote.charge + quote.packing : 0);
  const isNewCustomer = !orders.some((o) => o.status !== "cancelled");
  const plan = quote
    ? getPaymentPlan({ orderType: "stock", total, deliveryCharge: quote.charge, method: quote.method, isNewCustomer })
    : null;
  const chosen = plan ? (plan.options.find((o) => o.id === payId) ?? plan.options[0]) : null;

  if (!hydrated)
    return (
      <Container>
        <PageHeader title={t("checkout")} />
        <div className="h-60 animate-pulse rounded-2xl bg-line/60" />
      </Container>
    );

  if (placed) return <Success order={placed} />;

  if (!lines.length)
    return (
      <Container className="max-w-md">
        <Card className="mt-6 p-6 text-center">
          <h1 className="text-xl font-bold">{t("empty_cart")}</h1>
          <p className="mt-1 text-muted">{tx("চেকআউট করতে আগে কার্টে স্টকের পার্ট যোগ করুন।", "Add in-stock parts to your cart first.")}</p>
          <div className="mt-5 space-y-2">
            <ButtonLink href="/cart" variant="primary" size="lg" full>
              {tx("কার্টে যান", "Go to cart")}
            </ButtonLink>
            <ButtonLink href="/search" variant="outline" size="lg" full>
              {tx("পার্ট খুঁজুন", "Search parts")}
            </ButtonLink>
          </div>
        </Card>
      </Container>
    );

  const current: 1 | Step = profile ? step : 1;
  const stateOf = (n: number): StepState => (n < current ? "done" : n === current ? "active" : "locked");

  const confirm = () => {
    if (!address || !quote || !plan || !chosen || !agreed) return;
    const order = placeOrder({
      lines,
      address,
      delivery_method: quote.method,
      delivery_charge: quote.charge,
      packing_charge: quote.packing,
      advance: chosen.advance,
      needs_confirmation_call: plan.needsConfirmationCall,
    });
    setPlaced(order);
    window.scrollTo({ top: 0 });
  };

  const returnRules = tx(
    `ভুল পার্ট গেলে আমরা ফ্রি বদলে দেবো বা পুরো টাকা ফেরত দেবো। ভাঙা অবস্থায় এলে ডেলিভারির সময় খুলে দেখুন, নয়তো ${d(settings.damage_claim_hours)} ঘণ্টার মধ্যে ছবি বা ভিডিওসহ জানান। মন বদলালে স্টকের পার্ট ${d(settings.return_window_days_default)} দিনের মধ্যে, না লাগানো অবস্থায়, প্যাকেটসহ ফেরত দেওয়া যাবে, আসা-যাওয়ার খরচ আপনার। ইলেকট্রিক্যাল পার্ট লাগানোর পর ফেরত হয় না। ওয়ারেন্টি শুধু ওয়ারেন্টি থাকা জেনুইন পার্টে, সিল অক্ষত থাকলে।`,
    `Wrong part from us: free replacement or full refund. Check the parcel on delivery, or report damage within ${settings.damage_claim_hours} hours with photos/video. Change of mind: stock parts within ${settings.return_window_days_default} days, unfitted, in the box; you pay shipping both ways. Electrical parts can't be returned once fitted. Warranty only on genuine parts that carry it, with seals intact.`,
  );

  return (
    <Container className="max-w-xl">
      <PageHeader title={t("checkout")} subtitle={tx("৫টি ছোট ধাপ, এক পেজেই", "5 short steps on one page")} />

      <div className="space-y-3">
        {/* 1. Login */}
        <StepCard
          n={1}
          title={tx("লগইন", "Log in")}
          state={stateOf(1)}
          summary={profile && <>{tx("ফোন", "Phone")}: {d(profile.phone.replace("+88", ""))}</>}
        >
          <p className="mb-4 text-sm text-muted">{tx("শুধু ফোন নম্বর আর SMS কোড। পাসওয়ার্ড লাগবে না।", "Just your phone number and an SMS code. No password.")}</p>
          <LoginForm />
          <div className="my-4 flex items-center gap-3 text-sm text-muted">
            <span className="h-px flex-1 bg-line" /> {tx("অথবা", "or")} <span className="h-px flex-1 bg-line" />
          </div>
          <a href={telLink()} className={buttonClass("outline", "lg", true)}>
            <PhoneCall className="size-5" aria-hidden /> {tx("কল করে অর্ডার দিন", "Order by phone")}
          </a>
          <p className="mt-2 text-center text-sm text-muted">{settings.hotline_display}</p>
        </StepCard>

        {/* 2. Address */}
        <StepCard
          n={2}
          title={tx("ঠিকানা", "Address")}
          state={stateOf(2)}
          onEdit={() => setStep(2)}
          summary={
            address && (
              <>
                <b>{address.recipient_name}</b>, {address.address_line}, {address.area}, {address.district}
              </>
            )
          }
        >
          {!addingAddress && addresses.length > 0 ? (
            <div className="space-y-2">
              {addresses.map((a) => (
                <ChoiceCard
                  key={a.id}
                  selected={address?.id === a.id}
                  onClick={() => setAddressId(a.id)}
                  icon={<MapPin className="size-5" />}
                  title={`${a.recipient_name} · ${d(a.phone.replace("+88", ""))}`}
                  subtitle={`${a.address_line}, ${a.area}, ${a.district}`}
                />
              ))}
              <button
                type="button"
                onClick={() => setAddingAddress(true)}
                className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/25 font-semibold hover:border-ink/50"
              >
                <Plus className="size-5" aria-hidden /> {tx("নতুন ঠিকানা", "New address")}
              </button>
              <Button variant="primary" size="lg" full className="mt-2" disabled={!address} onClick={() => setStep(3)}>
                {tx("এই ঠিকানায় পাঠান", "Deliver here")} →
              </Button>
            </div>
          ) : (
            <>
              <AddressForm
                defaultPhone={profile?.phone}
                submitLabel={tx("ঠিকানা সেভ করে এগিয়ে যান", "Save and continue")}
                onSubmit={(a) => {
                  const id = saveAddress(a);
                  setAddressId(id);
                  setAddingAddress(false);
                  setStep(3);
                }}
              />
              {addresses.length > 0 && (
                <Button variant="ghost" full className="mt-2" onClick={() => setAddingAddress(false)}>
                  {tx("সেভ করা ঠিকানা থেকে বেছে নিন", "Choose a saved address")}
                </Button>
              )}
            </>
          )}
        </StepCard>

        {/* 3. Delivery (automatic) */}
        <StepCard
          n={3}
          title={tx("ডেলিভারি", "Delivery")}
          state={stateOf(3)}
          onEdit={() => setStep(3)}
          summary={quote && <>{deliveryMethodLabel[quote.method][lang]} · {taka(quote.charge + quote.packing)} · {range(quote.days[0], quote.days[1])} {t("days")}</>}
        >
          {quote && address && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-2xl bg-surface p-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-ink text-white">
                  <Truck className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="font-bold">{deliveryMethodLabel[quote.method][lang]}</p>
                  <p className="text-sm text-ink-2">{deliveryMethodLabel[quote.method][`desc_${lang}`]}</p>
                </div>
              </div>
              <p className="text-sm text-ink-2">
                {tx(
                  `আপনার ঠিকানা ${address.district} আর পার্টের আকার দেখে এটা নিজে থেকেই ঠিক হয়েছে। পৌঁছাতে ${range(quote.days[0], quote.days[1])} দিন লাগবে।`,
                  `Chosen automatically from your district (${address.district}) and the part size. Arrives in ${range(quote.days[0], quote.days[1])} days.`,
                )}
              </p>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">{t("delivery_charge")}</dt>
                  <dd className="font-semibold">{taka(quote.charge)}</dd>
                </div>
                {quote.packing > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted">
                      {t("packing_charge")} ({tx("ভঙ্গুর পার্ট", "fragile part")})
                    </dt>
                    <dd className="font-semibold">{taka(quote.packing)}</dd>
                  </div>
                )}
              </dl>
              <Button variant="primary" size="lg" full onClick={() => setStep(4)}>
                {t("next")} →
              </Button>
            </div>
          )}
        </StepCard>

        {/* 4. Payment */}
        <StepCard
          n={4}
          title={tx("পেমেন্ট", "Payment")}
          state={stateOf(4)}
          onEdit={() => setStep(4)}
          summary={chosen && <>{paymentOptionLabel[chosen.id][lang]}{chosen.advance > 0 && <> · {tx("এখন", "now")} {taka(chosen.advance)}</>}</>}
        >
          {plan && quote && (
            <div className="space-y-2">
              {plan.options.map((o) => (
                <ChoiceCard
                  key={o.id}
                  selected={chosen?.id === o.id}
                  onClick={() => setPayId(o.id)}
                  icon={<Wallet className="size-5" />}
                  title={o.id === "partial_advance" ? tx(`${d(Math.round((o.advance / total) * 100))}% আগে, বাকিটা হাতে পেয়ে`, `${Math.round((o.advance / total) * 100)}% now, rest on delivery`) : paymentOptionLabel[o.id][lang]}
                  subtitle={
                    o.advance === 0
                      ? tx(`পার্ট হাতে পেয়ে ${taka(o.cod)} দিন`, `Pay ${taka(o.cod)} when you receive it`)
                      : o.cod === 0
                        ? tx(`এখন bKash/Nagad-এ ${taka(o.advance)}`, `${taka(o.advance)} now by bKash/Nagad`)
                        : tx(`এখন ${taka(o.advance)} · হাতে পেয়ে ${taka(o.cod)}`, `${taka(o.advance)} now · ${taka(o.cod)} on delivery`)
                  }
                />
              ))}
              {!plan.options.some((o) => o.id === "cod") && (
                <Notice className="mt-2">
                  {quote.method === "branch_pickup"
                    ? tx(
                        `কুরিয়ার শাখা থেকে নেওয়া ভারী পার্টে ${d(settings.heavy_advance_percent)}% বা পুরো টাকা আগে দিতে হয়।`,
                        `Heavy parts collected from a courier branch need ${settings.heavy_advance_percent}% or full payment in advance.`,
                      )
                    : tx(
                        `${taka(settings.cod_limit)}-এর বেশি অর্ডারে পুরো ক্যাশ অন ডেলিভারি হয় না। শুধু ডেলিভারি চার্জ আগে দিলেই হবে।`,
                        `Orders above ${taka(settings.cod_limit)} can't be fully cash on delivery. Paying just the delivery charge first is enough.`,
                      )}
                </Notice>
              )}
              <Button variant="primary" size="lg" full className="mt-2" onClick={() => setStep(5)}>
                {t("next")} →
              </Button>
            </div>
          )}
        </StepCard>

        {/* 5. Review + 6. Confirm */}
        <StepCard n={5} title={tx("দেখে নিন ও নিশ্চিত করুন", "Review and confirm")} state={stateOf(5)}>
          {quote && chosen && address && plan && (
            <div className="space-y-4">
              <ul className="divide-y divide-line">
                {lines.map(({ part, qty }) => (
                  <li key={part.id} className="flex gap-3 py-3 first:pt-0">
                    <PartImage part={part} className="size-16 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug">{lang === "bn" ? part.name_bn : part.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                        <QualityBadge quality={part.quality} lang={lang} />
                        <span className={clsx("inline-flex items-center gap-1 font-medium", part.warranty_months > 0 ? "text-q-genuine" : "text-muted")}>
                          <ShieldCheck className="size-3.5" aria-hidden />
                          {t("warranty")}: {part.warranty_months > 0 ? `${d(part.warranty_months)} ${t("months")}` : t("no_warranty")}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {part.is_electrical
                          ? tx("ইলেকট্রিক্যাল: লাগানোর পর ফেরত হয় না", "Electrical: no return once fitted")
                          : part.is_returnable
                            ? tx(`${d(part.return_window_days)} দিনের মধ্যে না লাগানো অবস্থায় ফেরত`, `Returnable within ${part.return_window_days} days, unfitted`)
                            : tx("মন বদলালে ফেরত হয় না", "No change-of-mind returns")}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm text-muted">
                        {d(qty)} × {taka(part.price ?? 0)}
                      </p>
                      <p className="font-bold">{taka((part.price ?? 0) * qty)}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <dl className="space-y-1.5 rounded-2xl bg-surface p-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">{t("subtotal")}</dt>
                  <dd>{taka(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">{t("delivery_charge")}</dt>
                  <dd>{taka(quote.charge)}</dd>
                </div>
                {quote.packing > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted">{t("packing_charge")}</dt>
                    <dd>{taka(quote.packing)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-line pt-2 text-lg font-bold">
                  <dt>{t("total")}</dt>
                  <dd>{taka(total)}</dd>
                </div>
                {chosen.advance > 0 && (
                  <div className="flex justify-between font-semibold text-accent-ink">
                    <dt>{tx("এখন অগ্রিম (bKash/Nagad)", "Pay now (bKash/Nagad)")}</dt>
                    <dd>{taka(chosen.advance)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted">{tx("পার্ট হাতে পেয়ে দেবেন", "Pay on delivery")}</dt>
                  <dd>{taka(chosen.cod)}</dd>
                </div>
              </dl>

              <div className="rounded-2xl border border-line p-3">
                <p className="mb-1 font-semibold">{tx("রিটার্ন ও ওয়ারেন্টি নিয়ম (সংক্ষেপে)", "Returns & warranty (short)")}</p>
                <p className="text-sm text-ink-2">{returnRules}</p>
                <AudioGuide className="mt-3" text={returnRules} label={tx("নিয়ম শুনুন", "Listen to the rules")} />
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-line p-3 has-[:checked]:border-ok">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 size-6 shrink-0 accent-[var(--color-ok)]" />
                <span className="font-semibold">{tx("আমি রিটার্ন ও ওয়ারেন্টি নিয়ম পড়েছি", "I have read the return and warranty rules")}</span>
              </label>

              {plan.needsConfirmationCall && (
                <p className="flex items-start gap-2 text-sm text-ink-2">
                  <PhoneCall className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {tx("প্রথম অর্ডার বলে আমরা একবার কল করে নিশ্চিত করবো।", "As this is your first order, we'll call once to confirm.")}
                </p>
              )}

              <Button variant="accent" size="lg" full disabled={!agreed} onClick={confirm}>
                <CheckCircle2 className="size-5" aria-hidden /> {tx("অর্ডার নিশ্চিত করুন", "Confirm order")} · {taka(total)}
              </Button>
              {!agreed && <p className="text-center text-sm text-muted">{tx("নিশ্চিত করতে উপরের বক্সে টিক দিন", "Tick the box above to confirm")}</p>}
            </div>
          )}
        </StepCard>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        {tx("সাহায্য লাগবে?", "Need help?")}{" "}
        <a href={telLink()} className="font-semibold text-ink underline">
          {tx("কল করুন", "Call")} {settings.hotline_display}
        </a>
      </p>
    </Container>
  );
}

function Success({ order }: { order: Order }) {
  const { tx, d, taka } = useT();
  const advance = order.advance_required;
  const steps = [
    ...(advance > 0
      ? [tx(`bKash/Nagad-এ ${taka(advance)} অগ্রিম পাঠান`, `Send ${taka(advance)} advance by bKash/Nagad`)]
      : []),
    order.needs_confirmation_call
      ? tx("আমরা একবার কল করে নিশ্চিত করবো", "We'll call you once to confirm")
      : tx("আমরা অর্ডারটি নিশ্চিত করবো", "We'll confirm the order"),
    tx("পার্ট মান যাচাই করে প্যাক হবে", "The part is quality-checked and packed"),
    tx("পাঠানোর পর কুরিয়ার ট্র্যাকিং নম্বর SMS-এ পাবেন", "You'll get the courier tracking number by SMS"),
  ];

  return (
    <Container className="max-w-md">
      <Card className="mt-4 p-6 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-ok text-white">
          <CheckCircle2 className="size-9" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-bold">{tx("অর্ডার হয়েছে!", "Order placed!")}</h1>
        <p className="mt-3 text-sm text-muted">{tx("অর্ডার নম্বর", "Order number")}</p>
        <p className="text-4xl font-extrabold tracking-wide">{d(order.order_no)}</p>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-ink-2">
          <MessageSquareText className="size-4" aria-hidden />
          {tx(`নিশ্চিতকরণ SMS যাবে ${d(order.address.phone.replace("+88", ""))} নম্বরে`, `A confirmation SMS goes to ${order.address.phone.replace("+88", "")}`)}
        </p>
        {order.needs_confirmation_call && (
          <Notice tone="warn" className="mt-4 text-left">
            <span className="flex items-start gap-2 font-semibold">
              <PhoneCall className="mt-0.5 size-4 shrink-0" aria-hidden />
              {tx("আমরা একবার কল করে নিশ্চিত করবো।", "We'll call you once to confirm.")}
            </span>
          </Notice>
        )}
      </Card>

      <Card className="mt-3 p-5">
        <h2 className="mb-3 font-bold">{tx("এরপর কী হবে", "What happens next")}</h2>
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-white">{d(i + 1)}</span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="mt-4 space-y-2">
        {advance > 0 ? (
          <>
            <Notice tone="warn">
              <span className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {tx("অগ্রিম না পেলে অর্ডার প্রসেস শুরু হবে না।", "We start processing once the advance arrives.")}
              </span>
            </Notice>
            <ButtonLink href={`/checkout/payment/${order.id}`} variant="accent" size="lg" full>
              <Wallet className="size-5" aria-hidden /> {tx(`এখন ${taka(advance)} অগ্রিম দিন`, `Pay ${taka(advance)} advance now`)}
            </ButtonLink>
            <ButtonLink href={`/orders/${order.id}`} variant="outline" size="lg" full>
              <Package className="size-5" aria-hidden /> {tx("অর্ডার দেখুন", "View order")}
            </ButtonLink>
          </>
        ) : (
          <>
            <ButtonLink href={`/orders/${order.id}`} variant="primary" size="lg" full>
              <Package className="size-5" aria-hidden /> {tx("অর্ডার ট্র্যাক করুন", "Track order")}
            </ButtonLink>
            <Link href="/" className="block py-2 text-center font-semibold underline">
              {tx("হোমে ফিরুন", "Back to home")}
            </Link>
          </>
        )}
      </div>
    </Container>
  );
}
