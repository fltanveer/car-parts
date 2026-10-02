"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { useDb } from "@/lib/db/store";
import { digits, formatDate, formatDateTime, num, range, relTime, taka } from "@/lib/format";
import type { Label } from "@/lib/labels";
import type { Lang } from "@/lib/types";

const LangContext = createContext<Lang>("bn");

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const largeText = useDb((s) => s.prefs.largeText);
  useEffect(() => {
    document.documentElement.classList.toggle("large-text", largeText);
  }, [largeText]);
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

/** One hook for copy + number formatting in client components. */
export function useT() {
  const lang = useContext(LangContext);
  const bnDigits = useDb((s) => s.prefs.bnDigits);
  const router = useRouter();

  const setLang = useCallback(
    (l: Lang) => {
      document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    },
    [router],
  );

  return useMemo(
    () => ({
      lang,
      setLang,
      tx: (bn: string, en: string) => (lang === "bn" ? bn : en),
      /** Pick the label for the current language. */
      L: (l: Pick<Label, "bn" | "en"> | undefined) => (l ? (lang === "bn" ? l.bn : l.en) : ""),
      taka: (n: number) => taka(n, lang, bnDigits),
      num: (n: number) => num(n, lang, bnDigits),
      d: (s: string | number) => digits(s, lang, bnDigits),
      range: (a: number, b: number) => range(a, b, lang, bnDigits),
      date: (iso: string) => formatDate(iso, lang),
      dateTime: (iso: string) => formatDateTime(iso, lang),
      ago: (iso: string) => relTime(iso, lang, bnDigits),
    }),
    [lang, bnDigits, setLang],
  );
}
