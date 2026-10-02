"use client";

import { Car, Store, Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AudioGuide } from "@/components/layout/AudioGuide";
import { HelpCall } from "@/components/shared/Misc";
import { useT } from "@/components/providers/LangProvider";
import { Container, Notice, Tabs } from "@/components/ui/primitives";
import { MyCarChip } from "@/components/customer/shop/MyCarChip";
import { ResultsView } from "@/components/customer/shop/ResultsView";
import { SearchBox } from "@/components/customer/shop/SearchBox";
import { ShopsBrowser } from "@/components/customer/shop/ShopsBrowser";

type Tab = "parts" | "shops" | "cars";

export function SearchView() {
  const { tx } = useT();
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get("q") ?? "";
  const tab = (["parts", "shops", "cars"].includes(params.get("tab") ?? "") ? params.get("tab") : "parts") as Tab;
  const [draft, setDraft] = useState(q);
  const [lastQ, setLastQ] = useState(q);
  if (q !== lastQ) {
    // Back/forward navigation changed the query: keep the input in sync.
    setLastQ(q);
    setDraft(q);
  }

  const go = (nextQ: string, nextTab: Tab = tab) => {
    const p = new URLSearchParams();
    if (nextQ.trim()) p.set("q", nextQ.trim());
    if (nextTab !== "parts") p.set("tab", nextTab);
    router.replace(`/search${p.size ? `?${p}` : ""}`, { scroll: false });
  };

  return (
    <Container className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{tx("খুঁজুন", "Search")}</h1>
        <AudioGuide
          compact
          text={tx(
            "পার্টের নাম বাংলা বা ইংরেজিতে লিখুন, বা পার্ট নম্বর দিন। মাইক চেপে বলতেও পারেন। আপনার গাড়ির সাথে মেলে এমন জিনিস আগে দেখাবো। না পেলে নিচের 'দাম নিন' চাপুন।",
            "Type the part name in Bangla or English, or a part number. You can also tap the mic and speak. Parts that fit your car show first. If not found, tap 'Get prices' below.",
          )}
        />
      </div>
      <SearchBox value={draft} onChange={setDraft} onSubmit={(v) => go(v)} autoFocus={!q} />
      <MyCarChip />
      <Tabs<Tab>
        value={tab}
        onChange={(t) => go(draft, t)}
        items={[
          { value: "parts", label: <span className="inline-flex items-center gap-1.5"><Wrench className="size-4" aria-hidden />{tx("পার্টস", "Parts")}</span> },
          { value: "shops", label: <span className="inline-flex items-center gap-1.5"><Store className="size-4" aria-hidden />{tx("দোকান", "Shops")}</span> },
          { value: "cars", label: <span className="inline-flex items-center gap-1.5"><Car className="size-4" aria-hidden />{tx("গাড়ি", "Cars")}</span> },
        ]}
      />

      {tab === "parts" && <ResultsView q={q} />}
      {tab === "shops" && <ShopsBrowser q={q} />}
      {tab === "cars" && (
        <div className="space-y-3">
          <Notice tone="wait">
            {tx("গাড়ি কেনা-বেচা শীঘ্রই আসছে (ফেজ ২)। আগ্রহী হলে নাম লিখিয়ে রাখুন, চালু হলে জানাবো।", "Buying & selling cars is coming soon (phase 2). Register interest and we'll tell you when it launches.")}
          </Notice>
          <Link href="/cars" className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-lg font-semibold text-white">
            🚙 {tx("আগ্রহ জানান", "Register interest")}
          </Link>
        </div>
      )}
      <HelpCall />
    </Container>
  );
}
