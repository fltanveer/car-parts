import type { Metadata } from "next";
import Link from "next/link";
import { NotFoundCard } from "@/components/catalog/NotFoundCard";
import { PartListing } from "@/components/catalog/PartListing";
import { SearchBar } from "@/components/catalog/SearchBar";
import { Container } from "@/components/ui/primitives";
import { getT } from "@/lib/server-lang";

const readQ = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";

export async function generateMetadata(props: PageProps<"/search">): Promise<Metadata> {
  const q = readQ((await props.searchParams).q);
  const { tx } = await getT();
  return { title: q ? `${q} · ${tx("খুঁজুন", "Search")}` : tx("পার্ট খুঁজুন", "Search parts"), robots: { index: false } };
}

const SUGGESTIONS = [
  { bn: "ব্রেক প্যাড", en: "brake pad" },
  { bn: "মবিল ফিল্টার", en: "oil filter" },
  { bn: "স্পার্ক প্লাগ", en: "spark plug" },
  { bn: "হেডলাইট", en: "headlight" },
  { bn: "শকার", en: "shock absorber" },
  { bn: "04465-12592", en: "04465-12592" },
];

export default async function SearchPage(props: PageProps<"/search">) {
  const q = readQ((await props.searchParams).q);
  const { tx, lang } = await getT();

  return (
    <Container>
      <SearchBar key={`bar:${q}`} defaultValue={q} autoFocus={!q} className="mb-5" />
      {q ? (
        <PartListing key={`list:${q}`} q={q} />
      ) : (
        <>
          <h1 className="mb-3 text-xl font-bold">{tx("কী খুঁজছেন?", "What are you looking for?")}</h1>
          <p className="mb-2 text-sm text-muted">{tx("বাংলা, English বা পার্ট নম্বর, যেকোনোভাবে লিখুন। যেমন:", "Type in Bangla, English or a part number. For example:")}</p>
          <div className="mb-6 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => {
              const term = lang === "bn" ? s.bn : s.en;
              return (
                <Link
                  key={s.en}
                  href={`/search?q=${encodeURIComponent(term)}`}
                  className="inline-flex min-h-10 items-center rounded-full border border-line bg-card px-3.5 text-sm font-medium hover:border-ink/40"
                >
                  {term}
                </Link>
              );
            })}
          </div>
          <NotFoundCard />
        </>
      )}
    </Container>
  );
}
