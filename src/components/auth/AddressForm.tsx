"use client";

import { useState } from "react";
import { locations } from "@/lib/mock/settings";
import { normalizePhone } from "@/lib/format";
import type { Address, VoiceNote } from "@/lib/types";
import { VoicePlayer } from "../media/VoicePlayer";
import { VoiceRecorder } from "../media/VoiceRecorder";
import { useT } from "../providers/LangProvider";
import { Button, Field, Input, Select } from "../ui/primitives";

export type AddressDraft = Omit<Address, "id"> & { id?: string };

// Division -> district -> area dropdowns (bd_locations), plus optional voice
// landmark for users who can't type the address (spec 7.10 step 2).
export function AddressForm({
  initial,
  defaultPhone,
  onSubmit,
  submitLabel,
}: {
  initial?: Address | null;
  defaultPhone?: string;
  onSubmit: (a: AddressDraft, voice: VoiceNote | null) => void;
  submitLabel?: string;
}) {
  const { tx } = useT();
  const [a, setA] = useState<AddressDraft>(
    initial ?? {
      recipient_name: "",
      phone: defaultPhone?.replace("+88", "") ?? "",
      division: "ঢাকা",
      district: "ঢাকা সিটি",
      area: "",
      address_line: "",
      landmark: "",
      is_default: true,
    },
  );
  const [voice, setVoice] = useState<VoiceNote | null>(initial?.voice_note ?? null);
  const [showVoice, setShowVoice] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const div = locations.find((l) => l.division === a.division) ?? locations[0];
  const dist = div.districts.find((x) => x.name === a.district) ?? div.districts[0];
  const set = (patch: Partial<AddressDraft>) => setA((cur) => ({ ...cur, ...patch }));

  const submit = () => {
    const e: Record<string, string> = {};
    if (!a.recipient_name.trim()) e.recipient_name = tx("নাম দিন", "Enter a name");
    const phone = normalizePhone(a.phone);
    if (!phone) e.phone = tx("সঠিক মোবাইল নম্বর দিন", "Enter a valid mobile number");
    if (!a.area) e.area = tx("এলাকা বেছে নিন", "Choose an area");
    if (!a.address_line.trim() && !voice) e.address_line = tx("ঠিকানা লিখুন অথবা বলে দিন", "Type the address or record it");
    setErrors(e);
    if (Object.keys(e).length) return;
    onSubmit({ ...a, phone: phone!, landmark: a.landmark || null, voice_note: voice }, voice);
  };

  return (
    <div className="space-y-4">
      <Field label={tx("যিনি পার্ট নেবেন তার নাম", "Recipient name")} error={errors.recipient_name}>
        <Input value={a.recipient_name} autoComplete="name" onChange={(e) => set({ recipient_name: e.target.value })} />
      </Field>
      <Field label={tx("মোবাইল নম্বর", "Mobile number")} error={errors.phone}>
        <Input type="tel" inputMode="tel" value={a.phone} onChange={(e) => set({ phone: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={tx("বিভাগ", "Division")}>
          <Select
            value={a.division}
            onChange={(e) => {
              const d = locations.find((l) => l.division === e.target.value)!;
              set({ division: d.division, district: d.districts[0].name, area: "" });
            }}
          >
            {locations.map((l) => (
              <option key={l.division}>{l.division}</option>
            ))}
          </Select>
        </Field>
        <Field label={tx("জেলা", "District")}>
          <Select value={dist.name} onChange={(e) => set({ district: e.target.value, area: "" })}>
            {div.districts.map((x) => (
              <option key={x.name}>{x.name}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label={tx("থানা / এলাকা", "Area")} error={errors.area}>
        <Select value={a.area} onChange={(e) => set({ area: e.target.value })}>
          <option value="">{tx("বেছে নিন", "Choose")}</option>
          {dist.areas.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </Select>
      </Field>
      <Field label={tx("বাড়ি, রোড, বিস্তারিত ঠিকানা", "House, road, full address")} error={errors.address_line}>
        <Input value={a.address_line} autoComplete="street-address" onChange={(e) => set({ address_line: e.target.value })} />
      </Field>
      <Field label={<>{tx("কাছের চেনা জায়গা", "Landmark")} <span className="font-normal text-muted">({tx("ঐচ্ছিক", "optional")})</span></>}>
        <Input value={a.landmark ?? ""} onChange={(e) => set({ landmark: e.target.value })} placeholder={tx("যেমন: মসজিদের পাশে", "e.g. next to the mosque")} />
      </Field>

      <div className="rounded-2xl border border-line bg-surface p-3">
        {voice ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold">{tx("ঠিকানার ভয়েস নোট", "Address voice note")}</p>
            <VoicePlayer src={voice.url} duration={voice.duration_sec} />
            <button type="button" className="text-sm font-semibold text-danger" onClick={() => setVoice(null)}>
              {tx("মুছে ফেলুন", "Remove")}
            </button>
          </div>
        ) : showVoice ? (
          <VoiceRecorder compact onSaved={setVoice} />
        ) : (
          <button type="button" className="w-full text-left text-sm font-semibold" onClick={() => setShowVoice(true)}>
            🎤 {tx("লিখতে অসুবিধা? ঠিকানা বলে দিন", "Hard to type? Say the address")}
          </button>
        )}
      </div>

      <Button variant="primary" size="lg" full onClick={submit}>
        {submitLabel ?? tx("ঠিকানা সেভ করুন", "Save address")}
      </Button>
    </div>
  );
}
