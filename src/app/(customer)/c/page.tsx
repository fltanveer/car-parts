"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { childCategories, topCategories } from "@/lib/db/queries";
import { AudioGuide } from "@/components/layout/AudioGuide";
import { BackButton, HelpCall } from "@/components/shared/Misc";
import { useT } from "@/components/providers/LangProvider";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Container, PageHeader } from "@/components/ui/primitives";
import { RequestPromptCard } from "@/components/customer/shop/RequestPromptCard";

/** All categories (home "Buy parts" tile and "see all"). */
export default function AllCategoriesPage() {
  const { tx, lang } = useT();
  return (
    <Container className="space-y-4">
      <PageHeader back={<BackButton href="/" />} title={tx("পার্টস কিনুন", "Buy parts")} subtitle={tx("কোন ধরনের পার্ট লাগবে? ছবিতে চাপুন", "Which kind of part? Tap a picture")}>
        <AudioGuide compact text={tx("যে ধরনের পার্ট লাগবে সেই ছবিতে চাপুন। না বুঝলে নিচে 'দাম নিন' চাপুন, দোকানগুলোকে বলে দেবো।", "Tap the kind of part you need. Not sure? Tap 'Get prices' below and we'll ask the shops.")} />
      </PageHeader>
      <ul className="grid gap-3 sm:grid-cols-2">
        {topCategories().map((c) => (
          <li key={c.id} className="rounded-2xl border border-line bg-card p-3">
            <Link href={`/c/${c.slug}`} className="flex min-h-14 items-center gap-3 rounded-xl hover:bg-surface">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-soft/60 text-brand-ink">
                <CategoryIcon icon={c.icon} className="size-6" />
              </span>
              <span className="min-w-0 flex-1 text-lg font-bold">{lang === "bn" ? c.name_bn : c.name}</span>
              <ChevronRight className="size-5 text-muted" aria-hidden />
            </Link>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {childCategories(c.id).map((g) => (
                <Link key={g.id} href={`/c/${g.slug}`} className="inline-flex min-h-9 items-center rounded-full bg-surface px-3 text-sm font-medium hover:bg-brand-soft/50">
                  {lang === "bn" ? g.name_bn : g.name}
                </Link>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <RequestPromptCard />
      <HelpCall />
    </Container>
  );
}
