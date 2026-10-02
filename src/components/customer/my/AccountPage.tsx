"use client";

import { ChevronRight, LogOut, RotateCcw, Store } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { logoutCustomer, setPrefs, toggleFollow } from "@/lib/db/actions";
import { getMarket } from "@/lib/db/queries";
import { resetDemo, useDb, useHydrated } from "@/lib/db/store";
import { displayPhone } from "@/lib/format";
import type { Profile } from "@/lib/types";
import { AudioGuide } from "../../layout/AudioGuide";
import { HelpCall, ShopLogo, toast } from "../../shared/Misc";
import { useT } from "../../providers/LangProvider";
import { Button, Card, Chip, Container, Input, PageHeader, SectionTitle, Toggle } from "../../ui/primitives";
import { Sheet } from "../../ui/Sheet";
import { AddressBook } from "./AddressBook";
import { LoginNeeded } from "./common";
import { updateProfile } from "./customerActions";
import { NotificationList } from "./NotificationList";

const TYPES: { v: Profile["customer_type"]; icon: string; bn: string; en: string }[] = [
  { v: "personal", icon: "🚗", bn: "নিজের গাড়ি", en: "Car owner" },
  { v: "driver", icon: "🧑‍✈️", bn: "ড্রাইভার", en: "Driver" },
  { v: "mechanic", icon: "🧰", bn: "মেকানিক", en: "Mechanic" },
  { v: "fleet", icon: "🚚", bn: "অনেক গাড়ি (ফ্লিট)", en: "Fleet" },
];

