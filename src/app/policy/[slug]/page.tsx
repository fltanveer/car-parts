import { FileText, Lock, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { businessHoursLabel } from "@/components/account/hours";
import { Card, Container, Notice, PageHeader, SectionTitle, buttonClass } from "@/components/ui/primitives";
import { toEnDigits } from "@/lib/format";
import { qualityLabel } from "@/lib/i18n";
import { telLink, waLink } from "@/lib/links";
import { deliveryDays, deliveryRates, fragilePackingCharge, settings } from "@/lib/mock/settings";
import { getT } from "@/lib/server-lang";
import type { SizeClass } from "@/lib/types";

const SLUGS = ["return", "warranty", "delivery", "privacy"] as const;
type Slug = (typeof SLUGS)[number];

const TITLES: Record<Slug, { bn: string; en: string }> = {
  return: { bn: "রিটার্ন ও রিপ্লেসমেন্ট পলিসি", en: "Return & replacement policy" },
  warranty: { bn: "ওয়ারেন্টি পলিসি", en: "Warranty policy" },
  delivery: { bn: "ডেলিভারি পলিসি", en: "Delivery policy" },
  privacy: { bn: "প্রাইভেসি পলিসি", en: "Privacy policy" },
};

const isSlug = (s: string): s is Slug => (SLUGS as readonly string[]).includes(s);

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/policy/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: isSlug(slug) ? TITLES[slug].bn : undefined };
}

type T = Awaited<ReturnType<typeof getT>>;

// One rule as a stacked card (a 3-column table doesn't fit 360px).
function RuleCard({ title, rule, cost, tone }: { title: string; rule: ReactNode; cost?: string; tone?: "ok" | "warn" | "muted" }) {
  const toneCls = tone === "ok" ? "bg-q-genuine-soft text-q-genuine" : tone === "warn" ? "bg-accent-soft text-accent-ink" : "bg-surface text-ink-2";
  return (
    <Card className="p-4">
      <h3 className="font-bold">{title}</h3>
      <div className="mt-1 text-ink-2">{rule}</div>
      {cost && <p className={`mt-2 inline-block rounded-lg px-2.5 py-1 text-sm font-semibold ${toneCls}`}>{cost}</p>}
    </Card>
  );
}

