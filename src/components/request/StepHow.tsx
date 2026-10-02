"use client";

import clsx from "clsx";
import { Camera, Check, ChevronDown, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import type { MediaItem, VoiceNote } from "@/lib/types";
import { PhotoUploader } from "../media/PhotoUploader";
import { VoicePlayer } from "../media/VoicePlayer";
import { VoiceRecorder } from "../media/VoiceRecorder";
import { useT } from "../providers/LangProvider";
import { Button, Textarea } from "../ui/primitives";
import type { InputKind } from "./draft";

const QUICK_PARTS = [
  { bn: "ব্রেক প্যাড", en: "Brake pads" },
  { bn: "হেডলাইট", en: "Headlight" },
  { bn: "সাইড মিরর", en: "Side mirror" },
  { bn: "শক অ্যাবজর্বার", en: "Shock absorber" },
  { bn: "বাম্পার", en: "Bumper" },
  { bn: "রেডিয়েটর", en: "Radiator" },
  { bn: "এসি কম্প্রেসর", en: "AC compressor" },
  { bn: "ক্লাচ প্লেট", en: "Clutch plate" },
];

function InputCard({
  emoji,
  title,
  subtitle,
  open,
  filled,
  onToggle,
  tone,
  children,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  open: boolean;
  filled: string | null;
  onToggle: () => void;
  tone: string;
  children: ReactNode;
}) {
  return (
    <div className={clsx("overflow-hidden rounded-2xl border-2 bg-card transition-colors", open || filled ? "border-ink" : "border-line")}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-h-20 w-full items-center gap-4 p-4 text-left">
        <span className={clsx("grid size-14 shrink-0 place-items-center rounded-2xl text-3xl", tone)} aria-hidden>
          {emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xl font-bold">{title}</span>
          <span className="block text-sm text-muted">{subtitle}</span>
        </span>
        {filled ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ok px-2.5 py-1 text-xs font-bold text-white">
            <Check className="size-3.5" strokeWidth={3} aria-hidden /> {filled}
          </span>
        ) : (
          <ChevronDown className={clsx("size-6 shrink-0 text-muted transition-transform", open && "rotate-180")} aria-hidden />
        )}
      </button>
      {open && <div className="border-t border-line p-4">{children}</div>}
    </div>
  );
}

export function StepHow({
  voices,
  photos,
  text,
  open,
  setOpen,
  onVoices,
  onPhotos,
  onText,
}: {
  voices: VoiceNote[];
  photos: MediaItem[];
  text: string;
  open: Record<InputKind, boolean>;
  setOpen: (k: InputKind, v: boolean) => void;
  onVoices: (v: VoiceNote[]) => void;
  onPhotos: (p: MediaItem[]) => void;
  onText: (t: string) => void;
}) {
  const { tx, d, lang } = useT();

  const addChip = (w: string) => {
    const cur = text.trim();
    onText(cur ? (cur.endsWith(",") ? `${cur} ${w}` : `${cur}, ${w}`) : w);
  };

  return (
    <div className="space-y-3">
      <InputCard
        emoji="🎤"
        tone="bg-danger/10"
        title={tx("বলে দিন", "Say it")}
        subtitle={tx("সবচেয়ে সহজ: বলুন কোন গাড়ি, কোন পার্ট", "Easiest: say your car and the part")}
        open={open.voice}
        filled={voices.length ? tx(`${d(voices.length)}টি ভয়েস`, `${voices.length} voice`) : null}
        onToggle={() => setOpen("voice", !open.voice)}
      >
        <div className="space-y-3">
          {voices.map((v, i) => (
            <div key={v.id} className="flex items-center gap-2 rounded-xl bg-surface p-3">
              <span className="text-sm font-bold text-muted">{d(i + 1)}</span>
              <div className="min-w-0 flex-1">
                <VoicePlayer src={v.url} duration={v.duration_sec} />
              </div>
              <button
                type="button"
                onClick={() => onVoices(voices.filter((x) => x.id !== v.id))}
                aria-label={tx("ভয়েস মুছুন", "Delete voice note")}
                className="grid size-11 place-items-center rounded-full text-danger hover:bg-danger/5"
              >
                <Trash2 className="size-5" />
              </button>
            </div>
          ))}
          <VoiceRecorder
            compact={voices.length > 0}
            sendLabel={tx("ঠিক আছে, রাখুন", "OK, keep it")}
            onSaved={(v) => {
              onVoices([...voices, v]);
            }}
          />
          {voices.length > 0 && photos.length === 0 && (
            <div className="space-y-2 rounded-xl border border-accent/40 bg-accent-soft p-3 text-accent-ink">
              <p className="font-semibold">
                {tx("পুরনো পার্ট বা গাড়ির ছবি দিলে আরও দ্রুত খুঁজে দিতে পারবো", "A photo of the old part or the car helps us find it faster")}
              </p>
              <Button
                variant="primary"
                full
                onClick={() => {
                  setOpen("photo", true);
                  setTimeout(() => document.getElementById("req-photo")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
                }}
              >
                <Camera className="size-5" /> {tx("ছবি দিন", "Add a photo")}
              </Button>
            </div>
          )}
        </div>
      </InputCard>

      <div id="req-photo" className="scroll-mt-4">
        <InputCard
          emoji="📷"
          tone="bg-ink/10"
          title={tx("ছবি দিন", "Send a photo")}
          subtitle={tx("পুরনো পার্ট, ভাঙা জায়গা বা পার্ট নম্বরের ছবি", "Old part, damaged area or the part number")}
          open={open.photo}
          filled={photos.length ? tx(`${d(photos.length)}টি ছবি`, `${photos.length} photo${photos.length > 1 ? "s" : ""}`) : null}
          onToggle={() => setOpen("photo", !open.photo)}
        >
          <PhotoUploader value={photos} onChange={onPhotos} allowVideo />
          <p className="mt-2 text-sm text-muted">{tx("ছোট ভিডিও দিলেও চলবে (যেমন শব্দ হচ্ছে এমন)", "A short video works too (e.g. a strange noise)")}</p>
        </InputCard>
      </div>

      <InputCard
        emoji="✍️"
        tone="bg-q-oem/10"
        title={tx("লিখে দিন", "Write it")}
        subtitle={tx("পার্টের নাম, নম্বর বা সমস্যা", "Part name, number or the problem")}
        open={open.text}
        filled={text.trim() ? tx("লেখা আছে", "Written") : null}
        onToggle={() => setOpen("text", !open.text)}
      >
        <div className="space-y-3">
          <p className="text-sm font-semibold">{tx("চাপ দিলেই লেখা হয়ে যাবে:", "Tap to add:")}</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PARTS.map((p) => (
              <button
                key={p.bn}
                type="button"
                onClick={() => addChip(p[lang])}
                className="min-h-11 rounded-full border border-line bg-surface px-4 text-sm font-medium hover:border-ink/40"
              >
                + {p[lang]}
              </button>
            ))}
          </div>
          <Textarea
            value={text}
            onChange={(e) => onText(e.target.value)}
            rows={4}
            aria-label={tx("কী লাগবে লিখুন", "Describe what you need")}
            placeholder={tx("যেমন: সামনের ডান পাশের হেডলাইট ভেঙে গেছে", "e.g. Front right headlight is broken")}
            className="text-lg"
          />
        </div>
      </InputCard>

      <p className="pt-1 text-center text-sm text-muted">
        {tx("একটা দিলেই হবে। চাইলে ভয়েস, ছবি আর লেখা সব একসাথে দিতে পারেন।", "One is enough. You can combine voice, photo and text.")}
      </p>
    </div>
  );
}
