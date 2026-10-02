"use client";

import { Camera, Car, HelpCircle, Keyboard, Mic, Pencil, Tag, X } from "lucide-react";
import { useState } from "react";
import { describeVehicle, getCategory, getMake, getModel } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import { PhotoUploader } from "../../media/PhotoUploader";
import { VoicePlayer } from "../../media/VoicePlayer";
import { VoiceRecorder } from "../../media/VoiceRecorder";
import { CategoryPicker } from "../../shared/CategoryPicker";
import { MakeLogo } from "../../shared/Misc";
import { VehiclePicker } from "../../shared/VehiclePicker";
import { useT } from "../../providers/LangProvider";
import { Button, ChoiceCard, Input, Textarea } from "../../ui/primitives";
import { Sheet } from "../../ui/Sheet";
import type { Draft, HowMode, SetDraft } from "./wizardDraft";

/** Step 1: how will you tell us? Voice first (rule 3, 6). */
export function StepHow({ draft, set }: { draft: Draft; set: SetDraft }) {
  const { tx, lang, d } = useT();
  const [catOpen, setCatOpen] = useState(false);
  const cat = getCategory(draft.categoryId);
  const modes: { value: HowMode; icon: React.ReactNode; bn: string; en: string; sbn: string; sen: string }[] = [
    { value: "voice", icon: <Mic className="size-6 text-bad" />, bn: "বলে দিন", en: "Say it", sbn: "সবচেয়ে সহজ, ১ মিনিটে", sen: "Easiest, takes a minute" },
    { value: "photo", icon: <Camera className="size-6" />, bn: "ছবি দিন", en: "Send a photo", sbn: "পুরনো পার্ট বা ভাঙা জায়গার", sen: "Of the old or broken part" },
    { value: "text", icon: <Keyboard className="size-6" />, bn: "লিখে দিন", en: "Type it", sbn: "পার্টের নাম বা নম্বর", sen: "Part name or number" },
  ];
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        {modes.map((m) => (
          <ChoiceCard key={m.value} selected={draft.mode === m.value} onClick={() => set({ mode: m.value })} icon={m.icon} title={tx(m.bn, m.en)} subtitle={tx(m.sbn, m.sen)} />
        ))}
      </div>

      {draft.mode === "voice" && (
        <div className="rounded-2xl border border-line bg-card p-3">
          <p className="text-center font-semibold">{tx("লাল বাটন চেপে বলুন: কোন গাড়ি, কী লাগবে", "Tap the red button and say: which car, what part")}</p>
          <VoiceRecorder onSaved={(v) => set({ voice: [...draft.voice, v] })} />
        </div>
      )}
      {draft.mode === "photo" && <PhotoUploader value={draft.photos} onChange={(photos) => set({ photos })} max={6} />}
      {(draft.mode === "text" || draft.mode === "photo") && (
        <Textarea
          value={draft.text}
          onChange={(e) => set({ text: e.target.value })}
          placeholder={draft.mode === "photo" ? tx("কিছু বলার থাকলে লিখুন (ঐচ্ছিক)", "Anything to add? (optional)") : tx("যেমন: সামনের ডান হেডলাইট, পুরো সেট", "e.g. front right headlight, full set")}
        />
      )}
      {draft.mode === "text" && (
        <button type="button" onClick={() => set({ mode: "voice" })} className="flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-ink">
          <Mic className="size-4" aria-hidden /> {tx("লিখতে কষ্ট? বলে দিন", "Hard to type? Say it instead")}
        </button>
      )}

      {draft.voice.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted">{tx(`রাখা ভয়েস (${d(draft.voice.length)})`, `Saved voice notes (${draft.voice.length})`)}</p>
          {draft.voice.map((v) => (
            <div key={v.id} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <VoicePlayer src={v.url} duration={v.duration_sec} />
              </div>
              <button type="button" aria-label={tx("মুছুন", "Remove")} onClick={() => set({ voice: draft.voice.filter((x) => x.id !== v.id) })} className="grid size-11 place-items-center rounded-xl hover:bg-ink/5">
                <X className="size-5" />
              </button>
            </div>
          ))}
        </div>
      )}
      {draft.mode !== "photo" && draft.photos.length > 0 && <p className="text-sm text-muted">📷 {tx(`${d(draft.photos.length)}টা ছবি রাখা আছে`, `${draft.photos.length} photos attached`)}</p>}

      <div className="rounded-2xl border border-dashed border-line p-3">
        {cat ? (
          <div className="flex items-center gap-2">
            <Tag className="size-5 text-brand" aria-hidden />
            <span className="flex-1 font-semibold">{lang === "bn" ? cat.name_bn : cat.name}</span>
            <Button variant="ghost" size="sm" onClick={() => set({ categoryId: null })}>
              {tx("সরান", "Remove")}
            </Button>
          </div>
        ) : (
          <button type="button" onClick={() => setCatOpen(true)} className="flex min-h-12 w-full items-center gap-2 text-left font-semibold text-ink-2">
            <Tag className="size-5" aria-hidden /> {tx("কোন ধরনের পার্ট? বেছে নিন (ঐচ্ছিক, দিলে দ্রুত দাম আসে)", "Which kind of part? (optional, gets quotes faster)")}
          </button>
        )}
      </div>
      <Sheet open={catOpen} onClose={() => setCatOpen(false)} title={tx("পার্টের ধরন", "Part type")}>
        <div className="pb-4">
          <CategoryPicker
            onPick={(c) => {
              set({ categoryId: c.id });
              setCatOpen(false);
            }}
          />
        </div>
      </Sheet>
    </div>
  );
}

