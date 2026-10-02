"use client";

import { ArrowRight, Hourglass, MessageCircle, Phone, RotateCcw, SearchX, XCircle } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import { describeGeneration } from "@/lib/api";
import { displayPhone } from "@/lib/format";
import { requestStatusLabel } from "@/lib/i18n";
import { telLink, waLink } from "@/lib/links";
import { demoSendQuote, requoteRequest, useHydrated, useStore } from "@/lib/store";
import type { Order, PartRequest, RequestQuote, RequestStatus } from "@/lib/types";
import { AudioGuide } from "../layout/AudioGuide";
import { MediaThumb } from "../media/PhotoUploader";
import { VoicePlayer } from "../media/VoicePlayer";
import { QualityBadge } from "../part/QualityBadge";
import { useT } from "../providers/LangProvider";
import { StatusTimeline, type TimelineStep } from "../status/StatusTimeline";
import { Button, ButtonLink, Card, Container, Notice } from "../ui/primitives";
import { AcceptSheet } from "./AcceptSheet";
import { CancelSheet } from "./CancelSheet";
import { callTimeLabel, contactLabel, replyPromise } from "./labels";
import { QuoteCard } from "./QuoteCard";

// Spec 7.9: the nine customer-facing steps.
const STEPS = [
  { key: "new", icon: "📥", bn: "রিকোয়েস্ট পেয়েছি", en: "Request received" },
  { key: "searching", icon: "🔍", bn: "খোঁজা চলছে", en: "Searching" },
  { key: "quoted", icon: "💰", bn: "দাম জানানো হয়েছে", en: "Price sent" },
  { key: "accepted", icon: "✅", bn: "আপনি রাজি হয়েছেন", en: "You accepted" },
  { key: "advance_verified", icon: "💳", bn: "অগ্রিম পাওয়া গেছে", en: "Advance received" },
  { key: "sourcing", icon: "📦", bn: "পার্ট সংগ্রহ চলছে", en: "Sourcing the part" },
  { key: "qc", icon: "🔎", bn: "মান যাচাই হচ্ছে", en: "Quality check" },
  { key: "shipped", icon: "🚚", bn: "পাঠানো হয়েছে", en: "Shipped" },
  { key: "delivered", icon: "🏁", bn: "পৌঁছেছে", en: "Delivered" },
] as const;

const REACHED: Record<RequestStatus, number> = {
  new: 0,
  in_review: 0,
  searching: 1,
  quoted: 2,
  expired: 2,
  accepted: 3,
  advance_pending: 3,
  advance_verified: 4,
  sourcing: 5,
  qc: 6,
  shipped: 7,
  delivered: 8,
  not_found: 1,
  cancelled: 0,
};

const CANCELLABLE: RequestStatus[] = ["new", "in_review", "searching", "quoted", "expired"];
const WAITING: RequestStatus[] = ["new", "in_review", "searching"];

function timeline(r: PartRequest, order: Order | null, lang: "bn" | "en", stoppedLabel: (s: RequestStatus) => string) {
  const at = (key: string) => {
    if (key === "new") return r.created_at;
    const orderKey = key === "accepted" ? "advance_pending" : key;
    return order?.history.find((h) => h.status === orderKey)?.at ?? null;
  };
  const steps: TimelineStep[] = STEPS.map((s) => ({ key: s.key, label: s[lang], icon: <span aria-hidden>{s.icon}</span>, at: at(s.key) }));
  const stopped = r.status === "cancelled" || r.status === "not_found" || r.status === "expired";
  let reached = REACHED[r.status];
  if (r.status === "cancelled" && r.quotes.length) reached = 2;
  const currentIndex = stopped ? reached + 1 : r.status === "delivered" ? STEPS.length : reached;
  return { steps, currentIndex, stopped: stopped ? stoppedLabel(r.status) : null };
}

function Block({ title, children, action }: { title: ReactNode; children: ReactNode; action?: ReactNode }) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

