import { BadgeCheck, CircleDashed, MessageCircle, Phone, Recycle, RefreshCcw, ShieldCheck, ShieldHalf, Truck, Wallet } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ButtonLink, Card, Container, SectionTitle } from "@/components/ui/primitives";
import { settings } from "@/lib/api";
import { qualityLabel } from "@/lib/i18n";
import { telLink, waLink } from "@/lib/links";
import { getDeliveryQuote } from "@/lib/rules";
import { getT } from "@/lib/server-lang";
import type { Quality } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const { tx } = await getT();
  return {
    title: tx("আমাদের সম্পর্কে ও মানের লেবেল", "About us & quality labels"),
    description: tx(
      "জেনুইন, সমমানের, আফটারমার্কেট, রিকন্ডিশন: প্রতিটা লেবেলের মানে, রিটার্ন, ওয়ারেন্টি ও ডেলিভারির নিয়ম।",
      "Genuine, OEM-equivalent, aftermarket, reconditioned: what each label means, plus returns, warranty and delivery rules.",
    ),
  };
}

const QUALITY_STYLE: Record<Quality, { box: string; Icon: typeof BadgeCheck; warranty: boolean }> = {
  genuine: { box: "border-q-genuine/30 bg-q-genuine-soft text-q-genuine", Icon: BadgeCheck, warranty: true },
  oem_equivalent: { box: "border-q-oem/30 bg-q-oem-soft text-q-oem", Icon: ShieldHalf, warranty: false },
  aftermarket: { box: "border-q-after/30 bg-q-after-soft text-q-after", Icon: CircleDashed, warranty: false },
  reconditioned: { box: "border-q-recon/30 bg-q-recon-soft text-q-recon", Icon: Recycle, warranty: false },
};

function Rule({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Card className="flex gap-3 p-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface text-ink-2">{icon}</span>
      <div className="min-w-0">
        <h3 className="font-bold">{title}</h3>
        <div className="mt-1 space-y-1 text-sm text-ink-2">{children}</div>
      </div>
    </Card>
  );
}