function ReturnPolicy({ tx, d }: T) {
  const days = d(settings.return_window_days_default);
  const hours = d(settings.damage_claim_hours);
  return (
    <div className="space-y-3">
      <RuleCard
        title={tx("আমাদের ভুলে ভুল পার্ট", "Wrong part, our mistake")}
        rule={tx("ফ্রি রিপ্লেসমেন্ট বা পুরো টাকা ফেরত।", "Free replacement or full refund.")}
        cost={tx("খরচ: PartsBD (আসা-যাওয়া দুই দিক)", "Cost: PartsBD (both ways)")}
        tone="ok"
      />
      <RuleCard
        title={tx("আপনার ভুল তথ্য, স্টকের পার্ট", "Your wrong info, stock part")}
        rule={tx(
          `ডেলিভারির ${days} দিনের মধ্যে, না লাগানো অবস্থায় ও প্যাকেট অক্ষত থাকলে ফেরত নেওয়া হবে।`,
          `Returnable within ${days} days of delivery if unfitted and the packaging is intact.`,
        )}
        cost={tx("খরচ: আপনার (আসা-যাওয়া দুই দিক)", "Cost: you (both ways)")}
        tone="warn"
      />
      <RuleCard
        title={tx("আপনার ভুল তথ্য, আনিয়ে দেওয়া পার্ট", "Your wrong info, sourced part")}
        rule={tx(
          "সাধারণত ফেরত নেওয়া হয় না। বিশেষ ক্ষেত্রে ১০ থেকে ১৫% কেটে ফেরত নেওয়া হতে পারে, আমাদের সাথে কথা বলুন।",
          "Usually not returnable. In some cases we may accept it with a 10–15% deduction; talk to us.",
        )}
        cost={tx("খরচ: আপনার", "Cost: you")}
        tone="warn"
      />
      <RuleCard
        title={tx("ইলেকট্রিক্যাল পার্ট লাগানোর পর", "Electrical parts after fitting")}
        rule={tx("সেন্সর, রিলে, ECU, বাল্ব, সুইচ একবার লাগানো হলে ফেরত হয় না।", "Sensors, relays, ECUs, bulbs and switches can't be returned once fitted.")}
        tone="muted"
      />
      <RuleCard
        title={tx("ভাঙা/ত্রুটিপূর্ণ অবস্থায় পৌঁছালে", "Arrived broken or faulty")}
        rule={tx(
          `ডেলিভারির সময় খুলে দেখে নিন। নয়তো ${hours} ঘণ্টার মধ্যে ছবি/ভিডিওসহ দাবি করুন।`,
          `Open and check at delivery, or claim within ${hours} hours with photos/video.`,
        )}
        cost={tx("খরচ: PartsBD", "Cost: PartsBD")}
        tone="ok"
      />
      <RuleCard
        title={tx("ওয়ারেন্টি দাবি", "Warranty claims")}
        rule={
          <>
            {tx("শুধু ওয়ারেন্টি থাকা জেনুইন পার্টে। ", "Only for genuine parts that carry a warranty. ")}
            <Link href="/policy/warranty" className="font-semibold underline">
              {tx("বিস্তারিত", "Details")}
            </Link>
          </>
        }
        cost={tx("পাঠানো: আপনার · ফেরত পাঠানো: PartsBD", "Sending in: you · Sending back: PartsBD")}
      />
      <RuleCard
        title={tx("আফটারমার্কেট / রিকন্ডিশন", "Aftermarket / reconditioned")}
        rule={tx(
          "কোনো ওয়ারেন্টি নেই। শুধু উপরের \"ভুল পার্ট\" ও \"ভাঙা অবস্থায় পৌঁছানো\" নিয়ম প্রযোজ্য।",
          "No warranty. Only the \"wrong part\" and \"arrived broken\" rules above apply.",
        )}
        tone="muted"
      />
      <Notice>
        {tx(
          "প্রতিটা পার্টের পেজে সেই পার্ট ফেরত দেওয়া যাবে কি না ও কত দিনের মধ্যে, তা আলাদা করে লেখা থাকে। সেটাই চূড়ান্ত।",
          "Each part's page shows whether it is returnable and within how many days. That is final.",
        )}
      </Notice>
      <p className="text-ink-2">
        {tx("দাবি করতে: ", "To claim: ")}
        <Link href="/orders" className="font-semibold underline">
          {tx("আমার অর্ডার", "My orders")}
        </Link>
        {tx(" থেকে অর্ডার খুলে \"সমস্যা জানান\" চাপুন।", ", open the order and tap \"Report a problem\".")}
      </p>
    </div>
  );
}

function WarrantyPolicy({ tx, d, lang }: T) {
  return (
    <div className="space-y-3">
      <Card className="space-y-2 p-4">
        <h3 className="font-bold">{tx("কোন পার্টে ওয়ারেন্টি আছে", "Which parts have a warranty")}</h3>
        <ul className="space-y-1.5 text-ink-2">
          <li>
            <b className="text-q-genuine">{qualityLabel.genuine[lang]}:</b>{" "}
            {tx("পার্টের পেজে যে মেয়াদ লেখা আছে (মাসে)। সব জেনুইন পার্টে ওয়ারেন্টি থাকে না।", "The period shown on the part page (in months). Not every genuine part has one.")}
          </li>
          <li>
            <b className="text-q-oem">{qualityLabel.oem_equivalent[lang]}:</b>{" "}
            {tx("পার্টের পেজে লেখা থাকলে তবেই।", "Only if shown on the part page.")}
          </li>
          <li>
            <b className="text-q-after">{qualityLabel.aftermarket[lang]}</b> / <b className="text-q-recon">{qualityLabel.reconditioned[lang]}</b>:{" "}
            {tx("ওয়ারেন্টি নেই।", "No warranty.")}
          </li>
        </ul>
      </Card>
      <RuleCard
        title={tx("শর্ত", "Conditions")}
        rule={
          <ul className="list-disc space-y-1 pl-5">
            <li>{tx("মেয়াদ গণনা শুরু ডেলিভারির দিন থেকে।", "The period starts on the delivery date.")}</li>
            <li>{tx("সিল/স্টিকার অক্ষত থাকতে হবে।", "Seals/stickers must be intact.")}</li>
            <li>{tx("ভুল ইনস্টলেশন বা দুর্ঘটনায় নষ্ট হলে কাভার হবে না।", "Damage from bad installation or accidents isn't covered.")}</li>
          </ul>
        }
      />
      <RuleCard
        title={tx("খরচ", "Costs")}
        rule={tx("পার্ট আমাদের কাছে পাঠানোর খরচ আপনার। ঠিক করা বা বদলানো পার্ট ফেরত পাঠানোর খরচ আমাদের।", "You pay to send the part to us. We pay to send the repaired or replaced part back.")}
      />
      <RuleCard
        title={tx("কীভাবে দাবি করবেন", "How to claim")}
        rule={
          <>
            <Link href="/orders" className="font-semibold underline">
              {tx("আমার অর্ডার", "My orders")}
            </Link>
            {tx(
              ` থেকে পার্ট বেছে "ওয়ারেন্টির মধ্যে নষ্ট হয়েছে" চাপুন, ছবি ও ভয়েস নোট দিন। ভাঙা অবস্থায় পৌঁছালে ওয়ারেন্টি নয়, ${d(settings.damage_claim_hours)} ঘণ্টার মধ্যে "ভাঙা অবস্থায় এসেছে" দাবি করুন।`,
              `, pick the part and choose "Failed under warranty", add photos and a voice note. If it arrived broken, that's not warranty: use "Arrived broken" within ${settings.damage_claim_hours} hours.`,
            )}
          </>
        }
      />
    </div>
  );
}