export function RequestDetail({ id }: { id: string }) {
  const { tx, lang, d, dateTime } = useT();
  const hydrated = useHydrated();
  const requests = useStore((s) => s.requests);
  const orders = useStore((s) => s.orders);
  const [now, setNow] = useState(() => Date.now());
  const [accepting, setAccepting] = useState<RequestQuote | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  if (!hydrated)
    return (
      <Container className="max-w-xl space-y-3">
        <div className="h-28 animate-pulse rounded-2xl bg-line/60" />
        <div className="h-64 animate-pulse rounded-2xl bg-line/60" />
      </Container>
    );

  const r = requests.find((x) => x.id === id);
  if (!r)
    return (
      <Container className="max-w-xl">
        <Card className="space-y-4 p-6 text-center">
          <SearchX className="mx-auto size-12 text-muted" aria-hidden />
          <h1 className="text-xl font-bold">{tx("এই রিকোয়েস্ট খুঁজে পাইনি", "We couldn't find this request")}</h1>
          <p className="text-muted">
            {tx("অন্য ফোন থেকে দিয়ে থাকলে লগইন করুন বা আমাদের কল করে রিকোয়েস্ট নম্বর বলুন।", "If you sent it from another phone, log in or call us with the request number.")}
          </p>
          <div className="grid gap-2">
            <ButtonLink href={`/login?next=/request/${id}`} variant="primary" size="lg" full>
              {tx("লগইন করুন", "Log in")}
            </ButtonLink>
            <a href={telLink()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-ink/15 font-semibold">
              <Phone className="size-5" /> {tx("কল করুন", "Call us")}
            </a>
            <ButtonLink href="/request" variant="ghost" full>
              {tx("নতুন রিকোয়েস্ট দিন", "Make a new request")}
            </ButtonLink>
          </div>
        </Card>
      </Container>
    );

  const order = r.order_id ? (orders.find((o) => o.id === r.order_id) ?? null) : null;
  const tl = timeline(r, order, lang, (s) =>
    s === "expired"
      ? tx("⏰ দামের মেয়াদ শেষ", "⏰ Quote expired")
      : s === "not_found"
        ? tx("😔 পার্টটা পাওয়া যায়নি", "😔 Part not found")
        : tx("❌ রিকোয়েস্ট বাতিল করা হয়েছে", "❌ Request cancelled"),
  );
  const liveQuotes = r.quotes.filter((q) => q.status !== "expired" || r.status === "expired");
  const allQuotesPast = r.quotes.length > 0 && r.quotes.every((q) => new Date(q.valid_until).getTime() <= now);
  const expired = r.status === "expired" || (r.status === "quoted" && allQuotesPast);
  const canAccept = r.status === "quoted" && !r.order_id;
  const showQuotes = liveQuotes.length > 0 && r.status !== "searching" && r.status !== "cancelled";
  const gen = describeGeneration(r.vehicle_generation_id, lang);
  const waText = tx(`আসসালামু আলাইকুম, আমার রিকোয়েস্ট নম্বর ${r.request_no}`, `Hello, my request number is ${r.request_no}`);

  return (
    <Container className="max-w-xl space-y-4">
      {/* Header */}
      <Card className="p-5">
        <p className="text-sm font-semibold text-muted">{tx("রিকোয়েস্ট নম্বর", "Request number")}</p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-mono text-4xl font-bold tracking-wider">{d(r.request_no)}</h1>
          <span className="rounded-full bg-ink px-3 py-1 text-sm font-semibold text-white">{requestStatusLabel[r.status][lang]}</span>
        </div>
        <p className="mt-1 text-sm text-muted">
          {tx("পাঠিয়েছেন", "Sent")} {dateTime(r.created_at)}
        </p>
      </Card>

      {/* Order link */}
      {r.order_id &&
        (r.status === "advance_pending" ? (
          <Card className="space-y-3 border-2 border-accent p-4">
            <p className="text-lg font-bold">💳 {tx("অগ্রিম দিলে আমরা পার্ট আনা শুরু করবো", "Pay the advance and we'll start sourcing")}</p>
            <ButtonLink href={`/checkout/payment/${r.order_id}`} variant="accent" size="lg" full>
              {tx("অগ্রিম দিন", "Pay advance")} <ArrowRight className="size-5" />
            </ButtonLink>
            <Link href={`/orders/${r.order_id}`} className="block text-center text-sm font-semibold underline">
              {tx("অর্ডার দেখুন", "View order")} {order ? d(order.order_no) : ""}
            </Link>
          </Card>
        ) : (
          <Link href={`/orders/${r.order_id}`} className="flex min-h-14 items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-white">
            <span className="text-2xl" aria-hidden>
              📦
            </span>
            <span className="flex-1">
              <span className="block font-bold">{tx("অর্ডার হয়ে গেছে", "Order placed")} {order ? d(order.order_no) : ""}</span>
              <span className="block text-sm text-white/70">{tx("ডেলিভারি পর্যন্ত এখানে দেখুন", "Track it until delivery")}</span>
            </span>
            <ArrowRight className="size-5" aria-hidden />
          </Link>
        ))}

      {/* Waiting for a quote */}
      {WAITING.includes(r.status) && (
        <Card className="space-y-3 p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-ink">
              <Hourglass className="size-6" aria-hidden />
            </span>
            <div>
              <p className="text-lg font-bold">{r.status === "searching" ? tx("আমরা খুঁজছি", "We're searching") : tx("আপনার রিকোয়েস্ট পেয়েছি", "We got your request")}</p>
              <p>{replyPromise(lang)}</p>
            </div>
          </div>
          <AudioGuide text={`${tx("আমরা আপনার পার্ট খুঁজছি।", "We're looking for your part.")} ${replyPromise(lang)}`} />
        </Card>
      )}

      {WAITING.includes(r.status) && (
        <div className="rounded-2xl border-2 border-dashed border-q-oem/40 bg-q-oem-soft/50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-q-oem">{tx("ডেমো", "Demo")}</p>
          <p className="mb-3 font-semibold">{tx("ডেমো: অ্যাডমিন কোটেশন পাঠালে কেমন দেখাবে", "Demo: see what it looks like when the admin sends a quote")}</p>
          <Button variant="outline" full onClick={() => demoSendQuote(r.id)}>
            💰 {tx("ডেমো কোটেশন পাঠান", "Send a demo quote")}
          </Button>
        </div>
      )}

      {/* Quotes */}
      {showQuotes && (
        <section className="space-y-3">
          <div>
            <h2 className="text-xl font-bold">
              {canAccept && !expired ? tx("💰 দাম জানানো হয়েছে, একটা বেছে নিন", "💰 Prices are in, pick one") : tx("💰 দামের অপশন", "💰 Price options")}
            </h2>
            {canAccept && !expired && (
              <AudioGuide
                className="mt-2"
                text={tx(
                  "প্রতিটা কার্ডে দাম, ওয়ারেন্টি আর কত দিনে আনবো লেখা আছে। যেটা পছন্দ, তার নিচের হলুদ 'এটা নেবো' বাটন চাপুন।",
                  "Each card shows the price, warranty and how many days it takes. Tap the yellow 'I'll take this' button under the one you like.",
                )}
              />
            )}
          </div>
          {liveQuotes.map((q) => (
            <QuoteCard key={q.id} quote={q} now={now} canAccept={canAccept} onAccept={() => setAccepting(q)} />
          ))}
        </section>
      )}

      {expired && CANCELLABLE.includes(r.status) && (
        <Card className="space-y-3 border-2 border-danger/30 p-4">
          <p className="font-bold">⏰ {tx("দামের মেয়াদ শেষ হয়ে গেছে", "The quote has expired")}</p>
          <p className="text-sm text-muted">{tx("বাজারদর বদলাতে পারে, তাই আবার দাম দেখে জানাবো।", "Market prices change, so we'll check and quote again.")}</p>
          <Button variant="primary" size="lg" full onClick={() => requoteRequest(r.id)}>
            <RotateCcw className="size-5" /> {tx("আবার দাম জানতে চাই", "Ask for a new price")}
          </Button>
        </Card>
      )}

      {r.status === "not_found" && (
        <Notice tone="warn" className="text-base">
          {tx("দুঃখিত, এই পার্টটা এখন কোথাও পাওয়া যায়নি। অন্য মান বা বিকল্প নিয়ে কথা বলতে ফোন করুন।", "Sorry, we couldn't find this part right now. Call us to talk about other options.")}
        </Notice>
      )}

      {r.status === "cancelled" && r.cancel_reason && (
        <Notice>
          {tx("বাতিলের কারণ", "Reason")}: {r.cancel_reason}
        </Notice>
      )}

      {/* Timeline */}
      <Block title={tx("অবস্থা", "Status")}>
        <StatusTimeline steps={tl.steps} currentIndex={tl.currentIndex} stopped={tl.stopped} />
      </Block>

      {/* What was sent */}
      <Block title={tx("আপনি যা পাঠিয়েছেন", "What you sent")}>
        <div className="space-y-4">
          {r.voice_notes.length > 0 && (
            <div className="space-y-2">
              {r.voice_notes.map((v) => (
                <div key={v.id} className="rounded-xl bg-surface p-3">
                  <VoicePlayer src={v.url} duration={v.duration_sec} />
                </div>
              ))}
            </div>
          )}
          {r.photos.length > 0 && (
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {r.photos.map((p) => (
                <MediaThumb key={p.id} item={p} />
              ))}
            </div>
          )}
          {r.description_text && <p className="whitespace-pre-line text-lg">{r.description_text}</p>}
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 border-t border-line pt-3 text-sm">
            <dt className="text-muted">🚗 {tx("গাড়ি", "Car")}</dt>
            <dd className="font-medium">
              {gen ? gen.full : null}
              {gen && r.vehicle_text ? " · " : null}
              {r.vehicle_text}
              {!gen && !r.vehicle_text && <span className="text-muted">{tx("দেননি", "Not given")}</span>}
            </dd>
            <dt className="text-muted">⭐ {tx("মান", "Quality")}</dt>
            <dd>
              {r.preferred_qualities?.length ? (
                <span className="flex flex-wrap gap-1">
                  {r.preferred_qualities.map((q) => (
                    <QualityBadge key={q} quality={q} lang={lang} />
                  ))}
                </span>
              ) : (
                tx("আপনারা সাজেস্ট করুন", "You suggest")
              )}
            </dd>
            <dt className="text-muted">📞 {tx("যোগাযোগ", "Contact")}</dt>
            <dd>
              {r.guest_phone && <b className="mr-1">{d(displayPhone(r.guest_phone))}</b>}
              {r.contact_name && <span className="mr-1">({r.contact_name})</span>}
              {contactLabel(r.preferred_contact, lang)} · {callTimeLabel(r.preferred_call_time, lang)}
            </dd>
          </dl>
        </div>
      </Block>

      {/* Other actions */}
      <section className="grid grid-cols-2 gap-2">
        <ButtonLink href="/chat" variant="outline" size="lg">
          <MessageCircle className="size-5" /> {tx("প্রশ্ন করুন", "Ask a question")}
        </ButtonLink>
        <a href={telLink()} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-q-oem px-4 text-lg font-semibold text-white">
          <Phone className="size-5" /> {tx("কল করুন", "Call")}
        </a>
        <a
          href={waLink(waText)}
          target="_blank"
          rel="noopener"
          className="col-span-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 font-semibold text-white"
        >
          WhatsApp {tx("এ জানান", "us")}
        </a>
        {CANCELLABLE.includes(r.status) && !r.order_id && (
          <Button variant="danger" onClick={() => setCancelling(true)} className="col-span-2">
            <XCircle className="size-5" /> {tx("দরকার নেই", "Don't need it anymore")}
          </Button>
        )}
      </section>

      <AcceptSheet request={r} quote={accepting} onClose={() => setAccepting(null)} />
      <CancelSheet requestId={r.id} open={cancelling} onClose={() => setCancelling(false)} />
    </Container>
  );
}

