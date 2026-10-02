"use client";

import clsx from "clsx";
import { Mic, MicOff } from "lucide-react";
import { useRef, useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";

interface Recognition {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

/** 🎤 dictation into a text field (rule 6). Uses the browser speech engine when present. */
export function Dictate({ onText, className }: { onText: (text: string) => void; className?: string }) {
  const { tx, lang } = useT();
  const [on, setOn] = useState(false);
  const rec = useRef<Recognition | null>(null);

  const start = () => {
    const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      toast(tx("এই ব্রাউজারে বলে লেখা চলে না", "Dictation isn't supported in this browser"), "bad");
      return;
    }
    const r = new Ctor();
    r.lang = lang === "bn" ? "bn-BD" : "en-US";
    r.interimResults = false;
    r.onresult = (e) => onText(Array.from(e.results).map((x) => x[0].transcript).join(" "));
    r.onend = () => setOn(false);
    r.onerror = () => setOn(false);
    rec.current = r;
    r.start();
    setOn(true);
  };

  return (
    <button
      type="button"
      onClick={() => (on ? rec.current?.stop() : start())}
      aria-pressed={on}
      className={clsx("inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold ring-1", on ? "bg-bad text-white ring-bad" : "text-ink-2 ring-line hover:ring-ink/30", className)}
    >
      {on ? <MicOff className="size-4" /> : <Mic className="size-4" />}
      {on ? tx("থামান", "Stop") : tx("বলে লিখুন", "Dictate")}
    </button>
  );
}
