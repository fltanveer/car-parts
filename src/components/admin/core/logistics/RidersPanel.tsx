"use client";

import { UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, Field, Input, Select, Toggle } from "@/components/ui/primitives";
import { audit } from "@/lib/db/actions";
import { addRider } from "@/lib/db/actions-admin-core";
import { update, useDb } from "@/lib/db/store";
import { displayPhone, normalizePhone } from "@/lib/format";
import { markets } from "@/lib/mock/settings";
import { DataTable, Panel } from "../index";

export function RidersPanel() {
  const { tx, d } = useT();
  const riders = useDb((s) => s.riders);
  const rounds = useDb((s) => s.pickupRounds);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState(markets[0].bn);
  const ok = name.trim().length > 1 && !!normalizePhone(phone);

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <DataTable
        caption={tx("রাইডার", "Riders")}
        rows={riders}
        rowKey={(r) => r.id}
        search={(r) => `${r.name} ${r.phone} ${r.area}`}
        columns={[
          { key: "n", header: tx("নাম", "Name"), cell: (r) => <Link href={`/admin/logistics/rider?rider=${r.id}`} className="font-semibold text-brand hover:underline">{r.name}</Link>, sort: (r) => r.name },
          { key: "p", header: tx("ফোন", "Phone"), cell: (r) => <a href={`tel:${r.phone}`} className="hover:underline">{displayPhone(r.phone)}</a> },
          { key: "a", header: tx("এলাকা", "Area"), cell: (r) => r.area, sort: (r) => r.area },
          { key: "r", header: tx("রাউন্ড", "Rounds"), cell: (r) => d(rounds.filter((x) => x.rider_id === r.id).length) },
          {
            key: "act", header: tx("সক্রিয়", "Active"),
            cell: (r) => (
              <div className="w-20">
                <Toggle
                  checked={r.active}
                  label=""
                  onChange={(v) => {
                    update((s) => ({ riders: s.riders.map((x) => (x.id === r.id ? { ...x, active: v } : x)) }));
                    audit(v ? "রাইডার সক্রিয়" : "রাইডার নিষ্ক্রিয়", r.name);
                  }}
                />
              </div>
            ),
          },
        ]}
      />
      <Panel title={tx("নতুন রাইডার", "New rider")}>
        <div className="space-y-3">
          <Field label={tx("নাম", "Name")}><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label={tx("ফোন", "Phone")}><Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" /></Field>
          <Field label={tx("এলাকা", "Area")}>
            <Select value={area} onChange={(e) => setArea(e.target.value)}>
              {markets.map((m) => <option key={m.id}>{m.bn}</option>)}
            </Select>
          </Field>
          <Button
            full
            variant="brand"
            disabled={!ok}
            onClick={() => {
              addRider(name.trim(), normalizePhone(phone)!, area);
              setName("");
              setPhone("");
              toast(tx("রাইডার যোগ হয়েছে", "Rider added"));
            }}
          >
            <UserPlus className="size-4" /> {tx("রাইডার যোগ করুন", "Add rider")}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
