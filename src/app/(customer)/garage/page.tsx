"use client";

import { Car, ChevronRight, Plus, Star } from "lucide-react";
import Link from "next/link";
import { describeVehicle } from "@/lib/db/queries";
import { useDb, useHydrated } from "@/lib/db/store";
import { AudioGuide } from "@/components/layout/AudioGuide";
import { BackButton, HelpCall, MakeLogo, useNow } from "@/components/shared/Misc";
import { useT } from "@/components/providers/LangProvider";
import { ButtonLink, Container, Notice, PageHeader, StatusPill } from "@/components/ui/primitives";
import { myVehicles } from "@/components/customer/shop/data";
import { docStatus } from "@/components/customer/shop/GaragePapers";
import { AddCarCard } from "@/components/customer/shop/MyCarChip";

/** My cars (file 01 §3). */
export default function GaragePage() {
  const { tx, lang, d } = useT();
  const hydrated = useHydrated();
  const now = useNow();
  const cars = useDb(myVehicles);
  const loggedIn = useDb((s) => !!s.session.customerPhone);

  return (
    <Container className="space-y-4">
      <PageHeader back={<BackButton href="/account" />} title={tx("আমার গাড়ি", "My cars")} subtitle={tx("কাগজের মেয়াদ, সার্ভিস ও খরচের হিসাব", "Papers, service and expenses")}>
        <AudioGuide compact text={tx("আপনার গাড়ি এখানে থাকে। গাড়িতে চাপলে কাগজের মেয়াদ, সার্ভিস আর খরচের হিসাব দেখবেন। নতুন গাড়ি যোগ করতে নিচের বাটন চাপুন।", "Your cars live here. Tap a car to see papers, service and expenses. Tap the button below to add a car.")} />
      </PageHeader>
      {hydrated && !loggedIn && cars.length > 0 && (
        <Notice tone="wait">
          {tx("লগইন করলে গাড়ির তথ্য আপনার নম্বরে সেভ থাকবে।", "Log in to keep your cars on your number.")}{" "}
          <Link href="/login?next=/garage" className="font-bold underline">{tx("লগইন", "Log in")}</Link>
        </Notice>
      )}
      {cars.length === 0 ? (
        <AddCarCard />
      ) : (
        <ul className="space-y-3">
          {cars.map((v) => {
            const desc = describeVehicle(v.generation_id, v.engine_id, lang);
            const tones = v.documents.map((x) => docStatus(x, now).tone);
            const worst = tones.includes("bad") ? "bad" : tones.includes("wait") ? "wait" : "ok";
            return (
              <li key={v.id}>
                <Link href={`/garage/${v.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-card p-4 hover:border-ink/30">
                  {desc ? <MakeLogo make={desc.make} size="lg" /> : <span className="grid size-14 place-items-center rounded-xl bg-surface"><Car className="size-7 text-muted" /></span>}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-lg font-bold">
                      {desc?.withYear ?? tx("গাড়ি (টিম সেট করছে)", "Car (being set up)")}
                      {v.is_primary && <Star className="size-4 fill-wait-bg text-wait-bg" aria-label={tx("প্রধান", "Primary")} />}
                    </span>
                    <span className="block text-sm text-ink-2">{[v.nickname, v.registration_no, v.odometer_km ? `${d(v.odometer_km.toLocaleString("en-IN"))} ${tx("কিমি", "km")}` : null].filter(Boolean).join(" · ")}</span>
                    <span className="mt-1 flex flex-wrap gap-1.5">
                      {v.needs_admin_setup && <StatusPill tone="wait">{tx("টিম তথ্য বসাচ্ছে", "Team is setting up")}</StatusPill>}
                      <StatusPill tone={worst}>{worst === "bad" ? tx("কাগজের মেয়াদ শেষ", "Papers expired") : worst === "wait" ? tx("কাগজের মেয়াদ শেষ হচ্ছে", "Papers expiring") : tx("কাগজ ঠিক আছে", "Papers OK")}</StatusPill>
                    </span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {cars.length > 0 && (
        <ButtonLink href="/garage/add" variant="brand" size="lg" full>
          <Plus className="size-5" aria-hidden /> {tx("গাড়ি যোগ করুন", "Add a car")}
        </ButtonLink>
      )}
      <HelpCall />
    </Container>
  );
}
