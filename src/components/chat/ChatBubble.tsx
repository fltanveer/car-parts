"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { resolveMediaUrl } from "@/lib/blobstore";
import type { ChatMessage, MediaItem } from "@/lib/types";
import { VoicePlayer } from "../media/VoicePlayer";
import { useT } from "../providers/LangProvider";
import { OrderRefCard, PartRefCard, RequestRefCard } from "./RefCards";

function ChatImage({ item }: { item: MediaItem }) {
  const { tx } = useT();
  const [url, setUrl] = useState<string | null>(item.url.startsWith("idb:") ? null : item.url);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    if (!item.url.startsWith("idb:")) return;
    let live = true;
    void resolveMediaUrl(item.url).then((u) => {
      if (!live) return;
      if (u) setUrl(u);
      else setMissing(true);
    });
    return () => {
      live = false;
    };
  }, [item.url]);
  if (missing) return <p className="text-sm italic opacity-80">{tx("ছবি পাওয়া যায়নি", "Image unavailable")}</p>;
  return (
    <a href={url ?? undefined} target="_blank" rel="noopener" className="block">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- local blob URL
        <img src={url} alt={item.name} loading="lazy" className="max-h-72 w-56 max-w-full rounded-xl object-cover" />
      ) : (
        <span className="block h-40 w-56 max-w-full animate-pulse rounded-xl bg-line/60" />
      )}
    </a>
  );
}

export function ChatBubble({ m }: { m: ChatMessage }) {
  const { dateTime, tx } = useT();
  const mine = m.sender_type === "user";

  if (m.sender_type === "system")
    return <p className="mx-auto max-w-[85%] rounded-full bg-line/70 px-3 py-1 text-center text-xs text-ink-2">{m.body}</p>;

  const isCard = m.type === "part_card" || m.type === "order_card" || m.type === "request_card";
  const isMedia = m.type === "image" || isCard;

  return (
    <div className={clsx("flex flex-col", mine ? "items-end" : "items-start")}>
      {!mine && <span className="mb-0.5 ml-1 text-xs font-semibold text-muted">PartsBD</span>}
      <div
        className={clsx(
          "max-w-[85%] break-words",
          isMedia ? "rounded-2xl p-1" : "rounded-2xl px-3.5 py-2.5",
          mine ? "rounded-br-md bg-ink text-white" : "rounded-bl-md border border-line bg-card",
          m.type === "voice" && "w-64",
        )}
      >
        {m.type === "text" && <p className="whitespace-pre-wrap">{m.body}</p>}
        {m.type === "voice" &&
          (m.voice ? (
            <VoicePlayer src={m.voice.url} duration={m.voice.duration_sec} dark={mine} />
          ) : (
            <p className="text-sm italic">{tx("ভয়েস নোট", "Voice note")}</p>
          ))}
        {m.type === "image" && m.image && <ChatImage item={m.image} />}
        {m.type === "part_card" && m.ref_id && <PartRefCard partId={m.ref_id} />}
        {m.type === "order_card" && m.ref_id && <OrderRefCard orderId={m.ref_id} />}
        {m.type === "request_card" && m.ref_id && <RequestRefCard requestId={m.ref_id} />}
        {isMedia && m.body && <p className="whitespace-pre-wrap px-2 pb-1 pt-1.5 text-sm">{m.body}</p>}
      </div>
      <time dateTime={m.created_at} className="mx-1 mt-0.5 text-[11px] text-muted">
        {dateTime(m.created_at)}
      </time>
    </div>
  );
}