const SIZE: Record<SizeClass, { bn: string; en: string; ex_bn: string; ex_en: string }> = {
  small: { bn: "ছোট", en: "Small", ex_bn: "ফিল্টার, প্লাগ, সেন্সর", ex_en: "filters, plugs, sensors" },
  medium: { bn: "মাঝারি", en: "Medium", ex_bn: "শক অ্যাবজর্বার, হেডলাইট", ex_en: "shocks, headlights" },
  large_heavy: { bn: "বড়/ভারী", en: "Large/heavy", ex_bn: "বাম্পার, দরজা, ইঞ্জিন পার্ট", ex_en: "bumpers, doors, engine parts" },
};

function DeliveryPolicy({ tx, taka, range, d }: T) {
  const rate = (zone: "dhaka" | "outside", size: SizeClass) => deliveryRates.find((r) => r.zone === zone && r.size_class === size);
  const pickupOutside = rate("outside", "large_heavy")?.method === "branch_pickup";
  return (
    <div className="space-y-3">
      <RuleCard
        title={tx("ঢাকা সিটি", "Dhaka city")}
        rule={tx("কুরিয়ার বা নিজস্ব রাইডার, বাসায় ডেলিভারি।", "Courier or our own rider, to your door.")}
        cost={tx(`স্টকের পার্ট: ${range(...deliveryDays.home_dhaka)} দিন`, `Stock parts: ${range(...deliveryDays.home_dhaka)} days`)}
      />
      <RuleCard
        title={tx("ঢাকার বাইরে, ছোট/মাঝারি পার্ট", "Outside Dhaka, small/medium parts")}
        rule={tx("কুরিয়ার, বাসায় ডেলিভারি।", "Courier, to your door.")}
        cost={tx(`স্টকের পার্ট: ${range(...deliveryDays.home_outside)} দিন`, `Stock parts: ${range(...deliveryDays.home_outside)} days`)}
      />
      <RuleCard
        title={tx("বড়/ভারী পার্ট (ঢাকার বাইরে)", "Large/heavy parts (outside Dhaka)")}
        rule={tx(
          `কুরিয়ারের শাখা থেকে সংগ্রহ করতে হবে। এক্ষেত্রে ${d(settings.heavy_advance_percent)}% বা পুরো টাকা অগ্রিম।`,
          `Collected from the courier branch. Needs ${settings.heavy_advance_percent}% or full payment in advance.`,
        )}
        cost={tx(`স্টকের পার্ট: ${range(...deliveryDays.branch_pickup)} দিন`, `Stock parts: ${range(...deliveryDays.branch_pickup)} days`)}
      />

      <section className="pt-3">
        <SectionTitle>{tx("ডেলিভারি চার্জ", "Delivery charges")}</SectionTitle>
        <Card className="overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-surface text-sm text-muted">
              <tr>
                <th className="px-3 py-2 font-semibold">{tx("পার্টের সাইজ", "Part size")}</th>
                <th className="px-3 py-2 text-right font-semibold">{tx("ঢাকা সিটি", "Dhaka")}</th>
                <th className="px-3 py-2 text-right font-semibold">{tx("ঢাকার বাইরে", "Outside")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(Object.keys(SIZE) as SizeClass[]).map((s) => {
                const dh = rate("dhaka", s);
                const out = rate("outside", s);
                return (
                  <tr key={s}>
                    <td className="px-3 py-2.5">
                      <span className="block font-semibold">{tx(SIZE[s].bn, SIZE[s].en)}</span>
                      <span className="block text-xs text-muted">{tx(SIZE[s].ex_bn, SIZE[s].ex_en)}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{dh ? taka(dh.charge) : "—"}</td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                      {out ? taka(out.charge) : "—"}
                      {s === "large_heavy" && pickupOutside && <span className="block text-xs font-normal text-muted">{tx("শাখা থেকে", "branch pickup")}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-ink-2">
          <li>{tx("একাধিক পার্ট হলে সবচেয়ে বড় পার্টের সাইজ ধরে চার্জ হবে।", "With several parts, the largest part's size sets the charge.")}</li>
          <li>{tx(`ভঙ্গুর পার্টে (কাচ, লাইট ইত্যাদি) বাড়তি প্যাকিং চার্জ ${taka(fragilePackingCharge)}।`, `Fragile parts (glass, lights etc.) add ${taka(fragilePackingCharge)} for extra packing.`)}</li>
          <li>{tx("আনিয়ে দেওয়া পার্টে সময় = সংগ্রহের সময় (কোটেশনে লেখা) + ডেলিভারির সময়।", "Sourced parts: time = sourcing time (on the quote) + delivery time.")}</li>
          <li>
            {tx(
              `স্টকের পার্টে মোট ${taka(settings.cod_limit)} পর্যন্ত ক্যাশ অন ডেলিভারি; এর বেশি হলে ডেলিভারি চার্জ অগ্রিম দিতে হবে।`,
              `Stock parts: cash on delivery up to ${taka(settings.cod_limit)}; above that, the delivery charge is paid in advance.`,
            )}
          </li>
        </ul>
      </section>
      <Notice tone="warn">
        {tx(
          "ডেলিভারির সময় রাইডারের সামনে প্যাকেট খুলে দেখে নিন। ভাঙা থাকলে তখনই জানান।",
          "Open the package in front of the rider at delivery. If anything is broken, tell us right away.",
        )}
      </Notice>
    </div>
  );
}

function PrivacyPolicy({ tx, d }: T) {
  const retention = d(settings.voice_retention_days);
  return (
    <div className="space-y-3">
      <Card className="space-y-2 border-accent/40 bg-accent-soft/40 p-4">
        <h3 className="flex items-center gap-2 font-bold">
          <Lock className="size-5" aria-hidden /> {tx("আপনার ভয়েস রেকর্ড", "Your voice recordings")}
        </h3>
        <p className="text-ink-2">
          {tx(
            "আপনার ভয়েস রেকর্ড সঠিক পার্ট খুঁজতে ও বিরোধ মেটাতে সংরক্ষণ করা হয়।",
            "Your voice recordings are kept to find the right part and to settle disputes.",
          )}
        </p>
        <ul className="list-disc space-y-1.5 pl-5 text-ink-2">
          <li>{tx("রেকর্ডগুলো প্রাইভেট স্টোরেজে রাখা হয়, পাবলিক লিংক নেই।", "Recordings are kept in private storage with no public link.")}</li>
          <li>{tx("শুধু আপনি ও আমাদের টিম শুনতে পারে। চালানোর লিংক ১ ঘণ্টা পর নিজে থেকেই অকেজো হয়ে যায়।", "Only you and our team can listen. Playback links expire by themselves after 1 hour.")}</li>
          <li>
            {tx(
              `সংশ্লিষ্ট অর্ডার, রিকোয়েস্ট বা দাবি বন্ধ হওয়ার ${retention} দিন পর ফাইল স্বয়ংক্রিয়ভাবে মুছে যায়। আমাদের টিমের লেখা নোট থেকে যায়।`,
              `Files are deleted automatically ${retention} days after the related order, request or claim is closed. Notes written by our team are kept.`,
            )}
          </li>
          <li>{tx("ভয়েস লেখায় রূপান্তর (ট্রান্সক্রিপশন) শুধু আমাদের কাজের সুবিধার জন্য; না হলেও আপনার রিকোয়েস্ট থামবে না।", "Speech-to-text is only a convenience for our team; your request goes ahead even if it fails.")}</li>
        </ul>
      </Card>
      <RuleCard
        title={tx("যে তথ্য আমরা রাখি", "What we keep")}
        rule={
          <ul className="list-disc space-y-1 pl-5">
            <li>{tx("মোবাইল নম্বর ও নাম (লগইন ও যোগাযোগের জন্য)", "Mobile number and name (for login and contact)")}</li>
            <li>{tx("ডেলিভারির ঠিকানা", "Delivery addresses")}</li>
            <li>{tx("আপনার গাড়ির তথ্য (সঠিক পার্ট মেলাতে)", "Your car details (to match the right part)")}</li>
            <li>{tx("রিকোয়েস্ট, অর্ডার, দাবি ও চ্যাটের ছবি, ভয়েস ও লেখা", "Photos, voice notes and text from requests, orders, claims and chat")}</li>
          </ul>
        }
      />
      <RuleCard
        title={tx("যা আমরা করি না", "What we don't do")}
        rule={
          <ul className="list-disc space-y-1 pl-5">
            <li>{tx("আপনার তথ্য বিক্রি করি না।", "We never sell your data.")}</li>
            <li>{tx("কুরিয়ারকে শুধু ডেলিভারির জন্য দরকারি নাম, নম্বর ও ঠিকানা দেওয়া হয়।", "Couriers get only the name, number and address needed for delivery.")}</li>
            <li>{tx("ছবি ও ভয়েস ফাইল পাবলিক নয়।", "Photos and voice files are never public.")}</li>
          </ul>
        }
      />
      <RuleCard
        title={tx("WhatsApp ও কল", "WhatsApp and calls")}
        rule={tx(
          "WhatsApp কথোপকথন এই সাইটে রেকর্ড হয় না। কল বা WhatsApp-এ কী ঠিক হলো, তা আমাদের টিম ছোট নোট হিসেবে লিখে রাখে।",
          "WhatsApp conversations aren't recorded on this site. Our team writes a short note of what was agreed on a call or WhatsApp.",
        )}
      />
      <RuleCard
        title={tx("তথ্য মুছতে চাইলে", "To delete your data")}
        rule={tx("হটলাইনে কল করুন বা চ্যাটে জানান। চলমান অর্ডার শেষ হলে আপনার তথ্য মুছে দেওয়া হবে।", "Call our hotline or tell us in chat. Your data is deleted once any open orders are finished.")}
      />
    </div>
  );
}

export default async function PolicyPage({ params }: PageProps<"/policy/[slug]">) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  const t = await getT();
  const { tx, lang } = t;
  const hotline = tx(settings.hotline_display, toEnDigits(settings.hotline_display));

  return (
    <Container className="space-y-6">
      <PageHeader title={tx(TITLES[slug].bn, TITLES[slug].en)} />

      {slug === "return" && <ReturnPolicy {...t} />}
      {slug === "warranty" && <WarrantyPolicy {...t} />}
      {slug === "delivery" && <DeliveryPolicy {...t} />}
      {slug === "privacy" && <PrivacyPolicy {...t} />}

      <Card className="space-y-3 p-4">
        <p className="font-semibold">{tx("প্রশ্ন থাকলে জানান", "Questions? Ask us")}</p>
        <p className="text-sm text-muted">
          {hotline} · {businessHoursLabel(lang)}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <a href={telLink()} className={buttonClass("primary", "md", true)}>
            <Phone className="size-4" aria-hidden /> {tx("কল", "Call")}
          </a>
          <a
            href={waLink(tx(`${TITLES[slug].bn} নিয়ে প্রশ্ন আছে।`, `I have a question about the ${TITLES[slug].en.toLowerCase()}.`))}
            target="_blank"
            rel="noopener"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 font-semibold text-white"
          >
            <MessageCircle className="size-4" aria-hidden /> WhatsApp
          </a>
        </div>
      </Card>

      <nav aria-label={tx("অন্যান্য পলিসি", "Other policies")} className="flex flex-wrap gap-2">
        {SLUGS.filter((s) => s !== slug).map((s) => (
          <Link key={s} href={`/policy/${s}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-card px-3.5 text-sm font-medium">
            <FileText className="size-4" aria-hidden /> {tx(TITLES[s].bn, TITLES[s].en)}
          </Link>
        ))}
        <Link href="/help" className="inline-flex min-h-10 items-center rounded-full border border-line bg-card px-3.5 text-sm font-medium">
          {tx("সাহায্য", "Help")}
        </Link>
      </nav>
    </Container>
  );
}
