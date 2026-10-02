"use client";

import clsx from "clsx";
import {
  BarChart3, Boxes, Car, ClipboardCheck, FileWarning, Gauge, Hand, Headphones, Inbox, LayoutDashboard, ListChecks, MapPin, Menu,
  MessagesSquare, Package, PhoneCall, Scale, ScrollText, Search, Settings, ShieldAlert, Store, Truck, Users, Wallet, X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useDb } from "@/lib/db/store";
import { staffRoleLabel } from "@/lib/labels";
import { switchStaff } from "@/lib/db/actions";
import { useT } from "../providers/LangProvider";
import { PanelSwitch } from "./PanelSwitch";

interface NavItem {
  href: string;
  bn: string;
  en: string;
  icon: typeof Gauge;
  count?: (s: ReturnType<typeof useCounts>) => number;
}

const useCounts = () =>
  useDb((s) => ({
    requests: s.requests.filter((r) => r.status === "needs_clarification").length,
    verification: s.vendors.filter((v) => v.verifications.some((x) => x.status === "submitted")).length,
    moderation: s.moderation.filter((m) => m.status === "open").length,
    intake: s.intake.filter((i) => i.status === "new").length,
    disputes: s.claims.filter((c) => ["escalated", "admin_review"].includes(c.status)).length,
    payments: s.orders.reduce((n, o) => n + o.payments.filter((p) => p.status === "submitted").length, 0),
    refunds: s.refunds.filter((r) => r.status !== "done").length,
    complaints: s.complaints.filter((c) => c.status === "open").length,
    garage: s.garageTasks.filter((g) => g.status === "open").length,
    orders: s.vendorOrders.filter((v) => v.status === "pending_vendor").length,
  }));

