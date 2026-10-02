"use client";

import clsx from "clsx";
import { LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { resetDemo } from "@/lib/db/store";
import { useT } from "../providers/LangProvider";

/**
 * Demo-only switcher between the three frontends. All three share one mock
 * database in localStorage, so actions in one panel appear in the others.
 */
export function PanelSwitch({ dark }: { dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const { tx, lang, setLang } = useT();
  const item = "flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-ink hover:bg-surface";
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={tx("প্যানেল বদলান", "Switch panel")}
        className={clsx("grid size-11 place-items-center rounded-xl", dark ? "text-white hover:bg-white/10" : "hover:bg-ink/5")}
      >
        <LayoutGrid className="size-5" />
      </button>
      {open && (
        <>
          <button type="button" aria-label={tx("বন্ধ", "Close")} className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-line bg-card p-2 shadow-xl" onClick={() => setOpen(false)}>
            <p className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-wide text-muted">{tx("ডেমো: প্যানেল", "Demo: panels")}</p>
            <Link href="/" className={item}>🛒 {tx("কাস্টমার অ্যাপ", "Customer app")}</Link>
            <Link href="/seller" className={item}>🏪 {tx("বিক্রেতা প্যানেল", "Seller panel")}</Link>
            <Link href="/admin" className={item}>🛠️ {tx("অ্যাডমিন প্যানেল", "Admin panel")}</Link>
            <hr className="my-2 border-line" />
            <button type="button" className={item + " w-full"} onClick={() => setLang(lang === "bn" ? "en" : "bn")}>
              🌐 {lang === "bn" ? "English" : "বাংলা"}
            </button>
            <button
              type="button"
              className={item + " w-full text-bad"}
              onClick={() => {
                if (confirm(tx("সব ডেমো ডেটা মুছে শুরু থেকে?", "Reset all demo data?"))) resetDemo();
              }}
            >
              ↺ {tx("ডেমো ডেটা রিসেট", "Reset demo data")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
