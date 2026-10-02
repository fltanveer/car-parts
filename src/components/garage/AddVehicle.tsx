"use client";

import clsx from "clsx";
import { CircleCheck, FileImage, Hash, ListChecks } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { describeGeneration, getEngine } from "@/lib/api";
import { addVehicle } from "@/lib/store";
import type { MediaItem } from "@/lib/types";
import { AudioGuide } from "../layout/AudioGuide";
import { PhotoUploader } from "../media/PhotoUploader";
import { useT } from "../providers/LangProvider";
import { Button, Card, Container, Input, Notice } from "../ui/primitives";
import { VehiclePicker } from "../vehicle/VehiclePicker";
import { ChassisLookup } from "./ChassisLookup";

type Tab = "pick" | "chassis" | "paper";

interface Pending {
  generation_id: string | null;
  engine_id: string | null;
  chassis_number: string | null;
}

export function AddVehicle({ next }: { next: string }) {
  const { tx, lang, d } = useT();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pick");
  const [pending, setPending] = useState<Pending | null>(null);
  const [nickname, setNickname] = useState("");
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [paperSaved, setPaperSaved] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  const nicknameSuggestions = [
    tx("আমার গাড়ি", "My car"),
    tx("অফিসের গাড়ি", "Office car"),
    tx("বাসার গাড়ি", "Family car"),
    tx("ভাড়ার গাড়ি", "Rental car"),
  ];

  const save = () => {
    if (!pending) return;
    addVehicle({
      generation_id: pending.generation_id,
      engine_id: pending.engine_id,
      chassis_number: pending.chassis_number,
      nickname: nickname.trim() || null,
      registration_doc_url: null,
      // An unmatched chassis number needs a human to set the car up.
      needs_admin_setup: !pending.generation_id,
    });
    router.push(next);
  };

  const savePaper = () => {
    if (!photos.length) {
      setPhotoError(true);
      return;
    }
    addVehicle({
      generation_id: null,
      engine_id: null,
      chassis_number: null,
      nickname: nickname.trim() || null,
      registration_doc_url: photos[0].url,
      needs_admin_setup: true,
    });
    setPaperSaved(true);
  };

  const nicknameField = (
    <div>
      <label htmlFor="nickname" className="mb-1.5 block font-semibold">
        {tx("গাড়ির ডাকনাম", "Nickname")} <span className="font-normal text-muted">({tx("ঐচ্ছিক", "optional")})</span>
      </label>
      <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">
        {nicknameSuggestions.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setNickname(n)}
            aria-pressed={nickname === n}
            className={clsx(
              "min-h-10 shrink-0 rounded-full border px-3.5 text-sm font-medium",
              nickname === n ? "border-ink bg-ink text-white" : "border-line bg-card",
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <Input id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder={tx("যেমন: অফিসের গাড়ি", "e.g. Office car")} />
    </div>
  );

  if (paperSaved)
    return (
      <Container className="max-w-xl">
        <Card className="space-y-4 p-6 text-center">
          <CircleCheck className="mx-auto size-16 text-ok" aria-hidden />
          <h1 className="text-2xl font-bold">{tx("কাগজের ছবি পেয়েছি", "Got the photo")}</h1>
          <p className="text-lg">{tx("আমরা দেখে আপনার গাড়ি সেট করে দেবো", "We'll check it and set up your car for you")}</p>
          <AudioGuide className="flex flex-col items-center" text={tx("আমরা দেখে আপনার গাড়ি সেট করে দেবো। এর মধ্যে আপনি পার্ট খুঁজতে বা রিকোয়েস্ট দিতে পারেন।", "We'll check the paper and set up your car. Meanwhile you can search or request parts.")} />
          <Button variant="primary" size="lg" full onClick={() => router.push(next)}>
            {tx("ঠিক আছে, এগিয়ে যান", "OK, continue")}
          </Button>
        </Card>
      </Container>
    );

  if (pending) {
    const info = describeGeneration(pending.generation_id, lang);
    const engine = pending.engine_id ? getEngine(pending.engine_id) : null;
    return (
      <Container className="max-w-xl space-y-5">
        <h1 className="text-2xl font-bold">{tx("এটাই কি আপনার গাড়ি?", "Is this your car?")}</h1>
        <Card className="flex items-center gap-4 p-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-ink text-2xl font-black text-accent">
            {info ? info.make.name[0] : "?"}
          </span>
          <div className="min-w-0">
            {info ? (
              <>
                <p className="text-xl font-bold">{info.short}</p>
                <p className="text-muted">
                  {d(info.years)} · {info.generation.chassis_codes.join(", ")}
                  {engine && ` · ${engine.code} ${d(engine.displacement_cc)}cc`}
                </p>
              </>
            ) : (
              <p className="text-lg font-bold">{tx("গাড়ি মিলানো বাকি", "Car to be matched")}</p>
            )}
            {pending.chassis_number && <p className="font-mono text-sm">{pending.chassis_number}</p>}
          </div>
        </Card>
        {!info && <Notice tone="warn">{tx("আমরা দেখে আপনার গাড়ি সেট করে দেবো", "We'll check and set up your car for you")}</Notice>}
        {nicknameField}
        <div className="grid gap-2">
          <Button variant="primary" size="lg" full onClick={save}>
            <CircleCheck className="size-5" /> {tx("হ্যাঁ, সেভ করুন", "Yes, save it")}
          </Button>
          <Button variant="ghost" full onClick={() => setPending(null)}>
            {tx("না, আবার বেছে নিই", "No, choose again")}
          </Button>
        </div>
      </Container>
    );
  }

  const tabs: { key: Tab; icon: ReactNode; label: string }[] = [
    { key: "pick", icon: <ListChecks className="size-6" />, label: tx("বেছে নিন", "Choose") },
    { key: "chassis", icon: <Hash className="size-6" />, label: tx("চেসিস নম্বর", "Chassis no.") },
    { key: "paper", icon: <FileImage className="size-6" />, label: tx("কাগজের ছবি", "Paper photo") },
  ];

  return (
    <Container className="max-w-xl">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{tx("আপনার গাড়ি যোগ করুন", "Add your car")}</h1>
        <p className="mt-1 text-muted">{tx("একবার সেভ করলে শুধু আপনার গাড়িতে ফিট হওয়া পার্ট দেখাবো", "Save once and we'll show only parts that fit")}</p>
        <AudioGuide
          className="mt-3"
          text={tx(
            "তিনভাবে গাড়ি যোগ করতে পারেন: কোম্পানি আর মডেল বেছে নিন, অথবা চেসিস নম্বর লিখুন, অথবা গাড়ির কাগজের ছবি দিন।",
            "Add your car in one of three ways: choose the make and model, type the chassis number, or send a photo of the registration paper.",
          )}
        />
      </div>

      <div role="tablist" className="mb-5 grid grid-cols-3 gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              "flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-1 text-sm font-semibold transition-colors",
              tab === t.key ? "border-ink bg-ink text-white" : "border-line bg-card hover:border-ink/30",
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pick" && <VehiclePicker onPick={(v) => setPending({ ...v, chassis_number: null })} />}

      {tab === "chassis" && (
        <ChassisLookup
          onPick={(p) => setPending({ generation_id: p.generation_id, engine_id: null, chassis_number: p.chassis_number })}
          onPhotoInstead={() => setTab("paper")}
        />
      )}

      {tab === "paper" && (
        <div className="space-y-5">
          <p className="font-semibold">
            {tx("রেজিস্ট্রেশন কাগজ (ব্লু বুক / স্মার্ট কার্ড) এর ছবি তুলুন", "Take a photo of the registration paper (blue book / smart card)")}
          </p>
          <PhotoUploader
            value={photos}
            onChange={(p) => {
              setPhotos(p);
              setPhotoError(false);
            }}
            max={2}
          />
          {photoError && <p className="text-sm font-medium text-danger">{tx("আগে কাগজের ছবি দিন", "Add a photo of the paper first")}</p>}
          <Notice>{tx("আমরা দেখে আপনার গাড়ি সেট করে দেবো", "We'll check it and set up your car for you")}</Notice>
          {nicknameField}
          <Button variant="primary" size="lg" full onClick={savePaper}>
            {tx("ছবি পাঠান", "Send photo")}
          </Button>
        </div>
      )}
    </Container>
  );
}
