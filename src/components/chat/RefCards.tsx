"use client";

import clsx from "clsx";
import { ClipboardList, Package, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { getPartById } from "@/lib/api";
import { orderStatusLabel, requestStatusLabel } from "@/lib/i18n";
import { addToCart, useStore } from "@/lib/store";
import { PartImage } from "../part/PartImage";
import { QualityBadge } from "../part/QualityBadge";
import { useT } from "../providers/LangProvider";

const shell = "block w-64 max-w-full overflow-hidden rounded-xl border border-line bg-card text-ink";

// Mini part card shared in chat (spec 7.15). ref_id = part id.
export function PartRefCard({ partId, className }: { partId: string; className?: string }) {
  const { lang, tx, taka } = useT();
  const [added, setAdded] = useState(false);
  const part = getPartById(partId);
  if (!part) return <MissingRef />;
  const name = lang === "bn" ? part.name_bn : part.name;
  return (
    <div className={clsx(shell, className)}>
      <Link href={`/part/${part.slug}`} className="flex gap-3 p-2.5">
        <PartImage part={part} className="size-16 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold leading-snug">{name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <QualityBadge quality={part.quality} lang={lang} />
          </div>
          <p className="mt-1 font-bold">{part.price != null ? taka(part.price) : tx("দাম জানতে চান", "Ask for price")}</p>
        </div>
      </Link>
      {part.availability === "in_stock" && part.price != null && (
        <button
          type="button"
          onClick={() => {
            addToCart(part.id);
            setAdded(true);
          }}
          className="flex min-h-11 w-full items-center justify-center gap-2 border-t border-line text-sm font-semibold hover:bg-surface"
        >
          <ShoppingCart className="size-4" aria-hidden />
          {added ? tx("কার্টে আছে ✓", "In cart ✓") : tx("কার্টে দিন", "Add to cart")}
        </button>
      )}
    </div>
  );
}

export function OrderRefCard({ orderId, className }: { orderId: string; className?: string }) {
  const { lang, tx, taka, d } = useT();
  const orders = useStore((s) => s.orders);
  const order = orders.find((o) => o.id === orderId);
  if (!order) return <MissingRef />;
  return (
    <Link href={`/orders/${order.id}`} className={clsx(shell, "flex items-center gap-3 p-3", className)}>
      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-surface">
        <Package className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">
          {tx("অর্ডার", "Order")} {d(order.order_no)}
        </span>
        <span className="block text-xs text-muted">
          {orderStatusLabel[order.status][lang]} · {taka(order.total)}
        </span>
      </span>
    </Link>
  );
}

export function RequestRefCard({ requestId, className }: { requestId: string; className?: string }) {
  const { lang, tx, d } = useT();
  const requests = useStore((s) => s.requests);
  const req = requests.find((r) => r.id === requestId);
  if (!req) return <MissingRef />;
  return (
    <Link href={`/request/${req.id}`} className={clsx(shell, "flex items-center gap-3 p-3", className)}>
      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-ink">
        <ClipboardList className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">
          {tx("রিকোয়েস্ট", "Request")} {d(req.request_no)}
        </span>
        <span className="block truncate text-xs text-muted">
          {requestStatusLabel[req.status][lang]}
          {req.description_text ? ` · ${req.description_text}` : ""}
        </span>
      </span>
    </Link>
  );
}

function MissingRef() {
  const { tx } = useT();
  return <p className="text-sm italic opacity-80">{tx("এই তথ্য আর পাওয়া যাচ্ছে না", "This item is no longer available")}</p>;
}
