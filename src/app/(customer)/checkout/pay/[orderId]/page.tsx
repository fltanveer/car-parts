"use client";

import { Copy, CreditCard, Smartphone } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { payOnline, submitManualPayment } from "@/lib/db/actions";
import { orderById } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import { normalizePhone, spokenTaka, toEnDigits } from "@/lib/format";
import { settings } from "@/lib/mock/settings";
import { isManualAdvanceAllowed, maxManualAdvance } from "@/lib/rules";
import { AudioGuide } from "@/components/layout/AudioGuide";
import { HelpCall, toast } from "@/components/shared/Misc";
import { useT } from "@/components/providers/LangProvider";
import { Button, ButtonLink, ChoiceCard, Container, EmptyState, Field, Input, Notice, PageHeader } from "@/components/ui/primitives";

type Way = "bkash_manual" | "nagad_manual" | "online";

/** Advance payment: manual bKash/Nagad Send Money (≤10% / delivery charge) or online escrow (file 01 6.3). */
export default function PayPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { tx, lang, taka, d } = useT();
  const router = useRouter();
  const order = useDb((s) => orderById(s, orderId));
  const manualOk = !!order && order.payment_method !== "online" && order.advance_due > 0 && isManualAdvanceAllowed(order.advance_due, order.grand_total);
  const [way, setWay] = useState<Way | null>(null);
  const chosen: Way = way ?? (manualOk ? "bkash_manual" : "online");
  const [sender, setSender] = useState("");
  const [trx, setTrx] = useState("");
  const [err, setErr] = useState<string | null>(null);

  if (!order) {
    return (
      <Container>
        <EmptyState icon="🧾" title={tx("অর্ডার পাওয়া যায়নি", "Order not found")} action={<ButtonLink href="/my" variant="brand" size="lg">{tx("আমার কাজ", "My stuff")}</ButtonLink>} />
      </Container>
    );
  }

  const submitted = order.payments.some((p) => p.status === "submitted" || p.status === "verified");
  if (order.payment_status === "paid" || submitted) {
    return (
      <Container className="space-y-4">
        <Notice tone="ok">{tx("পেমেন্ট পাওয়া গেছে", "Payment received")}</Notice>
        <ButtonLink href={`/checkout/done/${order.id}`} variant="ok" size="xl" full>{tx("এগিয়ে যান", "Continue")}</ButtonLink>
      </Container>
    );
  }

  const amount = chosen === "online" ? order.grand_total : order.advance_due;
  const number = chosen === "nagad_manual" ? settings.nagad_number : settings.bkash_number;
  const wallet = chosen === "nagad_manual" ? "Nagad" : "bKash";
  const guide = tx(
    `${wallet} অ্যাপ খুলুন। সেন্ড মানি চাপুন। এই নম্বরে ${spokenTaka(amount, "bn")} পাঠান: ${number}। পাঠানোর পর যে নম্বর থেকে পাঠালেন আর ট্রানজেকশন আইডি এখানে লিখুন।`,
    `Open ${wallet}. Tap Send Money. Send ${spokenTaka(amount, "en")} to ${number}. Then enter your sending number and the Transaction ID here.`,
  );

  const sendManual = () => {
    const p = normalizePhone(sender);
    const id = toEnDigits(trx).trim();
    if (!p) return setErr(tx("যে নম্বর থেকে পাঠালেন সেটা দিন", "Enter the number you sent from"));
    if (id.length < 6) return setErr(tx("ট্রানজেকশন আইডি ঠিকমতো দিন", "Enter the Transaction ID"));
    submitManualPayment(order.id, { method: chosen as "bkash_manual" | "nagad_manual", amount: order.advance_due, sender: p.replace(/^\+88/, ""), trx: id });
    toast(tx("পাঠানো হয়েছে, আমাদের টিম মিলিয়ে দেখবে", "Submitted, our team will verify"));
    router.replace(`/checkout/done/${order.id}`);
  };

  return (
    <Container className="space-y-4">
      <PageHeader title={tx("অগ্রিম টাকা দিন", "Pay the advance")} subtitle={`${tx("অর্ডার", "Order")} ${order.order_no}`}>
        <AudioGuide compact text={chosen === "online" ? tx("অনলাইনে দিলে টাকা আমাদের কাছে নিরাপদ থাকবে, জিনিস ঠিক না হলে ফেরত পাবেন।", "Paying online keeps your money safe with us; refunded if the item isn't right.") : guide} />
      </PageHeader>

      <div className="rounded-2xl bg-ink p-5 text-center text-white">
        <p className="text-sm opacity-80">{chosen === "online" ? tx("এখন দেবেন (পুরো টাকা)", "Pay now (full amount)") : tx("এখন দেবেন", "Pay now")}</p>
        <p className="text-4xl font-bold">{taka(amount)}</p>
        {chosen !== "online" && <p className="mt-1 text-sm opacity-80">{tx(`বাকি ${taka(order.grand_total - order.advance_due)} জিনিস পেয়ে দেবেন`, `Remaining ${taka(order.grand_total - order.advance_due)} on delivery`)}</p>}
      </div>

      <div className="space-y-2">
        {manualOk && (
          <>
            <ChoiceCard selected={chosen === "bkash_manual"} onClick={() => setWay("bkash_manual")} icon={<Smartphone className="size-5 text-[#e2136e]" />} title="bKash Send Money" subtitle={tx("নিজের bKash থেকে পাঠান", "From your own bKash")} />
            <ChoiceCard selected={chosen === "nagad_manual"} onClick={() => setWay("nagad_manual")} icon={<Smartphone className="size-5 text-[#f6921e]" />} title="Nagad Send Money" subtitle={tx("নিজের Nagad থেকে পাঠান", "From your own Nagad")} />
          </>
        )}
        <ChoiceCard selected={chosen === "online"} onClick={() => setWay("online")} icon={<CreditCard className="size-5" />} title={tx("অনলাইনে পুরো টাকা (bKash/Nagad/কার্ড)", "Full amount online (bKash/Nagad/card)")} subtitle={tx(`${taka(order.grand_total)} · টাকা এসক্রোতে নিরাপদ`, `${taka(order.grand_total)} · held in escrow`)} />
      </div>

      {chosen === "online" ? (
        <Button
          variant="ok"
          size="xl"
          full
          onClick={() => {
            payOnline(order.id);
            toast(tx("পেমেন্ট সফল", "Payment successful"));
            router.replace(`/checkout/done/${order.id}`);
          }}
        >
          💳 {tx(`${taka(order.grand_total)} দিন`, `Pay ${taka(order.grand_total)}`)}
        </Button>
      ) : (
        <section className="space-y-3 rounded-2xl border border-line bg-card p-4">
          <ol className="list-decimal space-y-1 pl-5 text-ink-2">
            <li>{tx(`${wallet} অ্যাপে "Send Money" চাপুন`, `In ${wallet}, tap "Send Money"`)}</li>
            <li>{tx("এই নম্বরে টাকা পাঠান", "Send to this number")}</li>
            <li>{tx("নিচে নম্বর ও ট্রানজেকশন আইডি দিন", "Enter your number and the Transaction ID below")}</li>
          </ol>
          <div className="flex items-center justify-between gap-2 rounded-xl bg-surface p-3">
            <span className="font-mono text-2xl font-bold">{lang === "bn" ? d(number) : number}</span>
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                void navigator.clipboard?.writeText(number.replace(/-/g, ""));
                toast(tx("নম্বর কপি হয়েছে", "Number copied"));
              }}
            >
              <Copy className="size-4" aria-hidden /> {tx("কপি", "Copy")}
            </Button>
          </div>
          <Notice tone="wait">
            {tx(
              `আইন অনুযায়ী অগ্রিম মোটের ${d(settings.manual_advance_max_percent)}% (সর্বোচ্চ ${taka(maxManualAdvance(order.grand_total))}) বা শুধু ডেলিভারি চার্জ। এর বেশি কেউ চাইলে দেবেন না।`,
              `By law the advance is at most ${settings.manual_advance_max_percent}% (max ${taka(maxManualAdvance(order.grand_total))}) or just the delivery charge. Never pay more.`,
            )}
          </Notice>
          <Field label={tx("যে নম্বর থেকে পাঠালেন", "Number you sent from")}>
            <Input inputMode="tel" value={sender} onChange={(e) => { setSender(e.target.value); setErr(null); }} placeholder="01XXXXXXXXX" />
          </Field>
          <Field label={tx("ট্রানজেকশন আইডি (TrxID)", "Transaction ID (TrxID)")} hint={tx("SMS-এ আসে, যেমন 8N7A2KQ9", "Comes by SMS, e.g. 8N7A2KQ9")}>
            <Input value={trx} onChange={(e) => { setTrx(e.target.value.toUpperCase()); setErr(null); }} autoCapitalize="characters" className="font-mono" />
          </Field>
          {err && <p className="font-medium text-bad">{err}</p>}
          <Button variant="ok" size="xl" full onClick={sendManual}>
            ✅ {tx("টাকা পাঠিয়েছি", "I've sent the money")}
          </Button>
        </section>
      )}
      <ButtonLink href={`/my/orders/${order.id}`} variant="ghost" size="md" full>
        {tx("পরে দেবো, অর্ডার দেখুন", "Pay later, view order")}
      </ButtonLink>
      <HelpCall />
    </Container>
  );
}
