"use client";

import clsx from "clsx";
import { PlayCircle } from "lucide-react";
import { useState } from "react";
import type { ListingMedia } from "@/lib/types";
import { useT } from "@/components/providers/LangProvider";
import { MediaImage } from "@/components/ui/MediaImage";

/** Photo gallery with role tags: defect photos are tagged "দাগ/সমস্যা" (file 01 4.4). */
export function Gallery({ media, alt }: { media: ListingMedia[]; alt: string }) {
  const { tx } = useT();
  const [i, setI] = useState(0);
  const items = media.length ? media : [{ url: "ph:part", role: "main" as const }];
  const cur = items[Math.min(i, items.length - 1)];
  const tag = (role: ListingMedia["role"]) =>
    role === "defect"
      ? { text: tx("⚠️ দাগ/সমস্যা", "⚠️ Defect"), cls: "bg-bad text-white" }
      : role === "label"
        ? { text: tx("🏷️ লেবেল / পার্ট নম্বর", "🏷️ Label / part no."), cls: "bg-ink text-white" }
        : role === "running_video"
          ? { text: tx("▶️ চালু অবস্থার ভিডিও", "▶️ Running video"), cls: "bg-ok text-white" }
          : null;
  const t = tag(cur.role);
  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-2xl border border-line bg-card">
        <MediaImage src={cur.url} alt={alt} className="aspect-[4/3] w-full" />
        {cur.role === "running_video" && <PlayCircle className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-lg" aria-hidden />}
        {t && <span className={clsx("absolute left-3 top-3 rounded-lg px-2.5 py-1 text-sm font-bold", t.cls)}>{t.text}</span>}
        <span className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-2.5 py-0.5 text-xs font-semibold text-white">
          {i + 1}/{items.length}
        </span>
      </div>
      {items.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {items.map((m, idx) => {
            const tg = tag(m.role);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setI(idx)}
                aria-label={`${tx("ছবি", "Photo")} ${idx + 1}${tg ? ` · ${tg.text}` : ""}`}
                aria-pressed={idx === i}
                className={clsx("relative size-16 shrink-0 overflow-hidden rounded-xl border-2", idx === i ? "border-brand" : "border-line")}
              >
                <MediaImage src={m.url} alt="" className="size-full" />
                {tg && <span className={clsx("absolute inset-x-0 bottom-0 truncate px-0.5 text-[10px] font-bold", tg.cls)}>{tg.text}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
