"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { resolveMediaUrl } from "@/lib/blobstore";
import { CategoryIcon } from "./CategoryIcon";

const TINTS: Record<string, string> = {
  light: "from-amber-50 to-amber-100 text-amber-700",
  brake: "from-slate-100 to-slate-200 text-slate-600",
  engine: "from-zinc-100 to-zinc-200 text-zinc-700",
  filter: "from-sky-50 to-sky-100 text-sky-700",
  fluid: "from-yellow-50 to-amber-100 text-amber-800",
  battery: "from-emerald-50 to-emerald-100 text-emerald-700",
  tyre: "from-neutral-200 to-neutral-300 text-neutral-800",
  body: "from-cyan-50 to-cyan-100 text-cyan-800",
  mirror: "from-indigo-50 to-indigo-100 text-indigo-700",
  box: "from-orange-50 to-orange-100 text-orange-800",
  doc: "from-stone-100 to-stone-200 text-stone-600",
};

/**
 * Renders listing/quote media. "ph:<icon>" is a generated placeholder (the
 * mock has no product photos), "idb:<id>" an uploaded blob, anything else a URL.
 */
export function MediaImage({ src, alt, className, iconClass }: { src: string | null | undefined; alt: string; className?: string; iconClass?: string }) {
  const [url, setUrl] = useState<string | null>(src && !src.startsWith("idb:") && !src.startsWith("ph:") ? src : null);
  useEffect(() => {
    if (src?.startsWith("idb:")) void resolveMediaUrl(src).then(setUrl);
  }, [src]);

  if (!src || src.startsWith("ph:")) {
    const key = src?.slice(3) || "part";
    return (
      <div role="img" aria-label={alt} className={clsx("grid place-items-center bg-gradient-to-br", TINTS[key] ?? "from-slate-50 to-slate-100 text-slate-500", className)}>
        <CategoryIcon icon={key} className={clsx("size-1/3 min-h-6 min-w-6 opacity-80", iconClass)} />
      </div>
    );
  }
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element -- local blob / mock URLs
    <img src={url} alt={alt} className={clsx("object-cover", className)} />
  ) : (
    <div className={clsx("animate-pulse bg-surface", className)} />
  );
}
