"use client";

import clsx from "clsx";
import { Volume2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "../providers/LangProvider";

// Spec 4.6: 🔊 explains the screen in Bangla. Pre-recorded files will be
// uploaded from admin settings; until then we use the browser's speech engine
// and always show the text too, so it works even without a Bangla voice.
export function AudioGuide({ text, className, label }: { text: string; className?: string; label?: string }) {
  const { tx } = useT();
  const [open, setOpen] = useState(false);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const play = () => {
    setOpen(true);
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "bn-BD";
      u.rate = 0.9;
      synth.speak(u);
    } catch {
      /* text fallback is already visible */
    }
  };

  return (
    <div className={clsx("relative", className)}>
      <button
        type="button"
        onClick={play}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-accent-soft px-3.5 text-sm font-semibold text-accent-ink hover:brightness-95"
      >
        <Volume2 className="size-4.5" aria-hidden />
        {label ?? tx("শুনুন কী করতে হবে", "Listen to instructions")}
      </button>
      {open && (
        <div className="mt-2 flex items-start gap-2 rounded-xl border border-accent/40 bg-accent-soft p-3 text-sm text-accent-ink" role="status">
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
