"use client";

import clsx from "clsx";
import { ChevronDown, FileImage, Search } from "lucide-react";
import { useState } from "react";
import { describeGeneration, findGenerationsByChassis } from "@/lib/api";
import { toEnDigits } from "@/lib/format";
import { useT } from "../providers/LangProvider";
import { Button, ChoiceCard, Input } from "../ui/primitives";

export interface ChassisPick {
  generation_id: string | null;
  chassis_number: string;
}

const clean = (s: string) => toEnDigits(s).toUpperCase().replace(/\s+/g, "").slice(0, 24);

// Spec 7.2(b): the part before "-" is the chassis code; match it to a generation.
export function ChassisLookup({
  onPick,
  onPhotoInstead,
  initial = "",
}: {
  onPick: (p: ChassisPick) => void;
  onPhotoInstead?: () => void;
  initial?: string;
}) {
  const { tx, lang, d } = useT();
  const [value, setValue] = useState(initial);
  const [help, setHelp] = useState(false);

  const code = value.split("-")[0];
  const matches = code.length >= 3 ? findGenerationsByChassis(value) : [];
  const tried = code.length >= 5;

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="chassis" className="mb-1.5 block font-semibold">
          {tx("চেসিস নম্বর লিখুন", "Enter the chassis number")}
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
          <Input
            id="chassis"
            value={value}
            onChange={(e) => setValue(clean(e.target.value))}
            placeholder="NZE141-6012345"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            className="pl-12 font-mono text-xl tracking-wider"
          />
        </div>
        <p className="mt-1 text-sm text-muted">
          {tx("শুধু প্রথম অংশ (যেমন NZE141) দিলেও চলবে", "Just the first part (e.g. NZE141) is enough")}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setHelp((h) => !h)}
        aria-expanded={help}
        className="flex min-h-11 items-center gap-1.5 text-sm font-semibold text-q-oem"
      >
        <ChevronDown className={clsx("size-4 transition-transform", help && "rotate-180")} aria-hidden />
        {tx("চেসিস নম্বর কোথায় পাবেন?", "Where do I find the chassis number?")}
      </button>

      {help && (
        <div className="space-y-3 rounded-2xl border border-line bg-surface p-4 text-sm">
          <p>
            {tx(
              "গাড়ির রেজিস্ট্রেশন কাগজে (ব্লু বুক বা স্মার্ট কার্ড) “Chassis No” লেখা ঘরে পাবেন। ড্রাইভারের পাশের দরজার ফ্রেমে বা ইঞ্জিনের পেছনের ধাতব প্লেটেও লেখা থাকে।",
              "It's on the registration paper (blue book or smart card), in the “Chassis No” box. It's also stamped on a metal plate at the driver's door frame or behind the engine.",
            )}
          </p>
          {/* Illustration of a registration card with the chassis field highlighted. */}
          <div className="rounded-xl border-2 border-q-oem/30 bg-card p-3 font-mono text-xs shadow-sm" aria-hidden>
            <p className="mb-2 text-center font-sans font-bold text-q-oem">BRTA · Registration Certificate</p>
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
              <span className="text-muted">Reg. No</span>
              <span>DHAKA METRO-GA 12-3456</span>
              <span className="text-muted">Maker</span>
              <span>TOYOTA</span>
              <span className="rounded bg-accent-soft px-1 font-bold text-accent-ink">Chassis No</span>
              <span className="rounded bg-accent-soft px-1 font-bold text-accent-ink ring-2 ring-accent">NZE141-6012345</span>
              <span className="text-muted">Engine No</span>
              <span>1NZ-A123456</span>
            </div>
          </div>
          <p className="text-muted">
            {tx("হলুদ দাগ দেওয়া ঘরের লেখাটাই চেসিস নম্বর।", "The highlighted box is the chassis number.")}
          </p>
          {onPhotoInstead && (
            <Button variant="outline" onClick={onPhotoInstead}>
              <FileImage className="size-5" /> {tx("কাগজের ছবি দিয়ে দিন", "Send a photo of the paper instead")}
            </Button>
          )}
        </div>
      )}

      {matches.length > 0 && (
        <div className="space-y-2">
          <p className="font-semibold">
            {matches.length > 1
              ? tx("কোনটা আপনার গাড়ি? চাপ দিন", "Which one is your car? Tap it")
              : tx("এটা কি আপনার গাড়ি? চাপ দিন", "Is this your car? Tap it")}
          </p>
          {matches.map((g) => {
            const info = describeGeneration(g.id, lang)!;
            return (
              <ChoiceCard
                key={g.id}
                onClick={() => onPick({ generation_id: g.id, chassis_number: value })}
                icon={<span className="text-lg font-black">{info.make.name[0]}</span>}
                title={`${info.make.name} ${info.model.name}${lang === "bn" ? ` (${info.model.name_bn})` : ""}`}
                subtitle={`${d(info.years)} · ${g.chassis_codes.join(", ")}`}
              />
            );
          })}
        </div>
      )}

      {tried && matches.length === 0 && (
        <div className="space-y-3 rounded-2xl border border-line bg-card p-4">
          <p className="font-semibold">{tx("এই নম্বর আমাদের তালিকায় মেলেনি", "We couldn't match this number")}</p>
          <p className="text-sm text-muted">
            {tx("সমস্যা নেই, এই নম্বর দিয়েই এগিয়ে যান। আমরা দেখে মিলিয়ে নেবো।", "No problem, continue with it. We'll check and match it for you.")}
          </p>
          <Button variant="primary" size="lg" full onClick={() => onPick({ generation_id: null, chassis_number: value })}>
            {tx("এই নম্বর দিয়ে এগোন", "Continue with this number")}
          </Button>
        </div>
      )}
    </div>
  );
}
