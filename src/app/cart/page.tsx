"use client";

import { AlertTriangle, CheckCircle2, Minus, Plus, Search, ShieldCheck, ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { PartImage } from "@/components/part/PartImage";
import { QualityBadge } from "@/components/part/QualityBadge";
import { useT } from "@/components/providers/LangProvider";
import { ButtonLink, Card, Container, Notice, PageHeader } from "@/components/ui/primitives";
import { describeGeneration, getPartById, partFits, settings } from "@/lib/api";
import { setCartQty, useActiveVehicle, useHydrated, useStore } from "@/lib/store";
import type { Part } from "@/lib/types";

export default function CartPage() {
  const { t, tx, lang, taka, d } = useT();
  const hydrated = useHydrated();
  const cart = useStore((s) => s.cart);
  const vehicle = useActiveVehicle();
  const gen = vehicle?.generation_id ?? null;

  // Spec 7.10: only stock parts can be bought from the cart. Anything that
  // went out of stock since it was added is shown separately.
  const { lines, unavailable } = useMemo(() => {
    const lines: { part: Part; qty: number }[] = [];
    const unavailable: { id: string; part: Part | null }[] = [];
    for (const l of cart) {
      const part = getPartById(l.part_id);
      if (part && part.availability === "in_stock" && part.price != null && part.stock_qty > 0) lines.push({ part, qty: l.qty });
      else unavailable.push({ id: l.part_id, part });
    }
    return { lines, unavailable };
  }, [cart]);

  const subtotal = lines.reduce((s, l) => s + (l.part.price ?? 0) * l.qty, 0);
  const itemCount = lines.reduce((s, l) => s + l.qty, 0);
  const anyMismatch = lines.some((l) => partFits(l.part, gen) === false);
  const car = describeGeneration(gen, lang);

  if (!hydrated)
    return (
      <Container>
        <PageHeader title={t("cart")} />
        <div className="h-40 animate-pulse rounded-2xl bg-line/60" />
      </Container>
    );

  if (!lines.length && !unavailable.length)
    return (
      <Container className="max-w-md">
        <Card className="mt-6 p-6 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-surface">
            <ShoppingCart className="size-8 text-muted" aria-hidden />
          </span>
          <h1 className="mt-4 text-xl font-bold">{t("empty_cart")}</h1>
          <p className="mt-1 text-muted">{tx("পার্ট খুঁজে কার্টে যোগ করুন, অথবা আমাদের বলুন কী লাগবে।", "Find a part and add it, or just tell us what you need.")}</p>
          <div className="mt-5 space-y-2">
            <ButtonLink href="/search" variant="primary" size="lg" full>
              <Search className="size-5" aria-hidden /> {tx("পার্ট খুঁজুন", "Search parts")}
            </ButtonLink>
            <ButtonLink href="/request" variant="outline" size="lg" full>
              🎤 {tx("বলে দিন / ছবি দিন, আমরা এনে দেবো", "Tell us or send a photo, we'll get it")}
            </ButtonLink>
          </div>
        </Card>
      </Container>
    );

  return (
    <Container>
      <PageHeader title={t("cart")} subtitle={tx(`${d(itemCount)}টি পার্ট`, `${itemCount} item${itemCount === 1 ? "" : "s"}`)} />

      {car ? (
        <p className="mb-3 text-sm text-muted">
          {tx("ফিট মেলানো হচ্ছে", "Checking fit for")}: <b className="text-ink">{car.short} {car.years}</b>
        </p>
      ) : (
        <Notice className="mb-3">
          {tx("আপনার গাড়ি যোগ করলে প্রতিটা পার্ট ফিট হবে কি না দেখিয়ে দেবো।", "Add your car and we'll check each part fits.")}{" "}
          <Link href="/garage/add" className="font-semibold underline">
            {t("add_your_car")}
          </Link>
        </Notice>
      )}

      <ul className="space-y-3">
        {lines.map(({ part, qty }) => {
          const fits = partFits(part, gen);
          const max = part.stock_qty;
          return (
            <li key={part.id}>
              <Card className="p-3">
                <div className="flex gap-3">
                  <Link href={`/part/${part.slug}`} className="shrink-0">
                    <PartImage part={part} className="size-20 rounded-xl" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/part/${part.slug}`} className="line-clamp-2 font-semibold leading-snug">
                      {lang === "bn" ? part.name_bn : part.name}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <QualityBadge quality={part.quality} lang={lang} />
                      {part.warranty_months > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-q-genuine">
                          <ShieldCheck className="size-3.5" aria-hidden />
                          {d(part.warranty_months)} {t("months")}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-lg font-bold">{taka(part.price ?? 0)}</p>
                  </div>
                </div>

                {fits === false && (
                  <p className="mt-2 flex items-start gap-2 rounded-xl bg-accent-soft px-3 py-2 text-sm font-medium text-accent-ink">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>
                      {t("not_fit_your_car")}. {tx("নিশ্চিত না হলে অর্ডারের আগে আমাদের জিজ্ঞেস করুন।", "Not sure? Ask us before ordering.")}
                    </span>
                  </p>
                )}
                {fits === true && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-ok">
                    <CheckCircle2 className="size-4" aria-hidden /> {t("fits_your_car")}
                  </p>
                )}

                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center rounded-xl border-2 border-line" role="group" aria-label={t("qty")}>
                    <button
                      type="button"
                      onClick={() => setCartQty(part.id, qty - 1)}
                      className="grid size-11 place-items-center"
                      aria-label={tx("একটি কমান", "Decrease")}
                    >
                      <Minus className="size-5" />
                    </button>
                    <span className="min-w-8 text-center text-lg font-bold tabular-nums" aria-live="polite">
                      {d(qty)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCartQty(part.id, Math.min(max, qty + 1))}
                      disabled={qty >= max}
                      className="grid size-11 place-items-center disabled:opacity-30"
                      aria-label={tx("একটি বাড়ান", "Increase")}
                    >
                      <Plus className="size-5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCartQty(part.id, 0)}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-danger hover:bg-danger/5"
                  >
                    <Trash2 className="size-4" aria-hidden /> {tx("মুছুন", "Remove")}
                  </button>
                </div>
                {qty >= max && (
                  <p className="mt-1 text-xs text-muted">{tx(`স্টকে আছে ${d(max)}টি`, `Only ${max} in stock`)}</p>
                )}
              </Card>
            </li>
          );
        })}
      </ul>

      {unavailable.length > 0 && (
        <Notice tone="warn" className="mt-4">
          <p className="font-semibold">{tx("এগুলো এখন স্টকে নেই, তাই কার্ট থেকে কেনা যাবে না:", "These are no longer in stock and can't be bought from the cart:")}</p>
          <ul className="mt-2 space-y-2">
            {unavailable.map(({ id, part }) => (
              <li key={id} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate">{part ? (lang === "bn" ? part.name_bn : part.name) : id}</span>
                <button type="button" onClick={() => setCartQty(id, 0)} className="min-h-10 shrink-0 px-2 font-semibold underline">
                  {tx("সরান", "Remove")}
                </button>
              </li>
            ))}
          </ul>
          <Link href="/request" className="mt-2 inline-block font-semibold underline">
            {tx("আমরা আনিয়ে দিতে পারি, রিকোয়েস্ট দিন", "We can source it, send a request")}
          </Link>
        </Notice>
      )}

      {lines.length > 0 && (
        <Card className="mt-4 p-4">
          <div className="flex items-center justify-between text-lg">
            <span className="font-semibold">{t("subtotal")}</span>
            <span className="text-2xl font-bold">{taka(subtotal)}</span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {tx("ডেলিভারি চার্জ ঠিকানা দেখে পরের ধাপে যোগ হবে।", "Delivery charge is added at checkout based on your address.")}{" "}
            {subtotal <= settings.cod_limit
              ? tx("ক্যাশ অন ডেলিভারি পাওয়া যাবে।", "Cash on delivery available.")
              : tx(`${taka(settings.cod_limit)}-এর বেশি অর্ডারে ডেলিভারি চার্জ আগে দিতে হবে।`, `Orders above ${taka(settings.cod_limit)} need the delivery charge in advance.`)}
          </p>
          {anyMismatch && (
            <p className="mt-3 flex items-start gap-2 text-sm font-medium text-accent-ink">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {tx("কিছু পার্ট আপনার গাড়ির সাথে মিলছে না। তবুও কিনতে পারবেন।", "Some parts don't match your car. You can still order.")}
            </p>
          )}
          <ButtonLink href="/checkout" variant="primary" size="lg" full className="mt-4">
            {t("checkout")} →
          </ButtonLink>
          <Link href="/search" className="mt-3 block text-center text-sm font-semibold underline">
            {tx("আরও পার্ট খুঁজুন", "Keep shopping")}
          </Link>
        </Card>
      )}
    </Container>
  );
}
