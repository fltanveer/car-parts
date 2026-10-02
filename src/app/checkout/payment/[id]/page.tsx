"use client";

import clsx from "clsx";
import { BadgeCheck, Banknote, Clock, FileText, Hash, PhoneCall, Send, Smartphone } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import { RequireLogin } from "@/components/auth/RequireLogin";
import { CopyButton } from "@/components/checkout/CopyButton";
import { AudioGuide } from "@/components/layout/AudioGuide";
import { PhotoUploader } from "@/components/media/PhotoUploader";
import { DemoBox } from "@/components/orders/DemoBox";
import { advanceDue, hasPendingPayment, paymentMethodLabel } from "@/components/orders/helpers";
import { useT } from "@/components/providers/LangProvider";
import { Button, ButtonLink, Card, Container, Field, Input, PageHeader, buttonClass } from "@/components/ui/primitives";
import { settings } from "@/lib/api";
import { normalizePhone, toEnDigits } from "@/lib/format";
import { telLink } from "@/lib/links";
import { demoVerifyPayment, submitPayment, useHydrated, useStore } from "@/lib/store";
import type { MediaItem } from "@/lib/types";

type Wallet = "bkash" | "nagad";

const WALLET: Record<Wallet, { color: string; number: string }> = {
  bkash: { color: "#e2136e", number: settings.bkash_number },
  nagad: { color: "#f6921e", number: settings.nagad_number },
};

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { tx } = useT();
  return (
    <RequireLogin reason={tx("পেমেন্ট দিতে লগইন করুন", "Log in to pay")}>
      <Payment id={id} />
    </RequireLogin>
  );
}

