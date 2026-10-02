"use client";

import { Headphones, Volume2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { addToCart, openThread, requestCallback } from "@/lib/db/actions";
import { requestById } from "@/lib/db/queries";
import { HOUR } from "@/lib/db/seed";
import { useDb, useHydrated } from "@/lib/db/store";
import { requestStatusLabel } from "@/lib/labels";
import { settings } from "@/lib/mock/settings";
import type { QuoteSort } from "@/lib/rules";
import { AudioGuide, speak } from "../../layout/AudioGuide";
import { BackButton, HelpCall, toast, useNow } from "../../shared/Misc";
import { useT } from "../../providers/LangProvider";
import { Button, ButtonLink, Chip, Container, EmptyState, Notice, StatusPill } from "../../ui/primitives";
import { QuoteCard } from "./QuoteCard";
import { QuoteCompareSheet, QuoteDetailSheet } from "./QuoteSheets";
import { RequestActions } from "./RequestActions";
import { RequestQuestions } from "./RequestQuestions";
import { RequestSummary } from "./RequestSummary";
import { allQuotesSpeech, buildQuoteViews, sortQuotes, type QuoteView } from "./quoteUtils";

const SORTS: { value: QuoteSort; bn: string; en: string }[] = [
  { value: "best", bn: "⭐ সেরা পছন্দ", en: "⭐ Best choice" },
  { value: "cheapest", bn: "💰 কম দাম", en: "💰 Cheapest" },
  { value: "fastest", bn: "⚡ দ্রুত", en: "⚡ Fastest" },
  { value: "nearest", bn: "📍 কাছে", en: "📍 Nearest" },
  { value: "genuine_only", bn: "🟢 শুধু জেনুইন", en: "🟢 Genuine only" },
  { value: "new_only", bn: "🆕 শুধু নতুন", en: "🆕 New only" },
];

/** /request/[id]: the most important screen (file 01 §5.2). */
export function RequestDetail({ id }: { id: string }) {
  const { tx, d, L, lang } = useT();
  const router = useRouter();
  const hydrated = useHydrated();
  const now = useNow();
  const db = useDb((s) => s);
  const r = requestById(db, id);
  const [sort, setSort] = useState<QuoteSort>("best");
  const [showAll, setShowAll] = useState(false);
  const [compare, setCompare] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const views = useMemo(() => (r ? buildQuoteViews(db, r) : []), [db, r]);
  if (!hydrated) return <Container className="h-96 animate-pulse" />;
  if (!r)
    return (
      <Container>
        <BackButton href="/my" />
        <EmptyState icon="🔎" title={tx("রিকোয়েস্ট পাওয়া যায়নি", "Request not found")} action={<ButtonLink href="/request" variant="brand">{tx("নতুন রিকোয়েস্ট দিন", "New request")}</ButtonLink>} />
      </Container>
    );

  const best = sortQuotes(views, "best", r.district);
  const recommendedId = best.find((v) => !v.blocked && !v.anomaly && v.q.status === "submitted")?.q.id;
  const sorted = sortQuotes(views, sort, r.district);
  const shown = showAll ? sorted : sorted.slice(0, settings.quotes_shown_first);
  const canTake = r.status === "open" || r.status === "quotes_received";
  const hoursLeft = Math.max(0, Math.ceil((new Date(r.expires_at).getTime() - now) / HOUR));
  const ageHours = (now - new Date(r.created_at).getTime()) / HOUR;
  const teamSearching = r.team_searching || (views.length === 0 && ageHours >= 24 && r.status === "open");
  const st = requestStatusLabel[r.status];

  const take = (v: QuoteView) => {
    addToCart({ quote_id: v.q.id });
    toast(tx("কার্টে যোগ হয়েছে, এবার ঠিকানা ও পেমেন্ট", "Added. Now address and payment"));
    router.push("/checkout");
  };
  const ask = (v: QuoteView) => {
    if (!db.session.customerPhone) return router.push(`/login?next=${encodeURIComponent(`/request/${r.id}`)}`);
    const tid = openThread({ type: "customer_vendor", vendorId: v.q.vendor_id, contextType: "quote", contextId: v.q.id });
    router.push(`/messages/${tid}`);
  };
  const toggleCompare = (qid: string) =>
    setCompare((c) => {
      if (c.includes(qid)) return c.filter((x) => x !== qid);
      if (c.length >= 3) {
        toast(tx("সর্বোচ্চ ৩টা তুলনা করা যায়", "Compare up to 3"), "info");
        return c;
      }
      return [...c, qid];
    });
  const detail = views.find((v) => v.q.id === detailId) ?? null;

  return (
    <Container className="space-y-5">
      <div>
        <BackButton href="/my" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">
            🙋 {tx("রিকোয়েস্ট", "Request")} {d(r.request_no)}
          </h1>
          <StatusPill tone={st.tone}>{L(st)}</StatusPill>
        </div>
      </div>

      <AudioGuide
        text={tx(
          "এখানে দোকানগুলোর দেওয়া দাম দেখবেন। সবুজ ঘরে লেখা আমাদের পরামর্শ। শুনুন বাটন চাপলে দাম পড়ে শোনাবে। পছন্দ হলে সবুজ 'এটা নেবো' বাটন চাপুন।",
          "Here you see prices from shops. The green box is our pick. Press Listen to hear a price. Press the green 'Take it' button to choose.",
        )}
      />

      <RequestSummary r={r} />

      <p className="rounded-2xl bg-ink px-4 py-3 text-center font-semibold text-white">
        {r.broadcast_at ? tx(`${d(r.matches.length)}টা দোকানে পাঠানো`, `Sent to ${r.matches.length} shops`) : tx("টিম দেখছে", "Team reviewing")} ·{" "}
        {tx(`${d(views.length)}টা দাম এসেছে`, `${views.length} quotes`)} · {hoursLeft > 0 ? tx(`মেয়াদ ${d(hoursLeft)} ঘণ্টা বাকি`, `${hoursLeft} h left`) : tx("মেয়াদ শেষ", "Expired")}
      </p>

      {r.status === "needs_clarification" && (
        <Notice tone="wait">
          🎧 {r.voice_notes.length ? tx("আমাদের টিম আপনার ভয়েস শুনে ঠিক দোকানে পাঠাবে। দরকার হলে ফোন করবে।", "Our team will listen to your voice note and send it to the right shops. They may call you.") : tx("আমাদের টিম রিকোয়েস্টটা দেখে ঠিক দোকানে পাঠাবে।", "Our team will review your request and send it to the right shops.")}
        </Notice>
      )}
      {teamSearching && (
        <Notice tone="wait">🔎 {tx("এখনো দোকান থেকে দাম আসেনি। আমরা নিজে খুঁজছি, পেলেই জানাবো।", "No shop has quoted yet. We're searching ourselves and will let you know.")}</Notice>
      )}
      {r.status === "accepted" && (
        <Notice tone="ok">
          ✅ {tx("আপনি একটা দাম বেছে অর্ডার করেছেন। অন্য দোকানগুলোকে জানানো হয়েছে।", "You picked a quote and ordered. Other shops have been told.")}{" "}
          <Link href="/my" className="font-bold underline">
            {tx("আমার কাজ দেখুন", "See my stuff")}
          </Link>
        </Notice>
      )}
      {r.status === "cancelled" && <Notice tone="bad">✖️ {tx("রিকোয়েস্ট বাতিল করা হয়েছে।", "This request was cancelled.")} {r.cancel_reason}</Notice>}
      {r.status === "expired" && <Notice tone="info">⏱ {tx("মেয়াদ শেষ। নিচে 'মেয়াদ বাড়ান' চাপলে আবার দোকানে যাবে।", "Expired. Press 'Extend' below to reopen it.")}</Notice>}

      {views.length > 0 && (
        <section className="space-y-3">
          <Button variant="brand" size="lg" full onClick={() => speak(allQuotesSpeech(best, lang), lang)}>
            <Volume2 className="size-5" aria-hidden /> {tx("সব দাম শুনুন", "Hear all prices")}
          </Button>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {SORTS.map((s) => (
              <Chip key={s.value} active={sort === s.value} onClick={() => setSort(s.value)}>
                {tx(s.bn, s.en)}
              </Chip>
            ))}
          </div>
          {shown.length === 0 && <Notice>{tx("এই বাছাইয়ে কোনো দাম নেই।", "No quotes match this filter.")}</Notice>}
          {shown.map((v) => (
            <QuoteCard
              key={v.q.id}
              view={v}
              recommended={v.q.id === recommendedId}
              selected={compare.includes(v.q.id)}
              canTake={canTake}
              onOpen={() => setDetailId(v.q.id)}
              onTake={() => take(v)}
              onAsk={() => ask(v)}
              onToggleCompare={() => toggleCompare(v.q.id)}
            />
          ))}
          {sorted.length > shown.length && (
            <Button variant="outline" full onClick={() => setShowAll(true)}>
              {tx(`আরও ${d(sorted.length - shown.length)}টা দেখুন`, `See ${sorted.length - shown.length} more`)}
            </Button>
          )}
        </section>
      )}

      <section className="space-y-2 rounded-2xl border border-line bg-card p-4">
        <p className="font-bold">🤝 {tx("কোনটা নেবেন বুঝতে পারছেন না?", "Not sure which to take?")}</p>
        <Button
          variant="outline"
          full
          onClick={() => {
            requestCallback("support", null, `${r.request_no}: দাম বাছাইয়ে সাহায্য`);
            toast(tx("অনুরোধ পেয়েছি। আমাদের টিম শিগগিরই কল করবে।", "Got it. Our team will call you shortly."));
          }}
        >
          <Headphones className="size-5" aria-hidden /> {tx("আমাদের সাথে কথা বলে বেছে নিন", "Talk to us and choose")}
        </Button>
      </section>

      <RequestQuestions r={r} />
      <RequestActions r={r} />
      <p className="text-center text-sm text-muted">🔒 {tx("দোকান আপনার নাম, নম্বর বা ঠিকানা দেখে না, শুধু এলাকা।", "Shops never see your name, number or address, only your area.")}</p>
      <HelpCall />

      {compare.length >= 2 && (
        <div className="fixed inset-x-0 bottom-24 z-30 px-4">
          <div className="mx-auto max-w-3xl">
            <Button variant="primary" size="lg" full onClick={() => setCompareOpen(true)} className="shadow-xl">
              ⚖️ {tx(`${d(compare.length)}টা তুলনা করুন`, `Compare ${compare.length}`)}
            </Button>
          </div>
        </div>
      )}
      <QuoteCompareSheet
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        views={compare.map((qid) => views.find((v) => v.q.id === qid)).filter((v): v is QuoteView => !!v)}
        onTake={take}
      />
      <QuoteDetailSheet view={detail} onClose={() => setDetailId(null)} onTake={() => detail && take(detail)} canTake={canTake} />
    </Container>
  );
}
