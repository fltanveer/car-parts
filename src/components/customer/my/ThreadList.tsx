"use client";

import clsx from "clsx";
import { Pin } from "lucide-react";
import { useRouter } from "next/navigation";
import { openThread } from "@/lib/db/actions";
import { vendorById } from "@/lib/db/queries";
import { useDb, useHydrated } from "@/lib/db/store";
import type { ChatMessage, ChatThread } from "@/lib/types";
import { AudioGuide } from "../../layout/AudioGuide";
import { HelpCall, ShopLogo } from "../../shared/Misc";
import { useT } from "../../providers/LangProvider";
import { Container, EmptyState, PageHeader } from "../../ui/primitives";
import { LoginNeeded } from "./common";

export const previewOf = (m: ChatMessage | undefined, tx: (bn: string, en: string) => string) => {
  if (!m) return tx("এখনো কোনো মেসেজ নেই", "No messages yet");
  if (m.type === "voice") return `🎤 ${tx("ভয়েস মেসেজ", "Voice message")}`;
  if (m.type === "image") return `📷 ${tx("ছবি", "Photo")}`;
  if (m.type === "listing_card" || m.type === "offer_card") return `🏷️ ${tx("পণ্যের প্রস্তাব", "Product offer")}`;
  if (m.type === "quote_card") return `💰 ${tx("দামের প্রস্তাব", "Price quote")}`;
  if (m.type === "order_card") return `📦 ${tx("অর্ডার", "Order")}`;
  return m.body ?? "";
};

/** /messages: shops + GaariHub support (always pinned on top) (file 01 §8). */
export function ThreadList() {
  const { tx, d, ago, lang } = useT();
  const router = useRouter();
  const hydrated = useHydrated();
  const phone = useDb((s) => s.session.customerPhone);
  const db = useDb((s) => s);
  if (!hydrated) return <Container className="h-96 animate-pulse" />;
  if (!phone)
    return (
      <Container className="space-y-4">
        <PageHeader title={`💬 ${tx("মেসেজ", "Messages")}`} />
        <LoginNeeded next="/messages" why={tx("দোকান ও সাপোর্টের সাথে কথা বলতে লগইন করুন।", "Log in to chat with shops and support.")} />
        <HelpCall />
      </Container>
    );

  const mine = db.threads.filter((t) => t.customer_phone === phone && t.type !== "vendor_support");
  const support = mine.find((t) => t.type === "customer_support");
  const shops = mine.filter((t) => t.type === "customer_vendor").sort((a, b) => b.last_message_at.localeCompare(a.last_message_at));

  const go = (t: ChatThread | undefined) => {
    const id = t?.id ?? openThread({ type: "customer_support", vendorId: null });
    router.push(`/messages/${id}`);
  };

  const row = (t: ChatThread | undefined, pinned = false) => {
    const v = vendorById(db, t?.vendor_id ?? null);
    const name = pinned ? tx("গাড়িহাব সাপোর্ট", "GaariHub support") : v ? (lang === "bn" ? v.shop_name_bn : v.shop_name) : "—";
    const unread = t?.unread_customer ?? 0;
    return (
      <button type="button" onClick={() => go(t)} className={clsx("flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left hover:border-ink/30", pinned ? "border-brand/40" : "border-line")}>
        {pinned ? (
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-xl text-white" aria-hidden>
            🛟
          </span>
        ) : (
          <ShopLogo name={name} color={v?.logo_color ?? "#64748b"} />
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 font-bold">
            {name} {pinned && <Pin className="size-3.5 text-brand" aria-label={tx("পিন করা", "Pinned")} />}
          </span>
          <span className={clsx("block truncate text-sm", unread ? "font-semibold text-ink" : "text-muted")}>{previewOf(t?.messages[t.messages.length - 1], tx)}</span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          {t && <span className="text-xs text-muted">{ago(t.last_message_at)}</span>}
          {unread > 0 && <span className="grid min-w-6 place-items-center rounded-full bg-bad px-1.5 text-xs font-bold leading-6 text-white">{d(unread)}</span>}
        </span>
      </button>
    );
  };

  return (
    <Container className="space-y-4">
      <PageHeader title={`💬 ${tx("মেসেজ", "Messages")}`} subtitle={tx("দোকান ও গাড়িহাব সাপোর্ট", "Shops and GaariHub support")} />
      <AudioGuide text={tx("দোকানের সাথে এখানে কথা বলুন। নম্বর শেয়ার করবেন না, অ্যাপের বাইরে কিনলে টাকা ফেরতের সুরক্ষা পাবেন না।", "Chat with shops here. Don't share phone numbers; buying outside the app loses your money-back protection.")} />
      <ul className="space-y-2">
        <li>
          {row(support, true)}
        </li>
        {shops.map((t) => (
          <li key={t.id}>
            {row(t)}
          </li>
        ))}
      </ul>
      {shops.length === 0 && <EmptyState icon="🏪" title={tx("কোনো দোকানের সাথে কথা হয়নি", "No shop chats yet")} body={tx("পণ্য বা দামের পাশে 💬 প্রশ্ন চাপলে এখানে আসবে।", "Tap 💬 Ask next to a product or quote to start.")} />}
      <HelpCall />
    </Container>
  );
}