function Payment({ id }: { id: string }) {
  const { tx, lang, taka, d, dateTime } = useT();
  const hydrated = useHydrated();
  const order = useStore((s) => s.orders.find((o) => o.id === id));

  const [wallet, setWallet] = useState<Wallet>("bkash");
  const [sender, setSender] = useState("");
  const [trx, setTrx] = useState("");
  const [shots, setShots] = useState<MediaItem[]>([]);
  const [errors, setErrors] = useState<{ sender?: string; trx?: string }>({});

  if (!hydrated) return <Container><div className="h-40 animate-pulse rounded-2xl bg-line/60" /></Container>;

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
  const pending = hasPendingPayment(order);
  const pendingPayment = order.payments.find((p) => p.status === "submitted");
  const w = WALLET[wallet];
  const walletName = paymentMethodLabel[wallet][lang];
  const plainNumber = w.number.replace(/\D/g, "");

  const guide = tx(
    `${walletName} অ্যাপ খুলুন। Send Money চাপুন। এই নম্বর দিন: ${w.number}। টাকার পরিমাণ দিন: ${due} টাকা। রেফারেন্সে অর্ডার নম্বর লিখুন: ${order.order_no}। পিন দিয়ে পাঠান। তারপর এখানে কোন নম্বর থেকে পাঠালেন আর Transaction ID লিখে জমা দিন।`,
    `Open the ${walletName} app. Tap Send Money. Enter this number: ${w.number}. Enter the amount: ${due} taka. Put the order number ${order.order_no} as the reference. Confirm with your PIN. Then enter your sending number and the Transaction ID here.`,
  );

  const steps = [
    { Icon: Smartphone, text: tx(`${walletName} অ্যাপ খুলুন`, `Open the ${walletName} app`) },
    { Icon: Send, text: tx("“Send Money” চাপুন", "Tap “Send Money”") },
    { Icon: Hash, text: tx(`এই নম্বর দিন: ${d(w.number)}`, `Enter this number: ${w.number}`) },
    { Icon: Banknote, text: tx(`টাকার পরিমাণ: ${taka(due)}`, `Amount: ${taka(due)}`) },
    { Icon: FileText, text: tx(`রেফারেন্সে লিখুন: ${d(order.order_no)}`, `Reference: ${order.order_no}`) },
  ];

  const submit = () => {
    const e: typeof errors = {};
    const phone = normalizePhone(sender);
    if (!phone) e.sender = tx("যে নম্বর থেকে পাঠিয়েছেন সেটি সঠিকভাবে দিন (01XXXXXXXXX)", "Enter the number you sent from (01XXXXXXXXX)");
    const code = toEnDigits(trx).replace(/\s/g, "").toUpperCase();
    if (!/^[A-Z0-9]{8,12}$/.test(code))
      e.trx = tx("Transaction ID ৮ থেকে ১২ অক্ষরের (ইংরেজি অক্ষর ও সংখ্যা), SMS-এ পাবেন", "Transaction ID is 8–12 letters/digits, found in the SMS");
    setErrors(e);
    if (Object.keys(e).length) return;
    // Screenshot stays local for now: submitPayment has no field for it yet.
    submitPayment(order.id, { method: wallet, sender_number: phone!.replace("+88", ""), transaction_id: code, amount: due, screenshot_url: shots[0]?.url ?? null });
    window.scrollTo({ top: 0 });
  };

  if (order.status === "cancelled" || order.advance_required === 0)
    return (
      <Container className="max-w-md">
        <Card className="mt-6 p-6 text-center">
          <h1 className="text-xl font-bold">
            {order.status === "cancelled" ? tx("এই অর্ডার বাতিল হয়েছে", "This order was cancelled") : tx("এই অর্ডারে অগ্রিম লাগবে না", "No advance needed for this order")}
          </h1>
          <ButtonLink href={`/orders/${order.id}`} variant="primary" size="lg" full className="mt-4">
            {tx("অর্ডার দেখুন", "View order")}
          </ButtonLink>
        </Card>
      </Container>
    );

  // Paid in full (after admin verification).
  if (due === 0)
    return (
      <Container className="max-w-md">
        <Card className="mt-4 p-6 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-ok text-white">
            <BadgeCheck className="size-9" aria-hidden />
          </span>
          <h1 className="mt-4 text-2xl font-bold">{tx("অগ্রিম পাওয়া গেছে", "Advance received")}</h1>
          <p className="mt-2 text-muted">
            {tx(`অর্ডার ${d(order.order_no)}: ধন্যবাদ! কাজ শুরু হয়েছে, SMS পাবেন।`, `Order ${order.order_no}: thank you! We've started, you'll get an SMS.`)}
          </p>
          <ButtonLink href={`/orders/${order.id}`} variant="primary" size="lg" full className="mt-5">
            {tx("অর্ডার ট্র্যাক করুন", "Track order")}
          </ButtonLink>
        </Card>
      </Container>
    );

  if (pending && pendingPayment)
    return (
      <Container className="max-w-md">
        <Card className="mt-4 p-6 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-accent-soft text-accent-ink">
            <Clock className="size-9" aria-hidden />
          </span>
          <h1 className="mt-4 text-2xl font-bold">{tx("যাচাই হচ্ছে", "Being verified")}</h1>
          <p className="mt-2 text-ink-2">
            {tx(
              "আপনার পেমেন্টের তথ্য পেয়েছি। আমরা মিলিয়ে দেখে SMS-এ জানাবো, সাধারণত ৩০ মিনিটের মধ্যে (অফিস সময়ে)।",
              "We got your payment details. We'll match it and confirm by SMS, usually within 30 minutes (office hours).",
            )}
          </p>
          <dl className="mt-4 space-y-1 rounded-2xl bg-surface p-3 text-left text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{tx("অর্ডার", "Order")}</dt>
              <dd className="font-semibold">{d(order.order_no)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{paymentMethodLabel[pendingPayment.method][lang]}</dt>
              <dd className="font-semibold">{taka(pendingPayment.amount)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{tx("পাঠানো নম্বর", "From")}</dt>
              <dd className="font-semibold">{d(pendingPayment.sender_number ?? "")}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">TrxID</dt>
              <dd className="font-semibold">{pendingPayment.transaction_id}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{tx("সময়", "Time")}</dt>
              <dd>{dateTime(pendingPayment.created_at)}</dd>
            </div>
          </dl>
          <ButtonLink href={`/orders/${order.id}`} variant="primary" size="lg" full className="mt-5">
            {tx("অর্ডার দেখুন", "View order")}
          </ButtonLink>
        </Card>
        <DemoBox>
          <Button variant="outline" full onClick={() => demoVerifyPayment(order.id)}>
            {tx("ডেমো: অ্যাডমিন হিসেবে পেমেন্ট যাচাই করুন", "Demo: verify payment as admin")}
          </Button>
        </DemoBox>
        <CallHelp />
      </Container>
    );

  return (
    <Container className="max-w-md">
      <PageHeader title={tx("অগ্রিম পেমেন্ট", "Advance payment")} subtitle={`${tx("অর্ডার", "Order")} ${d(order.order_no)}`} />

      <Card className="p-5 text-center">
        <p className="text-sm font-semibold text-muted">{tx("পাঠাতে হবে", "Amount to send")}</p>
        <p className="text-5xl font-extrabold tracking-tight">{taka(due)}</p>
        <p className="mt-2 text-sm text-muted">
          {tx(`বাকি ${taka(order.total - due)} পার্ট হাতে পেয়ে দেবেন`, `The remaining ${taka(order.total - due)} is paid on delivery`)}
        </p>
      </Card>

      <h2 className="mb-2 mt-5 font-bold">{tx("কোনটা দিয়ে পাঠাবেন?", "Pay with")}</h2>
      <div className="grid grid-cols-2 gap-2" role="radiogroup">
        {(Object.keys(WALLET) as Wallet[]).map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={wallet === k}
            onClick={() => setWallet(k)}
            className={clsx(
              "flex min-h-16 items-center justify-center gap-2 rounded-2xl border-2 bg-card text-lg font-extrabold",
              wallet === k ? "border-ink" : "border-line",
            )}
          >
            <span className="grid size-8 place-items-center rounded-lg text-sm font-black text-white" style={{ backgroundColor: WALLET[k].color }} aria-hidden>
              {k === "bkash" ? "b" : "N"}
            </span>
            {paymentMethodLabel[k][lang]}
          </button>
        ))}
      </div>

      <Card className="mt-3 p-4">
        <p className="text-sm text-muted">
          {walletName} {tx("নম্বর (পার্সোনাল, Send Money করুন)", "number (personal, use Send Money)")}
        </p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="text-2xl font-bold tabular-nums tracking-wide" style={{ color: w.color }}>
            {d(w.number)}
          </p>
          <CopyButton value={plainNumber} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
          <div>
            <p className="text-sm text-muted">{tx("রেফারেন্স (অর্ডার নম্বর)", "Reference (order number)")}</p>
            <p className="text-lg font-bold">{order.order_no}</p>
          </div>
          <CopyButton value={order.order_no} />
        </div>
      </Card>

      <Card className="mt-3 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold">{tx("কীভাবে পাঠাবেন", "How to send")}</h2>
        </div>
        <ol className="space-y-2">
          {steps.map(({ Icon, text }, i) => (
            <li key={i} className="flex items-center gap-3 rounded-xl bg-surface p-2.5">
              <span className="relative grid size-11 shrink-0 place-items-center rounded-xl text-white" style={{ backgroundColor: w.color }}>
                <Icon className="size-5" aria-hidden />
                <span className="absolute -left-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-ink text-[11px] font-bold">{d(i + 1)}</span>
              </span>
              <span className="font-medium">{text}</span>
            </li>
          ))}
        </ol>
        <AudioGuide className="mt-3" text={guide} />
      </Card>

      <Card className="mt-3 space-y-4 p-4">
        <h2 className="font-bold">{tx("পাঠানোর পর এগুলো দিন", "After sending, enter")}</h2>
        <Field label={tx("কোন নম্বর থেকে পাঠিয়েছেন", "Number you sent from")} error={errors.sender}>
          <Input type="tel" inputMode="tel" placeholder="01XXXXXXXXX" value={sender} onChange={(e) => setSender(e.target.value)} />
        </Field>
        <Field
          label="Transaction ID (TrxID)"
          hint={tx(`${walletName} থেকে আসা SMS-এ পাবেন, যেমন 9KD7X2LQ1P`, `Found in the ${walletName} SMS, e.g. 9KD7X2LQ1P`)}
          error={errors.trx}
        >
          <Input
            value={trx}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setTrx(e.target.value)}
            className="font-mono uppercase tracking-wider"
          />
        </Field>
        <div>
          <p className="mb-1.5 font-semibold">
            {tx("স্ক্রিনশট", "Screenshot")} <span className="font-normal text-muted">({tx("ঐচ্ছিক", "optional")})</span>
          </p>
          <PhotoUploader value={shots} onChange={setShots} max={1} />
        </div>
        <Button variant="accent" size="lg" full onClick={submit}>
          {tx("পেমেন্ট জমা দিন", "Submit payment")}
        </Button>
      </Card>

      <CallHelp />
    </Container>
  );
}

function CallHelp() {
  const { tx } = useT();
  return (
    <div className="mt-4 rounded-2xl border border-line bg-card p-4 text-center">
      <p className="font-semibold">{tx("পাঠাতে সমস্যা হচ্ছে?", "Trouble sending?")}</p>
      <p className="text-sm text-muted">{tx("কল করুন, আমরা সাহায্য করবো", "Call us, we'll help")}</p>
      <a href={telLink()} className={clsx(buttonClass("outline", "lg", true), "mt-3")}>
        <PhoneCall className="size-5" aria-hidden /> {settings.hotline_display}
      </a>
      <Link href="/orders" className="mt-3 block text-sm font-semibold underline">
        {tx("পরে দেবো, আমার অর্ডারে যান", "Pay later, go to my orders")}
      </Link>
    </div>
  );
}
