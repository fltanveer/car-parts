"use client";

import { Car, ChevronDown, Plus } from "lucide-react";
import Link from "next/link";
import { describeGeneration, getEngine } from "@/lib/api";
import { useActiveVehicle, useHydrated } from "@/lib/store";
import type { UserVehicle } from "@/lib/types";
import { useT } from "../providers/LangProvider";

export const vehicleLabel = (v: UserVehicle, lang: "bn" | "en") => {
  const g = describeGeneration(v.generation_id, lang);
  if (!g) return v.nickname || v.chassis_number || (lang === "bn" ? "গাড়ি (সেট করা বাকি)" : "Car (pending setup)");
  const engine = v.engine_id ? getEngine(v.engine_id) : null;
  return `${g.short} ${g.years} (${g.generation.chassis_codes[0]}${engine ? ` · ${engine.code}` : ""})`;
};

// Spec 7.1: "my car" chip. Tapping goes to the garage to switch cars.
export function VehicleChip() {
  const { lang, t } = useT();
  const v = useActiveVehicle();
  const hydrated = useHydrated();

  if (!hydrated) return <div className="h-12 animate-pulse rounded-xl bg-line/60" />;

  if (!v)
    return (
      <Link
        href="/garage/add"
        className="flex min-h-12 items-center gap-2 rounded-xl border-2 border-dashed border-ink/25 bg-card px-4 font-semibold hover:border-ink/50"
      >
        <Plus className="size-5 shrink-0" aria-hidden />
        <span className="min-w-0 py-1.5">
          <span className="block">{t("add_your_car")}</span>
          <span className="block text-sm font-normal text-muted">{lang === "bn" ? "শুধু ফিট হওয়া পার্ট দেখাবো" : "See only parts that fit"}</span>
        </span>
      </Link>
    );

  return (
    <Link href="/garage" className="flex min-h-12 items-center gap-2.5 rounded-xl bg-ink px-4 text-white">
      <Car className="size-5 shrink-0 text-accent" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] uppercase tracking-wider text-white/60">{t("my_car")}</span>
        <span className="block truncate font-semibold">{vehicleLabel(v, lang)}</span>
      </span>
      <ChevronDown className="size-5 shrink-0" aria-hidden />
    </Link>
  );
}
