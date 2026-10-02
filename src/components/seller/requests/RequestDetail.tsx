"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { askRequestQuestion, declineRequest, markRequestSeen, withdrawQuote } from "@/lib/db/actions";
import { logActivity } from "@/lib/db/actions-seller";
import { describeVehicle, getCategory, requestById } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import { conditionLabel, conditionPrefLabel, gradeLabel, neededByLabel, positionLabel, sourceLabel, sourcePrefLabel, warrantyLabel, dispatchLabel } from "@/lib/labels";
import { containsPersonalInfo, maskContactInfo, verificationPerks } from "@/lib/rules";
import type { Vendor } from "@/lib/types";
import { useT } from "../../providers/LangProvider";
import { Countdown, toast } from "../../shared/Misc";
import { MediaImage } from "../../ui/MediaImage";
import { Sheet } from "../../ui/Sheet";
import { Button, Card, EmptyState, Notice, SectionTitle, StatusPill } from "../../ui/primitives";
import { ReasonChips } from "../Choices";
import { VoiceTextarea } from "../Dictate";
import { YouGet } from "../Money";
import { SellerPage } from "../SellerPage";
import { QuoteForm } from "./QuoteForm";
import { otherQuoteCount, VehicleLine } from "./shared";

const DECLINE = { bn: ["এই মডেলের নেই", "এই জিনিস রাখি না", "এখন স্টক নেই"], en: ["Not for this model", "Don't sell this item", "Out of stock now"] };
const WITHDRAW = { bn: ["স্টক শেষ হয়ে গেছে", "দাম ভুল দিয়েছিলাম", "অন্য কারণ"], en: ["Sold out", "Wrong price", "Other reason"] };

