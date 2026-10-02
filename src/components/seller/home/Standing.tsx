"use client";

import Link from "next/link";
import { listingQuality, vendorScoreBreakdown } from "@/lib/rules";
import type { Listing, Vendor } from "@/lib/types";
import { SpeakButton } from "../../layout/AudioGuide";
import { useT } from "../../providers/LangProvider";
import { Stars } from "../../shared/Badges";
import { Card, SectionTitle } from "../../ui/primitives";

export const SCORE_TIPS: Record<string, { bn: string; en: string }> = {
  rating: { bn: "ভালো প্যাকিং আর ছবির মতো জিনিস দিন, কাস্টমার ভালো রেটিং দেবে।", en: "Pack well and send items exactly as pictured to get good ratings." },
  not_as_described: { bn: "পণ্যের আসল ছবি আর সঠিক গ্রেড দিন, তাহলে 'ছবির মতো না' দাবি কমবে।", en: "Use real photos and the right grade to avoid 'not as described' claims." },
  on_time: { bn: "অর্ডার গ্রহণের পর ৪৮ ঘণ্টার মধ্যে প্যাক করে হস্তান্তর করুন।", en: "Pack and hand over within 48 hours of accepting." },
  cancel: { bn: "স্টক না থাকলে আগেই স্টক ০ করে দিন, অর্ডার বাতিল করতে হবে না।", en: "Set stock to 0 early so you don't have to cancel orders." },
  response: { bn: "দাম চাওয়ার উত্তর আরও দ্রুত দিন। ১ ঘণ্টার মধ্যে দিলে ৩ গুণ বেশি জেতে।", en: "Reply to price requests faster. Shops that quote within an hour win 3x more." },
  verification: { bn: "যাচাই সম্পূর্ণ করুন, স্কোর ও কাস্টমারের বিশ্বাস দুটোই বাড়বে।", en: "Complete verification to raise your score and trust." },
};

export function Standing({ vendor, weekSales, pendingMoney, weakestKey, listings }: { vendor: Vendor; weekSales: number; pendingMoney: number; weakestKey: string; listings: Listing[] }) {
  const { tx, taka, d, L } = useT();
  const parts = vendorScoreBreakdown(vendor);
  const tip = SCORE_TIPS[weakestKey];
  const active = listings.filter((l) => l.status === "active");
  const onePhoto = active.filter((l) => l.media.length < 2).length;
  const lowQ = active.filter((l) => listingQuality(l).score < 60).length;
  const scoreTone = vendor.score >= 70 ? "bg-ok" : vendor.score >= 50 ? "bg-wait-bg" : "bg-bad";
  return (
    <section className="space-y-3">
      <SectionTitle action={<Link href="/seller/reviews" className="text-sm font-semibold text-brand">{tx("বিস্তারিত", "Details")} ›</Link>}>{tx("আমার অবস্থা", "My standing")}</SectionTitle>
      <Card className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted">{tx("স্কোর", "Score")}</p>
            <p className="text-3xl font-bold">{d(vendor.score)}<span className="text-base text-muted">/{d(100)}</span></p>
          </div>
          <Stars value={vendor.rating_avg} count={vendor.rating_count} size="md" />
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-surface">
          <div className={`h-full ${scoreTone}`} style={{ width: `${vendor.score}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface p-3">
            <p className="text-sm text-muted">{tx("এই সপ্তাহের বিক্রি", "This week")}</p>
            <p className="text-xl font-bold">{taka(weekSales)}</p>
          </div>
          <Link href="/seller/money" className="rounded-xl bg-wait-soft p-3 text-wait">
            <p className="text-sm">⏳ {tx("পাওনা টাকা", "Money pending")}</p>
            <p className="text-xl font-bold">{taka(pendingMoney)}</p>
          </Link>
        </div>
        {tip && (
          <div className="flex items-start gap-2 rounded-xl bg-brand-soft/50 p-3">
            <p className="flex-1 text-sm">
              💡 <b>{tx("স্কোর বাড়ানোর টিপস", "Tip to raise score")} ({L(parts.find((p) => p.key === weakestKey))}):</b> {tx(tip.bn, tip.en)}
            </p>
            <SpeakButton text={tx(tip.bn, tip.en)} label="" className="px-2" />
          </div>
        )}
      </Card>
      {(onePhoto > 0 || lowQ > 0) && (
        <Link href="/seller/products" className="block rounded-2xl border-2 border-dashed border-brand/40 bg-card p-4">
          <p className="font-bold">📸 {tx("টিপস", "Tip")}</p>
          <p className="text-ink-2">
            {onePhoto > 0
              ? tx(`আপনার ${d(onePhoto)}টা পণ্যে মাত্র ১টা ছবি। আরেকটা ছবি দিলে বেশি বিক্রি হবে।`, `${onePhoto} of your products have only 1 photo. Add another to sell more.`)
              : tx(`আপনার ${d(lowQ)}টা পণ্যের মান কম। তথ্য যোগ করলে বেশি মানুষ দেখবে।`, `${lowQ} products have low quality. Add details so more people see them.`)}
          </p>
        </Link>
      )}
    </section>
  );
}
