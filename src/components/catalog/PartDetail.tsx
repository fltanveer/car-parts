"use client";

import clsx from "clsx";
import { BadgeCheck, ChevronRight, MessageCircle, MessagesSquare, PackageCheck, Phone, RotateCcw, ShieldCheck, Star, Truck } from "lucide-react";
import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { getAlternatives, getCategoryById, getRelatedParts, getReviews } from "@/lib/api";
import { qualityLabel } from "@/lib/i18n";
import { siteUrl, telLink, waLink } from "@/lib/links";
import { getDeliveryQuote } from "@/lib/rules";
import { useActiveVehicle, useHydrated } from "@/lib/store";
import type { Part } from "@/lib/types";
import { AudioGuide } from "../layout/AudioGuide";
import { AvailabilityLine, PartGrid } from "../part/PartCard";
import { PartImage } from "../part/PartImage";
import { QualityBadge, qualityDot } from "../part/QualityBadge";
import { useT } from "../providers/LangProvider";
import { Card, SectionTitle } from "../ui/primitives";
import { vehicleLabel } from "../vehicle/VehicleChip";
import { BuyBox } from "./BuyBox";
import { CopyButton } from "./CopyButton";
import { FitmentList, FitVerdict } from "./FitmentBlock";

function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 px-4 py-3.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-ink-2">{icon}</span>
      <div className="min-w-0 flex-1">
        <dt className="text-sm text-muted">{label}</dt>
        <dd className="font-semibold leading-snug">{children}</dd>
      </div>
    </div>
  );
}

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={clsx("inline-flex", className)} aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={clsx("size-4", i <= Math.round(value) ? "fill-accent text-accent" : "text-line")} />
      ))}
    </span>
  );
}

