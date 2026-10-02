"use client";

import Link from "next/link";
import { useState } from "react";
import { vendorReplyReview } from "@/lib/db/actions";
import { reportReviewBySeller } from "@/lib/db/actions-seller";
import { useDb } from "@/lib/db/store";
import { reviewTags } from "@/lib/mock/catalog";
import { verificationPerks, vendorScoreBreakdown, vendorStanding } from "@/lib/rules";
import type { Review, Vendor } from "@/lib/types";
import { SpeakButton } from "../../layout/AudioGuide";
import { useT } from "../../providers/LangProvider";
import { Stars, VerifiedBadge } from "../../shared/Badges";
import { toast } from "../../shared/Misc";
import { Sheet } from "../../ui/Sheet";
import { Button, Card, EmptyState, Notice, SectionTitle, Stat } from "../../ui/primitives";
import { ReasonChips } from "../Choices";
import { VoiceTextarea } from "../Dictate";
import { SCORE_TIPS } from "../home/Standing";
import { SellerPage } from "../SellerPage";

const NEXT_NEEDS = [
  { bn: "NID দুই পাশের ছবি + সেলফি", en: "NID both sides + selfie" },
  { bn: "ট্রেড লাইসেন্স + দোকানের ছবি + টিমের ফোন কল", en: "Trade licence + shop photo + team call" },
  { bn: "টিমের দোকান পরিদর্শন + bKash/ব্যাংক তথ্য", en: "Team shop visit + bKash/bank details" },
];

