import clsx from "clsx";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PartListing } from "@/components/catalog/PartListing";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Container } from "@/components/ui/primitives";
import { getCategory, getCategoryById, getSubcategories } from "@/lib/api";
import { getT } from "@/lib/server-lang";

export async function generateMetadata(props: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const cat = getCategory(slug);
  if (!cat) return {};
  const { lang, tx } = await getT();
  const name = lang === "bn" ? cat.name_bn : cat.name;
  return {
    title: name,
    description: tx(
      `${cat.name_bn} (${cat.name}): জেনুইন, সমমানের, আফটারমার্কেট ও রিকন্ডিশন পার্টস, মান স্পষ্ট লেখা।`,
      `${cat.name} parts: genuine, OEM-equivalent, aftermarket and reconditioned, clearly labelled.`,
    ),
  };
}

export default async function CategoryPage(props: PageProps<"/category/[slug]">) {
  const { slug } = await props.params;
  const cat = getCategory(slug);
  if (!cat) notFound();
  const { lang, tx } = await getT();

  const parent = cat.parent_id ? getCategoryById(cat.parent_id) : null;
  const top = parent ?? cat;
  const subs = getSubcategories(top.id);
  const label = (c: { name: string; name_bn: string }) => (lang === "bn" ? c.name_bn : c.name);

  const chip = (active: boolean) =>
    clsx(
      "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors",
      active ? "border-ink bg-ink text-white" : "border-line bg-card hover:border-ink/40",
    );

  return (
    <Container>
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent-ink">
          <CategoryIcon icon={cat.icon} className="size-7" />
        </span>
        <div className="min-w-0">
          {parent && (
            <Link href={`/category/${parent.slug}`} className="text-sm text-muted hover:text-ink hover:underline">
              {label(parent)}
            </Link>
          )}
          <p className="text-2xl font-bold leading-tight">{label(cat)}</p>
          <p className="text-sm text-muted">{lang === "bn" ? cat.name : cat.name_bn}</p>
        </div>
      </div>

      {subs.length > 0 && (
        <nav aria-label={tx("সাব-ক্যাটাগরি", "Subcategories")} className="-mx-4 mb-5 overflow-x-auto px-4 no-scrollbar">
          <div className="flex w-max gap-2 pb-1">
            <Link href={`/category/${top.slug}`} className={chip(cat.id === top.id)} aria-current={cat.id === top.id ? "page" : undefined}>
              {tx("সব", "All")}
            </Link>
            {subs.map((s) => (
              <Link key={s.id} href={`/category/${s.slug}`} className={chip(s.id === cat.id)} aria-current={s.id === cat.id ? "page" : undefined}>
                <CategoryIcon icon={s.icon} className="size-4.5" />
                {label(s)}
              </Link>
            ))}
          </div>
        </nav>
      )}

      <PartListing key={slug} categorySlug={slug} notFoundQuery={label(cat)} />
    </Container>
  );
}
