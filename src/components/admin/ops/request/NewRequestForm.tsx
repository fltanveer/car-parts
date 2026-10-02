"use client";

import { Send } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { PhotoUploader } from "@/components/media/PhotoUploader";
import { VoiceRecorder } from "@/components/media/VoiceRecorder";
import { VoicePlayer } from "@/components/media/VoicePlayer";
import { BackButton, toast } from "@/components/shared/Misc";
import { Button, Field, Input, Notice, Select, Textarea } from "@/components/ui/primitives";
import { audit, clarifyAndBroadcast, createRequest } from "@/lib/db/actions";
import { createVehicleFor, ensureProfile, setRequestSource, syncRequestStatus } from "@/lib/db/actions-admin-ops";
import { markIntakeHandled } from "@/lib/db/actions-admin-ops-trust";
import { describeVehicle, matchVendors } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import { normalizePhone } from "@/lib/format";
import { conditionPrefLabel, neededByLabel, sourcePrefLabel } from "@/lib/labels";
import { locations } from "@/lib/mock/settings";
import { containsPersonalInfo } from "@/lib/rules";
import type { MediaItem, PartRequest, VoiceNote } from "@/lib/types";
import { Dictate } from "../Dictate";
import { FilterChips, OpsPage, Panel } from "../ui";
import { autoSummary, draftPatch, type ClarifyDraft } from "./draft";
import { ItemsEditor, VehicleField } from "./Editors";

const districts = locations.flatMap((l) => l.districts);

