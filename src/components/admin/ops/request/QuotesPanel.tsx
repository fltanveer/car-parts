"use client";

import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { ConditionBadge, SourceBadge } from "@/components/shared/Badges";
import { toast } from "@/components/shared/Misc";
import { MediaImage } from "@/components/ui/MediaImage";
import { Sheet } from "@/components/ui/Sheet";
import { Button, Field, Input, Notice, StatusPill, Textarea } from "@/components/ui/primitives";
import { answerRequestQuestion, audit } from "@/lib/db/actions";
import { acceptQuoteOnBehalf, addNote } from "@/lib/db/actions-admin-ops";
import { benchmarkFor } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import { dispatchLabel, warrantyLabel } from "@/lib/labels";
import { priceAnomaly } from "@/lib/rules";
import type { PartRequest, Quote } from "@/lib/types";
import { Dictate } from "../Dictate";
import { Panel } from "../ui";

const quoteStatus: Record<Quote["status"], { bn: string; en: string; tone: "ok" | "wait" | "bad" | "info" }> = {
  submitted: { bn: "অপেক্ষায়", en: "Open", tone: "wait" },
  accepted: { bn: "গ্রহণ", en: "Accepted", tone: "ok" },
  not_selected: { bn: "নির্বাচিত হয়নি", en: "Not selected", tone: "info" },
  withdrawn: { bn: "প্রত্যাহার", en: "Withdrawn", tone: "bad" },
  expired: { bn: "মেয়াদ শেষ", en: "Expired", tone: "info" },
};

