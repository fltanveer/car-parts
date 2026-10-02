"use client";

import clsx from "clsx";
import { ClipboardList, Home, MessageCircle, Mic, Phone, Search, ShoppingCart, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useDb } from "@/lib/db/store";
import { telLink } from "@/lib/links";
import { useT } from "../providers/LangProvider";
import { PanelSwitch } from "./PanelSwitch";

/** Customer chrome: top bar (cart, messages, help) + 5-tab bottom nav (file 01 §1.1). */
export function CustomerShell({ children }: { children: ReactNode }) {
  const { tx, d } = useT();
  const path = usePathname();
  const cartCount = useDb((s) => s.cart.reduce((n, l) => n + l.qty, 0));
  const unread = useDb((s) => s.threads.filter((t) => t.type !== "vendor_support" && t.customer_phone === s.session.customerPhone).reduce((n, t) => n + t.unread_customer, 0));
  const iconBtn = "relative grid size-11 place-items-center rounded-xl hover:bg-ink/5";
  const badge = "absolute right-0.5 top-0.5 grid min-w-5 place-items-center rounded-full bg-bad px-1 text-[11px] font-bold leading-5 text-white";

  // Full-screen flows hide the bottom nav so there is one main action (rule 1).
  const hideNav = path.startsWith("/checkout") || /^\/messages\/.+/.test(path);

  const tabs = [
    { href: "/", icon: Home, label: tx("হোম", "Home"), active: path === "/" },
    { href: "/search", icon: Search, label: tx("খুঁজুন", "Search"), active: path.startsWith("/search") || path.startsWith("/c/") || path.startsWith("/shops") },
    { href: "/request?mode=voice", icon: Mic, label: tx("বলুন", "Speak"), active: path.startsWith("/request"), big: true },
    { href: "/my", icon: ClipboardList, label: tx("আমার কাজ", "My stuff"), active: path.startsWith("/my") },
    { href: "/account", icon: UserRound, label: tx("আমি", "Me"), active: path.startsWith("/account") || path.startsWith("/garage") },
  ];

  return (
    <>
      <header className="no-print sticky top-0 z-40 border-b border-line bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-0.5 px-3">
          <Link href="/" className="mr-auto flex items-center gap-2 px-1" aria-label="GaariHub">
            <span className="grid size-8 place-items-center rounded-lg bg-brand text-sm font-black text-white">G</span>
            <span className="text-lg font-extrabold tracking-tight">
              Gaari<span className="text-brand">Hub</span>
            </span>
          </Link>
          <a href={telLink()} className={iconBtn} aria-label={tx("সাহায্য: কল করুন", "Help: call us")}>
            <Phone className="size-5 text-ok" />
          </a>
          <Link href="/messages" className={iconBtn} aria-label={tx("মেসেজ", "Messages")}>
            <MessageCircle className="size-5.5" />
            {unread > 0 && <span className={badge}>{d(unread)}</span>}
          </Link>
          <Link href="/cart" className={iconBtn} aria-label={tx("কার্ট", "Cart")}>
            <ShoppingCart className="size-5.5" />
            {cartCount > 0 && <span className={badge}>{d(cartCount)}</span>}
          </Link>
          <PanelSwitch />
        </div>
      </header>

      <main className={clsx("flex-1 pt-4", hideNav ? "pb-10" : "pb-28")}>{children}</main>

      {!hideNav && (
        <nav aria-label={tx("প্রধান মেনু", "Main menu")} className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <ul className="mx-auto flex max-w-3xl items-end">
            {tabs.map((t) => (
              <li key={t.href} className="flex-1">
                <Link href={t.href} className={clsx("flex flex-col items-center gap-0.5 pb-2 pt-1.5 text-xs font-semibold", t.active ? "text-brand" : "text-ink-2")} aria-current={t.active ? "page" : undefined}>
                  {t.big ? (
                    <span className="-mt-6 grid size-16 place-items-center rounded-full bg-bad text-white shadow-lg ring-4 ring-card">
                      <t.icon className="size-8" aria-hidden />
                    </span>
                  ) : (
                    <t.icon className="size-6" aria-hidden />
                  )}
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
