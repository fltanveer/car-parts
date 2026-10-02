"use client";

import { HandHelping } from "lucide-react";
import Link from "next/link";
import { useT } from "@/components/providers/LangProvider";
import { useMyCar } from "./hooks";

/** Never an empty page: "Didn't find it? Get prices from shops" → /request prefilled (file 01 4.1). */
export function RequestPromptCard({ text, big }: { text?: string; big?: boolean }) {
  const { tx } = useT();
  const { vehicle } = useMyCar();
  const params = new URLSearchParams();
  if (text?.trim()) params.set("q", text.trim());
  if (vehicle) params.set("vehicle", vehicle.id);
  const qs = params.toString();
  return (
    <Link
      href={`/request${qs ? `?${qs}` : ""}`}
      className={
        big
          ? "flex flex-col items-center gap-3 rounded-2xl border-2 border-brand bg-brand-soft/40 px-5 py-8 text-center hover:bg-brand-soft/60"
          : "flex items-center gap-4 rounded-2xl border-2 border-brand/40 bg-brand-soft/30 p-4 hover:border-brand"
      }
    >
      <span className={big ? "grid size-16 place-items-center rounded-2xl bg-brand text-white" : "grid size-12 shrink-0 place-items-center rounded-xl bg-brand text-white"}>
        <HandHelping className={big ? "size-8" : "size-6"} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className={big ? "block text-xl font-bold" : "block text-lg font-bold"}>{tx("পাননি? দোকানগুলো থেকে দাম নিন", "Not found? Get prices from shops")}</span>
        <span className="block text-sm text-ink-2">
          {tx("কী লাগবে বলুন বা ছবি দিন। অনেক দোকান দাম পাঠাবে, আপনি বেছে নেবেন।", "Tell us or send a photo. Many shops will quote, you choose.")}
        </span>
        {big && <span className="mt-4 inline-flex min-h-14 items-center rounded-2xl bg-brand px-6 text-lg font-semibold text-white">🙋 {tx("দাম চাই", "Ask for prices")}</span>}
      </span>
    </Link>
  );
}
