"use client";

import { Calendar, Check, Hash, MapPin, MessageCircle, RotateCcw, ShieldCheck, ShoppingCart, Truck, Wallet, Zap } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { addToCart } from "@/lib/db/actions";
import { categoryPath, describeVehicle, fitsVehicle, getCategory, isPublic, listingById, models, publicListings, vendorById } from "@/lib/db/queries";
import type { DB } from "@/lib/db/seed";
import { useDb } from "@/lib/db/store";
import { dispatchLabel, positionLabel, warrantyLabel } from "@/lib/labels";
import { spokenTaka } from "@/lib/format";
import { AudioGuide, SpeakButton } from "@/components/layout/AudioGuide";
import { AssuredBadge, ConditionBadge, SourceBadge } from "@/components/shared/Badges";
import { BackButton, HelpCall, toast } from "@/components/shared/Misc";
import { useT } from "@/components/providers/LangProvider";
import { Button, ButtonLink, Container, EmptyState, Notice, SectionTitle } from "@/components/ui/primitives";
import { homeDistrict, deliveryEstimate } from "@/components/customer/shop/data";
import { Gallery } from "@/components/customer/shop/Gallery";
import { GradeMeaning } from "@/components/customer/shop/GradeMeaning";
import { useMyCar } from "@/components/customer/shop/hooks";
import { ListingCard } from "@/components/customer/shop/ListingCard";
import { ReportSheet } from "@/components/customer/shop/ReportSheet";
import { ShopCard } from "@/components/customer/shop/ShopCard";
import { InfoTable, useSpecRows } from "@/components/customer/shop/SpecTable";
import { useAskShop } from "@/components/customer/shop/useAskShop";

const whole = (s: DB) => s;

