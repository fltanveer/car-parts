"use client";

import { Car, ChevronDown, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { setActiveVehicle } from "@/lib/db/actions";
import { describeVehicle } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import { MakeLogo } from "@/components/shared/Misc";
import { useT } from "@/components/providers/LangProvider";
import { ButtonLink, ChoiceCard } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/Sheet";
import { myVehicles } from "./data";
import { useMyCar } from "./hooks";

/** `🚗 Axio 2010 ▾` — switch car or add one (file 01 §2). */
export function MyCarChip() {
  const { tx, lang } = useT();
  const { vehicle, desc, label } = useMyCar();
  const mine = useDb(myVehicles);
  const [open, setOpen] = useState(false);
  if (!vehicle) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border-2 border-line bg-card py-1 pl-1.5 pr-3 font-semibold hover:border-ink/30"
      >
        {desc ? <MakeLogo make={desc.make} size="sm" /> : <Car className="size-6 text-brand" aria-hidden />}
        <span className="truncate">{label}</span>
        <ChevronDown className="size-4 shrink-0" aria-hidden />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={tx("কোন গাড়ির জন্য?", "Which car?")}>
        <ul className="space-y-2">
          {mine.map((v) => {
            const dsc = describeVehicle(v.generation_id, v.engine_id, lang);
            return (
              <li key={v.id}>
                <ChoiceCard
                  selected={v.id === vehicle.id}
                  icon={dsc ? <MakeLogo make={dsc.make} size="sm" /> : <Car className="size-5" />}
                  title={dsc?.withYear ?? v.nickname ?? tx("টিম সেট করছে", "Being set up")}
                  subtitle={[v.nickname, v.registration_no].filter(Boolean).join(" · ") || undefined}
                  onClick={() => {
                    setActiveVehicle(v.id);
                    setOpen(false);
                  }}
                />
              </li>
            );
          })}
        </ul>
        <div className="mt-4 grid gap-2 pb-2 sm:grid-cols-2">
          <ButtonLink href="/garage/add" variant="outline" size="lg">
            <Plus className="size-5" aria-hidden /> {tx("আরেকটা গাড়ি যোগ", "Add another car")}
          </ButtonLink>
          <ButtonLink href={`/garage/${vehicle.id}`} variant="ghost" size="lg">
            {tx("গাড়ির খাতা খুলুন", "Open car dashboard")}
          </ButtonLink>
        </div>
      </Sheet>
    </>
  );
}

/** Big "add your car" card shown when no car is set. */
export function AddCarCard() {
  const { tx } = useT();
  return (
    <Link href="/garage/add" className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-brand/40 bg-brand-soft/30 p-4 hover:border-brand">
      <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand text-white">
        <Car className="size-7" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-bold">{tx("আপনার গাড়ি যোগ করুন", "Add your car")}</span>
        <span className="block text-sm text-ink-2">{tx("সব কিছু সহজ হবে: শুধু আপনার গাড়ির পার্টস দেখাবো", "Everything gets easier: we'll show only parts for your car")}</span>
      </span>
      <Plus className="size-6 shrink-0 text-brand" aria-hidden />
    </Link>
  );
}
