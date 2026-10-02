"use client";

import clsx from "clsx";
import { listingById } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import type { ChatMessage } from "@/lib/types";
import { VoicePlayer } from "../../media/VoicePlayer";
import { useT } from "../../providers/LangProvider";
import { MediaImage } from "../../ui/MediaImage";

export function Bubble({ m }: { m: ChatMessage }) {
  const { tx, taka, ago } = useT();
  const listing = useDb((s) => (m.ref_id && (m.type === "listing_card" || m.type === "offer_card") ? listingById(s, m.ref_id) : null));
  if (m.type === "system") return <p className="mx-auto max-w-sm rounded-xl bg-wait-soft px-3 py-2 text-center text-xs font-semibold text-wait">⚠️ {m.body}</p>;
  const mine = m.sender === "vendor";
  return (
    <div className={clsx("flex", mine ? "justify-end" : "justify-start")}>
      <div className={clsx("max-w-[85%] space-y-1 rounded-2xl px-3 py-2", mine ? "rounded-br-sm bg-seller text-white" : "rounded-bl-sm bg-card ring-1 ring-line")}>
        {m.sender === "support" && <p className="text-xs font-bold text-brand">🛟 {tx("সাপোর্ট", "Support")}</p>}
        {m.type === "voice" && m.voice && <VoicePlayer src={m.voice.url} duration={m.voice.duration_sec} dark={mine} />}
        {m.type === "image" && m.image && <MediaImage src={m.image.url} alt={m.image.name} className="size-48 rounded-xl" />}
        {(m.type === "listing_card" || m.type === "offer_card") && (
          <div className={clsx("flex gap-2 rounded-xl p-2", mine ? "bg-white/15" : "bg-surface")}>
            <MediaImage src={listing?.media[0]?.url} alt="" className="size-14 shrink-0 rounded-lg" />
            <div className="min-w-0">
              <p className="font-semibold leading-tight">{m.body}</p>
              {m.type === "offer_card" ? (
                <p>
                  🏷️ {tx("শুধু আপনার জন্য", "Just for you")}: <b className="text-lg">{taka(m.offer_price ?? 0)}</b>
                  {listing && listing.price > (m.offer_price ?? 0) && <s className="ml-1 opacity-70">{taka(listing.price)}</s>}
                </p>
              ) : (
                listing && <p className="font-bold">{taka(listing.price)}</p>
              )}
            </div>
          </div>
        )}
        {(m.type === "text" || m.type === "quote_card" || m.type === "order_card") && m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
        {m.contains_contact_info && <p className="text-xs opacity-80">🔒 {tx("নম্বর লুকানো হয়েছে", "Number hidden")}</p>}
        <p className={clsx("text-[11px]", mine ? "text-white/70" : "text-muted")}>{ago(m.created_at)}</p>
      </div>
    </div>
  );
}
