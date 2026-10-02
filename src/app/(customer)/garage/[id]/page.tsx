"use client";

import { Car, HandHelping, Pencil, Search, Star, Tag, Trash2, Wrench } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { removeVehicle, setActiveVehicle, updateVehicle } from "@/lib/db/actions";
import { describeVehicle } from "@/lib/db/queries";
import type { DB } from "@/lib/db/seed";
import { useDb } from "@/lib/db/store";
import { AudioGuide } from "@/components/layout/AudioGuide";
import { BackButton, HelpCall, MakeLogo, toast } from "@/components/shared/Misc";
import { useT } from "@/components/providers/LangProvider";
import { Button, ButtonLink, Container, EmptyState, Field, Input, Notice, SectionTitle } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/Sheet";
import { setPrimaryVehicle } from "@/components/customer/shop/actions";
import { ownerOf } from "@/components/customer/shop/data";
import { GarageDrivers } from "@/components/customer/shop/GarageDrivers";
import { ExpensesSection, ServiceLogSection } from "@/components/customer/shop/GarageLogs";
import { GaragePapers } from "@/components/customer/shop/GaragePapers";

const mineSel = (s: DB) => ({ owner: ownerOf(s), vehicles: s.vehicles });

/** One car's dashboard: papers, service, expenses, quick actions, drivers (file 01 3.1). */
export default function CarDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const { tx, lang, d } = useT();
  const router = useRouter();
  const { owner, vehicles } = useDb(mineSel);
  const v = vehicles.find((x) => x.id === id && x.owner === owner);
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  if (!v) {
    return (
      <Container className="space-y-4">
        <BackButton href="/garage" />
        <EmptyState icon={<Car className="size-7" />} title={tx("গাড়িটি পাওয়া যায়নি", "Car not found")} body={tx("অন্য নম্বরে লগইন থাকলে সেই নম্বরের গাড়ি দেখাবে।", "Cars are saved per phone number.")} action={<ButtonLink href="/garage" variant="brand" size="lg">{tx("আমার গাড়ি", "My cars")}</ButtonLink>} />
      </Container>
    );
  }

  const desc = describeVehicle(v.generation_id, v.engine_id, lang);
  const title = desc?.withYear ?? v.nickname ?? tx("গাড়ি (টিম সেট করছে)", "Car (being set up)");
  const quick = "relative flex min-h-24 flex-col items-start justify-between gap-2 rounded-2xl border border-line bg-card p-3 text-left font-bold hover:border-ink/30";
  const soon = <span className="absolute right-2 top-2 rounded-full bg-wait-soft px-2 py-0.5 text-[11px] font-bold text-wait">{tx("শীঘ্রই", "Soon")}</span>;

  return (
    <Container className="space-y-5">
      <BackButton href="/garage" />
      <header className="rounded-2xl border border-line bg-card p-4">
        <div className="flex items-start gap-3">
          {desc ? <MakeLogo make={desc.make} size="lg" /> : <span className="grid size-14 place-items-center rounded-xl bg-surface"><Car className="size-7 text-muted" /></span>}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{title}</h1>
            {desc && <p className="text-sm text-muted">{desc.full}</p>}
            <p className="mt-1 text-ink-2">{[v.nickname, v.registration_no, v.color].filter(Boolean).join(" · ")}</p>
            {v.odometer_km != null && <p className="text-sm text-ink-2">🛣️ {d(v.odometer_km.toLocaleString("en-IN"))} {tx("কিমি", "km")}</p>}
          </div>
          <AudioGuide compact text={tx("এখানে গাড়ির কাগজের মেয়াদ, সার্ভিস আর খরচ। লাল মানে মেয়াদ শেষ, হলুদ মানে শীঘ্রই শেষ হবে। কাগজে চাপলে ছবি বা তারিখ দিতে পারবেন।", "Papers, service and expenses for this car. Red means expired, yellow means expiring soon. Tap a paper to add a photo or date.")} />
        </div>
        {v.needs_admin_setup && <Notice tone="wait" className="mt-3">⏳ {tx("আমাদের টিম কাগজ দেখে গাড়ির তথ্য বসাচ্ছে।", "Our team is setting up this car from the papers.")}</Notice>}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil className="size-4" aria-hidden />{tx("তথ্য বদলান", "Edit")}</Button>
          {!v.is_primary && (
            <Button variant="outline" size="sm" onClick={() => { setPrimaryVehicle(v.id); toast(tx("প্রধান গাড়ি করা হয়েছে", "Set as main car")); }}>
              <Star className="size-4" aria-hidden />{tx("প্রধান গাড়ি করুন", "Make main car")}
            </Button>
          )}
        </div>
      </header>

      <section>
        <SectionTitle>{tx("দ্রুত কাজ", "Quick actions")}</SectionTitle>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button type="button" className={quick} onClick={() => { setActiveVehicle(v.id); router.push("/search"); }}>
            <Search className="size-6 text-brand" aria-hidden /> {tx("এই গাড়ির পার্টস", "Parts for this car")}
          </button>
          <Link href={`/request?vehicle=${v.id}`} className={quick}>
            <HandHelping className="size-6 text-bad" aria-hidden /> {tx("পার্ট চাই", "Request a part")}
          </Link>
          <Link href="/services" className={quick}>
            {soon}
            <Wrench className="size-6 text-muted" aria-hidden /> {tx("মেকানিক বুক", "Book mechanic")}
          </Link>
          <Link href="/cars" className={quick}>
            {soon}
            <Tag className="size-6 text-muted" aria-hidden /> {tx("গাড়ি বিক্রি করুন", "Sell this car")}
          </Link>
        </div>
      </section>

      <section>
        <SectionTitle>{tx("কাগজপত্র", "Papers")}</SectionTitle>
        <GaragePapers vehicle={v} ownerPhone={owner} />
      </section>

      <section>
        <SectionTitle>{tx("সার্ভিসের হিসাব", "Service log")}</SectionTitle>
        <ServiceLogSection vehicle={v} />
      </section>

      <section>
        <SectionTitle>{tx("খরচের হিসাব", "Expenses")}</SectionTitle>
        <ExpensesSection vehicle={v} />
      </section>

      <section>
        <SectionTitle>{tx("ড্রাইভার", "Drivers")}</SectionTitle>
        <GarageDrivers vehicle={v} />
      </section>

      <Button variant="danger" size="md" full onClick={() => setConfirmDel(true)}>
        <Trash2 className="size-4" aria-hidden /> {tx("গাড়িটি সরান", "Remove this car")}
      </Button>
      <HelpCall />

      <EditSheet key={String(editing)} open={editing} onClose={() => setEditing(false)} initial={{ nickname: v.nickname ?? "", reg: v.registration_no ?? "", km: v.odometer_km ? String(v.odometer_km) : "", color: v.color ?? "" }} onSave={(x) => {
        updateVehicle(v.id, { nickname: x.nickname || null, registration_no: x.reg || null, odometer_km: x.km ? Number(x.km) : null, color: x.color || null });
        toast(tx("সেভ হয়েছে", "Saved"));
        setEditing(false);
      }} />
      <Sheet open={confirmDel} onClose={() => setConfirmDel(false)} title={tx("গাড়িটি সরাবেন?", "Remove this car?")}>
        <p className="text-lg">{tx("কাগজ, সার্ভিস ও খরচের হিসাবও মুছে যাবে।", "Its papers, service and expense records will be deleted too.")}</p>
        <div className="my-4 grid grid-cols-2 gap-2">
          <Button variant="ghost" size="lg" onClick={() => setConfirmDel(false)}>{tx("না", "No")}</Button>
          <Button variant="danger" size="lg" onClick={() => { removeVehicle(v.id); toast(tx("সরানো হয়েছে", "Removed"), "info"); router.replace("/garage"); }}>{tx("হ্যাঁ, সরান", "Yes, remove")}</Button>
        </div>
      </Sheet>
    </Container>
  );
}

function EditSheet({ open, onClose, initial, onSave }: { open: boolean; onClose: () => void; initial: { nickname: string; reg: string; km: string; color: string }; onSave: (v: { nickname: string; reg: string; km: string; color: string }) => void }) {
  const { tx } = useT();
  const [f, setF] = useState(initial);
  return (
    <Sheet open={open} onClose={onClose} title={tx("গাড়ির তথ্য", "Car details")}>
      <div className="space-y-3 pb-2">
        <Field label={tx("ডাক নাম", "Nickname")}><Input value={f.nickname} onChange={(e) => setF({ ...f, nickname: e.target.value })} /></Field>
        <Field label={tx("রেজিস্ট্রেশন নম্বর", "Registration no.")}><Input value={f.reg} onChange={(e) => setF({ ...f, reg: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={tx("মিটারে কিমি", "Odometer km")}><Input inputMode="numeric" value={f.km} onChange={(e) => setF({ ...f, km: e.target.value.replace(/\D/g, "") })} /></Field>
          <Field label={tx("রং", "Colour")}><Input value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} /></Field>
        </div>
        <Button variant="brand" size="lg" full onClick={() => onSave(f)}>{tx("সেভ করুন", "Save")}</Button>
      </div>
    </Sheet>
  );
}
