"use client";

import { Camera, CarFront, ChevronRight, HandHelping, LifeBuoy, Mic, Search, ShieldCheck, Store, Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getCategoryBySlug } from "@/lib/db/queries";
import type { DB } from "@/lib/db/seed";
import { useDb } from "@/lib/db/store";
import { docTypeLabel } from "@/lib/labels";
import { telLink } from "@/lib/links";
import { settings } from "@/lib/mock/settings";
import { AudioGuide } from "@/components/layout/AudioGuide";
import { useNow } from "@/components/shared/Misc";
import { useT } from "@/components/providers/LangProvider";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { activeVehicleOf } from "./data";

const DAY = 86_400_000;

/** Big search bar: type, 🎤 voice or 📷 photo (file 01 §2). */
export function HomeSearch() {
  const { tx } = useT();
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      }}
      className="flex items-center gap-1 rounded-2xl border-2 border-ink/15 bg-card p-1.5 shadow-sm focus-within:border-brand"
    >
      <Search className="ml-2 size-5 shrink-0 text-muted" aria-hidden />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        enterKeyHint="search"
        placeholder={tx("কী লাগবে? লিখুন বা 🎤 চেপে বলুন", "What do you need? Type or tap 🎤")}
        aria-label={tx("খুঁজুন", "Search")}
        className="min-h-12 min-w-0 flex-1 bg-transparent px-1 text-base outline-none placeholder:text-muted/80"
      />
      <Link href="/request?mode=voice" aria-label={tx("বলে খুঁজুন", "Speak")} className="grid size-12 shrink-0 place-items-center rounded-xl bg-bad text-white">
        <Mic className="size-6" aria-hidden />
      </Link>
      <Link href="/request?mode=photo" aria-label={tx("ছবি দিয়ে খুঁজুন", "Search by photo")} className="grid size-12 shrink-0 place-items-center rounded-xl bg-surface text-ink">
        <Camera className="size-6" aria-hidden />
      </Link>
    </form>
  );
}

/** Red banner when car papers are expiring within 30 days or expired. */
export function PapersBanner() {
  const { tx, L, d } = useT();
  const v = useDb(activeVehicleOf);
  const now = useNow();
  if (!v) return null;
  const urgent = v.documents
    .filter((x) => x.expires_on)
    .map((x) => ({ doc: x, days: Math.ceil((new Date(x.expires_on!).getTime() - now) / DAY) }))
    .filter((x) => x.days <= 30)
    .sort((a, b) => a.days - b.days);
  if (!urgent.length) return null;
  return (
    <Link href={`/garage/${v.id}`} className="flex items-start gap-3 rounded-2xl border-2 border-bad/40 bg-bad-soft p-4 text-bad hover:border-bad">
      <span className="text-2xl" aria-hidden>
        ⚠️
      </span>
      <span className="min-w-0 flex-1 space-y-0.5">
        {urgent.slice(0, 2).map(({ doc, days }) => (
          <span key={doc.id} className="block font-bold">
            {days < 0
              ? tx(`${L(docTypeLabel[doc.doc_type])}-এর মেয়াদ ${d(-days)} দিন আগে শেষ হয়েছে`, `${L(docTypeLabel[doc.doc_type])} expired ${-days} days ago`)
              : tx(`${L(docTypeLabel[doc.doc_type])}-এর মেয়াদ ${d(days)} দিন পর শেষ`, `${L(docTypeLabel[doc.doc_type])} expires in ${days} days`)}
          </span>
        ))}
        <span className="block text-sm font-medium text-ink-2">{tx("দেখুন ও নবায়নের তারিখ দিন", "View and update the date")}</span>
      </span>
      <ChevronRight className="mt-1 size-5 shrink-0" aria-hidden />
    </Link>
  );
}

/** Exactly six big tiles (2×3), two "coming soon" (file 01 §2). */
export function HomeTiles() {
  const { tx } = useT();
  const tile = "relative flex min-h-28 flex-col items-start justify-between gap-2 rounded-2xl border border-line bg-card p-4 text-left hover:border-ink/30";
  const icon = "grid size-12 place-items-center rounded-xl";
  const soon = <span className="absolute right-2 top-2 rounded-full bg-wait-soft px-2 py-0.5 text-[11px] font-bold text-wait">{tx("শীঘ্রই আসছে", "Coming soon")}</span>;
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <li>
        <Link href="/c" className={tile}>
          <span className={`${icon} bg-brand text-white`}><Wrench className="size-6" aria-hidden /></span>
          <span className="text-lg font-bold leading-tight">{tx("পার্টস কিনুন", "Buy parts")}</span>
        </Link>
      </li>
      <li>
        <Link href="/request" className={tile}>
          <span className={`${icon} bg-bad text-white`}><HandHelping className="size-6" aria-hidden /></span>
          <span className="text-lg font-bold leading-tight">{tx("পার্ট চাই (দাম নিন)", "Request a part")}</span>
        </Link>
      </li>
      <li>
        <Link href="/shops" className={tile}>
          <span className={`${icon} bg-ink text-white`}><Store className="size-6" aria-hidden /></span>
          <span className="text-lg font-bold leading-tight">{tx("দোকান খুঁজুন", "Find shops")}</span>
        </Link>
      </li>
      <li>
        <Link href="/cars" className={tile}>
          {soon}
          <span className={`${icon} bg-surface text-ink-2`}><CarFront className="size-6" aria-hidden /></span>
          <span className="text-lg font-bold leading-tight text-ink-2">{tx("গাড়ি কিনুন-বেচুন", "Buy & sell cars")}</span>
        </Link>
      </li>
      <li>
        <Link href="/services" className={tile}>
          {soon}
          <span className={`${icon} bg-surface text-ink-2`}><Wrench className="size-6" aria-hidden /></span>
          <span className="text-lg font-bold leading-tight text-ink-2">{tx("মেকানিক ও সেবা", "Mechanics & services")}</span>
        </Link>
      </li>
      <li>
        <a href={telLink()} className={`${tile} border-bad/30`}>
          <span className={`${icon} bg-bad-soft text-bad`}><LifeBuoy className="size-6" aria-hidden /></span>
          <span>
            <span className="block text-lg font-bold leading-tight">{tx("রাস্তায় বিপদ", "Roadside help")}</span>
            <span className="block text-xs text-muted">{tx("হটলাইনে কল", "Call hotline")}</span>
          </span>
        </a>
      </li>
    </ul>
  );
}

