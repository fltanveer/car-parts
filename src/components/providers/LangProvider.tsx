"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo } from "react";
import { dict, type DictKey } from "@/lib/i18n";
import { digits, formatDate, formatDateTime, num, range, taka } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Lang } from "@/lib/types";

const LangContext = createContext<Lang>("bn");

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

// One hook for all copy + number formatting in client components.
export function useT() {
  const lang = useContext(LangContext);
  const bnDigits = useStore((s) => s.bnDigits);
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
      t: (k: DictKey) => dict[lang][k],
      // Pick between inline bn/en strings.
      tx: (bn: string, en: string) => (lang === "bn" ? bn : en),
      taka: (n: number) => taka(n, lang, bnDigits),
      num: (n: number) => num(n, lang, bnDigits),
      d: (s: string | number) => digits(s, lang, bnDigits),
      range: (a: number, b: number) => range(a, b, lang, bnDigits),
      date: (iso: string) => formatDate(iso, lang),
      dateTime: (iso: string) => formatDateTime(iso, lang),
    }),
    [lang, bnDigits, setLang],
  );
}