export function ReviewsPage({ vendor }: { vendor: Vendor }) {
  const { tx, d, L, ago, lang } = useT();
  const vid = vendor.id;
  const reviews = useDb((s) => s.reviews.filter((r) => r.vendor_id === vid).sort((a, b) => b.created_at.localeCompare(a.created_at)));
  const stats = useDb((s) => {
    const matched = s.requests.filter((r) => r.matches.some((m) => m.vendor_id === vid)).length;
    const mine = s.quotes.filter((q) => q.vendor_id === vid);
    const quoted = new Set(mine.map((q) => q.request_id)).size;
    const won = mine.filter((q) => q.status === "accepted").length;
    const lost = mine.filter((q) => q.status === "not_selected").length;
    return { matched, quoted, won, lost };
  });
  const [replyTo, setReplyTo] = useState<Review | null>(null);
  const [reply, setReply] = useState("");
  const [reportOf, setReportOf] = useState<Review | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const parts = vendorScoreBreakdown(vendor);
  const standing = vendorStanding(vendor.score);
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
  const next = vendor.verification_level < 3 ? vendor.verification_level + 1 : null;
  const tagLabel = (id: string) => reviewTags.find((t) => t.id === id);

  return (
    <SellerPage
      title={tx("⭐ রিভিউ ও আমার স্কোর", "⭐ Reviews & my score")}
      guide={tx("স্কোর ১০০-র মধ্যে। প্রতিটা বারের পাশে 🔊 চেপে শুনুন কীভাবে বাড়াবেন। ৫০-এর নিচে নামলে সতর্কতা, ৩০-এর নিচে দোকান স্থগিত।", "Score is out of 100. Tap 🔊 next to each bar to hear how to improve. Below 50 you get a warning, below 30 the shop is suspended.")}
    >
      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-5xl font-black">{d(vendor.score)}<span className="text-xl text-muted">/{d(100)}</span></p>
          <div className="text-right">
            <Stars value={vendor.rating_avg} count={vendor.rating_count} size="md" />
            <VerifiedBadge vendor={vendor} />
          </div>
        </div>
        {standing !== "good" && <Notice tone="bad">{standing === "suspend" ? tx("স্কোর ৩০-এর নিচে: দোকান স্থগিত হতে পারে।", "Below 30: shop may be suspended.") : tx("স্কোর ৫০-এর নিচে: সতর্কতা।", "Below 50: warning.")}</Notice>}
        <div className="space-y-3">
          {parts.map((p) => (
            <div key={p.key} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-semibold">{L(p)}</span>
                <span className="flex items-center gap-1">
                  <b>{d(p.points)}/{d(p.weight)}</b>
                  {SCORE_TIPS[p.key] && <SpeakButton text={tx(SCORE_TIPS[p.key].bn, SCORE_TIPS[p.key].en)} label={tx("কীভাবে বাড়াবেন", "How to improve")} className="min-h-8 px-2 text-xs" />}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-surface">
                <div className={p.value >= 0.8 ? "h-full bg-ok" : p.value >= 0.5 ? "h-full bg-wait-bg" : "h-full bg-bad"} style={{ width: `${Math.round(p.value * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <section>
        <SectionTitle>{tx("দাম চাওয়ার হিসাব", "Price request stats")}</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Stat label={tx("দাম দেওয়ার হার", "Quote rate")} value={`${d(pct(stats.quoted, stats.matched))}%`} sub={tx(`${d(stats.matched)}টার মধ্যে ${d(stats.quoted)}টা`, `${stats.quoted} of ${stats.matched}`)} />
          <Stat label={tx("জেতার হার", "Win rate")} value={`${d(pct(stats.won, stats.quoted))}%`} sub={tx(`${d(stats.won)}টা জিতেছেন`, `${stats.won} won`)} />
          <Stat label={tx("গড় সাড়ার সময়", "Avg response")} value={tx(`${d(vendor.response_minutes)} মিনিট`, `${vendor.response_minutes} min`)} />
          <Stat label={tx("হাতছাড়া", "Lost")} value={d(stats.lost)} sub={tx("দাম বেশি / দেরি / ছবি নেই", "Price / late / no photo")} />
        </div>
        <Notice className="mt-3">💡 {tx("যারা ১ ঘণ্টার মধ্যে দাম দেয় তারা ৩ গুণ বেশি জেতে।", "Shops that quote within an hour win 3x more.")}</Notice>
      </section>

      <section>
        <SectionTitle>{tx("যাচাই স্তর", "Verification level")}</SectionTitle>
        <Card className="space-y-2 p-4">
          <p className="text-lg font-bold">{tx("স্তর", "Level")} {d(vendor.verification_level)}: {L(verificationPerks[vendor.verification_level])}</p>
          {next != null ? (
            <>
              <p className="text-sm">{tx("পরের স্তরে যেতে লাগবে", "Next level needs")}: <b>{L(NEXT_NEEDS[next - 1])}</b></p>
              <p className="text-sm text-ok">🎁 {L(verificationPerks[next])}</p>
              <Link href="/seller/verify" className="font-bold text-brand">{tx("যাচাই করুন ›", "Verify ›")}</Link>
            </>
          ) : (
            <p className="text-ok">🏅 {tx("আপনি সর্বোচ্চ স্তরে আছেন", "You're at the top level")}</p>
          )}
        </Card>
      </section>

      <section>
        <SectionTitle>{tx("রিভিউ", "Reviews")} ({d(reviews.length)})</SectionTitle>
        {reviews.length ? (
          <div className="space-y-3">
            {reviews.map((r) => (
              <Card key={r.id} className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <Stars value={r.rating} />
                  <span className="text-xs text-muted">{r.user_name.split(" ")[0]} · {ago(r.created_at)}</span>
                </div>
                {r.tags.length > 0 && <div className="flex flex-wrap gap-1">{r.tags.map((t) => <span key={t} className="rounded-full bg-ok-soft px-2 py-0.5 text-xs font-semibold text-ok">✓ {L(tagLabel(t))}</span>)}</div>}
                {r.comment && <p>{r.comment}</p>}
                {r.vendor_reply ? (
                  <p className="rounded-xl bg-surface p-3 text-sm">🏪 {tx("আপনার উত্তর", "Your reply")}: {r.vendor_reply}</p>
                ) : (
                  <Button variant="outline" onClick={() => { setReplyTo(r); setReply(""); }}>💬 {tx("উত্তর দিন (একবার)", "Reply (once)")}</Button>
                )}
                <button type="button" className="text-xs font-semibold text-muted underline" onClick={() => { setReportOf(r); setReason(null); }}>🚩 {tx("ভুল/অন্যায় রিভিউ জানান", "Report unfair review")}</button>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState icon="⭐" title={tx("এখনো রিভিউ নেই", "No reviews yet")} />
        )}
      </section>

      <Sheet open={!!replyTo} onClose={() => setReplyTo(null)} title={tx("রিভিউর উত্তর", "Reply to review")}>
        <div className="space-y-3 pb-2">
          <Notice tone="wait">{tx("উত্তর একবারই দেওয়া যাবে, সবাই দেখবে। নম্বর দেবেন না।", "You can reply only once; everyone sees it. No phone numbers.")}</Notice>
          <VoiceTextarea value={reply} onChange={setReply} />
          <Button variant="brand" size="lg" full disabled={!reply.trim()} onClick={() => { vendorReplyReview(replyTo!.id, reply.trim()); setReplyTo(null); toast(tx("উত্তর দেওয়া হয়েছে", "Reply posted")); }}>📨 {tx("পাঠান", "Send")}</Button>
        </div>
      </Sheet>
      <Sheet open={!!reportOf} onClose={() => setReportOf(null)} title={tx("রিভিউ রিপোর্ট", "Report review")}>
        <div className="space-y-3 pb-2">
          <ReasonChips reasons={lang === "bn" ? ["এই কাস্টমার কেনেনি", "গালিগালাজ", "মিথ্যা তথ্য", "অন্য দোকানের লোক"] : ["Not a real buyer", "Abusive", "False claims", "Competitor"]} value={reason} onChange={setReason} />
          <Button variant="danger" size="lg" full disabled={!reason} onClick={() => { reportReviewBySeller(vid, reportOf!.id, reason!); setReportOf(null); toast(tx("রিপোর্ট পাঠানো হয়েছে, টিম দেখবে", "Reported, the team will check"), "info"); }}>🚩 {tx("রিপোর্ট করুন", "Report")}</Button>
        </div>
      </Sheet>
    </SellerPage>
  );
}
