"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Minimal typing for the browser speech-to-text API (Chrome on Android has it).
interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type RecognitionCtor = new () => RecognitionLike;

const getCtor = (): RecognitionCtor | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

/** Speak → text (rule 6). `supported` is false where the browser has no speech engine. */
export function useDictation(onText: (text: string) => void, lang: "bn" | "en") {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const rec = useRef<RecognitionLike | null>(null);
  const cb = useRef(onText);
  useEffect(() => {
    cb.current = onText;
  });
  useEffect(() => {
    // Feature detection must run after mount (no window on the server).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(!!getCtor());
    return () => rec.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) return false;
    const r = new Ctor();
    r.lang = lang === "bn" ? "bn-BD" : "en-US";
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript ?? "";
      if (text) cb.current(text);
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    rec.current = r;
    setListening(true);
    r.start();
    return true;
  }, [lang]);

  const stop = useCallback(() => rec.current?.stop(), []);
  return { listening, supported, start, stop };
}

/** "দুই হাজার পাঁচশো" / "2500" / "২৫০০" → 2500 (for spoken expense amounts). */
export const parseSpokenAmount = (text: string): number | null => {
  const en = text.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d))).replace(/,/g, "");
  const digits = en.match(/\d+(\.\d+)?/);
  if (digits) {
    let n = Number(digits[0]);
    if (/হাজার|thousand|k\b/i.test(en.slice(en.indexOf(digits[0])))) n *= 1000;
    return Math.round(n);
  }
  const words: Record<string, number> = {
    এক: 1, দুই: 2, দু: 2, তিন: 3, চার: 4, পাঁচ: 5, ছয়: 6, সাত: 7, আট: 8, নয়: 9, দশ: 10, বিশ: 20, ত্রিশ: 30, চল্লিশ: 40, পঞ্চাশ: 50, ষাট: 60, সত্তর: 70, আশি: 80, নব্বই: 90,
  };
  let total = 0;
  let cur = 0;
  for (const w of text.split(/\s+/)) {
    const hundred = w.match(/^(.+?)শো$/);
    if (hundred && words[hundred[1]]) cur += words[hundred[1]] * 100;
    else if (w === "শো" || w === "শ") cur = (cur || 1) * 100;
    else if (w.startsWith("হাজার")) { total += (cur || 1) * 1000; cur = 0; }
    else if (w.startsWith("লাখ")) { total += (cur || 1) * 100000; cur = 0; }
    else if (words[w]) cur += words[w];
  }
  total += cur;
  return total || null;
};

export const spokenExpenseCategory = (text: string) => {
  if (/তেল|অকটেন|পেট্রোল|ডিজেল|গ্যাস|fuel|petrol|octane|cng/i.test(text)) return "fuel" as const;
  if (/পার্ট|part/i.test(text)) return "parts" as const;
  if (/সার্ভিস|মেকানিক|গ্যারেজ|service|mechanic/i.test(text)) return "service" as const;
  if (/পার্কিং|parking/i.test(text)) return "parking" as const;
  if (/টোল|toll|ব্রিজ/i.test(text)) return "toll" as const;
  if (/কাগজ|টোকেন|ফিটনেস|paper|token/i.test(text)) return "papers" as const;
  return null;
};
