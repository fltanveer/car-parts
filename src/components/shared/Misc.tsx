"use client";

import clsx from "clsx";
import { ArrowLeft, Delete, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { telLink } from "@/lib/links";
import { settings } from "@/lib/mock/settings";
import type { VehicleMake } from "@/lib/types";
import { useT } from "../providers/LangProvider";

/** Rule 9: big, obvious back. */
export function BackButton({ href, label }: { href?: string; label?: string }) {
  const router = useRouter();
  const { tx } = useT();
  return (
    <button
      type="button"
      onClick={() => (href ? router.push(href) : router.back())}
      className="-ml-2 mb-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 font-semibold text-ink-2 hover:bg-ink/5"
    >
      <ArrowLeft className="size-5" aria-hidden />
      {label ?? tx("পেছনে", "Back")}
    </button>
  );
}

/** Rule 7: a human is always one tap away. */
export function HelpCall({ className, text }: { className?: string; text?: string }) {
  const { tx, lang } = useT();
  return (
    <a href={telLink()} className={clsx("flex min-h-14 items-center gap-3 rounded-2xl border border-line bg-card px-4 hover:border-ink/30", className)}>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ok text-white">
        <Phone className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{text ?? tx("সাহায্য লাগবে? কল করুন", "Need help? Call us")}</span>
        <span className="block text-sm text-muted">{lang === "bn" ? settings.hotline_display : settings.hotline}</span>
      </span>
    </a>
  );
}

export function MakeLogo({ make, size = "md" }: { make: Pick<VehicleMake, "name" | "color">; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      className={clsx("grid shrink-0 place-items-center rounded-xl font-black text-white", size === "sm" ? "size-8 text-xs" : size === "lg" ? "size-14 text-lg" : "size-11 text-sm")}
      style={{ background: make.color }}
      aria-hidden
    >
      {make.name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function ShopLogo({ name, color, size = "md" }: { name: string; color: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      className={clsx("grid shrink-0 place-items-center rounded-full font-black text-white", size === "sm" ? "size-8 text-xs" : size === "lg" ? "size-16 text-xl" : "size-11 text-sm")}
      style={{ background: color }}
      aria-hidden
    >
      {name.slice(0, 1)}
    </span>
  );
}

/** Calculator-style price pad (file 02 §5.1). */
export function NumberPad({ value, onChange, max = 9_999_999 }: { value: number; onChange: (v: number) => void; max?: number }) {
  const { taka, d } = useT();
  const press = (k: string) => {
    if (k === "del") return onChange(Math.floor(value / 10));
    if (k === "clear") return onChange(0);
    const next = Number(`${value === 0 ? "" : value}${k}`);
    if (next <= max) onChange(next);
  };
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "del"];
  return (
    <div className="space-y-3">
      <p className="rounded-2xl bg-ink px-5 py-4 text-right text-4xl font-bold tabular-nums text-white">{taka(value)}</p>
      <div className="grid grid-cols-3 gap-2">
        {keys.map((k) => (
          <button key={k} type="button" onClick={() => press(k)} className="grid min-h-14 place-items-center rounded-2xl border-2 border-line bg-card text-2xl font-bold hover:border-ink/40 active:scale-95">
            {k === "del" ? <Delete className="size-6" aria-label="⌫" /> : k === "clear" ? <span className="text-base">C</span> : d(k)}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        {["00", "000"].map((z) => (
          <button key={z} type="button" onClick={() => press(z)} className="min-h-11 flex-1 rounded-xl bg-surface font-bold">
            {d(z)}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Ticks once a minute so timers re-render. */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/** Live countdown: green → yellow → red as deadline approaches (rule 10). */
export function Countdown({ to, warnHours = 12, prefix }: { to: string; warnHours?: number; prefix?: string }) {
  const now = useNow(30_000);
  const { ago } = useT();
  const left = new Date(to).getTime() - now;
  const tone = left < 0 ? "text-bad bg-bad-soft" : left < warnHours * 3_600_000 ? "text-wait bg-wait-soft" : "text-ok bg-ok-soft";
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums", tone)}>
      ⏱ {prefix}
      {ago(to)}
    </span>
  );
}

// Tiny toast. Call `toast("…")` from anywhere on the client.
type ToastMsg = { id: number; text: string; tone: "ok" | "bad" | "info" };
let pushToast: ((m: ToastMsg) => void) | null = null;
export const toast = (text: string, tone: ToastMsg["tone"] = "ok") => pushToast?.({ id: Date.now(), text, tone });

export function Toaster() {
  const [items, setItems] = useState<ToastMsg[]>([]);
  useEffect(() => {
    pushToast = (m) => {
      setItems((x) => [...x, m]);
      setTimeout(() => setItems((x) => x.filter((i) => i.id !== m.id)), 3200);
    };
    return () => {
      pushToast = null;
    };
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={clsx("toast-in rounded-2xl px-5 py-3 font-semibold text-white shadow-lg", t.tone === "ok" ? "bg-ok" : t.tone === "bad" ? "bg-bad" : "bg-ink")}>
          {t.text}
        </div>
      ))}
    </div>
  );
}
