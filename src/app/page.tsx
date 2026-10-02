import { Camera, ChevronRight, Mic, Phone, RefreshCcw, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { SearchBar } from "@/components/catalog/SearchBar";
import { AudioGuide } from "@/components/layout/AudioGuide";
import { qualityDot } from "@/components/part/QualityBadge";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Container, SectionTitle } from "@/components/ui/primitives";
import { VehicleChip } from "@/components/vehicle/VehicleChip";
import { getMakes, getPopularModels, getReviews, getTopCategories, settings } from "@/lib/api";
import { qualityLabel } from "@/lib/i18n";
import { telLink } from "@/lib/links";
import { getT } from "@/lib/server-lang";
import type { Quality } from "@/lib/types";

const QUALITIES: Quality[] = ["genuine", "oem_equivalent", "aftermarket", "reconditioned"];

function ActionCard({ href, icon, iconClass, title, subtitle, external }: { href: string; icon: ReactNode; iconClass: string; title: string; subtitle: string; external?: boolean }) {
  const cls = "flex min-h-20 items-center gap-4 rounded-2xl border border-line bg-card p-4 transition-colors hover:border-ink/30 active:scale-[0.99]";
  const body = (
    <>
      <span className={`grid size-14 shrink-0 place-items-center rounded-2xl text-white ${iconClass}`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-bold leading-snug">{title}</span>
        <span className="block text-sm text-muted">{subtitle}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
    </>
  );
  return external ? (
    <a href={href} className={cls}>
      {body}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {body}
    </Link>
  );
}

export default async function Home() {
  const { lang, t, tx, d } = await getT();
  const categories = getTopCategories();
  const makes = getMakes();
  const models = getPopularModels();
  const reviews = getReviews().slice(0, 5);

  return (
    <Container className="space-y-10">
      <section className="space-y-4">
        <VehicleChip />
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{tx("কোন পার্ট লাগবে?", "Which part do you need?")}</h1>
          <p className="mt-0.5 text-muted">{t("tagline")}</p>
        </div>
        <SearchBar />
        <AudioGuide
          text={tx(
            "উপরে আপনার গাড়ি বেছে নিন। তারপর পার্টের নাম লিখুন, অথবা লাল মাইক চেপে বলুন কী লাগবে। পুরনো পার্টের ছবিও দিতে পারেন। না পারলে কল করুন, আমরা সব করে দেবো।",
            "Pick your car at the top. Then type the part name, or tap the red mic and say what you need. You can also send a photo of the old part, or just call us.",
          )}
        />
      </section>

      <section aria-label={tx("সহজে অর্ডার দিন", "Easy ways to order")} className="space-y-3">
        <ActionCard
          href="/request?mode=voice"
          icon={<Mic className="size-7" aria-hidden />}
          iconClass="bg-danger"
          title={tx("বলে দিন কী লাগবে", "Say what you need")}
          subtitle={tx("ভয়েস রেকর্ড করুন, আমরা খুঁজে দাম জানাবো", "Record a voice note, we'll find it and quote you")}
        />
        <ActionCard
          href="/request?mode=photo"
          icon={<Camera className="size-7" aria-hidden />}
          iconClass="bg-ink"
          title={tx("পুরনো পার্টের ছবি দিন", "Send a photo of the old part")}
          subtitle={tx("ছবি দেখে আমরা ঠিক পার্ট চিনে নেবো", "We'll identify the right part from the photo")}
        />
        <ActionCard
          href={telLink()}
          external
          icon={<Phone className="size-7" aria-hidden />}
          iconClass="bg-q-oem"
          title={tx("কল করে অর্ডার দিন", "Call to order")}
          subtitle={`${lang === "bn" ? settings.hotline_display : settings.hotline} · ${tx(
            `সকাল ${d(settings.business_hours.open)}টা থেকে রাত ${d(settings.business_hours.close - 12)}টা`,
            `${settings.business_hours.open} am to ${settings.business_hours.close - 12} pm`,
          )}`}
        />
      </section>

      <section aria-labelledby="cat-title">
        <SectionTitle>
          <span id="cat-title">{t("categories")}</span>
        </SectionTitle>
        <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={`/category/${c.slug}`}
                className="flex h-full min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-card p-2 text-center transition-colors hover:border-ink/30"
              >
                <span className="grid size-12 place-items-center rounded-xl bg-accent-soft text-accent-ink">
                  <CategoryIcon icon={c.icon} className="size-6.5" />
                </span>
                <span className="text-sm font-semibold leading-tight">{lang === "bn" ? c.name_bn : c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="models-title">
        <SectionTitle>
          <span id="models-title">{t("popular_models")}</span>
        </SectionTitle>
        <ul className="flex flex-wrap gap-2">
          {models.map((m) => {
            const make = makes.find((x) => x.id === m.make_id);
            return (
              <li key={m.id}>
                <Link
                  href={`/search?q=${encodeURIComponent(m.name)}`}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-line bg-card py-1 pr-4 pl-1.5 transition-colors hover:border-ink/40"
                >
                  <span className="grid size-9 place-items-center rounded-full bg-surface text-xs font-bold text-ink-2" aria-hidden>
                    {make?.name.slice(0, 1)}
                  </span>
                  <span className="leading-tight">
                    <span className="block font-semibold">{lang === "bn" ? m.name_bn : m.name}</span>
                    <span className="block text-[11px] text-muted">{make ? (lang === "bn" ? make.name_bn : make.name) : ""}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="trust-title" className="space-y-4">
        <SectionTitle className="mb-0">
          <span id="trust-title">{tx("কেন PartsBD-তে ভরসা করবেন", "Why you can trust PartsBD")}</span>
        </SectionTitle>

        <div className="rounded-2xl border border-line bg-card p-4">
          <h3 className="font-bold">{tx("মান লেখা থাকে", "Quality is always labelled")}</h3>
          <p className="text-sm text-muted">{tx("প্রতিটা পার্টে রঙসহ লেবেল, কিছুই লুকানো নেই।", "Every part carries a colour label. Nothing hidden.")}</p>
          <ul className="mt-3 space-y-3">
            {QUALITIES.map((q) => (
              <li key={q} className="flex items-start gap-3">
                <span className={`mt-1.5 size-3 shrink-0 rounded-full ${qualityDot[q]}`} aria-hidden />
                <span>
                  <span className="font-semibold">{qualityLabel[q][lang]}</span>
                  <span className="block text-sm text-ink-2">{lang === "bn" ? qualityLabel[q].desc_bn : qualityLabel[q].desc_en}</span>
                </span>
              </li>
            ))}
          </ul>
          <Link href="/about#quality" className="mt-3 inline-flex min-h-10 items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline">
            {tx("বিস্তারিত জানুন", "Learn more")} <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex gap-3 rounded-2xl border border-line bg-card p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-q-genuine-soft text-q-genuine">
              <RefreshCcw className="size-5.5" aria-hidden />
            </span>
            <div>
              <h3 className="font-bold">{tx("ভুল পার্ট দিলে আমরা ফ্রিতে বদলে দিই", "Wrong part? We replace it free")}</h3>
              <p className="text-sm text-muted">{tx("আসা-যাওয়ার খরচও আমাদের।", "We pay shipping both ways.")}</p>
            </div>
          </div>
          <div className="flex gap-3 rounded-2xl border border-line bg-card p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-q-genuine-soft text-q-genuine">
              <ShieldCheck className="size-5.5" aria-hidden />
            </span>
            <div>
              <h3 className="font-bold">{tx("জেনুইন পার্টে ওয়ারেন্টি", "Warranty on genuine parts")}</h3>
              <p className="text-sm text-muted">{tx("ওয়ারেন্টি থাকলে পার্টের পাতায় মেয়াদ লেখা থাকে।", "The warranty period is shown on the part page.")}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-2 font-bold">{tx("ক্রেতারা যা বলছেন", "What customers say")}</h3>
          <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
            {reviews.map((r) => (
              <li key={r.id} className="w-[85%] max-w-sm shrink-0 snap-start rounded-2xl border border-line bg-card p-4">
                <span className="flex" aria-label={tx(`${d(r.rating)} তারা`, `${r.rating} stars`)}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className={`size-4 ${i <= r.rating ? "fill-accent text-accent" : "text-line"}`} aria-hidden />
                  ))}
                </span>
                <p className="mt-2 text-ink-2">“{r.comment}”</p>
                <p className="mt-2 text-sm font-semibold">
                  {r.name} <span className="font-normal text-muted">· {r.vehicle}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </Container>
  );
}
