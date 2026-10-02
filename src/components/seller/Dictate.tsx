"use client";

import clsx from "clsx";
import { Mic, MicOff } from "lucide-react";
import { type ComponentProps, useEffect, useRef, useState } from "react";
import { useT } from "../providers/LangProvider";
import { toast } from "../shared/Misc";
import { Input, Textarea } from "../ui/primitives";

// Minimal typing for the browser speech-to-text API (Chrome/Android: webkit prefix).
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
type RecognitionCtor = new () => Recognition;

const getCtor = (): RecognitionCtor | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

/** 🎤 "say it" button: speech → text (rule 6). Falls back to a hint when unsupported. */
export function DictateButton({ onText, className, big }: { onText: (text: string) => void; className?: string; big?: boolean }) {
  const { tx, lang } = useT();
  const [on, setOn] = useState(false);
  const rec = useRef<Recognition | null>(null);
  useEffect(() => () => rec.current?.stop(), []);

  const start = () => {
    const Ctor = getCtor();
    if (!Ctor) {
      toast(tx("এই ফোনে বলে লেখা চলে না। লিখুন, বা সাহায্যে কল করুন।", "Voice typing isn't supported here. Please type or call us."), "info");
      return;
    }
    if (on) {
      rec.current?.stop();
      return;
    }
    const r = new Ctor();
    r.lang = lang === "bn" ? "bn-BD" : "en-US";
    r.interimResults = false;
    r.continuous = false;
    r.onresult = (e) => {
      const text = Array.from(e.results).map((x) => x[0]?.transcript ?? "").join(" ").trim();
      if (text) onText(text);
    };
    r.onend = () => setOn(false);
    r.onerror = () => {
      setOn(false);
      toast(tx("শোনা যায়নি, আবার বলুন", "Didn't catch that, try again"), "bad");
    };
    rec.current = r;
    setOn(true);
    r.start();
  };

  return (
    <button
      type="button"
      onClick={start}
      aria-label={tx("বলে লিখুন", "Speak to type")}
      className={clsx(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl font-semibold",
        on ? "animate-pulse bg-bad text-white" : "bg-brand-soft text-brand-ink",
        big ? "min-h-14 px-4" : "size-12",
        className,
      )}
    >
      {on ? <MicOff className="size-5" /> : <Mic className="size-5" />}
      {big && (on ? tx("থামান", "Stop") : tx("🎤 বলুন", "🎤 Speak"))}
    </button>
  );
}

/** Text input with a 🎤 button next to it. */
export function VoiceInput({ value, onChange, ...rest }: Omit<ComponentProps<"input">, "value" | "onChange"> & { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      <Input value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
      <DictateButton onText={(t) => onChange(value ? `${value} ${t}` : t)} />
    </div>
  );
}

/** Textarea with a 🎤 button under it. */
export function VoiceTextarea({ value, onChange, ...rest }: Omit<ComponentProps<"textarea">, "value" | "onChange"> & { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
      <DictateButton big onText={(t) => onChange(value ? `${value} ${t}` : t)} />
    </div>
  );
}