/** Phone / WhatsApp request entry in one go (file 03 6.3). */
export function NewRequestForm() {
  const { tx, L, d } = useT();
  const router = useRouter();
  const params = useSearchParams();
  const intakeId = params.get("intake");
  const [channel, setChannel] = useState<"phone" | "whatsapp">(intakeId ? "whatsapp" : "phone");
  const [phone, setPhone] = useState(params.get("phone")?.replace(/^\+88/, "") ?? "");
  const [name, setName] = useState("");
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [saveCar, setSaveCar] = useState(true);
  const [voice, setVoice] = useState<VoiceNote[]>([]);
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [text, setText] = useState(params.get("text") ?? "");
  const [district, setDistrict] = useState(districts[0].name);
  const [area, setArea] = useState(districts[0].areas[0]);
  const [pref, setPref] = useState<{ s: PartRequest["preferred_source"]; c: PartRequest["preferred_condition"]; n: PartRequest["needed_by"] }>({ s: "you_decide", c: "any", n: "2_3_days" });
  const [draft, setDraft] = useState<ClarifyDraft>({ clarity: "clear", generation_id: null, engine_id: null, items: [{ category_id: null, name: "", qty: 1, position: [] }], summary: "" });
  const [error, setError] = useState<string | null>(null);

  const e164 = normalizePhone(phone);
  const profile = useDb((s) => (e164 ? s.profiles.find((p) => p.phone === e164) ?? null : null));
  const vehicles = useDb((s) => (e164 ? s.vehicles.filter((v) => v.owner === e164) : []));
  const pastRequests = useDb((s) => (e164 ? s.requests.filter((r) => r.user_phone === e164).length : 0));
  const matches = useDb((s) => matchVendors(s, draftPatch(draft).items.map((i) => i.category_id).filter((x): x is string => !!x), draft.generation_id));
  const patch = draftPatch(draft);
  const ready = !!patch.items.length && !!patch.summary_bn && !containsPersonalInfo(patch.summary_bn) && !!draft.generation_id;
  const areas = districts.find((x) => x.name === district)?.areas ?? [];

  const pickVehicle = (id: string | null) => {
    setVehicleId(id);
    const v = vehicles.find((x) => x.id === id);
    if (v) setDraft({ ...draft, generation_id: v.generation_id, engine_id: v.engine_id });
  };

  const submit = () => {
    if (!e164) return setError(tx("সঠিক ফোন নম্বর দিন", "Enter a valid phone"));
    ensureProfile(e164, name.trim() || null);
    let userVehicleId = vehicleId;
    if (!userVehicleId && saveCar && draft.generation_id) userVehicleId = createVehicleFor(e164, { generation_id: draft.generation_id, engine_id: draft.engine_id });
    const res = createRequest({
      phone: e164, contact_name: name.trim() || profile?.full_name || null, user_vehicle_id: userVehicleId, generation_id: draft.generation_id, engine_id: draft.engine_id,
      vehicle_text: describeVehicle(draft.generation_id, draft.engine_id)?.withYear ?? null, description_text: text.trim() || null, category_id: patch.items[0]?.category_id ?? null,
      voice_notes: voice, photos, preferred_source: pref.s, preferred_condition: pref.c, needed_by: pref.n, district, area,
    });
    if ("error" in res) return setError(tx("এই নম্বর থেকে আজ অনেক রিকোয়েস্ট হয়েছে। সীমা পার।", "Too many requests from this number today."));
    setRequestSource(res.id, channel);
    if (ready) {
      clarifyAndBroadcast(res.id, patch, matches.map((v) => v.id));
      syncRequestStatus(res.id);
    }
    if (intakeId) markIntakeHandled(intakeId);
    audit(`${channel === "phone" ? "ফোন" : "WhatsApp"} থেকে রিকোয়েস্ট এন্ট্রি`, res.request_no);
    toast(ready ? tx(`${d(matches.length)}টা দোকানে পাঠানো হয়েছে`, `Sent to ${matches.length} shops`) : tx("রিকোয়েস্ট ডেস্কে সেভ হয়েছে", "Saved to the desk"));
    router.push(`/admin/requests/${res.id}`);
  };

  return (
    <OpsPage
      narrow
      back={<BackButton href="/admin/requests" label={tx("রিকোয়েস্ট ডেস্ক", "Request desk")} />}
      title={tx("ফোন/WhatsApp থেকে রিকোয়েস্ট", "Request from phone/WhatsApp")}
      guide={tx("কাস্টমারের ফোন নম্বর দিন। গাড়ি বাছুন, WhatsApp-এর ভয়েস বা ছবি থাকলে যোগ করুন। পার্ট আর সারাংশ লিখে নিচের বড় বাটন চাপুন, একসাথে দোকানে চলে যাবে।", "Enter the customer's phone. Pick the car, add WhatsApp voice or photos. Fill in the part and summary, then press the big button to send to shops.")}
    >
      <div className="space-y-4">
        <Panel title={tx("১. কাস্টমার", "1. Customer")}>
          <FilterChips<"phone" | "whatsapp"> value={channel} onChange={setChannel} items={[{ value: "phone", label: tx("📞 ফোন কল", "📞 Phone call") }, { value: "whatsapp", label: "💬 WhatsApp" }]} />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label={tx("ফোন নম্বর", "Phone number")} error={phone && !e164 ? tx("সঠিক নম্বর দিন", "Invalid number") : undefined}>
              <Input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
            </Field>
            <Field label={tx("নাম (ঐচ্ছিক)", "Name (optional)")}>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={profile?.full_name ?? ""} />
            </Field>
          </div>
          {e164 && (
            <Notice tone={profile ? "ok" : "info"} className="mt-3">
              {profile ? tx(`পুরনো কাস্টমার: ${profile.full_name ?? "নাম নেই"} · আগের রিকোয়েস্ট ${d(pastRequests)}`, `Existing customer: ${profile.full_name ?? "no name"} · ${pastRequests} past requests`) : tx("নতুন কাস্টমার, প্রোফাইল তৈরি হবে", "New customer, a profile will be created")}
            </Notice>
          )}
        </Panel>

        <Panel title={tx("২. গাড়ি", "2. Car")}>
          {vehicles.length > 0 && (
            <div className="mb-3">
              <FilterChips<string>
                value={vehicleId ?? ""}
                onChange={(v) => pickVehicle(v || null)}
                items={[...vehicles.map((v) => ({ value: v.id, label: `🚗 ${describeVehicle(v.generation_id, v.engine_id)?.withYear ?? v.nickname ?? "?"}` })), { value: "", label: tx("অন্য গাড়ি", "Other car") }]}
              />
            </div>
          )}
          <VehicleField generationId={draft.generation_id} engineId={draft.engine_id} onChange={(g, e) => { setVehicleId(null); setDraft({ ...draft, generation_id: g, engine_id: e }); }} />
          {!vehicleId && draft.generation_id && (
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-5" checked={saveCar} onChange={(e) => setSaveCar(e.target.checked)} />
              {tx("কাস্টমারের \"আমার গাড়ি\"-তে সেভ করুন", "Save to the customer's garage")}
            </label>
          )}
        </Panel>

        <Panel title={tx("৩. কাস্টমার যা দিয়েছে", "3. What the customer sent")}>
          <div className="space-y-3">
            {voice.map((v) => <VoicePlayer key={v.id} src={v.url} duration={v.duration_sec} />)}
            <VoiceRecorder compact onSaved={(v) => setVoice((x) => [...x, v])} />
            <PhotoUploader value={photos} onChange={setPhotos} />
            <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={tx("কাস্টমার যা বলেছে/লিখেছে", "What the customer said/wrote")} />
            <Dictate onText={(t) => setText((s) => (s ? `${s} ${t}` : t))} />
            <div className="grid grid-cols-2 gap-3">
              <Field label={tx("জেলা", "District")}>
                <Select value={district} onChange={(e) => { setDistrict(e.target.value); setArea(districts.find((x) => x.name === e.target.value)?.areas[0] ?? ""); }}>
                  {districts.map((x) => <option key={x.name}>{x.name}</option>)}
                </Select>
              </Field>
              <Field label={tx("এলাকা", "Area")}>
                <Select value={area} onChange={(e) => setArea(e.target.value)}>
                  {areas.map((a) => <option key={a}>{a}</option>)}
                </Select>
              </Field>
            </div>
            <FilterChips<PartRequest["preferred_source"]> value={pref.s} onChange={(s) => setPref({ ...pref, s })} items={(Object.keys(sourcePrefLabel) as PartRequest["preferred_source"][]).map((k) => ({ value: k, label: L(sourcePrefLabel[k]) }))} />
            <FilterChips<PartRequest["preferred_condition"]> value={pref.c} onChange={(c) => setPref({ ...pref, c })} items={(Object.keys(conditionPrefLabel) as PartRequest["preferred_condition"][]).map((k) => ({ value: k, label: L(conditionPrefLabel[k]) }))} />
            <FilterChips<PartRequest["needed_by"]> value={pref.n} onChange={(n) => setPref({ ...pref, n })} items={(Object.keys(neededByLabel) as PartRequest["needed_by"][]).map((k) => ({ value: k, label: L(neededByLabel[k]) }))} />
          </div>
        </Panel>

        <Panel title={tx("৪. পরিষ্কার নোট", "4. Clarify note")}>
          <div className="space-y-3">
            <ItemsEditor items={draft.items} onChange={(items) => setDraft({ ...draft, items })} />
            <Field label={tx("বিক্রেতারা যা দেখবে", "What sellers will see")}>
              <Textarea value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} />
            </Field>
            <Button size="sm" variant="outline" onClick={() => setDraft({ ...draft, summary: autoSummary(draft) })}>
              🪄 {tx("স্বয়ংক্রিয় সারাংশ", "Auto summary")}
            </Button>
            {patch.summary_bn && containsPersonalInfo(patch.summary_bn) && <Notice tone="bad">⚠️ {tx("সারাংশে ব্যক্তিগত তথ্য আছে, সরান।", "Summary contains personal info, remove it.")}</Notice>}
            <p className="text-sm text-muted">
              {tx(`মিলে যাওয়া দোকান: ${d(matches.length)}টা`, `Matching shops: ${matches.length}`)}
              {matches.length > 0 && `, ${matches.slice(0, 4).map((v) => v.shop_name_bn).join(", ")}${matches.length > 4 ? "…" : ""}`}
            </p>
          </div>
        </Panel>

        {error && <Notice tone="bad">{error}</Notice>}
        {!ready && <Notice tone="wait">{tx("গাড়ি, আইটেম ও সারাংশ না দিলে রিকোয়েস্ট ডেস্কে \"পরিষ্কার করতে হবে\" কলামে যাবে।", "Without car, item and summary it goes to the desk's clarify column.")}</Notice>}
        <Button variant="brand" size="xl" full onClick={submit} disabled={!e164}>
          <Send className="size-6" /> {ready ? tx("সেভ করে দোকানে পাঠান", "Save & send to shops") : tx("ডেস্কে সেভ করুন", "Save to desk")}
        </Button>
      </div>
    </OpsPage>
  );
}
