"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { openThread } from "@/lib/db/actions";
import { useDb } from "@/lib/db/store";
import type { ChatThread } from "@/lib/types";
import { useT } from "../../providers/LangProvider";
import { Button, EmptyState } from "../../ui/primitives";
import { SellerPage } from "../SellerPage";
import { useContextLabel } from "./ContextCard";

const preview = (t: ChatThread, tx: (a: string, b: string) => string) => {
  const m = t.messages[t.messages.length - 1];
  if (!m) return tx("এখনো কোনো মেসেজ নেই", "No messages yet");
  if (m.type === "voice") return "🎤 " + tx("ভয়েস", "Voice");
  if (m.type === "image") return "📷 " + tx("ছবি", "Photo");
  if (m.type === "offer_card") return "🏷️ " + tx("বিশেষ দাম", "Special price");
  if (m.type === "listing_card") return "📦 " + (m.body ?? "");
  return m.body ?? "";
};

export function ThreadList({ vendorId }: { vendorId: string }) {
  const { tx, d, ago } = useT();
  const router = useRouter();
  const ctx = useContextLabel();
  const support = useDb((s) => s.threads.find((t) => t.type === "vendor_support" && t.vendor_id === vendorId) ?? null);
  const threads = useDb((s) => s.threads.filter((t) => t.type === "customer_vendor" && t.vendor_id === vendorId).sort((a, b) => b.last_message_at.localeCompare(a.last_message_at)));

  const row = (t: ChatThread, pinned?: boolean) => (
    <li key={t.id}>
      <Link href={`/seller/messages/${t.id}`} className={`flex min-h-20 items-center gap-3 rounded-2xl border-2 p-3 ${pinned ? "border-brand/40 bg-brand-soft/30" : "border-line bg-card"}`}>
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-surface text-xl">{pinned ? "🛟" : "🙋"}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="truncate font-bold">{pinned ? tx("গাড়িহাব সাপোর্ট 📌", "GaariHub support 📌") : (t.customer_name?.split(" ")[0] ?? tx("কাস্টমার", "Customer"))}</span>
            <span className="shrink-0 text-xs text-muted">{ago(t.last_message_at)}</span>
          </span>
          {!pinned && <span className="block truncate text-xs font-semibold text-brand-ink">{ctx(t)}</span>}
          <span className="block truncate text-sm text-ink-2">{preview(t, tx)}</span>
        </span>
        {t.unread_vendor > 0 && <span className="grid min-w-6 place-items-center rounded-full bg-bad px-1.5 text-xs font-bold leading-6 text-white">{d(t.unread_vendor)}</span>}
      </Link>
    </li>
  );

  return (
    <SellerPage
      title={tx("💬 মেসেজ", "💬 Messages")}
      guide={tx("কাস্টমারের প্রশ্নের দ্রুত উত্তর দিন। ফোন নম্বর শেয়ার করা যাবে না। উপরে গাড়িহাব সাপোর্ট, যেকোনো সমস্যায় লিখুন।", "Reply to customers quickly. Phone numbers can't be shared. Support is pinned at the top.")}
    >
      <ul className="space-y-2">
        {support ? row(support, true) : (
          <li>
            <Button variant="outline" size="lg" full onClick={() => router.push(`/seller/messages/${openThread({ type: "vendor_support", vendorId })}`)}>🛟 {tx("সাপোর্টে লিখুন", "Write to support")}</Button>
          </li>
        )}
        {threads.map((t) => row(t))}
      </ul>
      {!threads.length && <EmptyState icon="💬" title={tx("কাস্টমারের কোনো মেসেজ নেই", "No customer messages")} />}
    </SellerPage>
  );
}
