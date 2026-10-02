"use client";

import Link from "next/link";
import { telLink } from "@/lib/links";
import { AudioGuide } from "../../layout/AudioGuide";
import { BackButton, HelpCall } from "../../shared/Misc";
import { useT } from "../../providers/LangProvider";
import { Card, Container, PageHeader } from "../../ui/primitives";
import { ComingSoon } from "./ComingSoon";

interface Service {
  type: string;
  icon: string;
  phase: 2 | 3;
  bn: string;
  en: string;
  dbn: string;
  den: string;
  points: { bn: string; en: string }[];
}

export const SERVICES: Service[] = [
  {
    type: "mechanic", icon: "🧰", phase: 2, bn: "মেকানিক ও গ্যারেজ", en: "Mechanic & garage",
    dbn: "কাছের যাচাইকৃত গ্যারেজ, রেটিং ও সেবার দাম দেখে বুক করুন।", den: "Book verified garages nearby with ratings and price ranges.",
    points: [
      { bn: "তারিখ-সময়, গাড়ি আর সমস্যা (🎤 বলে) দিয়ে বুকিং", en: "Book with date, car and problem (say it 🎤)" },
      { bn: "পার্টস + ফিটিং: কেনা পার্ট সরাসরি গ্যারেজে যাবে", en: "Parts + fitting: your parts go straight to the garage" },
    ],
  },
  {
    type: "inspection", icon: "🔍", phase: 2, bn: "গাড়ি ইন্সপেকশন", en: "Car inspection",
    dbn: "কেনার আগে, বিক্রির জন্য বা সাধারণ চেক-আপ।", den: "Before buying, for selling, or a general check-up.",
    points: [
      { bn: "ইঞ্জিন, বডি, ভেতর, ইলেকট্রিক্যাল, নিচের অংশ: সবুজ/হলুদ/লাল রিপোর্ট", en: "Engine, body, interior, electrical, underbody: green/yellow/red report" },
    ],
  },
  {
    type: "roadside", icon: "🛟", phase: 3, bn: "রাস্তায় সাহায্য", en: "Roadside help",
    dbn: "লোকেশন শেয়ার করে কাছের সাহায্যকারী ডাকুন। এখন জরুরি হলে হটলাইনে কল করুন।", den: "Share your location to call the nearest helper. For now, call the hotline in an emergency.",
    points: [{ bn: "টায়ার, ব্যাটারি জাম্প, টো, তেল শেষ", en: "Tyre, battery jump, tow, out of fuel" }],
  },
  {
    type: "wash", icon: "🧽", phase: 3, bn: "ওয়াশ ও সার্ভিস প্যাকেজ", en: "Wash & service packages",
    dbn: "বাসায় এসে গাড়ি ধোয়া ও নিয়মিত সার্ভিস।", den: "Car wash and routine service at your home.",
    points: [{ bn: "মাসিক প্যাকেজ", en: "Monthly packages" }],
  },
  {
    type: "papers", icon: "📄", phase: 3, bn: "কাগজপত্র সেবা", en: "Papers service",
    dbn: "ট্যাক্স টোকেন, ফিটনেস নবায়ন, মালিকানা বদল আমরা করে দেবো।", den: "We renew tax token and fitness and handle ownership transfer.",
    points: [{ bn: "আমার গাড়িতে মেয়াদের রিমাইন্ডার থেকে এক চাপে", en: "One tap from expiry reminders in My cars" }],
  },
  {
    type: "insurance", icon: "🛡️", phase: 3, bn: "ইন্স্যুরেন্স", en: "Insurance",
    dbn: "গাড়ির ইন্স্যুরেন্স তুলনা ও নবায়ন।", den: "Compare and renew car insurance.",
    points: [],
  },
];

/** /services and /services/[type]: phase 2/3 "coming soon" + interest (file 01 §10). */
export function ServicesView({ type }: { type: string | null }) {
  const { tx, d } = useT();
  const s = SERVICES.find((x) => x.type === type);
  if (s)
    return (
      <ComingSoon icon={s.icon} title={tx(s.bn, s.en)} body={tx(s.dbn, s.den)} service={s.type} back="/services">
        {s.points.length > 0 && (
          <ul className="space-y-2">
            {s.points.map((p) => (
              <li key={p.bn} className="rounded-xl border border-line bg-card p-3">
                ✨ {tx(p.bn, p.en)}
              </li>
            ))}
          </ul>
        )}
        {s.type === "roadside" && (
          <a href={telLink()} className="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-bad text-lg font-bold text-white">
            🚨 {tx("জরুরি হটলাইনে কল করুন", "Call the emergency hotline")}
          </a>
        )}
      </ComingSoon>
    );

  return (
    <Container className="space-y-5">
      <PageHeader back={<BackButton href="/" />} title={`🧰 ${tx("সেবা", "Services")}`} subtitle={tx("মেকানিক, ইন্সপেকশন, ওয়াশ… শীঘ্রই আসছে", "Mechanic, inspection, wash… coming soon")} />
      <AudioGuide text={tx("এই সেবাগুলো শীঘ্রই আসছে। যেটা লাগবে সেটায় চেপে আগ্রহ জানান, চালু হলে জানাবো।", "These services are coming soon. Tap the one you need and register interest; we'll tell you when it launches.")} />
      <div className="grid grid-cols-2 gap-3">
        {SERVICES.map((x) => (
          <Link key={x.type} href={`/services/${x.type}`}>
            <Card className="flex h-full flex-col items-center gap-2 p-4 text-center hover:border-ink/30">
              <span className="text-4xl" aria-hidden>
                {x.icon}
              </span>
              <span className="font-bold">{tx(x.bn, x.en)}</span>
              <span className="rounded-full bg-wait-soft px-2.5 py-0.5 text-xs font-bold text-wait">{tx(`ফেজ ${d(x.phase)} · শীঘ্রই`, `Phase ${x.phase} · soon`)}</span>
            </Card>
          </Link>
        ))}
      </div>
      <HelpCall />
    </Container>
  );
}
