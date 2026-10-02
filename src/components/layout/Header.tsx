"use client";

import { Bell, ShoppingCart, UserRound } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useT } from "../providers/LangProvider";

export function Header() {
  const { t, lang, setLang, d } = useT();
  const cartCount = useStore((s) => s.cart.reduce((n, l) => n + l.qty, 0));
  const unread = useStore((s) => (s.profile ? s.notifications.filter((n) => !n.read).length : 0));
  const loggedIn = useStore((s) => !!s.profile);

  const iconBtn = "relative grid size-11 place-items-center rounded-xl hover:bg-ink/5";
  const badge = "absolute right-1 top-1 grid min-w-5 place-items-center rounded-full bg-danger px-1 text-[11px] font-bold leading-5 text-white";

  return (
    <header className="no-print sticky top-0 z-40 border-b border-line bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-1 px-3">
        <Link href="/" className="mr-auto flex items-center gap-2 px-1" aria-label="PartsBD">
          <span className="grid size-8 place-items-center rounded-lg bg-ink text-sm font-black text-accent">P</span>
          <span className="text-lg font-extrabold tracking-tight">
            Parts<span className="text-accent">BD</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setLang(lang === "bn" ? "en" : "bn")}
          className="min-h-10 rounded-lg border border-line px-2.5 text-sm font-bold hover:border-ink/40"
          aria-label={lang === "bn" ? "Switch to English" : "বাংলায় দেখুন"}
        >
          {t("lang_toggle")}
        </button>
        {loggedIn && (
          <Link href="/account#notifications" className={iconBtn} aria-label={lang === "bn" ? "নোটিফিকেশন" : "Notifications"}>
            <Bell className="size-5.5" />
            {unread > 0 && <span className={badge}>{d(unread)}</span>}
          </Link>
        )}
        <Link href="/cart" className={iconBtn} aria-label={t("cart")}>
          <ShoppingCart className="size-5.5" />
          {cartCount > 0 && <span className={badge}>{d(cartCount)}</span>}
        </Link>
        <Link href={loggedIn ? "/account" : "/login"} className={iconBtn} aria-label={t("account")}>
          <UserRound className="size-5.5" />
        </Link>
      </div>
    </header>
  );
}
