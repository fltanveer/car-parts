"use client";

import Link from "next/link";
import { listingById, requestById, vendorOrderById } from "@/lib/db/queries";
import { getDb, useDb } from "@/lib/db/store";
import type { ChatThread } from "@/lib/types";
import { useT } from "../../providers/LangProvider";
import { Card } from "../../ui/primitives";
import { ListingMini } from "../Bits";

/** Short text for what a thread is about (listing / quote / request / order). */
export function useContextLabel() {
  const { tx, taka } = useT();
  return (t: ChatThread) => {
    const s = getDb();
    if (t.context_type === "listing") return `📦 ${listingById(s, t.context_id)?.title_bn ?? ""}`;
    if (t.context_type === "quote") {
      const q = s.quotes.find((x) => x.id === t.context_id);
      return q ? `🙋 ${requestById(s, q.request_id)?.request_no ?? ""} · ${q.title} · ${taka(q.price)}` : "";
    }
    if (t.context_type === "request") return `🙋 ${requestById(s, t.context_id)?.request_no ?? ""}`;
    if (t.context_type === "vendor_order") return `📦 ${tx("অর্ডার", "Order")} ${vendorOrderById(s, t.context_id)?.sub_order_no ?? ""}`;
    return "";
  };
}

/** Context card on top of a chat (file 02 §11). */
export function ContextCard({ t }: { t: ChatThread }) {
  const { tx, taka } = useT();
  const listing = useDb((s) => (t.context_type === "listing" ? listingById(s, t.context_id) : null));
  const quote = useDb((s) => (t.context_type === "quote" ? s.quotes.find((q) => q.id === t.context_id) ?? null : null));
  const vo = useDb((s) => (t.context_type === "vendor_order" ? vendorOrderById(s, t.context_id) : null));
  if (listing) return <ListingMini listing={listing} />;
  if (quote)
    return (
      <Link href={`/seller/requests/${quote.request_id}`}>
        <Card className="p-3 text-sm">🙋 {tx("আপনার দাম", "Your quote")}: <b>{quote.title}</b> · {taka(quote.price)}</Card>
      </Link>
    );
  if (vo)
    return (
      <Link href={`/seller/orders/${vo.id}`}>
        <Card className="p-3 text-sm">📦 {tx("অর্ডার", "Order")} <b className="font-mono">{vo.sub_order_no}</b> · {vo.items[0]?.snapshot.title}</Card>
      </Link>
    );
  return null;
}
