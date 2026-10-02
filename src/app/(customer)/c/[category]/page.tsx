"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { categoryPath, categoryTreeIds, childCategories, getCategoryBySlug } from "@/lib/db/queries";
import { AudioGuide } from "@/components/layout/AudioGuide";
import { BackButton, HelpCall } from "@/components/shared/Misc";
import { useT } from "@/components/providers/LangProvider";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { ButtonLink, Container, EmptyState, PageHeader } from "@/components/ui/primitives";
import { ChipRow } from "@/components/customer/shop/Bits";
import { MyCarChip } from "@/components/customer/shop/MyCarChip";
import { ResultsView } from "@/components/customer/shop/ResultsView";

/** Category page: level 1/2/3 with sub-category chips + products (file 01 sitemap /c/[category]). */
export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const { tx, lang } = useT();
  const cat = getCategoryBySlug(decodeURIComponent(category));
  const ids = useMemo(() => (cat ? categoryTreeIds(cat.id) : []), [cat]);

  if (!cat) {
    return (
      <Container className="space-y-4">
        <BackButton href="/c" />
        <EmptyState icon="🔎" title={tx("এই ক্যাটাগরি পাওয়া যায়নি", "Category not found")} action={<ButtonLink href="/c" variant="brand" size="lg">{tx("সব ক্যাটাগরি", "All categories")}</ButtonLink>} />
      </Container>
    );
  }

  const name = (c: { name: string; name_bn: string }) => (lang === "bn" ? c.name_bn : c.name);
  const path = categoryPath(cat.id);
  const parent = path.length > 1 ? path[path.length - 2] : null;
  const children = childCategories(cat.id);
  // Level 3 shows its siblings as chips so switching is one tap.
  const chips = children.length ? children : parent ? childCategories(parent.id) : [];

  return (
    <Container className="space-y-4">
      <PageHeader
        back={<BackButton href={parent ? `/c/${parent.slug}` : "/c"} />}
        title={
          <span className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft/60 text-brand-ink">
              <CategoryIcon icon={cat.icon} className="size-6" />
            </span>
            {name(cat)}
          </span>
        }
      >
        <AudioGuide compact text={tx(`${cat.name_bn}। উপরের ছোট বোতাম থেকে ঠিক জিনিসটা বেছে নিন। আপনার গাড়ির সাথে মেলে এমন জিনিস আগে দেখাবো।`, `${cat.name}. Pick the exact item from the chips above. Parts that fit your car show first.`)} />
      </PageHeader>

      <nav aria-label={tx("ক্যাটাগরির পথ", "Breadcrumb")} className="flex flex-wrap items-center gap-1 text-sm text-muted">
        <Link href="/c" className="font-semibold hover:underline">{tx("সব", "All")}</Link>
        {path.map((c) => (
          <span key={c.id} className="inline-flex items-center gap-1">
            <ChevronRight className="size-3.5" aria-hidden />
            {c.id === cat.id ? <span className="font-semibold text-ink">{name(c)}</span> : <Link href={`/c/${c.slug}`} className="font-semibold hover:underline">{name(c)}</Link>}
          </span>
        ))}
      </nav>

      {chips.length > 0 && (
        <ChipRow>
          {children.length === 0 && parent && (
            <Link href={`/c/${parent.slug}`} className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-line bg-card px-3.5 text-sm font-medium">
              {tx("সব", "All")} {name(parent)}
            </Link>
          )}
          {chips.map((c) => (
            <Link
              key={c.id}
              href={`/c/${c.slug}`}
              aria-current={c.id === cat.id ? "page" : undefined}
              className={`inline-flex min-h-10 shrink-0 items-center rounded-full border px-3.5 text-sm font-medium ${c.id === cat.id ? "border-brand bg-brand text-white" : "border-line bg-card hover:border-ink/40"}`}
            >
              {name(c)}
            </Link>
          ))}
        </ChipRow>
      )}

      <MyCarChip />
      <ResultsView categoryIds={ids} requestText={cat.name_bn} />
      <HelpCall />
    </Container>
  );
}
