"use client";

import clsx from "clsx";
import { Volume2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "../providers/LangProvider";

/**
 * Read text aloud (rule 5). Pre-recorded files will be uploaded from admin
 * settings; until then the browser speech engine is used, and the text is
 * always shown too so it works even without a Bangla voice installed.
 */
export const speak = (text: string, lang: "bn" | "en" = "bn") => {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "bn" ? "bn-BD" : "en-US";
    u.rate = 0.9;
    synth.speak(u);
  } catch {
    /* text fallback is visible */
  }
};

/** 🔊 button that reads `text` and shows it in a callout. */
export function AudioGuide({ text, className, label, compact }: { text: string; className?: string; label?: string; compact?: boolean }) {
  const { tx, lang } = useT();
  const [open, setOpen] = useState(false);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  return (
    <div className={clsx("relative", className)}>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          speak(text, lang);
        }}
        aria-label={compact ? (label ?? tx("শুনুন", "Listen")) : undefined}
        className={clsx(
          "inline-flex min-h-10 items-center gap-1.5 rounded-full bg-brand-soft font-semibold text-brand-ink hover:brightness-95",
          compact ? "size-10 justify-center" : "px-3.5 text-sm",
        )}
      >
        <Volume2 className="size-4.5" aria-hidden />
        {!compact && (label ?? tx("শুনুন কী করতে হবে", "Listen to instructions"))}
      </button>
      {open && (
        <div className="mt-2 flex items-start gap-2 rounded-xl border border-brand/30 bg-brand-soft/60 p-3 text-sm text-brand-ink" role="status">
          <p className="flex-1">{text}</p>
          <button
            type="button"
            aria-label={tx("বন্ধ", "Close")}
            onClick={() => {
              window.speechSynthesis?.cancel();
              setOpen(false);
            }}
            className="-m-1 p-1"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/** Small inline 🔊 that just speaks (for prices and cards). */
export function SpeakButton({ text, label, className }: { text: string; label?: string; className?: string }) {
  const { tx, lang } = useT();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        speak(text, lang);
      }}
      className={clsx("inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-brand-ink ring-1 ring-brand/30 hover:bg-brand-soft/60", className)}
    >
      <Volume2 className="size-4" aria-hidden />
      {label ?? tx("শুনুন", "Listen")}
    </button>
  );
}
