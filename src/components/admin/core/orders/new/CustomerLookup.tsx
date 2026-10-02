"use client";

import { UserRound } from "lucide-react";
import { useT } from "@/components/providers/LangProvider";
import { Field, Input, Notice } from "@/components/ui/primitives";
import { describeVehicle } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import { normalizePhone } from "@/lib/format";
import { Panel } from "../../index";

export interface CustomerInfo {
  phone: string | null;
  isNew: boolean;
  blocked: boolean;
  forceAdvance: boolean;
  vehicles: { id: string; label: string; generation_id: string | null }[];
}

/** Phone → existing profile or new customer (file 03 6.3). */
export function useCustomerInfo(raw: string): CustomerInfo {
  const phone = normalizePhone(raw);
  const profile = useDb((s) => s.profiles.find((p) => p.phone === phone) ?? null);
  const orders = useDb((s) => s.orders.filter((o) => o.user_phone === phone).length);
  const vehicles = useDb((s) => s.vehicles.filter((v) => v.owner === phone));
  return {
    phone,
    isNew: orders === 0,
    blocked: !!profile?.is_blocked,
    forceAdvance: !!profile?.force_advance,
    vehicles: vehicles.map((v) => ({ id: v.id, label: v.nickname ?? describeVehicle(v.generation_id, v.engine_id)?.full ?? v.id, generation_id: v.generation_id })),
  };
}

export function CustomerLookup({ phone, setPhone, name, setName, info }: { phone: string; setPhone: (v: string) => void; name: string; setName: (v: string) => void; info: CustomerInfo }) {
  const { tx, d } = useT();
  const profile = useDb((s) => s.profiles.find((p) => p.phone === info.phone) ?? null);
  const orders = useDb((s) => s.orders.filter((o) => o.user_phone === info.phone).length);
  return (
    <Panel title={<span className="flex items-center gap-2"><UserRound className="size-5" /> {tx("১. কাস্টমার", "1. Customer")}</span>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={tx("কাস্টমারের ফোন", "Customer phone")} error={phone.length > 5 && !info.phone ? tx("সঠিক মোবাইল নম্বর দিন", "Enter a valid mobile number") : undefined}>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="01XXXXXXXXX" autoFocus />
        </Field>
        <Field label={tx("নাম", "Name")}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={profile?.full_name ?? ""} />
        </Field>
      </div>
      {info.phone && (
        <div className="mt-3 space-y-2">
          {profile ? (
            <Notice tone="ok">
              {tx("পুরনো কাস্টমার", "Existing customer")}: {profile.full_name ?? "—"} · {tx(`${d(orders)}টা অর্ডার`, `${orders} orders`)} · {tx(`${d(info.vehicles.length)}টা গাড়ি`, `${info.vehicles.length} cars`)}
            </Notice>
          ) : (
            <Notice tone="info">{tx("নতুন কাস্টমার — অর্ডারের সাথে প্রোফাইল তৈরি হবে।", "New customer — a profile is created with the order.")}</Notice>
          )}
          {info.blocked && <Notice tone="bad">{tx("এই কাস্টমার ব্লক করা আছে। অর্ডার নেওয়া যাবে না।", "This customer is blocked. Orders are not allowed.")}</Notice>}
          {info.forceAdvance && <Notice tone="wait">{tx("COD ফেরতের ইতিহাস আছে: অগ্রিম বাধ্যতামূলক।", "COD-return history: advance required.")}</Notice>}
        </div>
      )}
    </Panel>
  );
}
