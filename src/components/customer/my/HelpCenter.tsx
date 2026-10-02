"use client";

import { MessageCircle, Phone, PhoneCall, PlayCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { openThread, requestCallback } from "@/lib/db/actions";
import { getDb } from "@/lib/db/store";
import { telLink, waLink } from "@/lib/links";
import { settings } from "@/lib/mock/settings";
import { AudioGuide, SpeakButton } from "../../layout/AudioGuide";
import { toast } from "../../shared/Misc";
import { useT } from "../../providers/LangProvider";
import { Button, Card, Container, PageHeader, SectionTitle } from "../../ui/primitives";
import { buildPolicies } from "./policies";

/** /help: audio/video guides, FAQ with 🔊, call / WhatsApp (file 01 §1.2, rule 7). */
export function HelpCenter() {
  const { tx, d, lang, L } = useT();
  const router = useRouter();
  const guides = [
    { icon: "🎤", href: "/request?mode=voice", bn: "কীভাবে পার্ট চাইবেন", en: "How to request a part", tbn: "নিচের লাল মাইক বাটন চাপুন। গাড়ির নাম আর কোন পার্ট লাগবে বলুন। তারপর পাঠান চাপুন। দোকানগুলো দাম পাঠাবে।", ten: "Press the red mic button at the bottom. Say the car and the part you need. Then press send. Shops will send prices." },
    { icon: "⚖️", href: "/my", bn: "কীভাবে দাম তুলনা করবেন", en: "How to compare prices", tbn: "দাম এলে আমার কাজে সবুজ বাটন আসবে। সেখানে সব দাম দেখবেন। সবুজ ঘরে আমাদের পরামর্শ। পছন্দ হলে 'এটা নেবো' চাপুন।", ten: "When prices arrive, a green button appears in My stuff. The green box is our pick. Press 'Take it' to choose." },
    { icon: "🚚", href: "/my", bn: "অর্ডার কোথায় আছে দেখবেন", en: "Track your order", tbn: "আমার কাজে অর্ডারে চাপুন। প্রতিটা দোকানের প্যাকেট আলাদা দেখাবে, কোথায় আছে আইকনে বোঝা যাবে।", ten: "Open the order in My stuff. Each shop's parcel shows separately with icons for where it is." },
    { icon: "⚠️", href: "/my", bn: "জিনিস ঠিক না হলে", en: "If the item is wrong", tbn: "অর্ডারে লাল 'সমস্যা জানান' চাপুন, ছবি দিন। সমাধান না হওয়া পর্যন্ত দোকান টাকা পাবে না।", ten: "Press the red 'Report a problem' on the order and add photos. The shop isn't paid until it's solved." },
  ];
  const faq = [
    { bn: "টাকা কি নিরাপদ?", en: "Is my money safe?", abn: `হ্যাঁ। টাকা আগে গাড়িহাবের কাছে থাকে। জিনিস পৌঁছানোর ${d(settings.return_window_days)} দিন পর কোনো সমস্যা না থাকলে তবেই দোকান পায়।`, aen: `Yes. GaariHub holds the money and pays the shop only ${settings.return_window_days} days after delivery if there's no problem.` },
    { bn: "দোকানের নম্বর পাবো না কেন?", en: "Why can't I see the shop's number?", abn: "আপনার সুরক্ষার জন্য। অ্যাপের ভেতরে কথা বললে আর কিনলে টাকা ফেরতের গ্যারান্টি থাকে। কল লাগলে 📞 কল অনুরোধ চাপুন।", aen: "For your protection. Talking and buying inside the app keeps the money-back guarantee. Use 📞 call request if you need a call." },
    { bn: "লগইন ছাড়া কি পার্ট চাওয়া যায়?", en: "Can I request without logging in?", abn: `হ্যাঁ, শুধু ফোন নম্বর দিয়ে। দিনে সর্বোচ্চ ${d(settings.guest_requests_per_day)}টা।`, aen: `Yes, with just a phone number. Up to ${settings.guest_requests_per_day} per day.` },
    { bn: "ক্যাশ অন ডেলিভারি আছে?", en: "Is cash on delivery available?", abn: `হ্যাঁ, ৳ ${d(settings.cod_limit)} পর্যন্ত। বেশি হলে ডেলিভারি চার্জ আগে দিতে হয় বা অনলাইনে দিন।`, aen: `Yes, up to ৳${settings.cod_limit}. Above that, pay the delivery charge first or pay online.` },
    { bn: "জেনুইন আর জাপানি খোলা মানে কী?", en: "What do genuine and used-import mean?", abn: "জেনুইন মানে গাড়ির কোম্পানির নিজের পার্ট। জাপানি খোলা মানে বিদেশি গাড়ি থেকে খোলা পুরনো পার্ট। প্রতিটা ব্যাজে চাপলে ব্যাখ্যা শুনবেন।", aen: "Genuine = made by the car maker. Used (import) = taken from an imported car. Tap any badge to hear an explanation." },
  ];

  const supportChat = () => {
    if (!getDb().session.customerPhone) return router.push(`/login?next=${encodeURIComponent("/help")}`);
    router.push(`/messages/${openThread({ type: "customer_support", vendorId: null })}`);
  };

  return (
    <Container className="space-y-6">
      <PageHeader title={`🆘 ${tx("সাহায্য", "Help")}`} subtitle={tx(`প্রতিদিন সকাল ${d(settings.business_hours.open)}টা থেকে রাত ${d(settings.business_hours.close - 12)}টা`, `Daily ${settings.business_hours.open}:00–${settings.business_hours.close}:00`)} />
      <AudioGuide text={tx("যেকোনো সমস্যায় সবুজ বাটন চেপে কল করুন। নিচে শুনে শুনে শেখার গাইড আছে।", "Press the green button to call us for any problem. Below are guides you can listen to.")} />

      <div className="grid gap-2 sm:grid-cols-2">
        <a href={telLink()} className="flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-ok px-4 text-lg font-bold text-white">
          <Phone className="size-6" aria-hidden /> {tx("কল করুন", "Call")} · {lang === "bn" ? settings.hotline_display : settings.hotline}
        </a>
        <a href={waLink(tx("আসসালামু আলাইকুম, সাহায্য লাগবে", "Hello, I need help"))} target="_blank" rel="noreferrer" className="flex min-h-16 items-center justify-center gap-3 rounded-2xl border-2 border-ok/40 bg-card px-4 text-lg font-bold text-ok">
          <MessageCircle className="size-6" aria-hidden /> WhatsApp
        </a>
        <Button variant="outline" size="lg" onClick={supportChat}>
          💬 {tx("অ্যাপে মেসেজ দিন", "Message in app")}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            requestCallback("support", null, "সাহায্য পেজ থেকে কলব্যাক");
            toast(tx("অনুরোধ পেয়েছি, আমরা কল করবো", "Got it, we'll call you"));
          }}
        >
          <PhoneCall className="size-5" aria-hidden /> {tx("আমাকে কল করুন", "Call me back")}
        </Button>
      </div>

      <section>
        <SectionTitle>🎧 {tx("শুনে শিখুন", "Listen and learn")}</SectionTitle>
        <div className="space-y-2">
          {guides.map((g) => (
            <Card key={g.bn} className="flex items-center gap-3 p-3">
              <span className="text-3xl" aria-hidden>
                {g.icon}
              </span>
              <Link href={g.href} className="min-w-0 flex-1 font-semibold">
                {tx(g.bn, g.en)}
              </Link>
              <SpeakButton text={tx(g.tbn, g.ten)} />
            </Card>
          ))}
          <Card className="flex items-center gap-3 p-3 opacity-70">
            <PlayCircle className="size-8 text-muted" aria-hidden />
            <span className="flex-1 font-semibold">{tx("ভিডিও গাইড", "Video guides")}</span>
            <span className="rounded-full bg-wait-soft px-2.5 py-0.5 text-xs font-bold text-wait">{tx("শীঘ্রই আসছে", "Coming soon")}</span>
          </Card>
        </div>
      </section>

      <section>
        <SectionTitle>❓ {tx("সাধারণ প্রশ্ন", "Common questions")}</SectionTitle>
        <div className="space-y-2">
          {faq.map((f) => (
            <details key={f.bn} className="group rounded-2xl border border-line bg-card p-4">
              <summary className="cursor-pointer list-none font-semibold">
                <span className="mr-1 inline-block transition-transform group-open:rotate-90">▸</span> {tx(f.bn, f.en)}
              </summary>
              <p className="mt-2">{tx(f.abn, f.aen)}</p>
              <SpeakButton text={`${tx(f.bn, f.en)} ${tx(f.abn, f.aen)}`} className="mt-2" />
            </details>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>📜 {tx("নিয়ম ও নীতি", "Policies")}</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {buildPolicies(d).map((p) => (
            <Link key={p.slug} href={`/policy/${p.slug}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-card px-3.5 text-sm font-medium hover:border-ink/40">
              {p.icon} {L(p.title)}
            </Link>
          ))}
        </div>
      </section>
    </Container>
  );
}
