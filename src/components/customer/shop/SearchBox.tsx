"use client";

import { Camera, Mic, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { useDictation } from "./useDictation";

/** Search input with 🎤 (speech-to-text where supported, else voice request) and 📷 (photo request). */
export function SearchBox({ value, onChange, onSubmit, autoFocus }: { value: string; onChange: (v: string) => void; onSubmit: (v: string) => void; autoFocus?: boolean }) {
  const { tx, lang } = useT();
  const router = useRouter();
  const dict = useDictation((t) => {
    onChange(t);
    onSubmit(t);
  }, lang);
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value);
      }}
      className="flex items-center gap-1 rounded-2xl border-2 border-ink/15 bg-card p-1.5 focus-within:border-brand"
    >
      <Search className="ml-2 size-5 shrink-0 text-muted" aria-hidden />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        enterKeyHint="search"
        aria-label={tx("খুঁজুন", "Search")}
        placeholder={tx("পার্টের নাম, পার্ট নম্বর বা দোকান", "Part name, part number or shop")}
        className="min-h-12 min-w-0 flex-1 bg-transparent px-1 outline-none placeholder:text-muted/80"
      />
      {value && (
        <button type="button" onClick={() => { onChange(""); onSubmit(""); }} aria-label={tx("মুছুন", "Clear")} className="grid size-10 shrink-0 place-items-center rounded-xl hover:bg-ink/5">
          <X className="size-5" aria-hidden />
        </button>
      )}
      <button
        type="button"
        aria-label={dict.listening ? tx("শুনছি… থামাতে চাপুন", "Listening… tap to stop") : tx("বলে খুঁজুন", "Speak to search")}
        onClick={() => {
          if (dict.listening) return dict.stop();
          if (!dict.supported || !dict.start()) {
            toast(tx("এই ফোনে বলে লেখা যায় না, ভয়েস রিকোয়েস্ট খুলছি", "Speech isn't supported here, opening voice request"), "info");
            router.push("/request?mode=voice");
          }
        }}
        className={`grid size-12 shrink-0 place-items-center rounded-xl text-white ${dict.listening ? "recording-pulse bg-bad" : "bg-bad"}`}
      >
        <Mic className="size-6" aria-hidden />
      </button>
      <Link href="/request?mode=photo" aria-label={tx("ছবি দিয়ে খুঁজুন", "Search by photo")} className="grid size-12 shrink-0 place-items-center rounded-xl bg-surface">
        <Camera className="size-6" aria-hidden />
      </Link>
    </form>
  );
}
