"use client";

import clsx from "clsx";
import {
  Car,
  ChevronRight,
  CircleHelp,
  FileText,
  Languages,
  LogOut,
  MessageCircle,
  Package,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout, resetDemo, setBnDigits, useStore } from "@/lib/store";
import { useT } from "../providers/LangProvider";
import { Button, Card, Container, PageHeader, SectionTitle } from "../ui/primitives";
import { AddressBook } from "./AddressBook";
import { NotificationList } from "./NotificationList";
import { ProfileCard } from "./ProfileCard";

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={clsx("relative h-8 w-14 shrink-0 rounded-full transition-colors", on ? "bg-ok" : "bg-line")}
    >
      <span className={clsx("absolute top-1 size-6 rounded-full bg-white shadow transition-all", on ? "left-7" : "left-1")} />
    </button>
  );
}

function LinkRow({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex min-h-14 items-center gap-3 px-4 hover:bg-surface">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface">{icon}</span>
      <span className="flex-1 font-semibold">{label}</span>
      <ChevronRight className="size-5 text-muted" aria-hidden />
    </Link>
  );
}

export function AccountScreen() {
  const { t, tx, lang, setLang } = useT();
  const router = useRouter();
  const profile = useStore((s) => s.profile);
  const bnDigits = useStore((s) => s.bnDigits);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!profile) return null;

  return (
    <Container className="space-y-8">
      <PageHeader title={t("account")} subtitle={tx("আপনার তথ্য, ঠিকানা ও সেটিংস", "Your details, addresses and settings")} />

      <ProfileCard key={profile.phone} profile={profile} />

      <AddressBook defaultPhone={profile.phone} />

      <NotificationList />

      <section>
        <SectionTitle>
          <span className="inline-flex items-center gap-2">
            <Languages className="size-5" aria-hidden /> {tx("ভাষা ও সংখ্যা", "Language & numbers")}
          </span>
        </SectionTitle>
        <Card className="divide-y divide-line">
          <div className="flex min-h-16 items-center gap-3 px-4 py-3">
            <span className="flex-1 font-semibold">{tx("ভাষা", "Language")}</span>
            <div className="flex rounded-xl border border-line p-1" role="group" aria-label={tx("ভাষা", "Language")}>
              {(["bn", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={lang === l}
                  onClick={() => setLang(l)}
                  className={clsx("min-h-10 rounded-lg px-4 font-semibold", lang === l ? "bg-ink text-white" : "text-ink-2")}
                >
                  {l === "bn" ? "বাংলা" : "English"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex min-h-16 items-center gap-3 px-4 py-3">
            <span className="flex-1">
              <span className="block font-semibold">{tx("বাংলা সংখ্যা", "Bangla digits")}</span>
              <span className="block text-sm text-muted">
                {tx(bnDigits ? "যেমন ৳ ১,২০০" : "যেমন ৳ 1,200", "In Bangla mode, shows ৳ ১,২০০ instead of ৳ 1,200")}
              </span>
            </span>
            <Toggle on={bnDigits} onChange={setBnDigits} label={tx("বাংলা সংখ্যা", "Bangla digits")} />
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle>{tx("আরও", "More")}</SectionTitle>
        <Card className="divide-y divide-line overflow-hidden">
          <LinkRow href="/garage" icon={<Car className="size-5" />} label={t("my_car")} />
          <LinkRow href="/orders" icon={<Package className="size-5" />} label={tx("আমার অর্ডার", "My orders")} />
          <LinkRow href="/chat" icon={<MessageCircle className="size-5" />} label={tx("সাপোর্ট চ্যাট", "Support chat")} />
          <LinkRow href="/help" icon={<CircleHelp className="size-5" />} label={tx("সাহায্য", "Help")} />
          <LinkRow href="/policy/return" icon={<FileText className="size-5" />} label={tx("রিটার্ন পলিসি", "Return policy")} />
          <LinkRow href="/policy/warranty" icon={<FileText className="size-5" />} label={tx("ওয়ারেন্টি পলিসি", "Warranty policy")} />
          <LinkRow href="/policy/delivery" icon={<FileText className="size-5" />} label={tx("ডেলিভারি পলিসি", "Delivery policy")} />
          <LinkRow href="/policy/privacy" icon={<FileText className="size-5" />} label={tx("প্রাইভেসি", "Privacy")} />
        </Card>
      </section>

      <Button
        variant="danger"
        size="lg"
        full
        onClick={() => {
          logout();
          router.push("/");
        }}
      >
        <LogOut className="size-5" aria-hidden /> {t("logout")}
      </Button>

      <div className="border-t border-dashed border-line pt-4 text-center">
        {confirmReset ? (
          <div className="space-y-2">
            <p className="text-sm text-muted">
              {tx("সব ডেমো ডেটা (কার্ট, অর্ডার, চ্যাট) শুরুর অবস্থায় ফিরে যাবে।", "All demo data (cart, orders, chat) will go back to the start.")}
            </p>
            <div className="flex justify-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>
                {t("cancel")}
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  resetDemo();
                  router.push("/");
                }}
              >
                {tx("হ্যাঁ, রিসেট করুন", "Yes, reset")}
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
          >
            <RotateCcw className="size-4" aria-hidden /> {tx("ডেমো ডেটা রিসেট করুন", "Reset demo data")}
          </button>
        )}
      </div>
    </Container>
  );
}
