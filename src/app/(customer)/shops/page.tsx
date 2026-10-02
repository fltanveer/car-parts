"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { AudioGuide } from "@/components/layout/AudioGuide";
import { BackButton, HelpCall } from "@/components/shared/Misc";
import { useT } from "@/components/providers/LangProvider";
import { Container, Input, PageHeader } from "@/components/ui/primitives";
import { ShopsBrowser } from "@/components/customer/shop/ShopsBrowser";

/** Find shops by market and specialty (file 01 4.5). */
export default function ShopsPage() {
  const { tx } = useT();
  const [q, setQ] = useState("");
  return (
    <Container className="space-y-4">
      <PageHeader back={<BackButton href="/" />} title={tx("দোকান খুঁজুন", "Find shops")} subtitle={tx("বাজার আর বিশেষত্ব বেছে নিন", "Pick a market and a specialty")}>
        <AudioGuide compact text={tx("উপরের বোতাম থেকে বাজার (যেমন ধোলাইখাল) আর কী ধরনের দোকান চান বেছে নিন। সবুজ টিক মানে আমরা দোকান যাচাই করেছি। দোকানে চাপলে সব পণ্য দেখবেন।", "Pick a market (e.g. Dholaikhal) and the kind of shop. A green tick means we verified the shop. Tap a shop to see its products.")} />
      </PageHeader>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tx("দোকানের নাম (ঐচ্ছিক)", "Shop name (optional)")} className="pl-12" aria-label={tx("দোকানের নাম", "Shop name")} />
      </div>
      <ShopsBrowser q={q} />
      <HelpCall />
    </Container>
  );
}
