import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PartDetail } from "@/components/catalog/PartDetail";
import { Container } from "@/components/ui/primitives";
import { describeGeneration, getPart } from "@/lib/api";
import { qualityLabel } from "@/lib/i18n";
import { getT } from "@/lib/server-lang";

export async function generateMetadata(props: PageProps<"/part/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const part = getPart(slug);
  if (!part) return {};
  const { lang } = await getT();
  const q = qualityLabel[part.quality][lang];
  const name = lang === "bn" ? part.name_bn : part.name;
  const cars = [...new Set(part.fitments.map((f) => describeGeneration(f.generation_id)?.short).filter(Boolean))].slice(0, 4).join(", ");
  return {
    title: `${name} · ${part.brand} ${part.part_number}`,
    description:
      lang === "bn"
        ? `${part.name_bn} (${part.name}), ${part.brand}, মান: ${q}। ${cars}-এ লাগে। ${part.description_bn}`
        : `${part.name}, ${part.brand}, quality: ${q}. Fits ${cars}. ${part.description}`,
    alternates: { canonical: `/part/${part.slug}` },
  };
}

export default async function PartPage(props: PageProps<"/part/[slug]">) {
  const { slug } = await props.params;
  const part = getPart(slug);
  if (!part) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: part.name,
    alternateName: part.name_bn,
    description: part.description,
    sku: part.sku,
    mpn: part.part_number,
    brand: { "@type": "Brand", name: part.brand },
    itemCondition: part.quality === "reconditioned" ? "https://schema.org/RefurbishedCondition" : "https://schema.org/NewCondition",
    ...(part.price != null && {
      offers: {
        "@type": "Offer",
        url: `/part/${part.slug}`,
        priceCurrency: "BDT",
        price: part.price,
        availability: part.availability === "in_stock" ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
      },
    }),
    ...(part.rating != null &&
      part.review_count > 0 && {
        aggregateRating: { "@type": "AggregateRating", ratingValue: part.rating, reviewCount: part.review_count },
      }),
  };

  return (
    <Container>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PartDetail part={part} />
    </Container>
  );
}
