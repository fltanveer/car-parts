import { Camera, ChevronDown, Clock, MessageCircle, Mic, Phone, PlayCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { businessHoursLabel } from "@/components/account/hours";
import { AudioGuide } from "@/components/layout/AudioGuide";
import { ButtonLink, Card, Container, PageHeader, SectionTitle, buttonClass } from "@/components/ui/primitives";
import { toEnDigits } from "@/lib/format";
import { qualityLabel } from "@/lib/i18n";
import { telLink, waLink } from "@/lib/links";
import { deliveryDays, deliveryRates, settings } from "@/lib/mock/settings";
import { getT } from "@/lib/server-lang";
import type { Quality } from "@/lib/types";

export const metadata: Metadata = { title: "সাহায্য" };

function Faq({ q, children }: { q: string; children: ReactNode }) {
  return (
    <details className="group border-b border-line last:border-b-0">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
        <span className="flex-1">{q}</span>
        <ChevronDown className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="space-y-2 px-4 pb-4 text-ink-2">{children}</div>
    </details>
  );
}

export default async function HelpPage() {
  const { lang, tx, d, taka, range } = await getT();
  const hours = businessHoursLabel(lang);
  const hotline = tx(settings.hotline_display, toEnDigits(settings.hotline_display));
  const replyHours = tx(settings.quote_reply_hours, toEnDigits(settings.quote_reply_hours).replace(" থেকে ", "–"));
  const minRate = (zone: "dhaka" | "outside") => Math.min(...deliveryRates.filter((r) => r.zone === zone).map((r) => r.charge));

  const ways = [
    {
      Icon: Mic,
      color: "bg-danger text-white",
      title: tx("বলে অর্ডার দিন", "Order by voice"),
      steps: [
        tx("নিচের 🎤 বাটন চাপুন", "Tap the 🎤 button"),
        tx("গাড়ির নাম ও কোন পার্ট লাগবে বলুন", "Say your car and the part you need"),
        tx("আবার চেপে থামান, তারপর পাঠান", "Tap again to stop, then send"),
      ],
      href: "/request?mode=voice",
      cta: tx("এখনই বলুন", "Speak now"),
    },
    {
      Icon: Camera,
      color: "bg-ink text-white",
      title: tx("ছবি দিয়ে অর্ডার দিন", "Order with a photo"),
      steps: [
        tx("পুরনো পার্ট বা তার গায়ের নম্বরের ছবি তুলুন", "Photograph the old part or its number"),
        tx("গাড়ির নাম দিন", "Add your car"),
        tx(`আমরা ${settings.quote_reply_hours} ঘণ্টার মধ্যে দাম জানাবো`, `We'll quote within ${replyHours} hours`),
      ],
      href: "/request?mode=photo",
      cta: tx("ছবি দিন", "Send a photo"),
    },
    {
      Icon: Phone,
      color: "bg-q-oem text-white",
      title: tx("কল করে অর্ডার দিন", "Order by phone"),
      steps: [
        tx(`হটলাইনে কল করুন: ${hotline}`, `Call our hotline: ${hotline}`),
        tx("গাড়ি ও পার্টের কথা বলুন", "Tell us the car and the part"),
        tx(`সময়: ${hours}`, `Hours: ${hours}`),
      ],
      href: telLink(),
      cta: tx("কল করুন", "Call now"),
    },
  ];

  return (
    <Container className="space-y-8">
      <div>
        <PageHeader title={tx("সাহায্য", "Help")} subtitle={tx("কীভাবে অর্ডার দেবেন, নিয়ম ও প্রশ্নের উত্তর", "How to order, our rules and answers")} />
        <AudioGuide
          text={tx(
            "এই পেজে দেখবেন কীভাবে বলে, ছবি দিয়ে বা কল করে পার্ট অর্ডার দেবেন। নিচে প্রশ্নে চাপ দিলে উত্তর খুলবে। যেকোনো সমস্যায় কল বা WhatsApp করুন।",
            "This page shows how to order by voice, photo or phone. Tap a question below to open its answer. Call or WhatsApp us any time you're stuck.",
          )}
        />
      </div>

      <section>
        <SectionTitle>{tx("কীভাবে অর্ডার দেবেন", "How to order")}</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          {ways.map((w) => (
            <Card key={w.title} className="flex flex-col p-4">
              <span className={`mb-3 grid size-12 place-items-center rounded-full ${w.color}`}>
                <w.Icon className="size-6" aria-hidden />
              </span>
              <h3 className="mb-2 text-lg font-bold">{w.title}</h3>
              <ol className="mb-4 flex-1 list-decimal space-y-1 pl-5 text-ink-2">
                {w.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              {w.href.startsWith("tel:") ? (
                <a href={w.href} className={buttonClass("outline", "md", true)}>
                  {w.cta}
                </a>
              ) : (
                <ButtonLink href={w.href} variant="outline" full>
                  {w.cta}
                </ButtonLink>
              )}
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>{tx("ভিডিও ও অডিও গাইড", "Video & audio guides")}</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              title: tx("প্রথম অর্ডার: শুরু থেকে শেষ", "Your first order, start to finish"),
              audio: tx(
                "প্রথমে আপনার গাড়ি যোগ করুন। তারপর পার্ট খুঁজুন বা বলুন। কার্টে দিয়ে ঠিকানা দিন, পেমেন্ট বেছে নিন।",
                "First add your car. Then search or speak the part. Add it to the cart, enter your address and choose how to pay.",
              ),
            },
            {
              title: tx("মানের লেবেল বুঝুন", "Understanding quality labels"),
              audio: tx(
                "সবুজ মানে জেনুইন, নীল মানে সমমানের, কমলা মানে আফটারমার্কেট, ধূসর মানে রিকন্ডিশন।",
                "Green is genuine, blue is OEM-equivalent, orange is aftermarket, grey is reconditioned.",
              ),
            },
          ].map((g) => (
            <Card key={g.title} className="overflow-hidden">
              <div className="grid aspect-video place-items-center bg-ink/90 text-white">
                <div className="text-center">
                  <PlayCircle className="mx-auto size-12 opacity-80" aria-hidden />
                  <p className="mt-1 text-sm opacity-80">{tx("ভিডিও শিগগিরই আসছে", "Video coming soon")}</p>
                </div>
              </div>
              <div className="p-4">
                <h3 className="mb-2 font-bold">{g.title}</h3>
                <AudioGuide text={g.audio} label={tx("অডিওতে শুনুন", "Listen")} />
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>{tx("প্রশ্ন ও উত্তর", "Questions & answers")}</SectionTitle>
        <Card className="overflow-hidden">
          <Faq q={tx("জেনুইন, সমমানের, আফটারমার্কেট, রিকন্ডিশন মানে কী?", "What do genuine, OEM-equivalent, aftermarket and reconditioned mean?")}>
            <ul className="space-y-2">
              {(Object.keys(qualityLabel) as Quality[]).map((q) => (
                <li key={q}>
                  <b className="text-ink">{qualityLabel[q][lang]}:</b> {lang === "bn" ? qualityLabel[q].desc_bn : qualityLabel[q].desc_en}
                </li>
              ))}
            </ul>
          </Faq>
          <Faq q={tx("কোন পার্টে ওয়ারেন্টি আছে?", "Which parts have a warranty?")}>
            <p>
              {tx(
                "শুধু যেসব জেনুইন পার্টের পেজে ওয়ারেন্টির মেয়াদ লেখা আছে। আফটারমার্কেট ও রিকন্ডিশন পার্টে ওয়ারেন্টি নেই। ভুল ইনস্টলেশন বা দুর্ঘটনা কাভার হয় না, সিল/স্টিকার অক্ষত থাকতে হবে।",
                "Only genuine parts that show a warranty period on their page. Aftermarket and reconditioned parts have no warranty. Bad installation and accidents aren't covered; seals/stickers must be intact.",
              )}
            </p>
            <Link href="/policy/warranty" className="font-semibold underline">
              {tx("ওয়ারেন্টি পলিসি পড়ুন", "Read the warranty policy")}
            </Link>
          </Faq>
          <Faq q={tx("পার্ট ফেরত দেওয়া যাবে?", "Can I return a part?")}>
            <p>
              {tx(
                `ভুল পার্ট আমাদের ভুলে গেলে ফ্রি বদলে দেবো বা পুরো টাকা ফেরত। ভাঙা অবস্থায় পৌঁছালে ${d(settings.damage_claim_hours)} ঘণ্টার মধ্যে ছবি/ভিডিওসহ জানান। মন বদলালে স্টকের পার্ট সাধারণত ${d(settings.return_window_days_default)} দিনের মধ্যে, না লাগানো অবস্থায় ফেরত নেওয়া যায়। ইলেকট্রিক্যাল পার্ট লাগানোর পর ফেরত হয় না।`,
                `If we sent the wrong part: free replacement or full refund. If it arrives broken, tell us within ${settings.damage_claim_hours} hours with photos/video. Change of mind: stock parts can usually be returned within ${settings.return_window_days_default} days, unfitted. Electrical parts can't be returned once fitted.`,
              )}
            </p>
            <Link href="/policy/return" className="font-semibold underline">
              {tx("রিটার্ন পলিসি পড়ুন", "Read the return policy")}
            </Link>
          </Faq>
          <Faq q={tx("ডেলিভারিতে কত দিন ও কত টাকা লাগে?", "How long does delivery take and what does it cost?")}>
            <p>
              {tx(
                `ঢাকা সিটিতে ${range(...deliveryDays.home_dhaka)} দিন, চার্জ ${taka(minRate("dhaka"))} থেকে। ঢাকার বাইরে ${range(...deliveryDays.home_outside)} দিন, চার্জ ${taka(minRate("outside"))} থেকে। বড়/ভারী পার্ট কুরিয়ার শাখা থেকে নিতে হয় (${range(...deliveryDays.branch_pickup)} দিন)। আনিয়ে দেওয়া পার্টে সংগ্রহের সময় যোগ হবে।`,
                `Dhaka city: ${range(...deliveryDays.home_dhaka)} days, from ${taka(minRate("dhaka"))}. Outside Dhaka: ${range(...deliveryDays.home_outside)} days, from ${taka(minRate("outside"))}. Large/heavy parts are collected from the courier branch (${range(...deliveryDays.branch_pickup)} days). Sourced parts add sourcing time.`,
              )}
            </p>
            <Link href="/policy/delivery" className="font-semibold underline">
              {tx("ডেলিভারি পলিসি ও চার্জের তালিকা", "Delivery policy and rates")}
            </Link>
          </Faq>
          <Faq q={tx("কীভাবে টাকা দেবো?", "How do I pay?")}>
            <p>
              {tx(
                `স্টকের পার্টে মোট ${taka(settings.cod_limit)} পর্যন্ত ক্যাশ অন ডেলিভারি। এর বেশি হলে শুধু ডেলিভারি চার্জ আগে bKash/Nagad-এ দিন, বাকিটা হাতে পেয়ে। আনিয়ে দেওয়া পার্টে কিছু টাকা অগ্রিম লাগে (কোটেশনে লেখা থাকবে); আনতে না পারলে পুরো অগ্রিম ফেরত।`,
                `Stock parts: cash on delivery up to ${taka(settings.cod_limit)} total. Above that, pay just the delivery charge upfront by bKash/Nagad and the rest on delivery. Sourced parts need a part advance (shown on the quote); if we can't get the part, the full advance is refunded.`,
              )}
            </p>
          </Faq>
          <Faq q={tx("দাম জানতে কতক্ষণ লাগে?", "How soon will I get a price?")}>
            <p>
              {tx(
                `অফিস সময়ে সাধারণত ${settings.quote_reply_hours} ঘণ্টার মধ্যে। দামের মেয়াদ ${d(settings.quote_validity_hours)} ঘণ্টা; মেয়াদ শেষ হলে আবার দাম চাইতে পারবেন।`,
                `Usually within ${replyHours} hours during office hours. A quote is valid for ${settings.quote_validity_hours} hours; after that you can ask for a new price.`,
              )}
            </p>
          </Faq>
          <Faq q={tx("অফিস কখন খোলা?", "When are you open?")}>
            <p className="flex items-center gap-2">
              <Clock className="size-4" aria-hidden /> {hours}
            </p>
            <p>
              {tx(
                "অফিস সময়ের বাইরে চ্যাটে বা ভয়েস নোটে জানিয়ে রাখুন, সকালে উত্তর দেবো।",
                "Outside office hours, leave a chat message or voice note and we'll reply in the morning.",
              )}
            </p>
          </Faq>
        </Card>
      </section>

      <section>
        <Card className="space-y-3 p-4">
          <h2 className="text-lg font-bold">{tx("এখনো প্রশ্ন আছে?", "Still have questions?")}</h2>
          <p className="text-sm text-muted">
            {tx("হটলাইন", "Hotline")}: <b className="text-ink">{hotline}</b> · {hours}
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <a href={telLink()} className={buttonClass("primary", "lg", true)}>
              <Phone className="size-5" aria-hidden /> {tx("কল করুন", "Call")}
            </a>
            <a
              href={waLink(tx("আসসালামু আলাইকুম, আমার একটা প্রশ্ন আছে।", "Hello, I have a question."))}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] px-5 text-lg font-semibold text-white hover:brightness-95"
            >
              <MessageCircle className="size-5" aria-hidden /> WhatsApp
            </a>
            <ButtonLink href="/chat" variant="outline" size="lg" full>
              {tx("চ্যাট করুন", "Chat")}
            </ButtonLink>
          </div>
        </Card>
      </section>
    </Container>
  );
}