export default async function AboutPage() {
  const { lang, tx, d, range, taka } = await getT();
  const qualities = Object.keys(qualityLabel) as Quality[];
  const days = (district: string, size: "small" | "large_heavy") => getDeliveryQuote(district, [{ size_class: size, is_fragile: false }]).days;
  const dDhaka = days("ঢাকা সিটি", "small");
  const dOutside = days("", "small");
  const dHeavy = days("", "large_heavy");

  return (
    <Container className="space-y-10">
      <header>
        <h1 className="text-2xl font-bold">{tx("আমরা কারা", "Who we are")}</h1>
        <p className="mt-2 text-ink-2">
          {tx(
            "PartsBD গাড়ির পার্টস বিক্রি করে ন্যায্য দামে, আর প্রতিটা পার্টের মান স্পষ্ট লিখে দেয়। জেনুইন বলে আফটারমার্কেট চালানো হয় না। যে পার্ট স্টকে নেই, সেটা আমরা খুঁজে এনে দিই, আগে দাম জানিয়ে।",
            "PartsBD sells car parts at fair prices and clearly labels the quality of every part. We never pass off aftermarket as genuine. If a part isn't in stock, we source it for you and tell you the price first.",
          )}
        </p>
      </header>

      <section id="quality" aria-labelledby="quality-title" className="scroll-mt-20">
        <SectionTitle>
          <span id="quality-title">{tx("মানের লেবেল কী মানে", "What the quality labels mean")}</span>
        </SectionTitle>
        <p className="mb-4 text-sm text-muted">
          {tx("রঙের অর্থ সব জায়গায় একই: সবুজ = জেনুইন, নীল = সমমানের, কমলা = আফটারমার্কেট, ধূসর = রিকন্ডিশন।", "Colours mean the same everywhere: green = genuine, blue = OEM-equivalent, orange = aftermarket, grey = reconditioned.")}
        </p>
        <ul className="space-y-3">
          {qualities.map((q) => {
            const s = QUALITY_STYLE[q];
            return (
              <li key={q} className={`rounded-2xl border p-4 ${s.box}`}>
                <div className="flex items-center gap-2">
                  <s.Icon className="size-6" aria-hidden />
                  <h3 className="text-lg font-bold">{qualityLabel[q][lang]}</h3>
                  {lang === "bn" && <span className="text-sm opacity-80">({qualityLabel[q].en})</span>}
                </div>
                <p className="mt-1.5 text-ink">{lang === "bn" ? qualityLabel[q].desc_bn : qualityLabel[q].desc_en}</p>
                <p className="mt-2 text-sm font-semibold">
                  {s.warranty
                    ? tx("ওয়ারেন্টি: কিছু পার্টে আছে, পার্টের পাতায় লেখা থাকে", "Warranty: on some parts, shown on the part page")
                    : tx("ওয়ারেন্টি: নেই", "Warranty: none")}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="rules-title" className="space-y-3">
        <SectionTitle className="mb-0">
          <span id="rules-title">{tx("আমাদের নিয়ম, সহজ ভাষায়", "Our rules, in plain words")}</span>
        </SectionTitle>
        <Rule icon={<RefreshCcw className="size-5" />} title={tx("ভুল পার্ট দিলে ফ্রিতে বদলে দিই", "Wrong part? Free replacement")}>
          <p>{tx("আমাদের ভুলে ভুল পার্ট গেলে ফ্রি রিপ্লেসমেন্ট বা পুরো টাকা ফেরত। আসা-যাওয়ার খরচ আমাদের।", "If we sent the wrong part: free replacement or full refund. We pay shipping both ways.")}</p>
          <p>
            {tx(
              `ভাঙা অবস্থায় পৌঁছালে ডেলিভারির সময় খুলে দেখুন, নয়তো ${d(settings.damage_claim_hours)} ঘণ্টার মধ্যে ছবি/ভিডিওসহ জানান।`,
              `If it arrives damaged, check at delivery or report within ${settings.damage_claim_hours} hours with photos/video.`,
            )}
          </p>
        </Rule>
        <Rule icon={<RefreshCcw className="size-5" />} title={tx("মন বদলালে ফেরত", "Returns for change of mind")}>
          <p>
            {tx(
              `স্টকের পার্ট ${d(settings.return_window_days_default)} দিনের মধ্যে, না লাগানো ও প্যাকেট অক্ষত থাকলে ফেরত নেওয়া যায়। আসা-যাওয়ার খরচ আপনার।`,
              `Stock parts can be returned within ${settings.return_window_days_default} days if unfitted and in original packaging. You pay shipping.`,
            )}
          </p>
          <p>{tx("আনিয়ে দেওয়া পার্ট সাধারণত ফেরত হয় না।", "Sourced parts are usually not returnable.")}</p>
          <p>{tx("ইলেকট্রিক্যাল পার্ট (সেন্সর, রিলে, ECU, বাল্ব, সুইচ) লাগানোর পর ফেরত হয় না।", "Electrical parts (sensors, relays, ECU, bulbs, switches) can't be returned once fitted.")}</p>
        </Rule>
        <Rule icon={<ShieldCheck className="size-5" />} title={tx("ওয়ারেন্টি", "Warranty")}>
          <p>{tx("শুধু ওয়ারেন্টি থাকা জেনুইন পার্টে। মেয়াদের মধ্যে, সিল/স্টিকার অক্ষত থাকতে হবে। ভুল ইনস্টলেশন বা দুর্ঘটনা কাভার নয়।", "Only on genuine parts that carry warranty. Within the period, seals intact. Bad installation and accidents aren't covered.")}</p>
          <p>{tx("আফটারমার্কেট ও রিকন্ডিশন পার্টে ওয়ারেন্টি নেই।", "Aftermarket and reconditioned parts have no warranty.")}</p>
        </Rule>
        <Rule icon={<Truck className="size-5" />} title={tx("ডেলিভারি", "Delivery")}>
          <p>{tx(`ঢাকা সিটি: ${range(...dDhaka)} দিন`, `Dhaka city: ${range(...dDhaka)} days`)}</p>
          <p>{tx(`ঢাকার বাইরে: ${range(...dOutside)} দিন (হোম ডেলিভারি)`, `Outside Dhaka: ${range(...dOutside)} days (home delivery)`)}</p>
          <p>{tx(`বড়/ভারী পার্ট: কুরিয়ার শাখা থেকে সংগ্রহ, ${range(...dHeavy)} দিন`, `Large/heavy parts: collect from courier branch, ${range(...dHeavy)} days`)}</p>
        </Rule>
        <Rule icon={<Wallet className="size-5" />} title={tx("পেমেন্ট", "Payment")}>
          <p>{tx(`স্টকের পার্ট ${taka(settings.cod_limit)} পর্যন্ত ক্যাশ অন ডেলিভারি।`, `Cash on delivery for stock orders up to ${taka(settings.cod_limit)}.`)}</p>
          <p>{tx("আনিয়ে দেওয়া পার্টে কিছু অগ্রিম লাগে। আনতে না পারলে পুরো অগ্রিম ফেরত।", "Sourced parts need a part advance. If we can't source it, the full advance is refunded.")}</p>
        </Rule>
      </section>

      <section aria-labelledby="contact-title" className="rounded-2xl bg-ink p-5 text-white">
        <h2 id="contact-title" className="text-lg font-bold">
          {tx("প্রশ্ন আছে? কথা বলুন", "Questions? Talk to us")}
        </h2>
        <p className="mt-1 text-sm text-white/70">
          {tx(
            `সকাল ${d(settings.business_hours.open)}টা থেকে রাত ${d(settings.business_hours.close - 12)}টা`,
            `${settings.business_hours.open} am to ${settings.business_hours.close - 12} pm`,
          )}
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <a href={telLink()} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white text-lg font-semibold text-ink hover:bg-white/90">
            <Phone className="size-5" aria-hidden />
            {lang === "bn" ? settings.hotline_display : settings.hotline}
          </a>
          <a
            href={waLink(tx("আসসালামু আলাইকুম, একটা প্রশ্ন ছিল।", "Hello, I have a question."))}
            target="_blank"
            rel="noopener"
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#25D366] text-lg font-semibold text-white hover:brightness-95"
          >
            <MessageCircle className="size-5" aria-hidden />
            WhatsApp
          </a>
        </div>
      </section>

      <ButtonLink href="/search" variant="outline" size="lg" full>
        {tx("পার্ট খুঁজুন", "Search parts")}
      </ButtonLink>
    </Container>
  );
}