const HOME_CATEGORIES = ["service", "brakes", "lighting", "engine", "suspension", "body", "battery-charging", "wheels-tyres", "electrical", "ac", "cooling", "accessories"];

export function CategoryGrid() {
  const { lang } = useT();
  return (
    <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
      {HOME_CATEGORIES.map((slug) => getCategoryBySlug(slug)).filter(Boolean).map((c) => (
        <li key={c!.id}>
          <Link href={`/c/${c!.slug}`} className="flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-2xl bg-card p-2 text-center ring-1 ring-line hover:ring-ink/30">
            <span className="grid size-11 place-items-center rounded-xl bg-brand-soft/60 text-brand-ink">
              <CategoryIcon icon={c!.icon} className="size-6" />
            </span>
            <span className="text-xs font-semibold leading-tight">{lang === "bn" ? c!.name_bn : c!.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Ongoing order / request in one card: "৩টা দোকান দাম দিয়েছে, দেখুন". */
const ongoingOf = (s: DB) => {
  const phone = s.session.customerPhone;
  if (!phone) return null;
  const req = s.requests.find((r) => r.user_phone === phone && r.status === "quotes_received");
  if (req) return { kind: "quotes" as const, id: req.id, no: req.request_no, count: s.quotes.filter((q) => q.request_id === req.id && q.status === "submitted").length };
  const waiting = s.requests.find((r) => r.user_phone === phone && ["new", "needs_clarification", "open"].includes(r.status));
  if (waiting) return { kind: "request" as const, id: waiting.id, no: waiting.request_no, count: 0 };
  const done = ["delivered", "completed", "cancelled", "rejected_by_vendor", "returned"];
  const order = s.orders.find((o) => o.user_phone === phone && s.vendorOrders.some((v) => v.order_id === o.id && !done.includes(v.status)));
  if (order) return { kind: "order" as const, id: order.id, no: order.order_no, count: order.vendor_order_ids.length };
  return null;
};

export function OngoingCard() {
  const { tx, d } = useT();
  const o = useDb(ongoingOf);
  if (!o) return null;
  const href = o.kind === "order" ? `/my/orders/${o.id}` : `/request/${o.id}`;
  const title =
    o.kind === "quotes"
      ? tx(`${d(o.count)}টা দোকান দাম দিয়েছে, দেখুন`, `${o.count} shops sent prices, take a look`)
      : o.kind === "request"
        ? tx("আপনার রিকোয়েস্ট দোকানে গেছে, দামের অপেক্ষা", "Your request is with shops, waiting for prices")
        : tx("আপনার অর্ডার চলছে", "Your order is in progress");
  return (
    <Link href={href} className={`flex items-center gap-3 rounded-2xl border-2 p-4 ${o.kind === "quotes" ? "border-ok/40 bg-ok-soft" : "border-wait-bg/50 bg-wait-soft"}`}>
      <span className="text-3xl" aria-hidden>
        {o.kind === "order" ? "📦" : "🙋"}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-lg font-bold ${o.kind === "quotes" ? "text-ok" : "text-wait"}`}>{title}</span>
        <span className="block text-sm text-ink-2">{o.no}</span>
      </span>
      <ChevronRight className="size-5 shrink-0" aria-hidden />
    </Link>
  );
}

/** "Your money is safe" buyer-protection card with 🔊. */
export function TrustCard() {
  const { tx } = useT();
  const text = tx(
    `টাকা নিরাপদ: পণ্য ঠিক না হলে টাকা ফেরত। আপনার টাকা আগে ${settings.brand_bn}-এর কাছে থাকে। জিনিস পেয়ে ${settings.return_window_days} দিনের মধ্যে সমস্যা জানালে দোকান টাকা পাবে না, আপনি ফেরত পাবেন। শুধু অ্যাপের ভেতরে কেনাকাটায় এই সুরক্ষা।`,
    `Your money is safe: refund if the item isn't right. ${settings.brand} holds your money first. Report a problem within ${settings.return_window_days} days and the shop isn't paid — you get it back. Only for purchases inside the app.`,
  );
  return (
    <section className="rounded-2xl border-2 border-ok/30 bg-ok-soft/60 p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-ok text-white">
          <ShieldCheck className="size-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-ok">{tx("টাকা নিরাপদ: পণ্য ঠিক না হলে টাকা ফেরত", "Money safe: refund if it isn't right")}</h2>
          <p className="mt-1 text-sm text-ink-2">{tx("ক্রেতা সুরক্ষা: দোকান টাকা পায় আপনি জিনিস বুঝে নেওয়ার পর।", "Buyer protection: the shop gets paid only after you've got the item.")}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <AudioGuide text={text} label={tx("শুনুন কীভাবে", "Listen how")} />
        <Link href="/policy/returns" className="inline-flex min-h-10 items-center text-sm font-semibold text-ok underline underline-offset-4">
          {tx("ফেরতের নিয়ম পড়ুন", "Read return policy")}
        </Link>
      </div>
    </section>
  );
}
