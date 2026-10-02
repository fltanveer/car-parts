"use client";

import clsx from "clsx";
import { Volume2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { withdrawMoney } from "@/lib/db/actions-seller";
import { vendorBalance } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import { spokenTaka } from "@/lib/format";
import { settings } from "@/lib/mock/settings";
import type { LedgerEntry, Vendor } from "@/lib/types";
import { speak } from "../../layout/AudioGuide";
import { useT } from "../../providers/LangProvider";
import { NumberPad, toast, useNow } from "../../shared/Misc";
import { Sheet } from "../../ui/Sheet";
import { Button, Card, Notice, SectionTitle, StatusPill } from "../../ui/primitives";
import { SellerPage } from "../SellerPage";
import { Statement } from "./Statement";

const WEEKDAYS = { bn: ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"], en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] };
const METHOD = { bkash: "bKash", nagad: "Nagad", bank: "Bank" } as const;

export function MoneyPage({ vendor }: { vendor: Vendor }) {
  const { tx, taka, d, lang, date } = useT();
  const now = useNow();
  const vid = vendor.id;
  const bal = useDb((s) => vendorBalance(s, vid, now));
  const ledger = useDb((s) => s.ledger.filter((e) => e.vendor_id === vid));
  const payouts = useDb((s) => s.payouts.filter((p) => p.vendor_id === vid));
  const vos = useDb((s) => s.vendorOrders.filter((o) => o.vendor_id === vid));
  const [withdraw, setWithdraw] = useState(false);
  const [amount, setAmount] = useState(0);
  const [statement, setStatement] = useState(false);
  const method = vendor.payout_methods.find((p) => p.is_default) ?? vendor.payout_methods[0];

  const read = () =>
    speak(
      lang === "bn"
        ? `আসছে ${spokenTaka(bal.pending, "bn")}। তোলা যাবে ${spokenTaka(bal.available, "bn")}। এই মাসে পেয়েছেন ${spokenTaka(bal.paidThisMonth, "bn")}।`
        : `Coming: ${bal.pending} taka. Withdrawable: ${bal.available} taka. Paid this month: ${bal.paidThisMonth} taka.`,
      lang,
    );

  // Per-order rows: sale − commission − delivery − refunds = you get.
  const byOrder = new Map<string, LedgerEntry[]>();
  const loose: LedgerEntry[] = [];
  ledger.forEach((e) => (e.vendor_order_id ? byOrder.set(e.vendor_order_id, [...(byOrder.get(e.vendor_order_id) ?? []), e]) : loose.push(e)));
  const sum = (es: LedgerEntry[], t: LedgerEntry["entry_type"]) => es.filter((e) => e.entry_type === t).reduce((a, e) => a + e.amount, 0);

  const submit = () => {
    const r = withdrawMoney(vid, amount);
    if ("error" in r) {
      toast(r.error === "min" ? tx(`কমপক্ষে ${taka(settings.payout_min)} তুলতে হবে`, `Minimum is ${taka(settings.payout_min)}`) : r.error === "method" ? tx("আগে টাকা নেওয়ার নম্বর দিন", "Add a payout method first") : tx("এত টাকা তোলা যাবে না", "Not enough balance"), "bad");
      return;
    }
    setWithdraw(false);
    toast(tx("অনুরোধ পাঠানো হয়েছে ✅", "Request sent ✅"));
  };

  return (
    <SellerPage
      title={tx("💰 টাকা", "💰 Money")}
      guide={tx("হলুদ কার্ড: যে টাকা আসছে (ফেরতের সময় চলছে)। সবুজ কার্ড: এখনই তোলা যাবে। নিচে প্রতিটা অর্ডারের হিসাব।", "Yellow: money on its way (return window running). Green: you can withdraw now. Each order's breakdown is below.")}
      className={clsx(statement && "print:space-y-0")}
    >
      <div className={clsx("space-y-3", statement && "no-print")}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border-wait-bg/50 bg-wait-soft p-4 text-wait">
            <p className="font-semibold">⏳ {tx("আসছে", "Coming")}</p>
            <p className="text-3xl font-bold">{taka(bal.pending)}</p>
            <p className="text-xs">{tx("রিটার্ন সময় চলছে", "Return window running")}</p>
          </Card>
          <Card className="border-ok/30 bg-ok-soft p-4 text-ok">
            <p className="font-semibold">✅ {tx("তোলা যাবে", "Withdrawable")}</p>
            <p className="text-3xl font-bold">{taka(bal.available)}</p>
            <Button variant="ok" className="mt-2 w-full" disabled={bal.available < settings.payout_min} onClick={() => { setAmount(bal.available); setWithdraw(true); }}>💸 {tx("টাকা তুলুন", "Withdraw")}</Button>
          </Card>
          <Card className="p-4">
            <p className="font-semibold">💸 {tx("এই মাসে পেয়েছেন", "Paid this month")}</p>
            <p className="text-3xl font-bold">{taka(bal.paidThisMonth)}</p>
          </Card>
        </div>
        <Button variant="brand" size="lg" full onClick={read}><Volume2 className="size-5" /> {tx("আমার টাকার হিসাব শুনুন", "Listen to my balance")}</Button>

        <Card className="space-y-2 p-4">
          <p className="font-bold">🏦 {tx("টাকা কোথায় যাবে", "Payout to")}</p>
          {method ? (
            <p className="text-lg">{METHOD[method.method]} •••• {d(method.last4)} · {method.account_name} {!method.verified && <StatusPill tone="wait">{tx("যাচাই বাকি", "Unverified")}</StatusPill>}</p>
          ) : (
            <Notice tone="wait">{tx("টাকা নেওয়ার নম্বর দেওয়া নেই।", "No payout method yet.")} <Link className="font-bold underline" href="/seller/verify">{tx("যোগ করুন", "Add one")}</Link></Notice>
          )}
          <p className="text-sm text-muted">
            🔁 {vendor.verification_level >= 3
              ? tx("আপনি স্তর ৩: প্রতিদিন স্বয়ংক্রিয় পেআউট।", "Level 3: automatic daily payouts.")
              : tx(`প্রতি ${WEEKDAYS.bn[settings.payout_day]} স্বয়ংক্রিয় পেআউট। চাইলে নিজে তুলতে পারেন (কমপক্ষে ${taka(settings.payout_min)})।`, `Automatic payout every ${WEEKDAYS.en[settings.payout_day]}. Or withdraw yourself (min ${taka(settings.payout_min)}).`)}
          </p>
          <Link href="/seller/shop" className="text-sm font-semibold text-brand">{tx("পেআউট পদ্ধতি বদলান ›", "Change payout method ›")}</Link>
        </Card>

        <section>
          <SectionTitle>{tx("প্রতিটা অর্ডারের হিসাব", "Per-order statement")}</SectionTitle>
          <div className="space-y-2">
            {[...byOrder.entries()].map(([voId, es]) => {
              const vo = vos.find((o) => o.id === voId);
              const sale = sum(es, "sale_credit");
              const comm = -sum(es, "commission_debit");
              const deliv = -sum(es, "delivery_debit");
              const refund = -sum(es, "refund_debit") - sum(es, "penalty");
              const net = es.reduce((a, e) => a + e.amount, 0);
              const avail = es.map((e) => e.available_at).sort().reverse()[0];
              const ready = new Date(avail).getTime() <= now;
              return (
                <Card key={voId} className="space-y-1 p-3 font-mono text-sm">
                  <p className="flex justify-between font-sans font-bold"><span>{tx("অর্ডার", "Order")} {vo?.sub_order_no ?? es[0].note}</span><span>{tx("বিক্রি", "Sale")} {taka(sale)}</span></p>
                  <p className="flex justify-between text-ink-2"><span>− {tx("কমিশন", "Commission")} ({d(vendor.commission_percent)}%)</span><span>{taka(comm)}</span></p>
                  <p className="flex justify-between text-ink-2"><span>− {tx("ডেলিভারি", "Delivery")}</span><span>{taka(deliv)} {deliv === 0 && <span className="font-sans text-xs">({tx("কাস্টমার দিয়েছে", "customer paid")})</span>}</span></p>
                  {refund > 0 && <p className="flex justify-between font-bold text-bad"><span>− {tx("ফেরত/জরিমানা", "Refund/penalty")}</span><span>{taka(refund)}</span></p>}
                  <p className="flex justify-between border-t border-line pt-1 font-sans text-base font-bold text-ok">
                    <span>= {tx("আপনি পাবেন", "You get")} {taka(net)}</span>
                    <span className={ready ? "text-ok" : "text-wait"}>{ready ? "✅" : "⏳"} {date(avail)}</span>
                  </p>
                </Card>
              );
            })}
            {loose.filter((e) => e.entry_type !== "payout_debit").map((e) => (
              <Card key={e.id} className={clsx("flex justify-between gap-2 p-3 text-sm", e.amount < 0 ? "border-bad/40 bg-bad-soft text-bad" : "")}>
                <span>{e.amount < 0 ? "🔴" : "🟢"} {e.note}</span>
                <span className="shrink-0 font-bold">{e.amount < 0 ? "−" : "+"}{taka(Math.abs(e.amount))} · {date(e.available_at)}</span>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle>{tx("পেআউটের ইতিহাস", "Payout history")}</SectionTitle>
          <div className="space-y-2">
            {payouts.length ? payouts.map((p) => (
              <Card key={p.id} className="flex items-center justify-between gap-2 p-3">
                <div>
                  <p className="font-bold">{taka(p.amount)}</p>
                  <p className="text-xs text-muted">{date(p.created_at)}{p.reference && ` · ${tx("রেফ", "Ref")} ${p.reference}`}</p>
                </div>
                <StatusPill tone={p.status === "paid" ? "ok" : p.status === "failed" ? "bad" : "wait"}>{{ requested: tx("অনুরোধ", "Requested"), processing: tx("প্রক্রিয়াধীন", "Processing"), paid: tx("পেয়েছেন", "Paid"), failed: tx("ব্যর্থ", "Failed") }[p.status]}</StatusPill>
              </Card>
            )) : <p className="text-muted">{tx("এখনো কোনো পেআউট নেই", "No payouts yet")}</p>}
          </div>
        </section>
      </div>

      <Button variant="outline" size="lg" full className="no-print" onClick={() => setStatement(!statement)}>📄 {statement ? tx("স্টেটমেন্ট বন্ধ", "Hide statement") : tx("মাসিক স্টেটমেন্ট (PDF)", "Monthly statement (PDF)")}</Button>
      {statement && <Statement vendor={vendor} ledger={ledger} now={now} />}

      <Sheet open={withdraw} onClose={() => setWithdraw(false)} title={tx("টাকা তুলুন", "Withdraw")}>
        <div className="space-y-3 pb-2">
          <NumberPad value={amount} onChange={(v) => setAmount(Math.min(v, bal.available))} max={bal.available} />
          <p className="text-sm text-muted">{tx(`তোলা যাবে: ${taka(bal.available)} · কমপক্ষে ${taka(settings.payout_min)}`, `Available: ${taka(bal.available)} · min ${taka(settings.payout_min)}`)}</p>
          {method && <p className="font-semibold">→ {METHOD[method.method]} •••• {d(method.last4)}</p>}
          <Button variant="ok" size="xl" full disabled={amount < settings.payout_min} onClick={submit}>💸 {tx("অনুরোধ পাঠান", "Request payout")}</Button>
        </div>
      </Sheet>
    </SellerPage>
  );
}
