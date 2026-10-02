"use client";

import clsx from "clsx";
import { Camera, Mic, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "../providers/LangProvider";

// Spec 7.1 / 7.3: one big search field with voice + photo shortcuts inside.
export function SearchBar({ defaultValue = "", className, autoFocus }: { defaultValue?: string; className?: string; autoFocus?: boolean }) {
  const { t, tx } = useT();
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    router.push(v ? `/search?q=${encodeURIComponent(v)}` : "/search");
  };

  const iconLink = "grid size-11 shrink-0 place-items-center rounded-xl transition-colors";

  return (
    <form role="search" onSubmit={submit} className={clsx("w-full", className)}>
      <div className="flex min-h-14 items-center gap-1 rounded-2xl border-2 border-ink/15 bg-card py-1 pl-4 pr-1 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-colors focus-within:border-ink">
        <label htmlFor="site-search" className="sr-only">
          {t("search")}
        </label>
        <input
          id="site-search"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("search_placeholder")}
          className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-muted/80 [&::-webkit-search-cancel-button]:hidden"
        />
        <Link
          href="/request?mode=voice"
          className={clsx(iconLink, "text-danger hover:bg-danger/10")}
          aria-label={tx("বলে খুঁজুন (ভয়েস)", "Search by voice")}
        >
          <Mic className="size-5.5" aria-hidden />
        </Link>
        <Link href="/request?mode=photo" className={clsx(iconLink, "text-ink-2 hover:bg-ink/5")} aria-label={tx("ছবি দিয়ে খুঁজুন", "Search by photo")}>
          <Camera className="size-5.5" aria-hidden />
        </Link>
        <button type="submit" className={clsx(iconLink, "bg-ink text-white hover:bg-ink-2")} aria-label={t("search")}>
          <Search className="size-5" aria-hidden />
        </button>
      </div>
    </form>
  );
}
