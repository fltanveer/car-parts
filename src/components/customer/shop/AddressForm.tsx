"use client";

import { MapPin, Plus } from "lucide-react";
import { useState } from "react";
import { saveAddress } from "@/lib/db/actions";
import { useDb } from "@/lib/db/store";
import { displayPhone, normalizePhone } from "@/lib/format";
import { locations } from "@/lib/mock/settings";
import type { VoiceNote } from "@/lib/types";
import { VoicePlayer } from "@/components/media/VoicePlayer";
import { VoiceRecorder } from "@/components/media/VoiceRecorder";
import { useT } from "@/components/providers/LangProvider";
import { Button, ChoiceCard, Field, Input, Select } from "@/components/ui/primitives";
import { myAddresses, myProfile } from "./data";

/** Saved addresses, or a new one: division → district → area, landmark by voice (file 01 6.2 step 2). */
export function AddressStep({ value, onChange }: { value: string | null; onChange: (id: string) => void }) {
  const { tx, d } = useT();
  const saved = useDb(myAddresses);
  const [adding, setAdding] = useState(false);
  const showForm = adding || saved.length === 0;
  return (
    <div className="space-y-2">
      {saved.map((a) => (
        <ChoiceCard
          key={a.id}
          selected={value === a.id}
          onClick={() => onChange(a.id)}
          icon={<MapPin className="size-5" />}
          title={`${a.label ? `${a.label} · ` : ""}${a.recipient_name}`}
          subtitle={`${a.address_line}, ${a.area}, ${a.district}${a.landmark ? ` · ${a.landmark}` : ""} · ${d(displayPhone(a.phone))}`}
        />
      ))}
      {showForm ? (
        <AddressForm
          onSaved={(id) => {
            onChange(id);
            setAdding(false);
          }}
          onCancel={saved.length ? () => setAdding(false) : undefined}
        />
      ) : (
        <Button variant="outline" size="lg" full onClick={() => setAdding(true)}>
          <Plus className="size-5" aria-hidden /> {tx("নতুন ঠিকানা", "New address")}
        </Button>
      )}
    </div>
  );
}

export function AddressForm({ onSaved, onCancel }: { onSaved: (id: string) => void; onCancel?: () => void }) {
  const { tx } = useT();
  const profile = useDb(myProfile);
  const sessionPhone = useDb((s) => s.session.customerPhone);
  const [division, setDivision] = useState(locations[0].division);
  const districts = locations.find((l) => l.division === division)?.districts ?? [];
  const [district, setDistrict] = useState(districts[0]?.name ?? "");
  const areas = districts.find((x) => x.name === district)?.areas ?? [];
  const [area, setArea] = useState(areas[0] ?? "");
  const [line, setLine] = useState("");
  const [landmark, setLandmark] = useState("");
  const [voice, setVoice] = useState<VoiceNote | null>(null);
  const [name, setName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(sessionPhone ? displayPhone(sessionPhone) : "");
  const [label, setLabel] = useState("বাসা");
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    const p = normalizePhone(phone);
    if (!name.trim()) return setErr(tx("নাম দিন", "Enter a name"));
    if (!p) return setErr(tx("সঠিক মোবাইল নম্বর দিন", "Enter a valid mobile number"));
    if (!line.trim() && !landmark.trim() && !voice) return setErr(tx("বাসা/রোড লিখুন বা ল্যান্ডমার্ক বলুন", "Add house/road or record a landmark"));
    const id = saveAddress({ label, recipient_name: name.trim(), phone: p, division, district, area, address_line: line.trim(), landmark: landmark.trim() || null, voice_note: voice, is_default: true });
    onSaved(id);
  };

  return (
    <div className="space-y-3 rounded-2xl border-2 border-brand/30 bg-card p-4">
      <div className="flex flex-wrap gap-2">
        {["বাসা", "অফিস", "গ্যারেজ"].map((l) => (
          <button key={l} type="button" onClick={() => setLabel(l)} aria-pressed={label === l} className={`min-h-10 rounded-full border px-3.5 text-sm font-medium ${label === l ? "border-brand bg-brand text-white" : "border-line"}`}>
            {l === "বাসা" ? "🏠" : l === "অফিস" ? "🏢" : "🔧"} {l}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={tx("বিভাগ", "Division")}>
          <Select
            value={division}
            onChange={(e) => {
              const dv = e.target.value;
              const ds = locations.find((l) => l.division === dv)?.districts ?? [];
              setDivision(dv);
              setDistrict(ds[0]?.name ?? "");
              setArea(ds[0]?.areas[0] ?? "");
            }}
          >
            {locations.map((l) => <option key={l.division}>{l.division}</option>)}
          </Select>
        </Field>
        <Field label={tx("জেলা", "District")}>
          <Select
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value);
              setArea(districts.find((x) => x.name === e.target.value)?.areas[0] ?? "");
            }}
          >
            {districts.map((x) => <option key={x.name}>{x.name}</option>)}
          </Select>
        </Field>
        <Field label={tx("এলাকা", "Area")}>
          <Select value={area} onChange={(e) => setArea(e.target.value)}>
            {areas.map((x) => <option key={x}>{x}</option>)}
          </Select>
        </Field>
      </div>
      <Field label={tx("বাসা / রোড", "House / road")}>
        <Input value={line} onChange={(e) => setLine(e.target.value)} placeholder={tx("যেমন: বাড়ি ১২, রোড ৩", "e.g. House 12, Road 3")} />
      </Field>
      <Field label={tx("কাছের চেনা জায়গা (ল্যান্ডমার্ক)", "Nearby landmark")} hint={tx("লিখতে না চাইলে নিচে 🎤 চেপে বলুন", "Or tap 🎤 below and say it")}>
        <Input value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder={tx("যেমন: মসজিদের পাশে", "e.g. next to the mosque")} />
      </Field>
      {voice ? (
        <div className="flex items-center gap-2">
          <VoicePlayer src={voice.url} duration={voice.duration_sec} />
          <Button variant="ghost" size="sm" onClick={() => setVoice(null)}>{tx("আবার বলুন", "Re-record")}</Button>
        </div>
      ) : (
        <VoiceRecorder compact onSaved={setVoice} sendLabel={tx("রাখুন", "Keep")} />
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={tx("যিনি নেবেন তাঁর নাম", "Recipient name")}>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </Field>
        <Field label={tx("মোবাইল", "Mobile")}>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" />
        </Field>
      </div>
      {err && <p className="font-medium text-bad">{err}</p>}
      <div className="flex gap-2">
        {onCancel && <Button variant="ghost" size="lg" onClick={onCancel}>{tx("বাতিল", "Cancel")}</Button>}
        <Button variant="brand" size="lg" full onClick={submit}>{tx("ঠিকানা রাখুন", "Save address")}</Button>
      </div>
    </div>
  );
}
