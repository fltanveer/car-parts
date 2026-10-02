"use client";

import { CheckCircle2, Minus, Plus, ShoppingCart, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addToCart } from "@/lib/store";
import type { Part } from "@/lib/types";
import { useT } from "../providers/LangProvider";
import { Button, ButtonLink } from "../ui/primitives";

export function QtyStepper({ value, max, onChange }: { value: number; max: number; onChange: (n: number) => void }) {
  const { t, tx, d } = useT();
  const btn = "grid size-12 place-items-center rounded-xl text-ink hover:bg-ink/5 disabled:opacity-30";
  return (
    <div className="flex items-center gap-3">
      <span className="font-semibold">{t("qty")}</span>
      <div className="flex items-center rounded-2xl border-2 border-line bg-card">
        <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label={tx("কমান", "Decrease")}>
          <Minus className="size-5" />
        </button>
        <output className="w-10 text-center text-lg font-bold" aria-live="polite">
          {d(value)}
        </output>
        <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={tx("বাড়ান", "Increase")}>
          <Plus className="size-5" />
        </button>
      </div>
      {max <= 5 && <span className="text-sm text-muted">{tx(`মাত্র ${d(max)}টি আছে`, `Only ${max} left`)}</span>}
    </div>
  );
}

// Spec 7.7: cart / buy-now only for in-stock parts; sourcing parts go through a request.
export function BuyBox({ part }: { part: Part }) {
  const { t, tx, lang } = useT();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (part.availability !== "in_stock") {
    const name = lang === "bn" ? part.name_bn : part.name;
    const href = `/request?q=${encodeURIComponent(`${name} (${part.brand} ${part.part_number})`)}&part=${part.id}`;
    return (
      <div className="space-y-3">
        <ButtonLink href={href} size="lg" full>
          {part.price != null ? tx("দাম নিশ্চিত করে অর্ডার দিন", "Confirm price & order") : t("ask_price")}
        </ButtonLink>
        <p className="text-center text-sm text-muted">
          {tx("আমরা সংগ্রহ করে চূড়ান্ত দাম ও সময় জানাবো, তারপর আপনি সিদ্ধান্ত নেবেন।", "We'll confirm the final price and time; then you decide.")}
        </p>
      </div>
    );
  }

  const max = Math.max(1, part.stock_qty);

  return (
    <div className="space-y-3">
      <QtyStepper value={qty} max={max} onChange={(n) => setQty(Math.min(max, Math.max(1, n)))} />
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          variant="outline"
          size="lg"
          full
          onClick={() => {
            addToCart(part.id, qty);
            setAdded(true);
          }}
        >
          <ShoppingCart className="size-5" aria-hidden />
          {t("add_to_cart")}
        </Button>
        <Button
          variant="accent"
          size="lg"
          full
          onClick={() => {
            addToCart(part.id, qty);
            router.push("/cart");
          }}
        >
          <Zap className="size-5" aria-hidden />
          {t("buy_now")}
        </Button>
      </div>
      {added && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-ok/30 bg-q-genuine-soft px-4 py-3 text-sm font-medium text-ok">
          <CheckCircle2 className="size-5 shrink-0" aria-hidden />
          <span className="flex-1">{tx("কার্টে যোগ হয়েছে", "Added to cart")}</span>
          <Link href="/cart" className="font-semibold underline underline-offset-4">
            {tx("কার্ট দেখুন", "View cart")}
          </Link>
        </div>
      )}
    </div>
  );
}
