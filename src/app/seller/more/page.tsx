"use client";

import Link from "next/link";
import { useT } from "@/components/providers/LangProvider";
import { SellerGate, useVendor } from "@/components/seller/Gate";
import { SellerPage } from "@/components/seller/SellerPage";
import { Card, Chip, SectionTitle, Toggle } from "@/components/ui/primitives";
import { setPrefs, switchVendor } from "@/lib/db/actions";
import { resetDemo, useDb } from "@/lib/db/store";

function More() {
  const { tx, d, lang, setLang } = useT();
  const v = useVendor()!;
  const vid = v.id;
  const prefs = useDb((s) => s.prefs);
  const vendors = useDb((s) => s.vendors);
  const unread = useDb((s) => s.threads.filter((t) => t.vendor_id === vid && t.type !== "customer_support").reduce((a, t) => a + t.unread_vendor, 0));
  const claims = useDb((s) => s.claims.filter((c) => c.vendor_id === vid && c.status === "vendor_review").length);
  const products = useDb((s) => s.listings.filter((l) => l.vendor_id === vid && l.status !== "removed").length);

  const tiles: { href: string; icon: string; bn: string; en: string; badge?: number; soon?: boolean }[] = [
    { href: "/seller/products", icon: "📦", bn: "আমার পণ্য", en: "My products", badge: products },
    { href: "/seller/money", icon: "💰", bn: "টাকা", en: "Money" },
    { href: "/seller/messages", icon: "💬", bn: "মেসেজ", en: "Messages", badge: unread },
    { href: "/seller/reviews", icon: "⭐", bn: "রিভিউ ও স্কোর", en: "Reviews & score" },
    { href: "/seller/claims", icon: "⚠️", bn: "সমস্যা/দাবি", en: "Claims", badge: claims },
    { href: "/seller/shop", icon: "🏪", bn: "দোকান সেটিংস", en: "Shop settings" },
    { href: "/seller/staff", icon: "👥", bn: "কর্মচারী", en: "Staff" },
    { href: "/seller/verify", icon: "✅", bn: "যাচাই", en: "Verification" },
    { href: "/seller/notifications", icon: "🔔", bn: "নোটিফিকেশন", en: "Notifications" },
    { href: "/seller/help", icon: "🆘", bn: "সাহায্য ও ভিডিও", en: "Help & videos" },
    { href: "/seller/cars", icon: "🚙", bn: "গাড়ির বিজ্ঞাপন", en: "Car ads", soon: true },
    { href: "/seller/services", icon: "🧰", bn: "সেবা ও বুকিং", en: "Services", soon: true },
  ];

  return (
    <SellerPage title={tx("☰ আরও", "☰ More")} guide={tx("যে কাজ করতে চান তার বড় বাটন চাপুন।", "Tap the big button for what you want to do.")}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className="relative flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-line bg-card p-3 text-center font-bold hover:border-ink/30">
            <span className="text-3xl">{t.icon}</span>
            {tx(t.bn, t.en)}
            {t.soon && <span className="text-xs font-semibold text-muted">{tx("শীঘ্রই", "Soon")}</span>}
            {!!t.badge && <span className="absolute right-2 top-2 grid min-w-6 place-items-center rounded-full bg-ink px-1.5 text-xs leading-6 text-white">{d(t.badge)}</span>}
          </Link>
        ))}
      </div>

      <section>
        <SectionTitle>{tx("দেখার সুবিধা", "Display")}</SectionTitle>
        <Card className="space-y-1 p-4">
          <Toggle checked={prefs.largeText} onChange={(largeText) => setPrefs({ largeText })} label={tx("🔠 বড় লেখা", "🔠 Large text")} />
          <Toggle checked={prefs.bnDigits} onChange={(bnDigits) => setPrefs({ bnDigits })} label={tx("১২৩ বাংলা সংখ্যা", "Bangla digits")} />
          <div className="flex gap-2 pt-2">
            <Chip active={lang === "bn"} onClick={() => setLang("bn")}>বাংলা</Chip>
            <Chip active={lang === "en"} onClick={() => setLang("en")}>English</Chip>
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle>{tx("ডেমো: অন্য দোকান হিসেবে দেখুন", "Demo: switch shop")}</SectionTitle>
        <Card className="space-y-3 p-4">
          <div className="flex flex-wrap gap-2">
            {vendors.map((x) => (
              <Chip key={x.id} active={x.id === vid} onClick={() => switchVendor(x.id)}>
                {lang === "bn" ? x.shop_name_bn : x.shop_name} · {tx("স্তর", "L")}{d(x.verification_level)}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/seller/join" onClick={() => switchVendor(null)} className="font-semibold text-brand underline">{tx("নতুন বিক্রেতা হিসেবে শুরু", "Start as a new seller")}</Link>
            <button type="button" className="font-semibold text-bad underline" onClick={() => resetDemo()}>{tx("ডেমো ডেটা রিসেট", "Reset demo data")}</button>
          </div>
        </Card>
      </section>
    </SellerPage>
  );
}

export default function Page() {
  return (
    <SellerGate>
      <More />
    </SellerGate>
  );
}
