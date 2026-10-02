"use client";

import clsx from "clsx";
import { Camera, Mic, PencilLine, Phone } from "lucide-react";
import Link from "next/link";
import { telLink } from "@/lib/links";
import { useT } from "../providers/LangProvider";

// Spec 7.3: never show an empty page. The request page reads `q` to prefill
// the description; the active car comes from the store.
export function NotFoundCard({ q, className, compact }: { q?: string; className?: string; compact?: boolean }) {
  const { t, tx } = useT();
  const query = q?.trim();
  const href = (mode: "voice" | "photo" | "text") => `/request?mode=${mode}${query ? `&q=${encodeURIComponent(query)}` : ""}`;

  const btn = "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 text-sm font-semibold transition active:scale-[0.98]";

  return (
    <section
      aria-labelledby="nf-title"
      className={clsx("rounded-2xl border border-accent/40 bg-accent-soft p-4 sm:p-5", className)}
    >
      <h2 id="nf-title" className={clsx("font-bold text-ink", compact ? "text-lg" : "text-xl")}>
        {t("not_found_title")}
      </h2>
      <p className="mt-1 text-accent-ink">
        {query
          ? tx(`“${query}” দিয়ে বলুন বা ছবি দিন, আমরা খুঁজে দাম জানাবো।`, `Tell us about “${query}” or send a photo, we'll find it and quote you.`)
          : t("not_found_body")}
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Link href={href("voice")} className={clsx(btn, "bg-danger text-white hover:brightness-95")}>
          <Mic className="size-6" aria-hidden />
          {t("speak")}
        </Link>
        <Link href={href("photo")} className={clsx(btn, "bg-ink text-white hover:bg-ink-2")}>
          <Camera className="size-6" aria-hidden />
          {tx("ছবি দিন", "Photo")}
        </Link>
        <Link href={href("text")} className={clsx(btn, "border-2 border-ink/15 bg-card text-ink hover:border-ink/40")}>
          <PencilLine className="size-6" aria-hidden />
          {t("write")}
        </Link>
      </div>
      <a href={telLink()} className="mt-3 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-accent-ink underline-offset-4 hover:underline">
        <Phone className="size-4" aria-hidden />
        {tx("অথবা সরাসরি কল করুন", "Or call us directly")}
      </a>
    </section>
  );
}
