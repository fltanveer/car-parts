"use client";

import { Gavel, Volume2 } from "lucide-react";
import { useState } from "react";
import { speak } from "@/components/layout/AudioGuide";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, Chip, Field, Input, Notice, Textarea } from "@/components/ui/primitives";
import { decideClaim } from "@/lib/db/actions";
import { notifyCustomer, notifyVendor, penalizeVendor } from "@/lib/db/actions-admin-core";
import { bnWords } from "@/lib/format";
import { claimTypeLabel } from "@/lib/labels";
import type { Claim, Order, OrderItem, VendorOrder } from "@/lib/types";
import { Panel } from "../index";
import { type Resolution, suggestFor } from "./RuleSuggestion";

type Payer = "seller" | "customer" | "platform" | "none";
const PAYER: Record<Payer, { bn: string; en: string }> = {
  seller: { bn: "দোকান", en: "Seller" },
  customer: { bn: "কাস্টমার", en: "Customer" },
  platform: { bn: "গাড়িহাব", en: "GaariHub" },
  none: { bn: "ফেরত লাগবে না", en: "No return needed" },
};
const RES: Record<Resolution, { bn: string; en: string; icon: string }> = {
  refund: { bn: "পূর্ণ রিফান্ড", en: "Full refund", icon: "💸" },
  partial_refund: { bn: "আংশিক রিফান্ড", en: "Partial refund", icon: "➗" },
  replace: { bn: "বদলে দেওয়া", en: "Replace", icon: "🔁" },
  rejected: { bn: "দাবি বাতিল", en: "Reject claim", icon: "❌" },
};

const customerText = (r: Resolution, amount: number, payer: Payer, reason: string) => {
  const ship = payer === "none" ? "" : ` পণ্য ফেরত পাঠানোর খরচ দেবে ${PAYER[payer].bn}।`;
  const why = reason ? ` কারণ: ${reason}।` : "";
  if (r === "refund") return `আপনার দাবি মেনে নেওয়া হয়েছে। আপনি ${bnWords(amount)} টাকা পুরো ফেরত পাবেন, যে মাধ্যমে টাকা দিয়েছিলেন সেই মাধ্যমে।${ship}${why}`;
  if (r === "partial_refund") return `আপনার দাবির একটা অংশ মেনে নেওয়া হয়েছে। আপনি ${bnWords(amount)} টাকা ফেরত পাবেন।${ship}${why}`;
  if (r === "replace") return `দোকান আপনাকে একই জিনিস বদলে নতুন করে পাঠাবে। আপনাকে কোনো টাকা দিতে হবে না।${ship}${why}`;
  return `সব প্রমাণ দেখে আপনার দাবি মানা গেল না।${why} প্রশ্ন থাকলে আমাদের হটলাইনে কল করুন।`;
};
const sellerText = (r: Resolution, amount: number, payer: Payer, penalty: number, points: number) => {
  const base = r === "rejected" ? "কাস্টমারের দাবি বাতিল হয়েছে, আপনার টাকা আটকে থাকবে না।" : r === "replace" ? "কাস্টমারকে বদলে নতুন পণ্য পাঠাতে হবে।" : `কাস্টমারকে ${bnWords(amount)} টাকা ফেরত দেওয়া হচ্ছে, আপনার হিসাব থেকে কাটা যাবে।`;
  const ship = payer === "seller" ? " ফেরত পাঠানোর খরচ আপনার।" : "";
  const pen = penalty || points ? ` জরিমানা: ${penalty ? `${bnWords(penalty)} টাকা` : ""}${penalty && points ? " ও " : ""}${points ? `স্কোর থেকে ${bnWords(points)} পয়েন্ট` : ""}।` : "";
  return base + ship + pen;
};