export function PartDetail({ part }: { part: Part }) {
  const { t, tx, lang, taka, d, range } = useT();
  const hydrated = useHydrated();
  const vehicle = useActiveVehicle();

  const name = lang === "bn" ? part.name_bn : part.name;
  const altName = lang === "bn" ? part.name : part.name_bn;
  const cat = getCategoryById(part.category_id);
  const parentCat = cat?.parent_id ? getCategoryById(cat.parent_id) : null;
  const q = qualityLabel[part.quality];
  const inStock = part.availability === "in_stock";

  const { alternatives, related, reviews } = useMemo(() => {
    const alts = getAlternatives(part);
    const otherQuality = alts.filter((p) => p.quality !== part.quality);
    const alternatives = otherQuality.length ? otherQuality : alts;
    const altIds = new Set(alternatives.map((p) => p.id));
    return {
      alternatives,
      related: getRelatedParts(part, 8).filter((p) => !altIds.has(p.id)).slice(0, 4),
      reviews: getReviews(part.id),
    };
  }, [part]);

  // Delivery (spec 8.3): computed from size class so heavy parts show branch pickup.
  const dhaka = getDeliveryQuote("ঢাকা সিটি", [part]);
  const outside = getDeliveryQuote("__outside__", [part]);
  const deliveryText = [
    tx(`ঢাকা ${range(...dhaka.days)} দিন`, `Dhaka ${range(...dhaka.days)} days`),
    tx(`ঢাকার বাইরে ${range(...outside.days)} দিন`, `Outside Dhaka ${range(...outside.days)} days`) +
      (outside.method === "branch_pickup" ? tx(" (কুরিয়ার শাখা থেকে সংগ্রহ)", " (collect from courier branch)") : ""),
  ].join(tx(", ", ", "));

  const returnText = part.is_electrical
    ? tx("ইলেকট্রিক্যাল পার্ট: লাগানোর পর ফেরত হয় না। ভুল পার্ট বা ভাঙা অবস্থায় পৌঁছালে বদলে দেবো।", "Electrical part: not returnable once fitted. Wrong or damaged-on-arrival parts are replaced.")
    : !inStock
      ? tx("আনিয়ে দেওয়া পার্ট: শুধু ভুল পার্ট বা ত্রুটিপূর্ণ ডেলিভারিতে ফেরত।", "Sourced part: returns only for a wrong or defective delivery.")
      : part.is_returnable
        ? tx(
            `${d(part.return_window_days)} দিনের মধ্যে, না লাগানো ও প্যাকেট অক্ষত থাকলে ফেরত। ভুল পার্ট দিলে ফ্রিতে বদলে দিই।`,
            `Within ${part.return_window_days} days if unfitted and in original packaging. Wrong part? Free replacement.`,
          )
        : tx("শুধু ভুল পার্ট বা ত্রুটিপূর্ণ ডেলিভারিতে", "Only for a wrong or defective delivery");

  const path = `/part/${part.slug}`;
  const shareUrl = hydrated ? siteUrl(path) : path;
  const car = hydrated && vehicle ? ` (${tx("আমার গাড়ি", "My car")}: ${vehicleLabel(vehicle, lang)})` : "";
  const waText = tx(
    `আসসালামু আলাইকুম, এই পার্টটা সম্পর্কে জানতে চাই: ${part.name_bn} — ${part.brand} ${part.part_number}${car}\n${shareUrl}`,
    `Hello, I have a question about this part: ${part.name} — ${part.brand} ${part.part_number}${car}\n${shareUrl}`,
  );

  const description = lang === "bn" ? part.description_bn : part.description;

  return (
    <div className="space-y-8">
      {/* breadcrumb */}
      {cat && (
        <nav aria-label={tx("অবস্থান", "Breadcrumb")} className="-mb-4 flex flex-wrap items-center gap-1 text-sm text-muted">
          {parentCat && (
            <>
              <Link href={`/category/${parentCat.slug}`} className="hover:text-ink hover:underline">
                {lang === "bn" ? parentCat.name_bn : parentCat.name}
              </Link>
              <ChevronRight className="size-4" aria-hidden />
            </>
          )}
          <Link href={`/category/${cat.slug}`} className="hover:text-ink hover:underline">
            {lang === "bn" ? cat.name_bn : cat.name}
          </Link>
        </nav>
      )}

      {/* hero */}
      <section className="grid gap-5 sm:grid-cols-2 sm:items-start">
        <div className="overflow-hidden rounded-2xl border border-line">
          <PartImage part={part} large />
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <QualityBadge quality={part.quality} lang={lang} size="lg" />
              {part.warranty_months > 0 && (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-q-genuine">
                  <ShieldCheck className="size-4.5" aria-hidden />
                  {tx(`${d(part.warranty_months)} মাস ওয়ারেন্টি`, `${part.warranty_months}-month warranty`)}
                </span>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold">{name}</h1>
            <p className="text-muted">{altName}</p>
            <p className="mt-1 font-semibold">{part.brand}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted">{tx("পার্ট নম্বর", "Part no.")}</span>
              <code className="rounded-md bg-surface px-2 py-1 font-mono text-[15px] font-semibold tracking-wide">{part.part_number}</code>
              <CopyButton text={part.part_number} label={part.part_number} />
            </div>
            {part.rating != null && part.review_count > 0 && (
              <a href="#reviews" className="mt-2 inline-flex items-center gap-1.5 text-sm">
                <Stars value={part.rating} />
                <span className="font-semibold">{d(part.rating.toFixed(1))}</span>
                <span className="text-muted">({tx(`${d(part.review_count)}টি রিভিউ`, `${part.review_count} reviews`)})</span>
              </a>
            )}
          </div>

          {/* price */}
          <div className="rounded-2xl bg-card">
            {part.price != null ? (
              <p className="flex flex-wrap items-baseline gap-x-2">
                {!inStock && <span className="text-sm font-semibold text-muted">{tx("আনুমানিক", "Approx.")}</span>}
                <span className="text-3xl font-bold">{taka(part.price)}</span>
                {part.compare_at_price && <s className="text-lg text-muted">{taka(part.compare_at_price)}</s>}
              </p>
            ) : (
              <p className="text-lg font-bold text-accent-ink">{tx("দাম জানতে রিকোয়েস্ট দিন", "Request a price")}</p>
            )}
            {!inStock && part.price != null && <p className="mt-1 text-sm font-medium text-accent-ink">{t("price_estimate_note")}</p>}
            <div className="mt-2">
              <AvailabilityLine part={part} />
            </div>
          </div>

          <FitVerdict part={part} />
          <BuyBox part={part} />
        </div>
      </section>

      {/* info table */}
      <section aria-labelledby="info-title">
        <SectionTitle>
          <span id="info-title">{tx("এক নজরে", "At a glance")}</span>
        </SectionTitle>
        <Card>
          <dl className="divide-y divide-line">
            <InfoRow icon={<BadgeCheck className="size-5" />} label={t("quality")}>
              <span className="inline-flex items-center gap-2">
                <span className={clsx("size-3 rounded-full", qualityDot[part.quality])} aria-hidden />
                {q[lang]}
              </span>
            </InfoRow>
            <InfoRow icon={<ShieldCheck className="size-5" />} label={t("warranty")}>
              {part.warranty_months > 0 ? tx(`${d(part.warranty_months)} মাস`, `${part.warranty_months} months`) : t("no_warranty")}
              {part.warranty_months > 0 && part.warranty_terms && lang === "bn" && (
                <span className="block text-sm font-normal text-muted">{part.warranty_terms}</span>
              )}
              {part.warranty_months > 0 && lang === "en" && (
                <span className="block text-sm font-normal text-muted">Bad installation and accidents not covered; seals must be intact.</span>
              )}
            </InfoRow>
            <InfoRow icon={<RotateCcw className="size-5" />} label={t("return")}>
              {returnText}
            </InfoRow>
            <InfoRow icon={<Truck className="size-5" />} label={t("delivery")}>
              {!inStock && (
                <span className="block">
                  {tx(`সংগ্রহে ${range(part.sourcing_days_min, part.sourcing_days_max)} দিন, এরপর`, `Sourcing ${range(part.sourcing_days_min, part.sourcing_days_max)} days, then`)}
                </span>
              )}
              {deliveryText}
              {part.is_fragile && <span className="block text-sm font-normal text-muted">{tx("ভঙ্গুর পার্ট, বাড়তি প্যাকিং করা হয়", "Fragile; packed with extra care")}</span>}
            </InfoRow>
            <InfoRow icon={<PackageCheck className="size-5" />} label={t("status")}>
              {inStock ? t("in_stock") : t("sourcing")}
            </InfoRow>
          </dl>
        </Card>
      </section>

      {/* ask us */}
      <section aria-labelledby="ask-title" className="rounded-2xl bg-ink p-5 text-white">
        <h2 id="ask-title" className="text-lg font-bold">
          {t("not_sure")}
        </h2>
        <p className="mt-1 text-sm text-white/70">
          {tx("পার্ট নম্বর বা গাড়ির চেসিস নম্বর বললে আমরা মিলিয়ে দেবো।", "Share your chassis number and we'll check the fit for you.")}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Link href={`/chat?part=${part.id}`} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl bg-white/10 py-2 text-sm font-semibold hover:bg-white/15">
            <MessagesSquare className="size-5" aria-hidden />
            {t("chat")}
          </Link>
          <a href={telLink()} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl bg-white/10 py-2 text-sm font-semibold hover:bg-white/15">
            <Phone className="size-5" aria-hidden />
            {t("call")}
          </a>
          <a
            href={waLink(waText)}
            target="_blank"
            rel="noopener"
            className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl bg-[#25D366] py-2 text-sm font-semibold text-white hover:brightness-95"
          >
            <MessageCircle className="size-5" aria-hidden />
            {t("whatsapp")}
          </a>
        </div>
      </section>

      {/* fitment */}
      <section aria-labelledby="fit-title">
        <SectionTitle>
          <span id="fit-title">{tx("যেসব গাড়িতে লাগে", "Fits these cars")}</span>
        </SectionTitle>
        <FitmentList part={part} />
      </section>

      {/* description */}
      <section aria-labelledby="desc-title">
        <SectionTitle action={<AudioGuide text={description} label={tx("এই পার্ট সম্পর্কে শুনুন", "Listen about this part")} />}>
          <span id="desc-title">{tx("বর্ণনা", "Description")}</span>
        </SectionTitle>
        <Card className="space-y-2 p-4">
          <p>{description}</p>
          <p className="text-sm text-muted">{lang === "bn" ? part.description : part.description_bn}</p>
        </Card>
      </section>

      {/* quality explainer */}
      <section aria-labelledby="q-title">
        <SectionTitle
          action={
            <Link href="/about#quality" className="text-sm font-semibold text-ink-2 underline-offset-4 hover:underline">
              {tx("সব লেবেল দেখুন", "All labels")}
            </Link>
          }
        >
          <span id="q-title">{tx("এই মানের লেবেল কী মানে?", "What does this label mean?")}</span>
        </SectionTitle>
        <Card className="flex items-start gap-3 p-4">
          <QualityBadge quality={part.quality} lang={lang} />
          <p className="flex-1 text-sm text-ink-2">{lang === "bn" ? q.desc_bn : q.desc_en}</p>
        </Card>
      </section>

      {/* reviews */}
      <section id="reviews" aria-labelledby="rv-title" className="scroll-mt-20">
        <SectionTitle>
          <span id="rv-title">{tx("রিভিউ", "Reviews")}</span>
        </SectionTitle>
        {reviews.length > 0 ? (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id}>
                <Card className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{r.name}</span>
                    <Stars value={r.rating} />
                  </div>
                  <p className="mt-1.5 text-ink-2">{r.comment}</p>
                  <p className="mt-1 text-xs text-muted">
                    {r.vehicle} · {tx("যাচাই করা ক্রেতা", "Verified buyer")}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <Card className="p-4 text-sm text-muted">
            {part.review_count > 0
              ? tx(`${d(part.review_count)} জন ক্রেতা রেটিং দিয়েছেন। লেখা রিভিউ শিগগিরই দেখাবো।`, `${part.review_count} buyers rated this. Written reviews coming soon.`)
              : tx("এখনো রিভিউ নেই।", "No reviews yet.")}{" "}
            {tx("শুধু যারা কিনেছেন তারাই রিভিউ দিতে পারেন।", "Only buyers can leave a review.")}
          </Card>
        )}
      </section>

      {alternatives.length > 0 && (
        <section aria-labelledby="alt-title">
          <SectionTitle>
            <span id="alt-title">{tx("অন্য মানে একই পার্ট", "Same part, other qualities")}</span>
          </SectionTitle>
          <PartGrid parts={alternatives} />
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="rel-title">
          <SectionTitle>
            <span id="rel-title">{tx("সাথে লাগতে পারে", "You may also need")}</span>
          </SectionTitle>
          <PartGrid parts={related} />
        </section>
      )}
    </div>
  );
}