export function RequestDetail({ id, vendor }: { id: string; vendor: Vendor }) {
  const { tx, L, d, lang, taka } = useT();
  const router = useRouter();
  const vid = vendor.id;
  const r = useDb((s) => requestById(s, id));
  const myQuote = useDb((s) => s.quotes.filter((q) => q.request_id === id && q.vendor_id === vid).sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null);
  const others = useDb((s) => otherQuoteCount(s, id, vid));
  const [quoting, setQuoting] = useState(false);
  const [ask, setAsk] = useState(false);
  const [question, setQuestion] = useState("");
  const [decline, setDecline] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [withdraw, setWithdraw] = useState(false);

  useEffect(() => {
    if (r?.matches.some((m) => m.vendor_id === vid && !m.seen_at)) markRequestSeen(id, vid);
  }, [id, vid, r]);

  if (!r || (!r.matches.some((m) => m.vendor_id === vid) && !myQuote)) {
    return (
      <SellerPage title={tx("রিকোয়েস্ট", "Request")} back="/seller/requests">
        <EmptyState icon="🔍" title={tx("এই রিকোয়েস্ট পাওয়া যায়নি", "Request not found")} />
      </SellerPage>
    );
  }

  const match = r.matches.find((m) => m.vendor_id === vid);
  const open = ["open", "quotes_received"].includes(r.status);
  const canQuote = vendor.verification_level >= 2;
  const vd = describeVehicle(r.generation_id, r.engine_id);
  // Sellers only see the team's summary, never the customer's raw voice or contact details (file 02 §7.2).
  const summary = r.summary_bn ?? (r.description_text && !containsPersonalInfo(r.description_text) ? maskContactInfo(r.description_text).masked : null);

  if (quoting && canQuote && open) {
    return (
      <SellerPage
        title={tx("দাম দিন", "Send a quote")}
        subtitle={`${vd?.short ?? r.vehicle_text ?? ""} · ${r.items[0]?.name ?? ""}`}
        guide={tx("ধাপে ধাপে বাছাই করুন: জিনিস, অবস্থা, দাম, কবে পাঠাবেন। শেষে সবুজ বাটন চাপুন।", "Choose step by step: item, condition, price, dispatch. Then tap the green button.")}
        action={<Button variant="ghost" onClick={() => setQuoting(false)}>✕</Button>}
      >
        <QuoteForm r={r} vendor={vendor} onDone={() => setQuoting(false)} />
      </SellerPage>
    );
  }

  return (
    <SellerPage
      title={`${r.items[0]?.name ?? tx("পার্ট", "Part")}`}
      subtitle={`${r.request_no} · ${r.district}, ${r.area}`}
      back="/seller/requests"
      guide={tx(
        "উপরে কাস্টমার কী চায় লেখা আছে। জিনিস থাকলে 'আছে, দাম দিই' চাপুন। প্রশ্ন থাকলে 'প্রশ্ন আছে' চাপুন। না থাকলে 'নেই' চাপুন।",
        "The request is described above. Tap 'Have it' to quote, 'Question' to ask, or 'Don't have' if you can't supply.",
      )}
    >
      <Card className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <VehicleLine r={r} />
          {open && <Countdown to={r.expires_at} />}
        </div>
        {summary && <p className="rounded-xl bg-brand-soft/40 p-3 text-lg font-semibold">📝 {summary}</p>}
        <ul className="space-y-1">
          {r.items.map((it, i) => (
            <li key={i} className="flex flex-wrap items-center gap-2">
              <b>• {it.name}</b>
              {it.qty > 1 && <span>× {d(it.qty)}</span>}
              {it.position.map((p) => <StatusPill key={p}>{L(positionLabel[p])}</StatusPill>)}
              {getCategory(it.category_id) && <span className="text-sm text-muted">({lang === "bn" ? getCategory(it.category_id)!.name_bn : getCategory(it.category_id)!.name})</span>}
            </li>
          ))}
        </ul>
        {r.photos.length > 0 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {r.photos.map((p) => <MediaImage key={p.id} src={p.url} alt={tx("কাস্টমারের ছবি", "Customer photo")} className="size-28 shrink-0 rounded-xl" />)}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <p className="rounded-xl bg-surface p-2">🏷️ {L(sourcePrefLabel[r.preferred_source])}</p>
          <p className="rounded-xl bg-surface p-2">♻️ {L(conditionPrefLabel[r.preferred_condition])}</p>
          <p className="rounded-xl bg-surface p-2">⏰ {L(neededByLabel[r.needed_by])}</p>
          <p className="rounded-xl bg-surface p-2">📍 {r.district}, {r.area}</p>
        </div>
        <p className="text-sm font-semibold text-ink-2">🏪 {others ? tx(`আরও ${d(others)}টা দোকান দাম দিয়েছে`, `${others} other shops quoted`) : tx("এখনো কেউ দাম দেয়নি", "No other quotes yet")}</p>
      </Card>

      {r.questions.length > 0 && (
        <section>
          <SectionTitle>{tx("প্রশ্ন-উত্তর (সবাই দেখে)", "Q&A (public)")}</SectionTitle>
          <div className="space-y-2">
            {r.questions.map((q) => (
              <Card key={q.id} className="p-3">
                <p className="font-semibold">❓ {q.question} <span className="text-xs text-muted">({q.vendor_id === vid ? tx("আপনি", "You") : tx("অন্য দোকান", "Another shop")})</span></p>
                <p className={q.answer ? "mt-1 text-ok" : "mt-1 text-sm text-muted"}>{q.answer ? `💬 ${q.answer}` : tx("উত্তরের অপেক্ষা…", "Waiting for answer…")}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {myQuote ? (
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold">{tx("আপনার দাম", "Your quote")}</p>
            <StatusPill tone={myQuote.status === "accepted" ? "ok" : myQuote.status === "submitted" ? "wait" : "bad"}>
              {{ submitted: tx("পাঠানো", "Sent"), accepted: tx("কাস্টমার নিয়েছে 🎉", "Accepted 🎉"), not_selected: tx("অন্যজন নির্বাচিত", "Not selected"), withdrawn: tx("প্রত্যাহার", "Withdrawn"), expired: tx("মেয়াদ শেষ", "Expired") }[myQuote.status]}
            </StatusPill>
          </div>
          <p className="text-3xl font-bold">{taka(myQuote.price)}</p>
          <p className="text-sm text-ink-2">
            {L(sourceLabel[myQuote.source])} · {L(conditionLabel[myQuote.condition])}
            {myQuote.grade && ` · ${tx("গ্রেড", "Grade")} ${myQuote.grade} (${L(gradeLabel[myQuote.grade])})`} · {dispatchLabel(myQuote.dispatch_days, lang)} · {warrantyLabel(myQuote.warranty_days, lang)}
          </p>
          <YouGet vendor={vendor} price={myQuote.price} />
          {myQuote.status === "accepted" && <Link href="/seller/orders" className="block rounded-2xl bg-ok p-4 text-center text-lg font-bold text-white">📦 {tx("অর্ডার দেখুন", "See the order")}</Link>}
          {myQuote.status === "submitted" && (
            <>
              <Notice>{tx("কাস্টমার নিলে নতুন অর্ডার হিসেবে আসবে। অন্যদের দাম দেখানো হয় না।", "If the customer accepts, it becomes a new order. Other prices are not shown.")}</Notice>
              <Button variant="danger" full onClick={() => setWithdraw(true)}>↩️ {tx("দাম প্রত্যাহার করুন", "Withdraw quote")}</Button>
            </>
          )}
        </Card>
      ) : match?.declined ? (
        <Notice>❌ {tx("আপনি 'নেই' বলেছেন", "You said you don't have it")}{match.decline_reason && `: ${match.decline_reason}`}</Notice>
      ) : open ? (
        <div className="space-y-3">
          {!canQuote && (
            <Notice tone="wait">
              {tx("দাম দিতে দোকান যাচাই (স্তর ২) লাগবে: ", "Quoting needs shop verification (level 2): ")}
              {L(verificationPerks[2])}. <Link href="/seller/verify" className="font-bold underline">{tx("যাচাই করুন", "Verify")}</Link>
            </Notice>
          )}
          <Button variant="ok" size="xl" full disabled={!canQuote} onClick={() => setQuoting(true)}>✅ {tx("আছে, দাম দিই", "Have it, quote")}</Button>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="lg" onClick={() => setAsk(true)}>❓ {tx("প্রশ্ন আছে", "Question")}</Button>
            <Button variant="danger" size="lg" onClick={() => setDecline(true)}>❌ {tx("নেই", "Don't have")}</Button>
          </div>
        </div>
      ) : (
        <Notice>{tx("এই রিকোয়েস্ট বন্ধ হয়ে গেছে।", "This request is closed.")}</Notice>
      )}

      <Sheet open={ask} onClose={() => setAsk(false)} title={tx("কাস্টমারকে প্রশ্ন", "Ask the customer")}>
        <div className="space-y-3 pb-2">
          <Notice>{tx("প্রশ্ন ও উত্তর সব দোকান দেখবে। নম্বর লিখবেন না।", "All shops see questions and answers. Don't write phone numbers.")}</Notice>
          <VoiceTextarea value={question} onChange={setQuestion} placeholder={tx("যেমন: কোন ইঞ্জিন? ছবি আছে?", "e.g. Which engine? Any photo?")} />
          <Button variant="brand" size="lg" full disabled={!question.trim()} onClick={() => { askRequestQuestion(r.id, vid, question.trim()); setQuestion(""); setAsk(false); toast(tx("প্রশ্ন পাঠানো হয়েছে, উত্তর এলে জানাবো", "Question sent")); }}>
            📨 {tx("প্রশ্ন পাঠান", "Send question")}
          </Button>
        </div>
      </Sheet>

      <Sheet open={decline} onClose={() => setDecline(false)} title={tx("এই জিনিস নেই", "Don't have it")}>
        <div className="space-y-4 pb-2">
          <p className="text-muted">{tx("কারণ বললে পরে আরও মিলে যাওয়া রিকোয়েস্ট পাবেন (ঐচ্ছিক)। স্কোর কমবে না।", "A reason helps us send better matches (optional). Your score won't drop.")}</p>
          <ReasonChips reasons={lang === "bn" ? DECLINE.bn : DECLINE.en} value={reason} onChange={setReason} />
          <Button variant="danger" size="xl" full onClick={() => { declineRequest(r.id, vid, reason); logActivity(vid, `রিকোয়েস্ট ${r.request_no}: নেই`); setDecline(false); router.push("/seller/requests"); }}>
            ❌ {tx("নেই, পরেরটা দেখি", "Don't have, next")}
          </Button>
        </div>
      </Sheet>

      <Sheet open={withdraw} onClose={() => setWithdraw(false)} title={tx("দাম প্রত্যাহার", "Withdraw quote")}>
        <div className="space-y-4 pb-2">
          <ReasonChips reasons={lang === "bn" ? WITHDRAW.bn : WITHDRAW.en} value={reason} onChange={setReason} />
          <Button variant="danger" size="xl" full disabled={!reason || !myQuote} onClick={() => { withdrawQuote(myQuote!.id, reason!); setWithdraw(false); toast(tx("দাম প্রত্যাহার করা হয়েছে", "Quote withdrawn"), "info"); }}>
            ↩️ {tx("প্রত্যাহার করুন", "Withdraw")}
          </Button>
        </div>
      </Sheet>
    </SellerPage>
  );
}