/** Single listing (used / one-off item) page (file 01 4.4). */
export default function ListingPage() {
  const { id } = useParams<{ id: string }>();
  const { tx, lang, taka, d, L } = useT();
  const router = useRouter();
  const s = useDb(whole);
  const ask = useAskShop();
  const { generationId, label } = useMyCar();
  const l = listingById(s, id);
  const v = vendorById(s, l?.vendor_id ?? null);
  const cat = getCategory(l?.category_id ?? null);
  const specRows = useSpecRows(cat?.attribute_template ?? "GENERIC_PART", l?.attributes ?? {});
  const inCart = s.cart.some((c) => c.listing_id === id);

  if (!l || !v) {
    return (
      <Container className="space-y-4">
        <BackButton />
        <EmptyState icon="🔎" title={tx("জিনিসটি পাওয়া যায়নি", "Item not found")} action={<ButtonLink href="/search" variant="brand" size="lg">{tx("খুঁজুন", "Search")}</ButtonLink>} />
      </Container>
    );
  }

  const title = lang === "bn" ? l.title_bn : l.title;
  const available = isPublic(s, l);
  const fit = fitsVehicle(l.fitments, l.is_universal, generationId);
  const fitNames = [...new Set(l.fitments.map((f) => describeVehicle(f.generation_id)?.withYear ?? models.find((m) => m.id === f.model_id)?.name).filter(Boolean))];
  const donor = l.donor_vehicle_id ? s.donors.find((x) => x.id === l.donor_vehicle_id) : null;
  const donorParts = donor ? publicListings(s).filter((x) => x.donor_vehicle_id === donor.id && x.id !== l.id) : [];
  const productCount = publicListings(s).filter((x) => x.vendor_id === v.id).length;
  const delivery = deliveryEstimate(homeDistrict(s), l);

  const add = () => {
    if (!inCart) addToCart({ listing_id: l.id });
  };

  return (
    <Container className="space-y-5">
      <BackButton />
      <p className="text-sm text-muted">{categoryPath(l.category_id).map((c) => (lang === "bn" ? c.name_bn : c.name)).join(" › ")}</p>
      <Gallery media={l.media} alt={title} />

      <header className="space-y-2">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex flex-wrap gap-1.5">
          <SourceBadge source={l.source} />
          <ConditionBadge condition={l.condition} grade={l.grade} />
          {l.is_assured_eligible && <AssuredBadge />}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-3xl font-bold">{taka(l.price)}</p>
          <SpeakButton text={`${title}। ${tx("দাম", "Price")} ${spokenTaka(l.price, lang)}। ${warrantyLabel(l.warranty_days, lang)}। ${dispatchLabel(l.dispatch_days, lang)}।`} />
        </div>
        {!available && <Notice tone="bad">{tx("এই জিনিসটি এখন পাওয়া যাচ্ছে না (বিক্রি হয়ে গেছে বা বন্ধ)।", "This item isn't available right now (sold or paused).")}</Notice>}
        {fit === true && <Notice tone="ok">✅ {tx(`আপনার ${label}-এ লাগবে`, `Fits your ${label}`)}</Notice>}
        {fit === false && <Notice tone="warn">⚠️ {tx(`আপনার ${label}-এর তালিকায় নেই। জেনে কিনলে লাগানো না গেলে দায় আপনার।`, `Not listed for your ${label}. If you buy anyway and it doesn't fit, it's your responsibility.`)}</Notice>}
      </header>

      <div className="space-y-2">
        <Button variant="brand" size="xl" full disabled={!available} onClick={() => { add(); toast(tx("কার্টে দেওয়া হয়েছে", "Added to cart")); }}>
          {inCart ? <Check className="size-6" aria-hidden /> : <ShoppingCart className="size-6" aria-hidden />}
          {inCart ? tx("কার্টে আছে", "In cart") : tx("কার্টে দিন", "Add to cart")}
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="lg" disabled={!available} onClick={() => { add(); router.push("/checkout"); }}>
            ⚡ {tx("এখনই কিনুন", "Buy now")}
          </Button>
          <Button variant="outline" size="lg" onClick={() => ask(v.id, "listing", l.id)}>
            <MessageCircle className="size-5" aria-hidden /> {tx("প্রশ্ন", "Ask")}
          </Button>
        </div>
      </div>

      {l.description_bn && (
        <section className="rounded-2xl border border-line bg-card p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="font-bold">{tx("দোকানের বিবরণ", "Seller's description")}</h2>
            <SpeakButton text={l.description_bn} />
          </div>
          <p className="text-ink-2">{l.description_bn}</p>
        </section>
      )}

      <GradeMeaning source={l.source} condition={l.condition} grade={l.grade} />

      <section>
        <SectionTitle>{tx("তথ্য", "Details")}</SectionTitle>
        <InfoTable
          rows={[
            { icon: <Wallet className="size-4" />, label: tx("দাম", "Price"), value: `${taka(l.price)}${l.unit !== "piece" ? ` / ${l.unit === "pair" ? tx("জোড়া", "pair") : l.unit === "set" ? tx("সেট", "set") : tx("প্যাক", "pack")}` : ""}` },
            { icon: <ShieldCheck className="size-4" />, label: tx("ওয়ারেন্টি", "Warranty"), value: warrantyLabel(l.warranty_days, lang) },
            { icon: <RotateCcw className="size-4" />, label: tx("ফেরত", "Returns"), value: l.is_returnable ? tx(`${d(l.return_window_days)} দিনের মধ্যে, না লাগানো অবস্থায়`, `Within ${l.return_window_days} days, unfitted`) : tx("মন বদলালে ফেরত হয় না (ভুল/ভাঙা হলে টাকা ফেরত)", "No change-of-mind returns (wrong/broken is refunded)") },
            { icon: <Truck className="size-4" />, label: tx("পাঠানো", "Dispatch"), value: `${dispatchLabel(l.dispatch_days, lang)} · ${tx("ডেলিভারি", "delivery")} ${taka(delivery)}` },
            { icon: <Calendar className="size-4" />, label: tx("যেসব গাড়িতে লাগে", "Fits"), value: l.is_universal ? tx("সব গাড়ি (মাপ মিলিয়ে নিন)", "Universal (check size)") : fitNames.join(", ") || "—" },
            ...(l.position.length ? [{ icon: <MapPin className="size-4" />, label: tx("কোন পাশে", "Position"), value: l.position.map((p) => L(positionLabel[p])).join(", ") }] : []),
            ...(l.part_number ? [{ icon: <Hash className="size-4" />, label: tx("পার্ট নম্বর", "Part no."), value: <span className="font-mono">{l.part_number}</span> }] : []),
            ...(l.is_electrical ? [{ icon: <Zap className="size-4" />, label: tx("ইলেকট্রিক্যাল", "Electrical"), value: tx("লাগানোর পর মন বদলালে ফেরত হয় না", "No change-of-mind returns after fitting") }] : []),
            ...specRows.map((r) => ({ label: r.label, value: r.value })),
          ]}
        />
      </section>

      <section>
        <SectionTitle>{tx("দোকান", "Shop")}</SectionTitle>
        <ShopCard vendor={v} productCount={productCount} />
      </section>

      {donor && (
        <section className="space-y-3">
          <SectionTitle>{tx("এই গাড়ি থেকে আরও পার্টস", "More parts from this car")}</SectionTitle>
          <Notice>
            🚗 {describeVehicle(donor.generation_id, donor.engine_id, lang)?.full} · {donor.color}
            {donor.odometer_km ? ` · ${d(donor.odometer_km.toLocaleString("en-IN"))} ${tx("কিমি", "km")}` : ""}
            {donor.notes && <span className="mt-1 block">{donor.notes}</span>}
          </Notice>
          {donorParts.length ? (
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar">
              {donorParts.map((x) => (
                <ListingCard key={x.id} listing={x} vendor={v} fit={fitsVehicle(x.fitments, x.is_universal, generationId)} compact />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">{tx("এই গাড়ির আর কোনো পার্ট এখন তালিকায় নেই। দোকানকে জিজ্ঞেস করুন।", "No other parts listed from this car yet. Ask the shop.")}</p>
          )}
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <AudioGuide text={tx("ছবিগুলো দেখুন, লাল ট্যাগ মানে দাগ বা সমস্যার ছবি। গ্রেড মানে জিনিস কতটা ভালো। ঠিক থাকলে 'কার্টে দিন' চাপুন।", "Check the photos; a red tag marks a defect photo. The grade tells how good it is. If it's right, tap 'Add to cart'.")} />
        <ReportSheet targetType="listing" targetId={l.id} />
      </div>
      <HelpCall />
    </Container>
  );
}
