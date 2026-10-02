"use client";

import { Hash, MessageCircle, Tag, Volume2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { categoryPath, fitsVehicle, getBrand, getCategory, getProductBySlug, models, offersForProduct, publicListings } from "@/lib/db/queries";
import type { DB } from "@/lib/db/seed";
import { useDb } from "@/lib/db/store";
import { AudioGuide, speak } from "@/components/layout/AudioGuide";
import { SourceBadge } from "@/components/shared/Badges";
import { BackButton, HelpCall } from "@/components/shared/Misc";
import { useT } from "@/components/providers/LangProvider";
import { Button, ButtonLink, Container, EmptyState, Notice, SectionTitle } from "@/components/ui/primitives";
import { rankOffers, suggestionReason } from "@/components/customer/shop/data";
import { Gallery } from "@/components/customer/shop/Gallery";
import { useMyCar } from "@/components/customer/shop/hooks";
import { ListingCard } from "@/components/customer/shop/ListingCard";
import { offerSpeech, OfferRow } from "@/components/customer/shop/OfferRow";
import { RequestPromptCard } from "@/components/customer/shop/RequestPromptCard";
import { InfoTable, useSpecRows } from "@/components/customer/shop/SpecTable";
import { useAskShop } from "@/components/customer/shop/useAskShop";
import { homeDistrict } from "@/components/customer/shop/data";

const whole = (s: DB) => s;

/** Master product: compare every shop's price (file 01 4.3). */
export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { tx, lang, d } = useT();
  const s = useDb(whole);
  const ask = useAskShop();
  const { generationId, label } = useMyCar();
  const p = getProductBySlug(decodeURIComponent(slug));
  const district = homeDistrict(s);
  const ranked = useMemo(() => (p ? rankOffers(offersForProduct(s, p.id), s.vendors, district) : []), [p, s, district]);
  const specRows = useSpecRows(getCategory(p?.category_id ?? null)?.attribute_template ?? "GENERIC_PART", p?.attributes ?? {});

  if (!p) {
    return (
      <Container className="space-y-4">
        <BackButton />
        <EmptyState icon="🔎" title={tx("পণ্যটি পাওয়া যায়নি", "Product not found")} action={<ButtonLink href="/search" variant="brand" size="lg">{tx("খুঁজুন", "Search")}</ButtonLink>} />
        <RequestPromptCard />
      </Container>
    );
  }

  const name = lang === "bn" ? p.name_bn : p.name;
  const fit = fitsVehicle(p.fitments, p.is_universal, generationId);
  const best = ranked[0];
  const reason = best ? suggestionReason(best, ranked, tx) : undefined;
  const fitModels = [...new Set(p.fitments.map((f) => models.find((m) => m.id === f.model_id)).filter(Boolean).map((m) => m!.name))];
  const cheaperUsed = publicListings(s).filter(
    (l) => !l.catalog_product_id && l.category_id === p.category_id && l.condition !== "new" && (!generationId || fitsVehicle(l.fitments, l.is_universal, generationId) !== false),
  );
  const brand = getBrand(p.brand_id);
  const sayAll = () => {
    const top = ranked.slice(0, 3).map((o, i) => offerSpeech(o, i, lang)).join(" ");
    speak(`${name}। ${top} ${tx("প্রথমটা নিতে চাইলে সবুজ বাটন চাপুন।", "To take the first one, press the green button.")}`, lang);
  };

  return (
    <Container className="space-y-5">
      <BackButton />
      <p className="text-sm text-muted">{categoryPath(p.category_id).map((c) => (lang === "bn" ? c.name_bn : c.name)).join(" › ")}</p>
      <Gallery media={[{ url: `ph:${p.image}`, role: "main" }, { url: `ph:${p.image}`, role: "other" }, { url: `ph:${p.image}`, role: "label" }]} alt={name} />

      <header className="space-y-2">
        <h1 className="text-2xl font-bold">{name}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <SourceBadge source={p.source} />
          {brand && <span className="rounded-md bg-surface px-2 py-0.5 text-xs font-bold ring-1 ring-line">{brand.name}</span>}
        </div>
        {p.part_number && (
          <p className="flex flex-wrap items-center gap-1.5 text-sm">
            <Hash className="size-4 text-muted" aria-hidden />
            <span className="text-muted">{tx("পার্ট নম্বর", "Part no.")}</span>
            <span className="font-mono font-bold">{p.part_number}</span>
            {p.cross_ref_numbers.length > 0 && <span className="text-muted">({tx("একই", "same as")}: {p.cross_ref_numbers.join(", ")})</span>}
          </p>
        )}
        {fit === true && <Notice tone="ok">✅ {tx(`আপনার ${label}-এ লাগবে`, `Fits your ${label}`)}</Notice>}
        {fit === false && <Notice tone="warn">⚠️ {tx(`আপনার ${label}-এর তালিকায় নেই। কেনার আগে দোকানকে জিজ্ঞেস করুন।`, `Not listed for your ${label}. Ask the shop before buying.`)}</Notice>}
        {fit === null && !p.is_universal && <Notice>🚗 {tx("আপনার গাড়ি সেট করলে মিলবে কিনা দেখাবো।", "Set your car and we'll tell you if it fits.")}</Notice>}
        {p.is_universal ? (
          <p className="text-sm text-ink-2">{tx("সব গাড়িতে চলে (মাপ মিলিয়ে নিন)", "Universal (check the size)")}</p>
        ) : (
          fitModels.length > 0 && <p className="text-sm text-ink-2">{tx("যেসব গাড়িতে লাগে", "Fits")}: {fitModels.join(", ")}</p>
        )}
        {p.description_bn && <p className="text-ink-2">{p.description_bn}</p>}
      </header>

      <section>
        <SectionTitle action={ranked.length > 0 && <Button variant="outline" size="sm" onClick={sayAll}><Volume2 className="size-4" aria-hidden />{tx("সব দাম শুনুন", "Hear all prices")}</Button>}>
          {tx(`কোন দোকান থেকে কিনবেন? (${d(ranked.length)})`, `Which shop? (${ranked.length})`)}
        </SectionTitle>
        <AudioGuide className="mb-3" text={tx("সবুজ ঘরে আমাদের পরামর্শ। দাম, ওয়ারেন্টি আর কবে পাঠাবে দেখে 'কার্টে দিন' চাপুন। ব্যাজে চাপলে মানে বুঝিয়ে দেবে।", "The green box is our suggestion. Compare price, warranty and dispatch, then tap 'Add to cart'. Tap a badge to hear what it means.")} />
        {ranked.length ? (
          <ul className="space-y-3">
            {ranked.map((o, i) => (
              <li key={o.listing.id}>
                <OfferRow offer={o} index={i} suggested={i === 0 && ranked.length > 1} reason={i === 0 ? reason : undefined} district={district} />
              </li>
            ))}
          </ul>
        ) : (
          <RequestPromptCard text={p.name_bn} big />
        )}
      </section>

      {specRows.length > 0 && (
        <section>
          <SectionTitle>{tx("বিস্তারিত তথ্য", "Specifications")}</SectionTitle>
          <InfoTable rows={specRows.map((r) => ({ icon: <Tag className="size-4" />, label: r.label, value: r.value }))} />
        </section>
      )}

      {cheaperUsed.length > 0 && (
        <section>
          <SectionTitle>{tx("কম দামে পুরনো দেখুন", "Cheaper used options")}</SectionTitle>
          <ul className="space-y-3">
            {cheaperUsed.slice(0, 4).map((l) => (
              <li key={l.id}>
                <ListingCard listing={l} vendor={s.vendors.find((v) => v.id === l.vendor_id)!} fit={fitsVehicle(l.fitments, l.is_universal, generationId)} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {best?.vendor && (
        <Button variant="outline" size="lg" full onClick={() => ask(best.vendor!.id, "listing", best.listing.id)}>
          <MessageCircle className="size-5" aria-hidden /> {tx("প্রশ্ন? দোকানকে জিজ্ঞেস করুন", "Questions? Ask the shop")}
        </Button>
      )}
      <HelpCall />
    </Container>
  );
}
