"use client";

import { Camera, Hash, LayoutGrid } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addVehicle } from "@/lib/db/actions";
import { describeVehicle, findGenerationsByChassis, getModel, getMake } from "@/lib/db/queries";
import type { MediaItem } from "@/lib/types";
import { AudioGuide } from "@/components/layout/AudioGuide";
import { PhotoUploader } from "@/components/media/PhotoUploader";
import { BackButton, HelpCall, MakeLogo, toast } from "@/components/shared/Misc";
import { VehiclePicker, type VehicleChoice } from "@/components/shared/VehiclePicker";
import { useT } from "@/components/providers/LangProvider";
import { Button, ChoiceCard, Container, Field, Input, Notice, PageHeader } from "@/components/ui/primitives";

type Way = "pick" | "chassis" | "papers";

/** Add a car three ways: pick, chassis number, papers photo (file 01 §3). */
export default function AddCarPage() {
  const { tx, lang, d } = useT();
  const router = useRouter();
  const [way, setWay] = useState<Way | null>(null);
  const [choice, setChoice] = useState<VehicleChoice | null>(null);
  const [chassis, setChassis] = useState("");
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [nickname, setNickname] = useState("");
  const [reg, setReg] = useState("");
  const [km, setKm] = useState("");

  const matches = chassis.trim().length >= 2 ? findGenerationsByChassis(chassis) : [];
  const desc = describeVehicle(choice?.generation_id ?? null, choice?.engine_id ?? null, lang);
  const partial = choice && !choice.generation_id ? [getMake(choice.make_id)?.name, getModel(choice.model_id)?.name].filter(Boolean).join(" ") : "";

  const save = () => {
    const papers = way === "papers";
    const id = addVehicle({
      generation_id: papers ? null : choice?.generation_id ?? null,
      engine_id: papers ? null : choice?.engine_id ?? null,
      chassis_number: way === "chassis" ? chassis.trim().toUpperCase() : null,
      nickname: nickname.trim() || partial || null,
      registration_no: reg.trim() || null,
      odometer_km: km ? Number(km) : null,
      papers_photo_url: papers ? photos[0]?.url ?? null : null,
      // Papers photo, or an incomplete pick, is finished by the team.
      needs_admin_setup: papers || !choice?.generation_id,
    });
    toast(papers || !choice?.generation_id ? tx("গাড়ি যোগ হয়েছে, টিম বাকি তথ্য বসাবে", "Car added, the team will fill in the rest") : tx("গাড়ি যোগ হয়েছে", "Car added"));
    router.replace(`/garage/${id}`);
  };

  const ready = way === "papers" ? photos.length > 0 : !!choice;

  return (
    <Container className="space-y-4">
      <PageHeader back={<BackButton href="/garage" />} title={tx("গাড়ি যোগ করুন", "Add a car")}>
        <AudioGuide compact text={tx("তিনভাবে গাড়ি যোগ করা যায়: ছবি দেখে বেছে নিন, চেসিস নম্বর দিন, বা গাড়ির কাগজের ছবি তুলে দিন, আমাদের টিম বসিয়ে দেবে।", "Three ways: pick from pictures, enter the chassis number, or photograph the papers and our team will set it up.")} />
      </PageHeader>

      {!way && (
        <div className="space-y-2">
          <ChoiceCard icon={<LayoutGrid className="size-5" />} title={tx("বেছে নিন", "Pick it")} subtitle={tx("লোগো → মডেল → সাল → ইঞ্জিন", "Logo → model → year → engine")} onClick={() => setWay("pick")} />
          <ChoiceCard icon={<Hash className="size-5" />} title={tx("চেসিস নম্বর দিন", "Enter chassis number")} subtitle={tx("কাগজে লেখা থাকে, যেমন NZE141-6012345", "On the papers, e.g. NZE141-6012345")} onClick={() => setWay("chassis")} />
          <ChoiceCard icon={<Camera className="size-5" />} title={tx("কাগজের ছবি দিন", "Photo of the papers")} subtitle={tx("আমাদের টিম সব বসিয়ে দেবে", "Our team sets it up for you")} onClick={() => setWay("papers")} />
        </div>
      )}

      {way && (
        <Button variant="ghost" size="sm" onClick={() => { setWay(null); setChoice(null); }}>
          ← {tx("অন্যভাবে যোগ করুন", "Use another way")}
        </Button>
      )}

      {way === "pick" && !choice && <VehiclePicker onDone={setChoice} />}

      {way === "chassis" && !choice && (
        <div className="space-y-3">
          <Field label={tx("চেসিস নম্বর", "Chassis number")} hint={tx("প্রথম অংশ দিলেই চলবে (যেমন NZE141)", "The first part is enough (e.g. NZE141)")}>
            <Input value={chassis} onChange={(e) => setChassis(e.target.value)} autoCapitalize="characters" className="font-mono uppercase" placeholder="NZE141-6012345" />
          </Field>
          {matches.length > 0 ? (
            <ul className="space-y-2">
              {matches.map((g) => {
                const dsc = describeVehicle(g.id, null, lang)!;
                return (
                  <li key={g.id}>
                    <ChoiceCard icon={<MakeLogo make={dsc.make} size="sm" />} title={dsc.short} subtitle={`${d(dsc.years)} · ${g.chassis_codes.join(", ")}`} onClick={() => setChoice({ make_id: dsc.make.id, model_id: dsc.model.id, generation_id: g.id, engine_id: null })} />
                  </li>
                );
              })}
            </ul>
          ) : (
            chassis.trim().length >= 3 && (
              <Notice tone="wait">
                {tx("এই নম্বরে গাড়ি মেলেনি। কাগজের ছবি দিন, টিম বসিয়ে দেবে।", "No match. Send a photo of the papers and the team will set it up.")}{" "}
                <button type="button" className="font-bold underline" onClick={() => setWay("papers")}>{tx("ছবি দিন", "Send photo")}</button>
              </Notice>
            )
          )}
        </div>
      )}

      {way === "papers" && (
        <div className="space-y-2">
          <p className="font-semibold">{tx("রেজিস্ট্রেশন কাগজ (ব্লু বুক / স্মার্ট কার্ড) এর ছবি", "Photo of the registration papers")}</p>
          <PhotoUploader value={photos} onChange={setPhotos} max={3} />
          <Notice>{tx("ছবি পাবলিক হবে না। টিম গাড়ির মডেল আর কাগজের মেয়াদ বসিয়ে আপনাকে জানাবে।", "Photos are private. The team will set the model and paper expiry dates and let you know.")}</Notice>
        </div>
      )}

      {ready && (
        <section className="space-y-3 rounded-2xl border-2 border-ok/40 bg-card p-4">
          {way !== "papers" && (
            <p className="flex items-center gap-2 text-lg font-bold">
              {desc && <MakeLogo make={desc.make} size="sm" />}
              {desc?.full ?? (partial || tx("গাড়ি (টিম ঠিক করবে)", "Car (team will set it)"))}
            </p>
          )}
          <p className="text-sm text-muted">{tx("নিচের তথ্য ঐচ্ছিক, পরে দিলেও চলবে", "These are optional; you can add them later")}</p>
          <Field label={tx("ডাক নাম", "Nickname")}><Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder={tx("যেমন: সাদা এক্সিও", "e.g. White Axio")} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={tx("রেজিস্ট্রেশন নম্বর", "Registration no.")}><Input value={reg} onChange={(e) => setReg(e.target.value)} placeholder={tx("ঢাকা মেট্রো-গ ১২-৩৪৫৬", "Dhaka Metro-Ga 12-3456")} /></Field>
            <Field label={tx("মিটারে কত কিমি", "Odometer km")}><Input inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value.replace(/\D/g, ""))} /></Field>
          </div>
          <Button variant="ok" size="xl" full onClick={save}>
            ✅ {tx("গাড়ি যোগ করুন", "Add car")}
          </Button>
        </section>
      )}
      <HelpCall />
    </Container>
  );
}
