"use client";

import Link from "next/link";
import { SpeakButton } from "../../layout/AudioGuide";
import { useT } from "../../providers/LangProvider";
import { Card, Notice, SectionTitle } from "../../ui/primitives";
import { ComingSoon } from "./ComingSoon";

/** BRTA ownership-transfer checklist (file 00 §10), with 🔊. */
function OwnershipChecklist() {
  const { tx } = useT();
  const items = [
    { bn: "ক্রেতা ও বিক্রেতা দুজনের TO ও TTO ফরম", en: "TO and TTO forms from both buyer and seller" },
    { bn: "বিক্রয় রসিদ", en: "Sale receipt" },
    { bn: "দুজনেরই জাতীয় পরিচয়পত্র (NID)", en: "National ID of both" },
    { bn: "মূল রেজিস্ট্রেশন সনদ", en: "Original registration certificate" },
    { bn: "গাড়ি ব্যাংক/লোনে থাকলে ঋণ পরিশোধের ছাড়পত্র", en: "Loan clearance if the car is under a bank loan" },
    { bn: "ফি জমা ও BRTA-তে গাড়ি দেখানো", en: "Pay the fee and show the car at BRTA" },
  ];
  return (
    <section>
      <SectionTitle action={<SpeakButton text={items.map((i) => tx(i.bn, i.en)).join("। ")} />}>📋 {tx("মালিকানা বদলের চেকলিস্ট", "Ownership transfer checklist")}</SectionTitle>
      <ul className="space-y-2">
        {items.map((i) => (
          <li key={i.bn} className="flex gap-2 rounded-xl border border-line bg-card p-3">
            <span aria-hidden>☑️</span> {tx(i.bn, i.en)}
          </li>
        ))}
      </ul>
    </section>
  );
}

function SafetyNote() {
  const { tx } = useT();
  const text = tx("গাড়ি না দেখে ও কাগজ না মিলিয়ে কোনো অগ্রিম টাকা দেবেন না।", "Never pay any advance before seeing the car and checking its papers.");
  return (
    <Notice tone="bad" className="flex items-center justify-between gap-2 text-base">
      <span>⚠️ {text}</span>
      <SpeakButton text={text} />
    </Notice>
  );
}

/** /cars, /cars/[id], /cars/sell: phase-2 car marketplace previews (file 01 §9). */
export function CarsComingSoon({ variant }: { variant: "list" | "detail" | "sell" }) {
  const { tx } = useT();
  if (variant === "sell")
    return (
      <ComingSoon icon="🏷️" title={tx("আমার গাড়ি বিক্রি করুন", "Sell my car")} body={tx("আমার গাড়ি থেকে বেছে নিলে বেশিরভাগ তথ্য আগে থেকে বসানো থাকবে। ধাপে ধাপে ৬টা ছবি, দাম আর কাগজ দিন; টিম ২৪ ঘণ্টায় অনুমোদন দেবে।", "Pick from My cars and most details are pre-filled. Add 6 guided photos, price and papers; the team approves within 24 hours.")} service="cars_sell" back="/cars">
        <section>
          <SectionTitle>📸 {tx("ছবির গাইড (৬টা)", "Photo guide (6)")}</SectionTitle>
          <div className="grid grid-cols-3 gap-2 text-center text-sm font-semibold">
            {[tx("সামনে", "Front"), tx("পেছনে", "Back"), tx("বাম পাশ", "Left"), tx("ডান পাশ", "Right"), tx("ভেতর", "Inside"), tx("মিটার", "Meter")].map((x) => (
              <Card key={x} className="grid aspect-square place-items-center p-2">
                <span className="text-3xl" aria-hidden>
                  🚗
                </span>
                {x}
              </Card>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted">🔒 {tx("কাগজের ছবি পাবলিক হবে না, শুধু ✅ ব্যাজ দেখাবে।", "Paper photos are never public, only a ✅ badge.")}</p>
        </section>
        <OwnershipChecklist />
        <Link href="/garage" className="block text-center font-semibold text-brand-ink underline">
          🚗 {tx("আমার গাড়ি আগে যোগ করে রাখুন", "Add your car to My cars first")}
        </Link>
      </ComingSoon>
    );
  if (variant === "detail")
    return (
      <ComingSoon icon="🚙" title={tx("গাড়ির বিজ্ঞাপন", "Car listing")} body={tx("গাড়ির ছবি, কাগজের ✅ ব্যাজ, ইন্সপেকশন রিপোর্ট আর বাজারদর এক পাতায়। শীঘ্রই আসছে।", "Photos, paper ✅ badges, inspection report and market price on one page. Coming soon.")} service="cars_buy" back="/cars">
        <SafetyNote />
        <OwnershipChecklist />
      </ComingSoon>
    );
  return (
    <ComingSoon icon="🚙" title={tx("গাড়ি কিনুন-বেচুন", "Buy & sell cars")} body={tx("বাজেট, ব্র্যান্ড আর ধরন দিয়ে খুঁজুন; কাগজ যাচাইকৃত ✅ আর পরীক্ষিত 🔍 গাড়ি আলাদা করে দেখুন।", "Search by budget, brand and type; see paper-verified ✅ and inspected 🔍 cars separately.")} service="cars_buy">
      <section>
        <SectionTitle>💰 {tx("বাজেট (নমুনা)", "Budget (preview)")}</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {[tx("৫ লাখের নিচে", "Under 5 lakh"), tx("৫-১০ লাখ", "5–10 lakh"), tx("১০-২০ লাখ", "10–20 lakh"), tx("২০-৩০ লাখ", "20–30 lakh"), tx("৩০ লাখ+", "30 lakh+")].map((x) => (
            <span key={x} className="rounded-full border border-line bg-card px-3.5 py-2 text-sm font-medium text-muted">
              {x}
            </span>
          ))}
        </div>
      </section>
      <Link href="/cars/sell" className="flex items-center gap-3 rounded-2xl border border-line bg-card p-4 font-semibold hover:border-ink/30">
        <span className="text-2xl" aria-hidden>
          🏷️
        </span>
        {tx("আমার গাড়ি বিক্রি করতে চাই →", "I want to sell my car →")}
      </Link>
      <SafetyNote />
    </ComingSoon>
  );
}
