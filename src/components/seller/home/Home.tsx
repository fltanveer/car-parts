"use client";

import clsx from "clsx";
import { Volume2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { updateVendor } from "@/lib/db/actions";
import { vendorBalance, vendorListings, vendorOrdersOf } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import { spokenTaka } from "@/lib/format";
import { vendorScoreBreakdown, vendorStanding } from "@/lib/rules";
import { speak } from "../../layout/AudioGuide";
import { useT } from "../../providers/LangProvider";
import { Countdown, HelpCall, useNow } from "../../shared/Misc";
import { Button, Card, Container, Notice, SectionTitle } from "../../ui/primitives";
import { TaskCard } from "../Bits";
import { useVendor } from "../Gate";
import { playBeep, verificationProgress } from "../utils";
import { DraftsCard } from "./DraftsCard";
import { Standing } from "./Standing";

const DAY = 86_400_000;

export function SellerHome() {
  const v = useVendor()!;
  const { tx, taka, d, lang } = useT();
  const now = useNow(30_000);
  const vid = v.id;
  const orders = useDb((s) => vendorOrdersOf(s, vid));
  const listings = useDb((s) => vendorListings(s, vid));
  const newReqs = useDb((s) =>
    s.requests.filter((r) => ["open", "quotes_received"].includes(r.status) && r.matches.some((m) => m.vendor_id === vid && !m.declined) && !s.quotes.some((q) => q.request_id === r.id && q.vendor_id === vid)),
  );
  const unread = useDb((s) => s.threads.filter((t) => t.vendor_id === vid && t.type !== "customer_support").reduce((a, t) => a + t.unread_vendor, 0));
  const claims = useDb((s) => s.claims.filter((c) => c.vendor_id === vid && c.status === "vendor_review"));
  const bal = useDb((s) => vendorBalance(s, vid, now));

  const pending = orders.filter((o) => o.status === "pending_vendor").sort((a, b) => a.accept_by.localeCompare(b.accept_by));
  const toShip = orders.filter((o) => o.status === "accepted" || o.status === "ready_to_ship");
  const nextHandover = toShip.map((o) => o.handover_by).filter(Boolean).sort()[0] ?? null;
  const outOfStock = listings.filter((l) => l.status === "sold_out" || (l.status === "active" && l.stock_qty === 0));
  const nextClaim = [...claims].sort((a, b) => a.vendor_respond_by.localeCompare(b.vendor_respond_by))[0];
  const vp = verificationProgress(v);

  const live = (o: (typeof orders)[number]) => !["cancelled", "rejected_by_vendor"].includes(o.status);
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const createdAt = (o: (typeof orders)[number]) => new Date(o.history[0]?.at ?? o.accept_by).getTime();
  const todaySales = orders.filter((o) => live(o) && createdAt(o) >= startOfDay.getTime()).reduce((a, o) => a + o.subtotal, 0);
  const weekSales = orders.filter((o) => live(o) && createdAt(o) >= now - 7 * DAY).reduce((a, o) => a + o.subtotal, 0);

  // New-order beep while the home screen is open (file 02 §1.6).
  const prevPending = useRef<number | null>(null);
  useEffect(() => {
    if (prevPending.current !== null && pending.length > prevPending.current) playBeep("order");
    prevPending.current = pending.length;
  }, [pending.length]);

  const cards: { key: string; icon: string; title: string; sub: string; href: string; tone: "bad" | "wait" | "info" | "ok"; extra?: React.ReactNode }[] = [];
  if (pending.length)
    cards.push({
      key: "new", icon: "🔴", tone: "bad", href: "/seller/orders",
      title: tx(`নতুন অর্ডার: ${d(pending.length)}টা`, `New orders: ${pending.length}`),
      sub: tx("সময়ের মধ্যে গ্রহণ করুন", "Accept before the timer ends"),
      extra: <Countdown to={pending[0].accept_by} warnHours={2} />,
    });
  if (toShip.length)
    cards.push({
      key: "ship", icon: "🟠", tone: "wait", href: "/seller/orders",
      title: tx(`পাঠাতে হবে: ${d(toShip.length)}টা`, `To ship: ${toShip.length}`),
      sub: tx("প্যাক করে ছবি দিন", "Pack and add a photo"),
      extra: nextHandover ? <Countdown to={nextHandover} /> : undefined,
    });
  if (newReqs.length)
    cards.push({ key: "req", icon: "🙋", tone: "info", href: "/seller/requests", title: tx(`দাম চাওয়া হয়েছে: ${d(newReqs.length)}টা`, `Price requests: ${newReqs.length}`), sub: tx("দাম দিলে বিক্রি বাড়বে", "Quote to sell more") });
  if (unread)
    cards.push({ key: "msg", icon: "💬", tone: "info", href: "/seller/messages", title: tx(`উত্তর দিন: ${d(unread)}টা মেসেজ`, `Reply: ${unread} messages`), sub: tx("দ্রুত উত্তর দিলে স্কোর বাড়ে", "Fast replies raise your score") });
  if (claims.length)
    cards.push({
      key: "claim", icon: "⚠️", tone: "bad", href: "/seller/claims",
      title: tx(`সমস্যা জানিয়েছে: ${d(claims.length)}টা`, `Problems reported: ${claims.length}`),
      sub: tx("২ দিনের মধ্যে উত্তর দিন", "Reply within 2 days"),
      extra: nextClaim ? <Countdown to={nextClaim.vendor_respond_by} /> : undefined,
    });
  if (outOfStock.length)
    cards.push({ key: "stock", icon: "📉", tone: "wait", href: "/seller/products", title: tx(`স্টক শেষ: ${d(outOfStock.length)}টা পণ্য`, `Out of stock: ${outOfStock.length}`), sub: tx("স্টক বাড়ান বা বন্ধ রাখুন", "Restock or pause") });
  if (vp.done < vp.total)
    cards.push({ key: "verify", icon: "✅", tone: "ok", href: "/seller/verify", title: tx(`যাচাই বাকি: ${d(vp.done)}/${d(vp.total)}`, `Verification: ${vp.done}/${vp.total}`), sub: tx("আরও বিক্রি করতে যাচাই সম্পূর্ণ করুন", "Complete verification to sell more") });

  const readAll = () => {
    const parts = [
      lang === "bn" ? `আজকের বিক্রি ${spokenTaka(todaySales, "bn")}।` : `Today's sales ${todaySales} taka.`,
      ...cards.map((c) => `${c.title}। ${c.sub}।`),
    ];
    if (!cards.length) parts.push(tx("এখন কোনো জরুরি কাজ নেই।", "No urgent tasks right now."));
    speak(parts.join(" "), lang);
  };

  const standing = vendorStanding(v.score);
  const weakest = [...vendorScoreBreakdown(v)].sort((a, b) => a.value - b.value)[0];

  return (
    <Container className="space-y-5">
      {/* top: shop, open/closed, today's sales */}
      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted">{tx("আমার দোকান", "My shop")}</p>
            <h1 className="truncate text-2xl font-bold">{lang === "bn" ? v.shop_name_bn : v.shop_name}</h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted">{tx("আজকের বিক্রি", "Today's sales")}</p>
            <p className="text-2xl font-bold text-ok">{taka(todaySales)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => updateVendor(vid, { is_open: !v.is_open })}
          aria-pressed={v.is_open}
          className={clsx("flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl px-5 text-xl font-bold text-white", v.is_open ? "bg-ok" : "bg-bad")}
        >
          <span>{v.is_open ? tx("🟢 দোকান খোলা", "🟢 Shop open") : tx("🔴 দোকান বন্ধ", "🔴 Shop closed")}</span>
          <span className="rounded-xl bg-white/20 px-3 py-1 text-sm">{v.is_open ? tx("বন্ধ করুন", "Close") : tx("খুলুন", "Open")}</span>
        </button>
        {!v.is_open && <Notice tone="wait">{tx("দোকান বন্ধ থাকলে নতুন দাম চাওয়া আসবে না।", "While closed you won't get new price requests.")}</Notice>}
        {v.holiday_mode && (
          <Notice tone="wait">
            🏖️ {tx("ছুটির মোড চালু: সব পণ্য লুকানো, অর্ডার আসবে না।", "Holiday mode on: products hidden, no orders.")}{" "}
            <button type="button" className="font-bold underline" onClick={() => updateVendor(vid, { holiday_mode: false })}>
              {tx("ছুটি শেষ করুন", "End holiday")}
            </button>
          </Notice>
        )}
        {standing !== "good" && <Notice tone="bad">{tx("আপনার স্কোর কম। নিচের টিপস দেখুন, না হলে দোকান স্থগিত হতে পারে।", "Your score is low. See tips below or the shop may be suspended.")}</Notice>}
      </Card>

      <Button variant="brand" size="lg" full onClick={readAll}>
        <Volume2 className="size-6" /> {tx("আজকের কাজ শুনুন", "Listen to today's tasks")}
      </Button>

      <section>
        <SectionTitle>{tx("আজকের কাজ", "Today's tasks")}</SectionTitle>
        {cards.length ? (
          <div className="space-y-3">
            {cards.map((c) => (
              <TaskCard key={c.key} href={c.href} icon={c.icon} title={c.title} sub={c.sub} tone={c.tone} extra={c.extra} />
            ))}
          </div>
        ) : (
          <Notice tone="ok">🎉 {tx("এখন কোনো জরুরি কাজ নেই। নতুন পণ্য যোগ করুন!", "No urgent tasks. Add a new product!")}</Notice>
        )}
      </section>

      <DraftsCard vendor={v} drafts={listings.filter((l) => l.status === "draft")} />

      <Standing vendor={v} weekSales={weekSales} pendingMoney={bal.pending} weakestKey={weakest.key} listings={listings} />

      <div className="grid grid-cols-2 gap-3">
        <Link href="/seller/add" className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl bg-seller font-bold text-white">
          <span className="text-2xl">📷</span>
          {tx("পণ্য যোগ", "Add product")}
        </Link>
        <Link href="/seller/money" className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-line bg-card font-bold">
          <span className="text-2xl">💰</span>
          {tx("আমার টাকা", "My money")}
        </Link>
      </div>
      <HelpCall />
    </Container>
  );
}