const groups: { bn: string; en: string; items: NavItem[] }[] = [
  {
    bn: "প্রতিদিনের কাজ", en: "Daily work",
    items: [
      { href: "/admin", bn: "ড্যাশবোর্ড", en: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/requests", bn: "রিকোয়েস্ট ডেস্ক", en: "Request desk", icon: Hand, count: (c) => c.requests },
      { href: "/admin/orders", bn: "অর্ডার", en: "Orders", icon: Package, count: (c) => c.orders },
      { href: "/admin/disputes", bn: "বিরোধ ও দাবি", en: "Disputes", icon: Scale, count: (c) => c.disputes },
      { href: "/admin/intake", bn: "WhatsApp ইনটেক", en: "WhatsApp intake", icon: Inbox, count: (c) => c.intake },
      { href: "/admin/messages", bn: "সাপোর্ট ইনবক্স", en: "Support inbox", icon: MessagesSquare },
      { href: "/admin/calls", bn: "কল লগ", en: "Call log", icon: PhoneCall },
    ],
  },
  {
    bn: "বিক্রেতা ও বিশ্বাস", en: "Sellers & trust",
    items: [
      { href: "/admin/vendors", bn: "বিক্রেতা", en: "Sellers", icon: Store },
      { href: "/admin/vendors/verification", bn: "যাচাই কিউ", en: "Verification", icon: ClipboardCheck, count: (c) => c.verification },
      { href: "/admin/vendors/leads", bn: "সম্ভাব্য বিক্রেতা", en: "Leads", icon: ListChecks },
      { href: "/admin/field", bn: "মাঠকর্মী", en: "Field agents", icon: MapPin },
      { href: "/admin/moderation", bn: "মডারেশন", en: "Moderation", icon: ShieldAlert, count: (c) => c.moderation },
      { href: "/admin/complaints", bn: "অভিযোগ ও রিপোর্ট", en: "Complaints", icon: FileWarning, count: (c) => c.complaints },
    ],
  },
  {
    bn: "ক্যাটালগ", en: "Catalog",
    items: [
      { href: "/admin/catalog/products", bn: "মাস্টার পণ্য", en: "Master products", icon: Boxes },
      { href: "/admin/catalog/listings", bn: "সব লিস্টিং", en: "All listings", icon: ListChecks },
      { href: "/admin/catalog/categories", bn: "ক্যাটাগরি ও অ্যাট্রিবিউট", en: "Categories", icon: ScrollText },
      { href: "/admin/catalog/vehicles", bn: "গাড়ির ডেটা", en: "Vehicles", icon: Car },
      { href: "/admin/catalog/dictionary", bn: "শব্দভাণ্ডার", en: "Dictionary", icon: Search },
    ],
  },
  {
    bn: "টাকা ও লজিস্টিকস", en: "Money & logistics",
    items: [
      { href: "/admin/finance/payments", bn: "পেমেন্ট যাচাই", en: "Payments", icon: Wallet, count: (c) => c.payments },
      { href: "/admin/finance/refunds", bn: "রিফান্ড", en: "Refunds", icon: Wallet, count: (c) => c.refunds },
      { href: "/admin/finance/payouts", bn: "পেআউট", en: "Payouts", icon: Wallet },
      { href: "/admin/finance/cod", bn: "COD মেলানো", en: "COD reconciliation", icon: Wallet },
      { href: "/admin/finance/ledger", bn: "লেজার", en: "Ledger", icon: ScrollText },
      { href: "/admin/logistics", bn: "পিকআপ ও হাব", en: "Pickup & hub", icon: Truck },
    ],
  },
  {
    bn: "কাস্টমার", en: "Customers",
    items: [
      { href: "/admin/customers", bn: "কাস্টমার", en: "Customers", icon: Users },
      { href: "/admin/garage-docs", bn: "গাড়ির কাগজ যাচাই", en: "Garage docs", icon: ClipboardCheck, count: (c) => c.garage },
    ],
  },
  {
    bn: "সিস্টেম", en: "System",
    items: [
      { href: "/admin/reports", bn: "রিপোর্ট", en: "Reports", icon: BarChart3 },
      { href: "/admin/settings", bn: "সেটিংস", en: "Settings", icon: Settings },
      { href: "/admin/staff", bn: "স্টাফ ও রোল", en: "Staff & roles", icon: Headphones },
      { href: "/admin/audit", bn: "অডিট লগ", en: "Audit log", icon: ScrollText },
    ],
  },
];

/** Desktop-first admin chrome with sidebar + Ctrl+K search (file 03 §1). */
export function AdminShell({ children }: { children: ReactNode }) {
  const { tx, d, lang, L } = useT();
  const path = usePathname();
  const router = useRouter();
  const counts = useCounts();
  const staff = useDb((s) => s.staff);
  const me = useDb((s) => s.staff.find((x) => x.id === s.session.staffId) ?? null);
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) => (href === "/admin" ? path === "/admin" : path === href || (path.startsWith(href + "/") && !groups.some((g) => g.items.some((i) => i.href !== href && i.href.startsWith(href + "/") && path.startsWith(i.href)))));

  const nav = (
    <nav className="space-y-5 p-3">
      {groups.map((g) => (
        <div key={g.en}>
          <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-white/50">{lang === "bn" ? g.bn : g.en}</p>
          <ul className="space-y-0.5">
            {g.items.map((i) => {
              const n = i.count?.(counts) ?? 0;
              return (
                <li key={i.href}>
                  <Link
                    href={i.href}
                    onClick={() => setNavOpen(false)}
                    className={clsx("flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium", isActive(i.href) ? "bg-white text-admin" : "text-white/85 hover:bg-white/10")}
                  >
                    <i.icon className="size-4.5 shrink-0" aria-hidden />
                    <span className="flex-1 truncate">{lang === "bn" ? i.bn : i.en}</span>
                    {n > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-bad px-1.5 text-[11px] font-bold leading-5 text-white">{d(n)}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-dvh">
      <aside className="no-print sticky top-0 hidden h-dvh w-64 shrink-0 overflow-y-auto bg-admin lg:block">
        <Link href="/admin" className="flex h-14 items-center gap-2 px-5 font-extrabold text-white">
          <span className="grid size-8 place-items-center rounded-lg bg-brand text-sm font-black">G</span>
          GaariHub <span className="text-xs font-semibold text-white/60">Admin</span>
        </Link>
        {nav}
      </aside>
      {navOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-ink/50" aria-label={tx("বন্ধ", "Close")} onClick={() => setNavOpen(false)} />
          <aside className="relative h-full w-72 overflow-y-auto bg-admin">
            <button type="button" onClick={() => setNavOpen(false)} className="m-2 grid size-11 place-items-center rounded-xl text-white hover:bg-white/10" aria-label={tx("বন্ধ", "Close")}>
              <X className="size-5" />
            </button>
            {nav}
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-card px-3 lg:px-6">
          <button type="button" onClick={() => setNavOpen(true)} className="grid size-11 place-items-center rounded-xl hover:bg-ink/5 lg:hidden" aria-label={tx("মেনু", "Menu")}>
            <Menu className="size-5" />
          </button>
          <button type="button" onClick={() => setSearchOpen(true)} className="flex min-h-10 flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-left text-sm text-muted hover:border-ink/30 sm:max-w-md">
            <Search className="size-4" />
            <span className="flex-1 truncate">{tx("অর্ডার, রিকোয়েস্ট, ফোন, দোকান, পার্ট নম্বর…", "Order, request, phone, shop, part no…")}</span>
            <kbd className="hidden rounded border border-line bg-card px-1.5 text-xs sm:inline">Ctrl K</kbd>
          </button>
          <select
            value={me?.id ?? ""}
            onChange={(e) => switchStaff(e.target.value)}
            className="hidden min-h-10 rounded-xl border border-line bg-card px-2 text-sm sm:block"
            aria-label={tx("স্টাফ হিসেবে দেখুন", "View as staff")}
          >
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.roles.map((r) => L(staffRoleLabel[r])).join(", ")}
              </option>
            ))}
          </select>
          <PanelSwitch />
        </header>
        <main className="flex-1 px-3 py-5 lg:px-6">{children}</main>
      </div>
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} onGo={(href) => { setSearchOpen(false); router.push(href); }} />}
    </div>
  );
}

function GlobalSearch({ onClose, onGo }: { onClose: () => void; onGo: (href: string) => void }) {
  const { tx } = useT();
  const [q, setQ] = useState("");
  const db = useDb((s) => s);
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    const out: { label: string; sub: string; href: string }[] = [];
    db.orders.forEach((o) => (o.order_no.toLowerCase().includes(t) || o.user_phone.includes(t)) && out.push({ label: o.order_no, sub: `${tx("অর্ডার", "Order")} · ${o.customer_name}`, href: `/admin/orders/${o.id}` }));
    db.vendorOrders.forEach((v) => v.sub_order_no.toLowerCase().includes(t) && out.push({ label: v.sub_order_no, sub: tx("সাব-অর্ডার", "Sub-order"), href: `/admin/orders/${v.order_id}` }));
    db.requests.forEach((r) => (r.request_no.toLowerCase().includes(t) || r.user_phone.includes(t)) && out.push({ label: r.request_no, sub: `${tx("রিকোয়েস্ট", "Request")} · ${r.summary_bn ?? r.description_text ?? ""}`, href: `/admin/requests/${r.id}` }));
    db.claims.forEach((c) => c.claim_no.toLowerCase().includes(t) && out.push({ label: c.claim_no, sub: tx("দাবি", "Claim"), href: `/admin/disputes/${c.id}` }));
    db.vendors.forEach((v) => (v.shop_name.toLowerCase().includes(t) || v.shop_name_bn.includes(t) || v.owner_phone.includes(t)) && out.push({ label: v.shop_name_bn, sub: tx("বিক্রেতা", "Seller"), href: `/admin/vendors/${v.id}` }));
    db.listings.forEach((l) => l.part_number?.toLowerCase().replace(/-/g, "").includes(t.replace(/-/g, "")) && out.push({ label: l.title_bn, sub: `${tx("লিস্টিং", "Listing")} · ${l.part_number}`, href: `/admin/catalog/listings?q=${l.id}` }));
    db.profiles.forEach((p) => p.phone.includes(t) && out.push({ label: p.full_name ?? p.phone, sub: tx("কাস্টমার", "Customer"), href: `/admin/customers/${encodeURIComponent(p.phone)}` }));
    return out.slice(0, 12);
  }, [q, db, tx]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh]" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-ink/50" aria-label={tx("বন্ধ", "Close")} onClick={onClose} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-card shadow-2xl">
        <div className="flex items-center gap-2 border-b border-line px-4">
          <Search className="size-5 text-muted" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter" && results[0]) onGo(results[0].href);
            }}
            placeholder={tx("GH-4821, R-10231, 017…, রহমান…", "GH-4821, R-10231, 017…, Rahman…")}
            className="min-h-14 flex-1 bg-transparent outline-none"
          />
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-2">
          {results.map((r) => (
            <li key={r.href + r.label}>
              <button type="button" onClick={() => onGo(r.href)} className="flex w-full flex-col items-start rounded-xl px-3 py-2 text-left hover:bg-surface">
                <span className="font-semibold">{r.label}</span>
                <span className="truncate text-sm text-muted">{r.sub}</span>
              </button>
            </li>
          ))}
          {q.length >= 2 && results.length === 0 && <li className="px-3 py-6 text-center text-muted">{tx("কিছু পাওয়া যায়নি", "No results")}</li>}
        </ul>
      </div>
    </div>
  );
}