/** Incoming quotes as the customer sees them, with anomaly flags + accept on behalf. */
export function QuotesPanel({ r }: { r: PartRequest }) {
  const { tx, taka, d, lang, L } = useT();
  const quotes = useDb((s) => s.quotes.filter((q) => q.request_id === r.id).sort((a, b) => b.quote_score - a.quote_score));
  const vendors = useDb((s) => s.vendors);
  const [accepting, setAccepting] = useState<Quote | null>(null);
  const [note, setNote] = useState("");

  return (
    <Panel title={tx(`আসা দাম (${d(quotes.length)})`, `Quotes (${quotes.length})`)}>
      {quotes.length === 0 && <p className="text-sm text-muted">{tx("এখনো কোনো দাম আসেনি", "No quotes yet")}</p>}
      <ul className="space-y-3">
        {quotes.map((q, i) => {
          const v = vendors.find((x) => x.id === q.vendor_id);
          const anomaly = priceAnomaly(q.price, benchmarkFor(r.items[q.item_index]?.category_id ?? "", q.condition));
          return (
            <li key={q.id} className="rounded-xl border border-line p-3">
              <div className="flex gap-3">
                <MediaImage src={q.media[0]} alt={q.title} className="size-16 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold leading-tight">{q.title}</p>
                    <StatusPill tone={quoteStatus[q.status].tone}>{L(quoteStatus[q.status])}</StatusPill>
                  </div>
                  <p className="text-xs text-muted">
                    {i === 0 && q.status === "submitted" && <b className="text-ok">{tx("সেরা পছন্দ · ", "Best pick · ")}</b>}
                    {v?.shop_name_bn} · {tx("স্কোর", "score")} {d(q.quote_score)}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <SourceBadge source={q.source} />
                    <ConditionBadge condition={q.condition} grade={q.grade} />
                  </div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  <b className="text-lg">{taka(q.price)}</b> <span className="text-muted">+ {taka(q.delivery_charge_estimate)} {tx("ডেলিভারি", "delivery")}</span>
                </span>
                <span className="text-xs text-muted">
                  {dispatchLabel(q.dispatch_days, lang)} · {warrantyLabel(q.warranty_days, lang)} · {q.is_returnable ? tx("ফেরতযোগ্য", "Returnable") : tx("ফেরত নেই", "No return")}
                </span>
              </div>
              {q.note_bn && <p className="mt-1 text-sm text-ink-2">“{q.note_bn}”</p>}
              {anomaly && (
                <Notice tone={anomaly === "too_low" ? "bad" : "wait"} className="mt-2">
                  {anomaly === "too_low" ? tx("⚠️ বাজারদরের চেয়ে অনেক কম: প্রতারণা হতে পারে, যাচাই করুন", "⚠️ Far below market: possible bait, verify") : tx("⚠️ বাজারদরের চেয়ে অনেক বেশি", "⚠️ Far above market")}
                </Notice>
              )}
              {q.status === "submitted" && r.status !== "accepted" && (
                <Button size="sm" variant="ok" className="mt-2" onClick={() => setAccepting(q)}>
                  <CheckCircle2 className="size-4" /> {tx("কাস্টমারের পক্ষে গ্রহণ", "Accept for customer")}
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      <Questions r={r} />

      <Sheet open={!!accepting} onClose={() => setAccepting(null)} title={tx("কাস্টমারের পক্ষে গ্রহণ", "Accept on customer's behalf")}>
        {accepting && (
          <div className="space-y-3 pb-2">
            <p>
              <b>{accepting.title}</b> · {taka(accepting.price)}
            </p>
            <Notice tone="wait">{tx("কাস্টমার ফোনে মুখে রাজি হয়েছেন কিনা নিশ্চিত হন। কল নোট বাধ্যতামূলক। কাস্টমার SMS পাবেন পেমেন্ট করে নিশ্চিত করতে।", "Confirm verbal consent on the phone. A call note is mandatory. The customer gets an SMS to pay and confirm.")}</Notice>
            <Field label={tx("কল নোট", "Call note")}>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={tx("যেমন: কাস্টমার ১৪,২০০ টাকারটা নিতে রাজি, কাল পাঠাতে বলেছেন", "e.g. Customer agreed to the 14,200 one")} />
            </Field>
            <Dictate onText={(t) => setNote((s) => (s ? `${s} ${t}` : t))} />
            <Button
              variant="ok"
              size="lg"
              full
              disabled={note.trim().length < 5}
              onClick={() => {
                acceptQuoteOnBehalf(accepting.id, note.trim());
                setAccepting(null);
                setNote("");
                toast(tx("গ্রহণ করা হয়েছে, কাস্টমারকে SMS গেছে", "Accepted, customer notified"));
              }}
            >
              {tx("গ্রহণ নিশ্চিত করুন", "Confirm accept")}
            </Button>
          </div>
        )}
      </Sheet>
    </Panel>
  );
}

function Questions({ r }: { r: PartRequest }) {
  const { tx, ago } = useT();
  const vendors = useDb((s) => s.vendors);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  if (!r.questions.length) return null;
  return (
    <div className="mt-4 border-t border-line pt-3">
      <p className="mb-2 font-semibold">{tx("বিক্রেতাদের প্রশ্ন", "Seller questions")}</p>
      <ul className="space-y-2">
        {r.questions.map((q) => (
          <li key={q.id} className="rounded-xl bg-surface p-3 text-sm">
            <p>
              ❓ {q.question} <span className="text-xs text-muted">· {vendors.find((v) => v.id === q.vendor_id)?.shop_name_bn} · {ago(q.asked_at)}</span>
            </p>
            {q.answer ? (
              <p className="mt-1 text-ok">💬 {q.answer}</p>
            ) : (
              <div className="mt-2 flex gap-2">
                <Input value={answers[q.id] ?? ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} placeholder={tx("কাস্টমারের পক্ষে উত্তর", "Answer for customer")} className="min-h-10" />
                <Button
                  size="sm"
                  disabled={!answers[q.id]?.trim()}
                  onClick={() => {
                    answerRequestQuestion(r.id, q.id, answers[q.id].trim());
                    addNote(`request:${r.id}`, `প্রশ্নের উত্তর (কাস্টমারের পক্ষে): ${answers[q.id].trim()}`, "event");
                    audit("কাস্টমারের পক্ষে প্রশ্নের উত্তর", r.request_no);
                    setAnswers({ ...answers, [q.id]: "" });
                  }}
                >
                  {tx("উত্তর", "Answer")}
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