/** /account: profile, addresses, cars, followed shops, settings, notifications (file 01 §12). */
export function AccountPage() {
  const { tx, d, lang, setLang } = useT();
  const router = useRouter();
  const hydrated = useHydrated();
  const db = useDb((s) => s);
  const [resetOpen, setResetOpen] = useState(false);
  if (!hydrated) return <Container className="h-96 animate-pulse" />;
  const phone = db.session.customerPhone;
  const profile = db.profiles.find((p) => p.phone === phone) ?? null;
  const cars = db.vehicles.filter((v) => v.owner === phone).length;
  const followed = db.vendors.filter((v) => profile?.followed_vendor_ids.includes(v.id));

  const link = (href: string, icon: string, label: string, extra?: string) => (
    <Link href={href} className="flex min-h-14 items-center gap-3 px-4 hover:bg-surface">
      <span className="text-xl" aria-hidden>
        {icon}
      </span>
      <span className="flex-1 font-semibold">{label}</span>
      {extra && <span className="text-sm text-muted">{extra}</span>}
      <ChevronRight className="size-5 text-muted" aria-hidden />
    </Link>
  );

  return (
    <Container className="space-y-6">
      <PageHeader title={`👤 ${profile?.full_name ?? tx("আমি", "Me")}`} subtitle={phone ? d(displayPhone(phone)) : tx("লগইন করা নেই", "Not logged in")} />
      <AudioGuide text={tx("এখানে আপনার নাম, ঠিকানা, গাড়ি আর সেটিংস। বড় লেখা চাইলে 'বড় লেখা' চালু করুন।", "Your name, addresses, cars and settings are here. Turn on 'Large text' if you need bigger letters.")} />

      {!phone && <LoginNeeded next="/account" why={tx("ঠিকানা, অর্ডার আর নোটিফিকেশন দেখতে লগইন করুন।", "Log in to see addresses, orders and notifications.")} />}

      {phone && profile && (
        <section className="space-y-3">
          <SectionTitle>🙂 {tx("প্রোফাইল", "Profile")}</SectionTitle>
          <NameForm key={profile.full_name ?? ""} phone={phone} initial={profile.full_name ?? ""} />
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map((t) => (
              <Chip key={t.v} active={profile.customer_type === t.v} onClick={() => updateProfile(phone, { customer_type: t.v })} className="justify-center">
                {t.icon} {tx(t.bn, t.en)}
              </Chip>
            ))}
          </div>
        </section>
      )}

      <Card className="divide-y divide-line overflow-hidden">
        {link("/garage", "🚗", tx("আমার গাড়ি", "My cars"), cars ? tx(`${d(cars)}টা`, String(cars)) : undefined)}
        {link("/my", "📦", tx("আমার কাজ", "My stuff"))}
        {link("/messages", "💬", tx("মেসেজ", "Messages"))}
      </Card>

      {phone && <AddressBook phone={phone} name={profile?.full_name ?? ""} />}

      {phone && (
        <section>
          <SectionTitle>🏪 {tx("ফলো করা দোকান", "Followed shops")}</SectionTitle>
          {followed.length === 0 ? (
            <p className="text-muted">{tx("দোকানের পেজে 'ফলো' চাপলে নতুন পণ্যের খবর পাবেন।", "Tap 'Follow' on a shop page to get news of new products.")}</p>
          ) : (
            <ul className="space-y-2">
              {followed.map((v) => (
                <li key={v.id} className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3">
                  <ShopLogo name={v.shop_name_bn} color={v.logo_color} size="sm" />
                  <Link href={`/shop/${v.slug}`} className="min-w-0 flex-1">
                    <span className="block font-semibold">{lang === "bn" ? v.shop_name_bn : v.shop_name}</span>
                    <span className="text-sm text-muted">{lang === "bn" ? getMarket(v.market_area).bn : getMarket(v.market_area).en}</span>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => toggleFollow(v.id)}>
                    {tx("আনফলো", "Unfollow")}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {phone && <NotificationList phone={phone} />}

      <section className="space-y-1">
        <SectionTitle>⚙️ {tx("সেটিংস", "Settings")}</SectionTitle>
        <Card className="space-y-1 px-4 py-2">
          <div className="flex min-h-12 items-center justify-between gap-3">
            <span className="font-semibold">🌐 {tx("ভাষা", "Language")}</span>
            <div className="flex gap-2">
              <Chip active={lang === "bn"} onClick={() => setLang("bn")}>
                বাংলা
              </Chip>
              <Chip active={lang === "en"} onClick={() => setLang("en")}>
                English
              </Chip>
            </div>
          </div>
          <Toggle
            size="lg"
            checked={db.prefs.largeText}
            onChange={(v) => {
              setPrefs({ largeText: v });
              if (phone) updateProfile(phone, { large_text: v });
            }}
            label={`🔠 ${tx("বড় লেখা", "Large text")}`}
          />
          <Toggle size="lg" checked={db.prefs.bnDigits} onChange={(v) => setPrefs({ bnDigits: v })} label={`১২৩ ${tx("বাংলা সংখ্যা", "Bangla digits")}`} />
          {phone && profile && <Toggle size="lg" checked={profile.notify_sms} onChange={(v) => updateProfile(phone, { notify_sms: v })} label={`📩 ${tx("SMS-এ জানান", "SMS notifications")}`} />}
        </Card>
      </section>

      <Card className="divide-y divide-line overflow-hidden">
        {link("/help", "🆘", tx("সাহায্য ও গাইড", "Help & guides"))}
        {link("/policy", "📜", tx("নিয়ম ও নীতি", "Policies"))}
        {link("/services", "🧰", tx("সেবা (শীঘ্রই)", "Services (soon)"))}
      </Card>

      <Link href="/seller/join" className="flex items-center gap-3 rounded-2xl border-2 border-seller/30 bg-card p-4 hover:border-seller/60">
        <Store className="size-8 text-seller" aria-hidden />
        <span className="flex-1">
          <b className="block">{tx("আমি কি বিক্রেতা হতে পারি?", "Can I become a seller?")}</b>
          <span className="text-sm text-muted">{tx("আপনার দোকান গাড়িহাবে তুলুন, কমিশন কম", "List your shop on GaariHub, low commission")}</span>
        </span>
        <ChevronRight className="size-5 text-muted" aria-hidden />
      </Link>

      <div className="grid grid-cols-2 gap-2">
        {phone ? (
          <Button
            variant="danger"
            onClick={() => {
              logoutCustomer();
              toast(tx("লগআউট হয়েছে", "Logged out"), "info");
              router.push("/");
            }}
          >
            <LogOut className="size-5" aria-hidden /> {tx("লগআউট", "Log out")}
          </Button>
        ) : (
          <span />
        )}
        <Button variant="ghost" onClick={() => setResetOpen(true)}>
          <RotateCcw className="size-5" aria-hidden /> {tx("ডেমো রিসেট", "Reset demo")}
        </Button>
      </div>
      <Sheet open={resetOpen} onClose={() => setResetOpen(false)} title={tx("ডেমো রিসেট করবেন?", "Reset the demo?")}>
        <div className="space-y-3 pb-3">
          <p>{tx("সব ডেমো ডেটা শুরুর অবস্থায় ফিরে যাবে (অর্ডার, রিকোয়েস্ট, মেসেজ)।", "All demo data (orders, requests, messages) goes back to the start.")}</p>
          <Button
            variant="danger"
            size="lg"
            full
            onClick={() => {
              resetDemo();
              setResetOpen(false);
              toast(tx("ডেমো রিসেট হয়েছে", "Demo reset"), "info");
            }}
          >
            {tx("হ্যাঁ, রিসেট করুন", "Yes, reset")}
          </Button>
        </div>
      </Sheet>
      <HelpCall />
    </Container>
  );
}

function NameForm({ phone, initial }: { phone: string; initial: string }) {
  const { tx } = useT();
  const [name, setName] = useState(initial);
  return (
    <div className="flex gap-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={tx("আপনার নাম", "Your name")} autoComplete="name" aria-label={tx("নাম", "Name")} />
      <Button
        variant="brand"
        disabled={!name.trim() || name.trim() === initial}
        onClick={() => {
          updateProfile(phone, { full_name: name.trim() });
          toast(tx("নাম সেভ হয়েছে", "Name saved"));
        }}
      >
        {tx("সেভ", "Save")}
      </Button>
    </div>
  );
}
