"use client";

import { MapPin, Mic, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteAddress, saveAddress } from "@/lib/db/actions";
import { useDb } from "@/lib/db/store";
import { displayPhone, normalizePhone } from "@/lib/format";
import { locations } from "@/lib/mock/settings";
import type { Address, VoiceNote } from "@/lib/types";
import { VoicePlayer } from "../../media/VoicePlayer";
import { VoiceRecorder } from "../../media/VoiceRecorder";
import { toast } from "../../shared/Misc";
import { useT } from "../../providers/LangProvider";
import { Button, Card, Chip, Field, Input, SectionTitle, Select, Textarea, Toggle } from "../../ui/primitives";
import { Sheet } from "../../ui/Sheet";

type Editing = (Omit<Address, "id"> & { id?: string }) | null;

/** Saved addresses: add, edit, delete, default (file 01 §12). */
export function AddressBook({ phone, name }: { phone: string; name: string }) {
  const { tx, d } = useT();
  const list = useDb((s) => s.addresses.filter((a) => a.owner === phone));
  const [editing, setEditing] = useState<Editing>(null);
  const blank = (): Editing => ({
    label: "বাসা", recipient_name: name, phone, division: "ঢাকা", district: "ঢাকা", area: "", address_line: "", landmark: null, voice_note: null, is_default: list.length === 0,
  });

  return (
    <section>
      <SectionTitle
        action={
          <Button variant="outline" size="sm" onClick={() => setEditing(blank())}>
            <Plus className="size-4" aria-hidden /> {tx("নতুন", "Add")}
          </Button>
        }
      >
        📍 {tx("ঠিকানা", "Addresses")}
      </SectionTitle>
      <div className="space-y-2">
        {list.length === 0 && <p className="text-muted">{tx("কোনো ঠিকানা সেভ নেই। অর্ডারের সময়ও দেওয়া যাবে।", "No saved address. You can also add one at checkout.")}</p>}
        {list.map((a) => (
          <Card key={a.id} className="flex items-start gap-3 p-4">
            <MapPin className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-bold">
                {a.label ?? tx("ঠিকানা", "Address")} {a.is_default && <span className="ml-1 rounded-full bg-ok-soft px-2 text-xs text-ok">{tx("ডিফল্ট", "Default")}</span>}
              </p>
              <p>
                {a.recipient_name} · {d(displayPhone(a.phone))}
              </p>
              <p className="text-muted">
                {a.address_line}, {a.area}, {a.district}
              </p>
            </div>
            <button type="button" aria-label={tx("বদলান", "Edit")} onClick={() => setEditing(a)} className="grid size-11 place-items-center rounded-xl hover:bg-ink/5">
              <Pencil className="size-5" />
            </button>
            <button
              type="button"
              aria-label={tx("মুছুন", "Delete")}
              onClick={() => {
                deleteAddress(a.id);
                toast(tx("ঠিকানা মুছে ফেলা হয়েছে", "Address deleted"), "info");
              }}
              className="grid size-11 place-items-center rounded-xl text-bad hover:bg-bad-soft"
            >
              <Trash2 className="size-5" />
            </button>
          </Card>
        ))}
      </div>
      <Sheet open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? tx("ঠিকানা বদলান", "Edit address") : tx("নতুন ঠিকানা", "New address")}>
        {editing && <AddressForm key={editing.id ?? "new"} initial={editing} onDone={() => setEditing(null)} />}
      </Sheet>
    </section>
  );
}

function AddressForm({ initial, onDone }: { initial: NonNullable<Editing>; onDone: () => void }) {
  const { tx } = useT();
  const [a, setA] = useState(initial);
  const [rec, setRec] = useState(false);
  const set = (p: Partial<NonNullable<Editing>>) => setA((x) => ({ ...x!, ...p }));
  const districts = locations.flatMap((l) => l.districts.map((dd) => ({ ...dd, division: l.division })));
  const areas = districts.find((x) => x.name === a.district)?.areas ?? [];
  const phone = normalizePhone(a.phone);
  const ok = !!a.recipient_name.trim() && !!phone && !!a.area && a.address_line.trim().length > 3;

  return (
    <div className="space-y-4 pb-3">
      <div className="flex gap-2">
        {["বাসা", "অফিস", "দোকান/গ্যারেজ"].map((l) => (
          <Chip key={l} active={a.label === l} onClick={() => set({ label: l })}>
            {l}
          </Chip>
        ))}
      </div>
      <Field label={tx("যিনি নেবেন", "Recipient")}>
        <Input value={a.recipient_name} onChange={(e) => set({ recipient_name: e.target.value })} autoComplete="name" />
      </Field>
      <Field label={tx("মোবাইল", "Mobile")} error={a.phone && !phone ? tx("সঠিক নম্বর দিন", "Invalid number") : undefined}>
        <Input type="tel" inputMode="numeric" value={displayPhone(a.phone)} onChange={(e) => set({ phone: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={tx("জেলা", "District")}>
          <Select value={a.district} onChange={(e) => set({ district: e.target.value, division: districts.find((x) => x.name === e.target.value)?.division ?? a.division, area: "" })}>
            {districts.map((x) => (
              <option key={x.name}>{x.name}</option>
            ))}
          </Select>
        </Field>
        <Field label={tx("এলাকা", "Area")}>
          <Select value={a.area} onChange={(e) => set({ area: e.target.value })}>
            <option value="">{tx("বাছুন", "Choose")}</option>
            {areas.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label={tx("বাড়ি, রোড", "House, road")}>
        <Textarea value={a.address_line} onChange={(e) => set({ address_line: e.target.value })} className="min-h-20" />
      </Field>
      <Field label={tx("কাছের চেনা জায়গা", "Landmark")}>
        <Input value={a.landmark ?? ""} onChange={(e) => set({ landmark: e.target.value || null })} placeholder={tx("যেমন: মসজিদের পাশে", "e.g. next to the mosque")} />
      </Field>
      {a.voice_note ? (
        <VoicePlayer src={a.voice_note.url} duration={a.voice_note.duration_sec} />
      ) : rec ? (
        <VoiceRecorder compact onSaved={(v: VoiceNote) => set({ voice_note: v })} />
      ) : (
        <Button variant="outline" size="sm" onClick={() => setRec(true)}>
          <Mic className="size-4" aria-hidden /> {tx("ঠিকানা বলে দিন (ডেলিভারিম্যান শুনবে)", "Say the directions (for the rider)")}
        </Button>
      )}
      <Toggle checked={a.is_default} onChange={(v) => set({ is_default: v })} label={tx("এটাই ডিফল্ট ঠিকানা", "Make default")} />
      <Button
        variant="brand"
        size="lg"
        full
        disabled={!ok}
        onClick={() => {
          saveAddress({ ...a, phone: phone! });
          toast(tx("ঠিকানা সেভ হয়েছে", "Address saved"));
          onDone();
        }}
      >
        {tx("সেভ করুন", "Save")}
      </Button>
    </div>
  );
}
