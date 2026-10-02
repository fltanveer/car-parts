"use client";

import clsx from "clsx";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/db/actions";
import { isPublic, listingById, orderById, requestById, vendorOrderById } from "@/lib/db/queries";
import type { DB } from "@/lib/db/seed";
import { requestStatusLabel, vendorOrderStatusLabel } from "@/lib/labels";
import type { ChatMessage, ChatThread } from "@/lib/types";
import { VoicePlayer } from "../../media/VoicePlayer";
import { toast } from "../../shared/Misc";
import { useT } from "../../providers/LangProvider";
import { MediaImage } from "../../ui/MediaImage";
import { Button, StatusPill } from "../../ui/primitives";

/** What this chat is about: listing / quote / request / order (file 01 §8). */
export function ChatContextCard({ db, thread }: { db: DB; thread: ChatThread }) {
  const { tx, taka, L, d } = useT();
  const box = "flex items-center gap-3 rounded-2xl border border-line bg-card p-3";
  if (thread.context_type === "listing") {
    const l = listingById(db, thread.context_id);
    if (!l) return null;
    return (
      <Link href={`/l/${l.id}`} className={box}>
        <MediaImage src={l.media[0]?.url} alt={l.title_bn} className="size-14 shrink-0 rounded-xl" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{l.title_bn}</span>
          <span className="font-bold">{taka(l.price)}</span>
        </span>
      </Link>
    );
  }
  if (thread.context_type === "quote") {
    const q = db.quotes.find((x) => x.id === thread.context_id);
    if (!q) return null;
    return (
      <Link href={`/request/${q.request_id}`} className={box}>
        <MediaImage src={q.media[0]} alt={q.title} className="size-14 shrink-0 rounded-xl" />
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-muted">💰 {tx("দামের প্রস্তাব", "Quote")}</span>
          <span className="block truncate font-semibold">{q.title}</span>
          <span className="font-bold">{taka(q.price)}</span>
        </span>
      </Link>
    );
  }
  if (thread.context_type === "request") {
    const r = requestById(db, thread.context_id);
    if (!r) return null;
    return (
      <Link href={`/request/${r.id}`} className={box}>
        <span className="text-3xl" aria-hidden>
          🙋
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">
            {tx("রিকোয়েস্ট", "Request")} {d(r.request_no)}
          </span>
          <StatusPill tone={requestStatusLabel[r.status].tone}>{L(requestStatusLabel[r.status])}</StatusPill>
        </span>
      </Link>
    );
  }
  if (thread.context_type === "vendor_order") {
    const vo = vendorOrderById(db, thread.context_id);
    const o = orderById(db, vo?.order_id ?? null);
    if (!vo || !o) return null;
    return (
      <Link href={`/my/orders/${o.id}`} className={box}>
        <span className="text-3xl" aria-hidden>
          📦
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">
            {tx("অর্ডার", "Order")} {d(vo.sub_order_no)}
          </span>
          <StatusPill tone={vendorOrderStatusLabel[vo.status].tone}>{L(vendorOrderStatusLabel[vo.status])}</StatusPill>
        </span>
      </Link>
    );
  }
  return null;
}

/** One message bubble; product/offer/quote cards get a one-tap add to cart. */
export function ChatBubble({ db, m }: { db: DB; m: ChatMessage }) {
  const { tx, taka, dateTime } = useT();
  const router = useRouter();
  if (m.type === "system")
    return <p className="mx-auto max-w-[90%] rounded-xl bg-wait-soft px-3 py-2 text-center text-sm font-medium text-wait">⚠️ {m.body}</p>;
  const mine = m.sender === "customer";

  let body: React.ReactNode = <p className="whitespace-pre-wrap">{m.body}</p>;
  if (m.type === "voice" && m.voice) body = <VoicePlayer src={m.voice.url} duration={m.voice.duration_sec} dark={mine} />;
  if (m.type === "image" && m.image) body = <MediaImage src={m.image.url} alt={m.image.name} className="h-48 w-56 max-w-full rounded-xl" />;
  if (m.type === "listing_card" || m.type === "offer_card") {
    const l = listingById(db, m.ref_id ?? null);
    body = l ? (
      <div className="w-56 max-w-full space-y-2">
        <MediaImage src={l.media[0]?.url} alt={l.title_bn} className="h-28 w-full rounded-xl" />
        <p className="font-semibold">{l.title_bn}</p>
        <p className="text-lg font-bold">{taka(m.offer_price ?? l.price)}</p>
        <Button
          variant="ok"
          size="sm"
          full
          disabled={!isPublic(db, l)}
          onClick={() => {
            addToCart({ listing_id: l.id });
            toast(tx("কার্টে যোগ হয়েছে", "Added to cart"));
          }}
        >
          <ShoppingCart className="size-4" aria-hidden /> {tx("কার্টে দিন", "Add to cart")}
        </Button>
      </div>
    ) : (
      <p className="text-muted">{tx("পণ্যটা আর নেই", "Product no longer available")}</p>
    );
  }
  if (m.type === "quote_card") {
    const q = db.quotes.find((x) => x.id === m.ref_id);
    body = q ? (
      <div className="w-56 max-w-full space-y-2">
        <p className="font-semibold">{q.title}</p>
        <p className="text-lg font-bold">{taka(q.price)}</p>
        <Button
          variant="ok"
          size="sm"
          full
          disabled={q.status !== "submitted"}
          onClick={() => {
            addToCart({ quote_id: q.id });
            router.push("/checkout");
          }}
        >
          ✅ {tx("এটা নেবো", "Take it")}
        </Button>
      </div>
    ) : null;
  }
  if (m.type === "order_card") body = <Link href="/my" className="font-semibold underline">📦 {m.body ?? tx("অর্ডার দেখুন", "View order")}</Link>;

  return (
    <div className={clsx("flex", mine ? "justify-end" : "justify-start")}>
      <div className={clsx("max-w-[85%] rounded-2xl px-3.5 py-2.5", mine ? "rounded-br-md bg-brand text-white" : "rounded-bl-md border border-line bg-card")}>
        {body}
        <p className={clsx("mt-1 text-[11px]", mine ? "text-white/70" : "text-muted")}>
          {m.contains_contact_info && `🔒 ${tx("নম্বর লুকানো", "Number hidden")} · `}
          {dateTime(m.created_at)}
        </p>
      </div>
    </div>
  );
}
