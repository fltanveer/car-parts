"use client";

import clsx from "clsx";
import { Car, CircleCheck, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { removeVehicle, setActiveVehicle, setPrimaryVehicle, useHydrated, useStore } from "@/lib/store";
import type { UserVehicle } from "@/lib/types";
import { AudioGuide } from "../layout/AudioGuide";
import { MediaThumb } from "../media/PhotoUploader";
import { useT } from "../providers/LangProvider";
import { Button, ButtonLink, Card, Container } from "../ui/primitives";
import { vehicleLabel } from "../vehicle/VehicleChip";

function VehicleRow({ v, active }: { v: UserVehicle; active: boolean }) {
  const { tx, lang } = useT();
  const [confirming, setConfirming] = useState(false);

  return (
    <Card className={clsx("p-4", active && "border-2 border-ink")}>
      <div className="flex items-start gap-3">
        <span className={clsx("grid size-12 shrink-0 place-items-center rounded-xl", active ? "bg-ink text-accent" : "bg-surface text-ink")}>
          <Car className="size-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          {v.nickname && <p className="text-sm font-semibold text-muted">{v.nickname}</p>}
          <p className="text-lg font-bold leading-snug">{vehicleLabel(v, lang)}</p>
          {v.chassis_number && <p className="font-mono text-sm text-muted">{v.chassis_number}</p>}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {active && (
              <span className="inline-flex items-center gap-1 rounded-full bg-ok px-2.5 py-0.5 text-xs font-semibold text-white">
                <CircleCheck className="size-3.5" aria-hidden /> {tx("এখন এই গাড়ির পার্ট দেখাচ্ছি", "Showing parts for this car")}
              </span>
            )}
            {v.is_primary && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent-ink">
                <Star className="size-3.5" fill="currentColor" aria-hidden /> {tx("প্রধান গাড়ি", "Primary")}
              </span>
            )}
          </div>
        </div>
      </div>

      {v.needs_admin_setup && (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-accent-soft p-3 text-sm text-accent-ink">
          {v.registration_doc_url && (
            <MediaThumb item={{ id: v.id, url: v.registration_doc_url, kind: "image", name: "registration" }} />
          )}
          <p className="font-medium">{tx("আমরা দেখে আপনার গাড়ি সেট করে দেবো", "We'll check it and set up your car for you")}</p>
        </div>
      )}

      {confirming ? (
        <div className="mt-4 space-y-2 rounded-xl bg-danger/5 p-3">
          <p className="font-semibold text-danger">{tx("এই গাড়ি মুছে ফেলবেন?", "Remove this car?")}</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setConfirming(false)}>
              {tx("না", "No")}
            </Button>
            <Button variant="danger" onClick={() => removeVehicle(v.id)}>
              {tx("হ্যাঁ, মুছুন", "Yes, remove")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {!active && (
            <Button variant="primary" onClick={() => setActiveVehicle(v.id)} className="flex-1">
              <CircleCheck className="size-5" /> {tx("এই গাড়ি বেছে নিন", "Use this car")}
            </Button>
          )}
          {!v.is_primary && (
            <Button variant="outline" onClick={() => setPrimaryVehicle(v.id)} className="flex-1">
              <Star className="size-5" /> {tx("প্রধান করুন", "Make primary")}
            </Button>
          )}
          <Button variant="ghost" onClick={() => setConfirming(true)} aria-label={tx("মুছুন", "Remove")} className="text-danger">
            <Trash2 className="size-5" /> {tx("মুছুন", "Remove")}
          </Button>
        </div>
      )}
    </Card>
  );
}

export function GarageList() {
  const { tx } = useT();
  const hydrated = useHydrated();
  const vehicles = useStore((s) => s.vehicles);
  const activeId = useStore((s) => s.activeVehicleId);

  return (
    <Container className="max-w-xl">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{tx("আমার গাড়ি", "My cars")}</h1>
          <p className="mt-1 text-muted">{tx("যে গাড়ি বেছে নেবেন, শুধু তাতে ফিট হওয়া পার্ট দেখাবো", "We show only parts that fit the chosen car")}</p>
        </div>
      </div>

      {!hydrated ? (
        <div className="space-y-3">
          <div className="h-32 animate-pulse rounded-2xl bg-line/60" />
          <div className="h-14 animate-pulse rounded-2xl bg-line/60" />
        </div>
      ) : vehicles.length === 0 ? (
        <Card className="space-y-4 p-6 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-surface">
            <Car className="size-8" aria-hidden />
          </span>
          <p className="text-lg font-bold">{tx("এখনো কোনো গাড়ি যোগ করেননি", "No cars saved yet")}</p>
          <p className="text-muted">
            {tx("গাড়ি যোগ করলে ভুল পার্ট কেনার ভয় থাকবে না", "Add your car so you never buy a part that doesn't fit")}
          </p>
          <AudioGuide
            className="flex flex-col items-center"
            text={tx("নিচের বাটন চেপে আপনার গাড়ি যোগ করুন। তাহলে শুধু আপনার গাড়িতে লাগে এমন পার্ট দেখাবো।", "Tap the button below to add your car. Then we'll show only parts that fit it.")}
          />
          <ButtonLink href="/garage/add?next=/garage" variant="primary" size="lg" full>
            <Plus className="size-5" /> {tx("গাড়ি যোগ করুন", "Add a car")}
          </ButtonLink>
        </Card>
      ) : (
        <div className="space-y-3">
          {vehicles.map((v) => (
            <VehicleRow key={v.id} v={v} active={v.id === activeId} />
          ))}
          <ButtonLink href="/garage/add?next=/garage" variant="outline" size="lg" full className="border-dashed">
            <Plus className="size-5" /> {tx("আরেকটা গাড়ি যোগ করুন", "Add another car")}
          </ButtonLink>
          {activeId && (
            <Button variant="ghost" full onClick={() => setActiveVehicle(null)}>
              {tx("কোনো গাড়ি বাছাই না করে সব পার্ট দেখুন", "Show all parts, no car selected")}
            </Button>
          )}
          <p className="pt-2 text-center text-sm text-muted">
            {tx("লগইন ছাড়াও গাড়ি এই ফোনে সেভ থাকে", "Cars are saved on this phone, even without logging in")}
          </p>
        </div>
      )}
    </Container>
  );
}