/** Step 2: which car — my cars, the picker, or free text. */
export function StepVehicle({ draft, set }: { draft: Draft; set: SetDraft }) {
  const { tx, lang } = useT();
  const cars = useDb((s) => s.vehicles.filter((v) => v.owner === (s.session.customerPhone ?? "guest")));
  const picked = describeVehicle(draft.generationId, draft.engineId, lang);

  if (draft.vehicleMode === "pick" && !draft.generationId && !draft.vehicleText) {
    return (
      <div className="space-y-3">
        <Button variant="ghost" onClick={() => set({ vehicleMode: null })}>
          ← {tx("অন্য উপায়ে", "Other ways")}
        </Button>
        <VehiclePicker
          onDone={(v) => {
            const make = getMake(v.make_id);
            const model = getModel(v.model_id);
            set({
              generationId: v.generation_id, engineId: v.engine_id, userVehicleId: null,
              vehicleText: v.generation_id ? "" : [make?.name, model?.name].filter(Boolean).join(" "),
              vehicleMode: v.make_id ? "pick" : "unknown",
            });
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {cars.map((c) => {
        const dv = describeVehicle(c.generation_id, c.engine_id, lang);
        return (
          <ChoiceCard
            key={c.id}
            selected={draft.vehicleMode === "mine" && draft.userVehicleId === c.id}
            onClick={() => set({ vehicleMode: "mine", userVehicleId: c.id, generationId: c.generation_id, engineId: c.engine_id, vehicleText: "" })}
            icon={dv ? <MakeLogo make={dv.make} size="sm" /> : <Car className="size-6" />}
            title={c.nickname ?? dv?.withYear ?? tx("আমার গাড়ি", "My car")}
            subtitle={dv?.full ?? c.registration_no}
          />
        );
      })}
      {draft.vehicleMode === "pick" && (picked || draft.vehicleText) ? (
        <ChoiceCard selected icon={picked ? <MakeLogo make={picked.make} size="sm" /> : <Car className="size-6" />} title={picked?.full ?? draft.vehicleText} subtitle={tx("বদলাতে চাপুন", "Tap to change")} onClick={() => set({ generationId: null, engineId: null, vehicleText: "" })} />
      ) : (
        <ChoiceCard icon={<Car className="size-6" />} title={tx(cars.length ? "অন্য গাড়ি বাছাই করুন" : "গাড়ি বাছাই করুন", cars.length ? "Pick another car" : "Pick the car")} subtitle={tx("লোগো → মডেল → সাল", "Logo → model → year")} onClick={() => set({ vehicleMode: "pick", generationId: null, engineId: null, vehicleText: "", userVehicleId: null })} />
      )}
      <ChoiceCard selected={draft.vehicleMode === "text"} icon={<Pencil className="size-5" />} title={tx("লিখে দিন", "Type it")} subtitle={tx("যেমন: নোয়া ২০১০", "e.g. Noah 2010")} onClick={() => set({ vehicleMode: "text", userVehicleId: null, generationId: null, engineId: null })} />
      {draft.vehicleMode === "text" && <Input autoFocus value={draft.vehicleText} onChange={(e) => set({ vehicleText: e.target.value })} placeholder={tx("গাড়ির নাম ও সাল", "Car name and year")} />}
      <ChoiceCard selected={draft.vehicleMode === "unknown"} icon={<HelpCircle className="size-5" />} title={tx("জানি না, টিম জেনে নেবে", "Not sure, the team will ask")} onClick={() => set({ vehicleMode: "unknown", userVehicleId: null, generationId: null, engineId: null, vehicleText: "" })} />
    </div>
  );
}
