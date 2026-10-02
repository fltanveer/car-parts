"use client";

import clsx from "clsx";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "../providers/LangProvider";

// Copies plain text (numbers are always copied with English digits so they
// paste correctly into bKash / Nagad / courier apps).
export function CopyButton({ value, className, label }: { value: string; className?: string; label?: string }) {
  const { t } = useT();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => setDone(false), 1800);
    return () => clearTimeout(id);
  }, [done]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
    } catch {
      // Fallback for old Android browsers without the async clipboard API.
      try {
        const ta = document.createElement("textarea");
        ta.value = value;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        setDone(true);
      } catch {
        /* nothing else we can do; the number is visible on screen */
      }
    }
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className={clsx(
        "no-print inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border-2 px-3 text-sm font-semibold transition-colors",
        done ? "border-ok bg-ok text-white" : "border-ink/15 bg-card hover:border-ink/40",
        className,
      )}
      aria-live="polite"
    >
      {done ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {done ? t("copied") : (label ?? t("copy"))}
    </button>
  );
}
