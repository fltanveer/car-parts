"use client";

import clsx from "clsx";
import { AlertTriangle, CheckCircle2, Plus } from "lucide-react";
import Link from "next/link";
import { describeGeneration, getEngine, partFits } from "@/lib/api";
import { useActiveVehicle, useHydrated } from "@/lib/store";
import type { Part } from "@/lib/types";
import { useT } from "../providers/LangProvider";
import { vehicleLabel } from "../vehicle/VehicleChip";

// Spec 7.7: big ✅ / ⚠️ for the user's own car.
export function FitVerdict({ part }: { part: Part }) {
  const { t, tx, lang } = useT();
  const hydrated = useHydrated();
  const vehicle = useActiveVehicle();

  if (!hydrated) return <div className="h-20 animate-pulse rounded-2xl bg-line/60" />;

  if (!vehicle)
    return (
      <Link
        href="/garage/add"
        className="flex min-h-16 items-center gap-3 rounded-2xl border-2 border-dashed border-ink/25 bg-card p-4 hover:border-ink/50"
      >
        <Plus className="size-6 shrink-0" aria-hidden />
        <span className="flex-1">
          <span className="block font-semibold">{t("add_your_car")}</span>
          <span className="block text-sm text-muted">{tx("আপনার গাড়িতে ফিট করবে কিনা আমরা মিলিয়ে দেখাবো", "We'll check whether it fits your car")}</span>
        </span>
      </Link>
    );

  const fits = partFits(part, vehicle.generation_id);
  const label = vehicleLabel(vehicle, lang);

  if (fits === null)
    return (
      <div className="rounded-2xl border border-line bg-card p-4">
        <p className="font-semibold">{tx("আপনার গাড়ির তথ্য এখনো সেট হয়নি", "Your car details are still being set up")}</p>
        <p className="mt-1 text-sm text-muted">{tx("নিশ্চিত হতে নিচে আমাদের জিজ্ঞেস করুন।", "Ask us below to be sure.")}</p>
      </div>
    );

  return (
    <div
      className={clsx(
        "flex items-start gap-3 rounded-2xl border-2 p-4",
        fits ? "border-ok/30 bg-q-genuine-soft text-ok" : "border-q-after/30 bg-q-after-soft text-q-after",
      )}
      role="status"
    >
      {fits ? <CheckCircle2 className="size-8 shrink-0" aria-hidden /> : <AlertTriangle className="size-8 shrink-0" aria-hidden />}
      <div className="min-w-0">
        <p className="text-lg font-bold leading-snug">
          {fits ? tx(`আপনার ${label}-এ ফিট করবে`, `Fits your ${label}`) : t("not_fit_your_car")}
        </p>
        <p className="mt-0.5 text-sm text-ink-2">
          {fits
            ? tx("ভুল পার্ট গেলে আমরা ফ্রিতে বদলে দিই।", "If we send the wrong part, we replace it free.")
            : tx(`এটা ${label}-এর তালিকায় নেই। কিনতে চাইলে আগে আমাদের জিজ্ঞেস করুন।`, `Not listed for ${label}. Ask us before buying.`)}
        </p>
      </div>
    </div>
  );
}

// Every car this part is listed for.
export function FitmentList({ part }: { part: Part }) {
  const { tx, lang } = useT();
  const vehicle = useActiveVehicle();
  const hydrated = useHydrated();
  const mine = hydrated ? vehicle?.generation_id : null;

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
      {part.fitments.map((f) => {
        const g = describeGeneration(f.generation_id, lang);
        if (!g) return null;
        const engine = f.engine_id ? getEngine(f.engine_id) : null;
        const isMine = mine === f.generation_id;
        return (
          <li key={`${f.generation_id}-${f.engine_id ?? ""}`} className={clsx("flex items-start gap-3 px-4 py-3", isMine && "bg-q-genuine-soft/60")}>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">
                {g.short} <span className="font-normal text-muted">{g.generation.label}</span>
              </span>
              <span className="block text-sm text-muted">
                {g.years} · {g.generation.chassis_codes.join(", ")}
                {engine ? ` · ${engine.code} ${engine.displacement_cc}cc` : ""}
              </span>
              {f.notes && <span className="mt-0.5 block text-sm text-ink-2">{f.notes}</span>}
            </span>
            {isMine && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ok px-2 py-0.5 text-xs font-semibold text-white">
                <CheckCircle2 className="size-3.5" aria-hidden />
                {tx("আপনার গাড়ি", "Your car")}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
