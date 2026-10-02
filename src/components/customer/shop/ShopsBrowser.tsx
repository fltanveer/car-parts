"use client";

import { useMemo, useState } from "react";
import { isVendorOpenNow, publicListings } from "@/lib/db/queries";
import type { DB } from "@/lib/db/seed";
import { useDb } from "@/lib/db/store";
import { markets } from "@/lib/mock/settings";
import type { Vendor } from "@/lib/types";
import { useNow } from "@/components/shared/Misc";
import { useT } from "@/components/providers/LangProvider";
import { Chip, EmptyState } from "@/components/ui/primitives";
import { ChipRow } from "./Bits";
import { compact, homeDistrict } from "./data";
import { RequestPromptCard } from "./RequestPromptCard";
import { ShopCard } from "./ShopCard";

const whole = (s: DB) => s;

// Specialty chips (file 01 4.5): makes, divisions and shop types.
const SPECIALTIES: { id: string; bn: string; en: string; test: (v: Vendor) => boolean }[] = [
  { id: "toyota", bn: "Toyota", en: "Toyota", test: (v) => v.specialty_makes.includes("mk-toyota") },
  { id: "honda", bn: "Honda", en: "Honda", test: (v) => v.specialty_makes.includes("mk-honda") },
  { id: "nissan", bn: "Nissan", en: "Nissan", test: (v) => v.specialty_makes.includes("mk-nissan") },
  { id: "engine", bn: "⚙️ ইঞ্জিন", en: "⚙️ Engine", test: (v) => v.specialty_categories.includes("c-engine") },
  { id: "body", bn: "🚗 বডি পার্টস", en: "🚗 Body parts", test: (v) => v.specialty_categories.includes("c-body") },
  { id: "light", bn: "💡 লাইট", en: "💡 Lights", test: (v) => v.specialty_categories.includes("c-lighting") },
  { id: "tyre", bn: "🛞 টায়ার", en: "🛞 Tyres", test: (v) => v.specialty_categories.includes("c-wheels-tyres") },
  { id: "battery", bn: "🔋 ব্যাটারি", en: "🔋 Battery", test: (v) => v.specialty_categories.includes("c-battery-charging") },
  { id: "oil", bn: "🛢️ তেল-ফিল্টার", en: "🛢️ Oil & filters", test: (v) => v.specialty_categories.includes("c-service") || v.vendor_types.includes("lubricant") },
  { id: "halfcut", bn: "🚙 হাফকাট", en: "🚙 Half-cut", test: (v) => v.vendor_types.includes("halfcut") },
  { id: "accessories", bn: "✨ অ্যাক্সেসরিজ", en: "✨ Accessories", test: (v) => v.vendor_types.includes("accessories") },
];

/** Shop finder: market + specialty chips, open now, verified only, near (file 01 4.5). */
export function ShopsBrowser({ q = "" }: { q?: string }) {
  const { tx, L, d } = useT();
  const s = useDb(whole);
  const now = useNow();
  const [market, setMarket] = useState<string | null>(null);
  const [spec, setSpec] = useState<string | null>(null);
  const [openNow, setOpenNow] = useState(false);
  const [verified, setVerified] = useState(false);
  const [near, setNear] = useState(false);
  const district = homeDistrict(s);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    publicListings(s).forEach((l) => m.set(l.vendor_id, (m.get(l.vendor_id) ?? 0) + 1));
    return m;
  }, [s]);

  const shops = useMemo(() => {
    const term = compact(q);
    const sp = SPECIALTIES.find((x) => x.id === spec);
    return s.vendors
      .filter((v) => v.status === "active")
      .filter((v) => !term || compact(`${v.shop_name}${v.shop_name_bn}${L(markets.find((m) => m.id === v.market_area))}`).includes(term))
      .filter((v) => !market || v.market_area === market)
      .filter((v) => !sp || sp.test(v))
      .filter((v) => !openNow || isVendorOpenNow(v, new Date(now)))
      .filter((v) => !verified || v.verification_level >= 2)
      .sort((a, b) => (near ? Number(b.district === district) - Number(a.district === district) : 0) || b.score - a.score);
  }, [s, q, market, spec, openNow, verified, near, district, now, L]);

  return (
    <div className="space-y-3">
      <ChipRow>
        <Chip active={!market} onClick={() => setMarket(null)}>
          {tx("সব বাজার", "All markets")}
        </Chip>
        {markets.map((m) => (
          <Chip key={m.id} active={market === m.id} onClick={() => setMarket(market === m.id ? null : m.id)}>
            📍 {L(m)}
          </Chip>
        ))}
      </ChipRow>
      <ChipRow>
        {SPECIALTIES.map((x) => (
          <Chip key={x.id} active={spec === x.id} onClick={() => setSpec(spec === x.id ? null : x.id)}>
            {L(x)}
          </Chip>
        ))}
      </ChipRow>
      <ChipRow>
        <Chip active={openNow} onClick={() => setOpenNow(!openNow)}>
          🟢 {tx("এখন খোলা", "Open now")}
        </Chip>
        <Chip active={verified} onClick={() => setVerified(!verified)}>
          ✅ {tx("শুধু যাচাইকৃত", "Verified only")}
        </Chip>
        <Chip active={near} onClick={() => setNear(!near)}>
          📍 {tx("কাছে আগে", "Nearest first")}
        </Chip>
      </ChipRow>

      <p className="text-sm text-muted" aria-live="polite">
        {tx(`${d(shops.length)}টা দোকান`, `${shops.length} shops`)}
      </p>
      {shops.length ? (
        <ul className="space-y-3">
          {shops.map((v) => (
            <li key={v.id}>
              <ShopCard vendor={v} productCount={counts.get(v.id) ?? 0} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon="🏪" title={tx("এই ফিল্টারে দোকান নেই", "No shops match")} body={tx("ফিল্টার কমিয়ে দেখুন, বা নিচে থেকে দাম চান।", "Try fewer filters, or ask for prices below.")} />
      )}
      <RequestPromptCard text={q} />
    </div>
  );
}
