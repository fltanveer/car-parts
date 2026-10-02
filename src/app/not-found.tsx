import { Mic, Search } from "lucide-react";
import Link from "next/link";
import { ButtonLink, Card, Container, buttonClass, inputClass } from "@/components/ui/primitives";
import { getT } from "@/lib/server-lang";

export default async function NotFound() {
  const { tx, d } = await getT();
  return (
    <Container className="max-w-md space-y-5 py-6 text-center">
      <p className="text-6xl font-black text-accent">{d(404)}</p>
      <div>
        <h1 className="text-2xl font-bold">{tx("পেজটা খুঁজে পাওয়া যায়নি", "Page not found")}</h1>
        <p className="mt-1 text-muted">
          {tx("লিংকটা হয়তো পুরনো বা ভুল। পার্টের নাম লিখে খুঁজুন।", "The link may be old or wrong. Search for your part instead.")}
        </p>
      </div>

      <form action="/search" method="get" role="search" className="flex gap-2">
        <input
          name="q"
          required
          aria-label={tx("পার্ট খুঁজুন", "Search parts")}
          placeholder={tx("যেমন: ব্রেক প্যাড, অয়েল ফিল্টার", "e.g. brake pads, oil filter")}
          className={inputClass}
        />
        <button type="submit" className={buttonClass("primary", "md")} aria-label={tx("খুঁজুন", "Search")}>
          <Search className="size-5" />
        </button>
      </form>

      <Card className="space-y-3 p-4">
        <p className="font-semibold">{tx("পার্ট খুঁজে পাচ্ছেন না? আমরা এনে দেবো।", "Can't find it? We'll get it.")}</p>
        <ButtonLink href="/request?mode=voice" variant="accent" size="lg" full>
          <Mic className="size-5" aria-hidden /> {tx("বলে দিন কোন পার্ট লাগবে", "Tell us which part you need")}
        </ButtonLink>
        <ButtonLink href="/request" variant="outline" full>
          {tx("পার্ট চাই ফর্ম", "Request a part")}
        </ButtonLink>
      </Card>

      <Link href="/" className="inline-block min-h-10 font-semibold underline">
        {tx("হোমে ফিরে যান", "Back to home")}
      </Link>
    </Container>
  );
}