export function DecisionForm({ claim, vo, item, order }: { claim: Claim; vo: VendorOrder; item: OrderItem; order: Order }) {
  const { tx, L, taka } = useT();
  const sug = suggestFor(claim, vo, item);
  const max = item.line_total + vo.delivery_charge;
  const [res, setRes] = useState<Resolution>(sug.resolution);
  const [amount, setAmount] = useState(item.line_total);
  const [payer, setPayer] = useState<Payer>(sug.shippingPayer);
  const [penalty, setPenalty] = useState(0);
  const [points, setPoints] = useState(0);
  const [reason, setReason] = useState("");
  const [custEdit, setCustEdit] = useState<string | null>(null);

  const money = res === "refund" || res === "partial_refund";
  const amt = res === "refund" ? item.line_total : Math.min(amount, max);
  const cText = custEdit ?? customerText(res, amt, payer, reason);
  const sText = sellerText(res, amt, payer, penalty, points);
  const ok = reason.trim().length >= 3 && (!money || (amt > 0 && amt <= max));

  const submit = () => {
    const note = `${cText} [রিটার্ন শিপিং: ${PAYER[payer].bn}${penalty || points ? ` · জরিমানা ${penalty} টাকা, ${points} পয়েন্ট` : ""}]`;
    decideClaim(claim.id, res, money ? amt : null, note);
    if (penalty || points) penalizeVendor(claim.vendor_id, penalty, points, claim.claim_no);
    notifyCustomer(claim.user_phone, `দাবি ${claim.claim_no}: সিদ্ধান্ত`, cText, `/my/orders/${order.id}`);
    notifyVendor(claim.vendor_id, `দাবি ${claim.claim_no}: সিদ্ধান্ত`, sText, "/seller/claims");
    toast(tx("সিদ্ধান্ত জানানো হয়েছে", "Decision sent"));
  };

  return (
    <Panel title={<span className="flex items-center gap-2"><Gavel className="size-5" /> {tx("সিদ্ধান্ত", "Decision")}</span>}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(RES) as Resolution[]).map((r) => (
            <button key={r} type="button" onClick={() => setRes(r)} aria-pressed={res === r} className={res === r ? "min-h-14 rounded-2xl border-2 border-brand bg-brand-soft/40 px-2 font-semibold" : "min-h-14 rounded-2xl border-2 border-line px-2 font-semibold hover:border-ink/30"}>
              {RES[r].icon} {L(RES[r])}
              {r === sug.resolution && <span className="block text-[11px] font-normal text-muted">{tx("নিয়মের সাজেশন", "suggested")}</span>}
            </button>
          ))}
        </div>
        {money && (
          <Field label={tx(`ফেরতের পরিমাণ (সর্বোচ্চ ${taka(max)})`, `Refund amount (max ${taka(max)})`)} error={amt > max ? tx("সীমার বেশি", "Over the limit") : undefined}>
            <Input type="number" value={res === "refund" ? item.line_total : amount} disabled={res === "refund"} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
          </Field>
        )}
        <div>
          <p className="mb-1.5 font-semibold">{tx("রিটার্ন শিপিং কে দেবে?", "Who pays return shipping?")}</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PAYER) as Payer[]).map((p) => (
              <Chip key={p} active={payer === p} onClick={() => setPayer(p)}>{L(PAYER[p])}</Chip>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={tx("বিক্রেতার জরিমানা (টাকা)", "Seller penalty (৳)")}>
            <Input type="number" min={0} value={penalty} onChange={(e) => setPenalty(Math.max(0, Number(e.target.value) || 0))} />
          </Field>
          <div>
            <p className="mb-1.5 font-semibold">{tx("স্কোর কাটা", "Score deduction")}</p>
            <div className="flex flex-wrap gap-2">
              {[0, 2, 5, 10].map((n) => (
                <Chip key={n} active={points === n} onClick={() => setPoints(n)}>−{n}</Chip>
              ))}
            </div>
          </div>
        </div>
        <Field label={tx("কারণ (দুই পক্ষ দেখবে)", "Reason (both sides see it)")}>
          <Textarea value={reason} onChange={(e) => { setReason(e.target.value); setCustEdit(null); }} placeholder={tx(`যেমন: প্যাকিং ছবিতে ফাটল নেই, কাস্টমারের ছবিতে আছে — ${L(claimTypeLabel[claim.type])}`, "e.g. packing photo shows no crack, customer photo does")} className="min-h-20" />
        </Field>
        <div className="space-y-2 rounded-2xl border border-line bg-surface p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold">{tx("কাস্টমার যা পাবে (সহজ বাংলা)", "What the customer gets (plain Bangla)")}</p>
            <Button size="sm" variant="ghost" onClick={() => speak(cText, "bn")}><Volume2 className="size-4" /> 🔊 {tx("শুনুন", "Listen")}</Button>
          </div>
          <Textarea value={cText} onChange={(e) => setCustEdit(e.target.value)} className="min-h-24 bg-card" />
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <p className="text-sm font-bold">{tx("দোকান যা পাবে", "What the seller gets")}</p>
            <Button size="sm" variant="ghost" onClick={() => speak(sText, "bn")}><Volume2 className="size-4" /> 🔊 {tx("শুনুন", "Listen")}</Button>
          </div>
          <p className="rounded-xl bg-card p-3 text-sm">{sText}</p>
        </div>
        {money && <Notice tone="info">{tx("টাকা এসক্রো থেকে রিফান্ড কিউতে যাবে; বিক্রেতার টাকা আগেই ছাড়া থাকলে ওয়ালেট থেকে কাটা হবে।", "Money goes to the refund queue from escrow; if already released, it is deducted from the seller wallet.")}</Notice>}
        <Button full size="lg" variant="brand" disabled={!ok} onClick={submit}>
          <Gavel className="size-5" /> {tx("সিদ্ধান্ত দিন ও দুই পক্ষকে জানান", "Decide & notify both sides")}
        </Button>
      </div>
    </Panel>
  );
}
