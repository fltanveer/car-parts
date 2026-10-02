"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { publicListings } from "@/lib/db/queries";
import type { DB } from "@/lib/db/seed";
import { useDb } from "@/lib/db/store";
import { AudioGuide } from "@/components/layout/AudioGuide";
import { HelpCall } from "@/components/shared/Misc";
import { useT } from "@/components/providers/LangProvider";
import { Container, SectionTitle } from "@/components/ui/primitives";
import { popularForCar } from "@/components/customer/shop/data";
import { CategoryGrid, HomeSearch, HomeTiles, OngoingCard, PapersBanner, TrustCard } from "@/components/customer/shop/HomeParts";
import { useMyCar } from "@/components/customer/shop/hooks";
import { ListingCard } from "@/components/customer/shop/ListingCard";
import { AddCarCard, MyCarChip } from "@/components/customer/shop/MyCarChip";
import { ProductCard } from "@/components/customer/shop/ProductCard";
import { ShopCard } from "@/components/customer/shop/ShopCard";

const whole = (s: DB) => s;

export default function HomePage() {
  const { tx } = useT();
  const s = useDb(whole);
  const { vehicle, generationId, label } = useMyCar();
  const popular = generationId ? popularForCar(s, generationId, 4) : [];
  const listings = publicListings(s);
  const shops = s.vendors
    .filter((v) => v.status === "active" && v.verification_level >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
  const seeAll = (href: string) => (
    <Link href={href} className="inline-flex min-h-10 items-center gap-0.5 text-sm font-semibold text-brand">
      {tx("সব দেখুন", "See all")} <ChevronRight className="size-4" aria-hidden />
    </Link>
  );

  return (
    <Container className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {vehicle ? <MyCarChip /> : <span className="text-lg font-bold">{tx("আসসালামু আলাইকুম 👋", "Hello 👋")}</span>}
        <AudioGuide
          compact
          text={tx(
            "এখানে লিখে বা মাইক চেপে বলে পার্টস খুঁজুন। না পেলে লাল 'পার্ট চাই' চাপুন, দোকানগুলো দাম পাঠাবে। সমস্যা হলে সবুজ ফোন চেপে আমাদের কল করুন।",
            "Search by typing or tap the mic to speak. If you can't find it, tap 'Request a part' and shops will send prices. Tap the green phone to call us.",
          )}
        />
      </div>

      {!vehicle && <AddCarCard />}
      <PapersBanner />
      <HomeSearch />
      <HomeTiles />
      <OngoingCard />

      {vehicle && popular.length > 0 && (
        <section>
          <SectionTitle action={seeAll("/search")}>{tx(`আপনার ${label ?? "গাড়ি"}-এর জন্য`, `For your ${label ?? "car"}`)}</SectionTitle>
          <ul className="space-y-3">
            {popular.map((r) => (
              <li key={r.key}>
                {r.kind === "product" ? <ProductCard product={r.product} offers={r.offers} min={r.min} fit={r.fit} /> : <ListingCard listing={r.listing} vendor={r.vendor} fit={r.fit} />}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <SectionTitle action={seeAll("/c")}>{tx("ক্যাটাগরি", "Categories")}</SectionTitle>
        <CategoryGrid />
      </section>

      <section>
        <SectionTitle action={seeAll("/shops")}>{tx("যাচাইকৃত দোকান", "Verified shops")}</SectionTitle>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
          {shops.map((v) => (
            <ShopCard key={v.id} vendor={v} compact productCount={listings.filter((l) => l.vendor_id === v.id).length} />
          ))}
        </div>
      </section>

      <TrustCard />
      <HelpCall />
    </Container>
  );
}
