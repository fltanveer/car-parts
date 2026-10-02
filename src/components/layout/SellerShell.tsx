"use client";

import clsx from "clsx";
import { Bell, Hand, Home, Menu, Package, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useDb } from "@/lib/db/store";
import { useT } from "../providers/LangProvider";
import { ShopLogo } from "../shared/Misc";
import { PanelSwitch } from "./PanelSwitch";

/** Seller chrome: phone-first, 5-tab nav with a big ➕ (file 02 §2.1). */
export function SellerShell({ children }: { children: ReactNode }) {
  const { tx, d, lang } = useT();
  const path = usePathname();
  const vendor = useDb((s) => s.vendors.find((v) => v.id === s.session.vendorId) ?? null);
  const newRequests = useDb((s) =>
    s.requests.filter((r) => ["open", "quotes_received"].includes(r.status) && r.matches.some((m) => m.vendor_id === s.session.vendorId && !m.declined) && !s.quotes.some((q) => q.request_id === r.id && q.vendor_id === s.session.vendorId)).length,
  );
  const newOrders = useDb((s) => s.vendorOrders.filter((o) => o.vendor_id === s.session.vendorId && o.status === "pending_vendor").length);
  const unreadNotes = useDb((s) => s.notifications.filter((n) => n.audience === "vendor" && n.target === s.session.vendorId && !n.read).length);

  const onboarding = path.startsWith("/seller/join");
  const tabs = [
    { href: "/seller", icon: Home, label: tx("আজ", "Today"), active: path === "/seller" },
    { href: "/seller/requests", icon: Hand, label: tx("দাম চাই", "Requests"), active: path.startsWith("/seller/requests"), count: newRequests },
    { href: "/seller/add", icon: Plus, label: tx("পণ্য যোগ", "Add"), active: path.startsWith("/seller/add"), big: true },
    { href: "/seller/orders", icon: Package, label: tx("অর্ডার", "Orders"), active: path.startsWith("/seller/orders"), count: newOrders },
    { href: "/seller/more", icon: Menu, label: tx("আরও", "More"), active: ["/seller/more", "/seller/products", "/seller/money", "/seller/messages", "/seller/reviews", "/seller/shop", "/seller/staff", "/seller/help", "/seller/claims", "/seller/verify", "/seller/notifications", "/seller/cars", "/seller/services"].some((p) => path.startsWith(p)) },
  ];

  return (
    <>
      <header className="no-print sticky top-0 z-40 bg-seller text-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-1 px-3">
          <Link href="/seller" className="mr-auto flex min-w-0 items-center gap-2">
            {vendor ? <ShopLogo name={lang === "bn" ? vendor.shop_name_bn : vendor.shop_name} color={vendor.logo_color} size="sm" /> : <span className="grid size-8 place-items-center rounded-lg bg-white font-black text-seller">G</span>}
            <span className="min-w-0">
              <span className="block truncate font-bold leading-tight">{vendor ? (lang === "bn" ? vendor.shop_name_bn : vendor.shop_name) : "GaariHub"}</span>
              <span className="block text-[11px] leading-tight text-white/70">{tx("বিক্রেতা প্যানেল", "Seller panel")}</span>
            </span>
          </Link>
          <Link href="/seller/notifications" className="relative grid size-11 place-items-center rounded-xl hover:bg-white/10" aria-label={tx("নোটিফিকেশন", "Notifications")}>
            <Bell className="size-5.5" />
            {unreadNotes > 0 && <span className="absolute right-0.5 top-0.5 grid min-w-5 place-items-center rounded-full bg-bad px-1 text-[11px] font-bold leading-5">{d(unreadNotes)}</span>}
          </Link>
          <PanelSwitch dark />
        </div>
      </header>
      <main className={clsx("flex-1 pt-4", onboarding ? "pb-10" : "pb-28")}>{children}</main>
      {!onboarding && (
        <nav aria-label={tx("বিক্রেতা মেনু", "Seller menu")} className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <ul className="mx-auto flex max-w-3xl items-end">
            {tabs.map((t) => (
              <li key={t.href} className="flex-1">
                <Link href={t.href} className={clsx("relative flex flex-col items-center gap-0.5 pb-2 pt-1.5 text-xs font-semibold", t.active ? "text-seller" : "text-ink-2")} aria-current={t.active ? "page" : undefined}>
                  {t.big ? (
                    <span className="-mt-6 grid size-16 place-items-center rounded-full bg-seller text-white shadow-lg ring-4 ring-card">
                      <t.icon className="size-9" aria-hidden />
                    </span>
                  ) : (
                    <span className="relative">
                      <t.icon className="size-6" aria-hidden />
                      {!!t.count && <span className="absolute -right-3 -top-1.5 grid min-w-5 place-items-center rounded-full bg-bad px-1 text-[11px] font-bold leading-5 text-white">{d(t.count)}</span>}
                    </span>
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
