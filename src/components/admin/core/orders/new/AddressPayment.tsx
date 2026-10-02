"use client";

import { MapPin, Wallet } from "lucide-react";
import { useT } from "@/components/providers/LangProvider";
import { ChoiceCard, Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { useDb } from "@/lib/db/store";
import { paymentMethodLabel } from "@/lib/labels";
import { locations } from "@/lib/mock/settings";
import type { PaymentOption } from "@/lib/rules";
import type { Address } from "@/lib/types";
import { Panel } from "../../index";

export type AddressDraft = Omit<Address, "id" | "is_default" | "label"> & { id: string | null };

export const emptyAddress = (phone: string): AddressDraft => ({
  id: null, recipient_name: "", phone, division: "ঢাকা", district: "ঢাকা", area: locations[0].districts[0].areas[0], address_line: "", landmark: null,
});

const allDistricts = locations.flatMap((x) => x.districts.map((d) => ({ ...d, division: x.division })));

export function AddressForm({ phone, value, onChange }: { phone: string | null; value: AddressDraft; onChange: (a: AddressDraft) => void }) {
  const { tx } = useT();
  const saved = useDb((s) => s.addresses.filter((a) => a.owner === phone));
  const district = allDistricts.find((x) => x.name === value.district);
  const set = <K extends keyof AddressDraft>(k: K, v: AddressDraft[K]) => onChange({ ...value, [k]: v, id: k === "id" ? (v as string | null) : null });
  return (
    <Panel title={<span className="flex items-center gap-2"><MapPin className="size-5" /> {tx("৪. ঠিকানা", "4. Address")}</span>}>
      {saved.length > 0 && (
        <div className="mb-3 grid gap-2 sm:grid-cols-2">
          {saved.map((a) => (
            <ChoiceCard
              key={a.id}
              selected={value.id === a.id}
              onClick={() => onChange({ id: a.id, recipient_name: a.recipient_name, phone: a.phone, division: a.division, district: a.district, area: a.area, address_line: a.address_line, landmark: a.landmark })}
              icon="🏠"
              title={`${a.label ?? ""} ${a.recipient_name}`}
              subtitle={`${a.address_line}, ${a.area}, ${a.district}`}
            />
          ))}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={tx("প্রাপকের নাম", "Recipient")}><Input value={value.recipient_name} onChange={(e) => set("recipient_name", e.target.value)} /></Field>
        <Field label={tx("প্রাপকের ফোন", "Recipient phone")}><Input value={value.phone} onChange={(e) => set("phone", e.target.value)} inputMode="tel" /></Field>
        <Field label={tx("জেলা", "District")}>
          <Select value={value.district} onChange={(e) => { const d = allDistricts.find((x) => x.name === e.target.value)!; onChange({ ...value, id: null, district: d.name, division: d.division, area: d.areas[0] }); }}>
            {allDistricts.map((d) => <option key={d.name}>{d.name}</option>)}
          </Select>
        </Field>
        <Field label={tx("এলাকা", "Area")}>
          <Select value={value.area} onChange={(e) => set("area", e.target.value)}>
            {(district?.areas ?? []).map((a) => <option key={a}>{a}</option>)}
          </Select>
        </Field>
      </div>
      <Field label={tx("বাড়ি / রাস্তা", "House / road")}><Textarea value={value.address_line} onChange={(e) => set("address_line", e.target.value)} className="min-h-20" /></Field>
      <Field label={tx("চেনার জায়গা (ঐচ্ছিক)", "Landmark (optional)")}><Input value={value.landmark ?? ""} onChange={(e) => set("landmark", e.target.value || null)} /></Field>
    </Panel>
  );
}

export function PaymentChooser({ options, value, onChange, trx, setTrx, sender, setSender }: {
  options: PaymentOption[];
  value: PaymentOption["method"] | null;
  onChange: (m: PaymentOption["method"]) => void;
  trx: string;
  setTrx: (v: string) => void;
  sender: string;
  setSender: (v: string) => void;
}) {
  const { tx, L, taka } = useT();
  const chosen = options.find((o) => o.method === value);
  return (
    <Panel title={<span className="flex items-center gap-2"><Wallet className="size-5" /> {tx("৫. পেমেন্ট", "5. Payment")}</span>}>
      <div className="grid gap-2">
        {options.map((o) => (
          <ChoiceCard
            key={o.method}
            selected={value === o.method}
            onClick={() => onChange(o.method)}
            icon={o.method === "cod" ? "💵" : o.method === "online" ? "💳" : "📲"}
            title={`${L(paymentMethodLabel[o.method])}${o.recommended ? tx(" · প্রস্তাবিত", " · recommended") : ""}`}
            subtitle={tx(`এখন ${taka(o.advance)} · পৌঁছালে ${taka(o.cod)}`, `Now ${taka(o.advance)} · on delivery ${taka(o.cod)}`)}
          />
        ))}
      </div>
      {chosen && chosen.method === "delivery_advance_cod" && chosen.advance > 0 && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Field label={tx("bKash/Nagad TrxID (কাস্টমার পাঠিয়ে থাকলে)", "bKash/Nagad TrxID (if already sent)")}><Input value={trx} onChange={(e) => setTrx(e.target.value.toUpperCase())} /></Field>
          <Field label={tx("যে নম্বর থেকে পাঠিয়েছে", "Sender number")}><Input value={sender} onChange={(e) => setSender(e.target.value)} inputMode="tel" /></Field>
        </div>
      )}
      {chosen?.method === "online" && <p className="mt-2 text-sm text-muted">{tx("কাস্টমারকে পেমেন্ট লিংকসহ নোটিফিকেশন যাবে।", "The customer gets a notification with the payment link.")}</p>}
    </Panel>
  );
}
