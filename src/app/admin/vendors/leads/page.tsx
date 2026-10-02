"use client";

import { Phone, Plus } from "lucide-react";
import { useState } from "react";
import { KanbanColumn, OpsPage, Panel, StaffSelect, useStaffName } from "@/components/admin/ops/ui";
import { useT } from "@/components/providers/LangProvider";
import { BackButton, toast } from "@/components/shared/Misc";
import { Button, ButtonLink, Field, Input, Select } from "@/components/ui/primitives";
import { addLead, LEAD_TARGETS, setLeadStatus } from "@/lib/db/actions-admin-ops";
import { getMarket, markets } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import { displayPhone, normalizePhone } from "@/lib/format";
import type { VendorLead } from "@/lib/types";

const STAGES: { key: VendorLead["status"]; bn: string; en: string; tone: "info" | "wait" | "ok" | "bad" }[] = [
  { key: "new", bn: "নতুন", en: "New", tone: "info" },
  { key: "contacted", bn: "যোগাযোগ হয়েছে", en: "Contacted", tone: "wait" },
  { key: "visit_scheduled", bn: "ভিজিট ঠিক", en: "Visit scheduled", tone: "wait" },
  { key: "onboarded", bn: "যুক্ত হয়েছে", en: "Onboarded", tone: "ok" },
  { key: "not_interested", bn: "আগ্রহী নয়", en: "Not interested", tone: "bad" },
];

export default function LeadsPage() {
  const { tx, L, d } = useT();
  const leads = useDb((s) => s.leads);
  const vendors = useDb((s) => s.vendors);
  const staffName = useStaffName();
  const [form, setForm] = useState({ shop_name: "", market_area: "dholaikhal", phone: "", specialty: "", owner_agent: null as string | null });
  const e164 = normalizePhone(form.phone);

  const marketRows = markets
    .map((m) => ({
      m,
      shops: vendors.filter((v) => getMarket(v.market_area).id === m.id && v.status !== "closed").length,
      pipeline: leads.filter((l) => l.market_area === m.id && !["onboarded", "not_interested"].includes(l.status)).length,
      target: LEAD_TARGETS[m.id] ?? null,
    }))
    .filter((r) => r.shops || r.pipeline || r.target);

  return (
    <OpsPage
      back={<BackButton href="/admin/vendors" label={tx("বিক্রেতা", "Sellers")} />}
      title={tx("সম্ভাব্য বিক্রেতা", "Seller leads")}
      guide={tx("নতুন দোকানের তথ্য নিচের ফর্মে যোগ করুন। প্রতিটা কার্ডে কথা হলে পরের ধাপে সরান। যুক্ত হলে বিক্রেতা হোন ফ্লো খুলে দোকান খুলে দিন। লক্ষ্য: প্রথমে ধোলাইখালে ৫০টা দোকান।", "Add new shops with the form. Move each card to the next stage as you talk. When they join, open the seller sign-up flow. Goal: 50 shops in Dholaikhal first.")}
      actions={<ButtonLink href="/seller/join" variant="brand"><Plus className="size-5" /> {tx("নতুন বিক্রেতা ফ্লো", "New seller flow")}</ButtonLink>}
    >
      <Panel title={tx("বাজার অনুযায়ী অগ্রগতি", "Progress by market")} className="mb-4">
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {marketRows.map(({ m, shops, pipeline, target }) => (
            <li key={m.id} className="rounded-xl bg-surface p-3">
              <p className="flex justify-between font-semibold">
                <span>{L(m)}</span>
                <span className="tabular-nums">{d(shops)}{target ? ` / ${d(target)}` : ""}</span>
              </p>
              {target && (
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-card">
                  <div className="h-full bg-ok" style={{ width: `${Math.min(100, (shops / target) * 100)}%` }} />
                </div>
              )}
              <p className="mt-1 text-xs text-muted">
                {target && tx(`${L(m)}ে ${d(target)} দোকানের লক্ষ্য · `, `Goal ${target} shops · `)}
                {tx(`পাইপলাইনে ${d(pipeline)}টা`, `${pipeline} in pipeline`)}
              </p>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:overflow-x-auto lg:pb-3">
        {STAGES.map((st) => {
          const list = leads.filter((l) => l.status === st.key);
          return (
            <KanbanColumn key={st.key} title={L(st)} count={list.length} tone={st.tone}>
              {list.map((l) => {
                const idx = STAGES.findIndex((x) => x.key === l.status);
                return (
                  <div key={l.id} className="rounded-xl border border-line bg-card p-3 text-sm shadow-sm">
                    <p className="font-bold">{l.shop_name}</p>
                    <p className="text-xs text-muted">{L(getMarket(l.market_area))} · {l.specialty}</p>
                    <p className="text-xs text-muted">👤 {l.owner_agent ? staffName(l.owner_agent) : tx("কেউ না", "Unassigned")}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <a href={`tel:${l.phone}`} className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-ok px-2.5 text-xs font-semibold text-white">
                        <Phone className="size-3.5" /> {d(displayPhone(l.phone))}
                      </a>
                      {idx < 3 && (
                        <Button size="sm" variant="outline" onClick={() => setLeadStatus(l.id, STAGES[idx + 1].key)}>
                          → {L(STAGES[idx + 1])}
                        </Button>
                      )}
                      {l.status !== "not_interested" && l.status !== "onboarded" && (
                        <Button size="sm" variant="ghost" onClick={() => setLeadStatus(l.id, "not_interested")}>
                          ✕
                        </Button>
                      )}
                      {l.status === "not_interested" && (
                        <Button size="sm" variant="ghost" onClick={() => setLeadStatus(l.id, "new")}>
                          ↺ {tx("আবার চেষ্টা", "Retry")}
                        </Button>
                      )}
                      {l.status === "visit_scheduled" && <ButtonLink href="/admin/field/app" size="sm" variant="ghost">📍 {tx("ভিজিট", "Visit")}</ButtonLink>}
                    </div>
                  </div>
                );
              })}
              {!list.length && <p className="px-2 py-4 text-center text-xs text-muted">{tx("খালি", "Empty")}</p>}
            </KanbanColumn>
          );
        })}
      </div>

      <Panel title={tx("নতুন সম্ভাব্য দোকান যোগ", "Add a lead")} className="max-w-2xl">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={tx("দোকানের নাম", "Shop name")}>
            <Input value={form.shop_name} onChange={(e) => setForm({ ...form, shop_name: e.target.value })} />
          </Field>
          <Field label={tx("ফোন", "Phone")} error={form.phone && !e164 ? tx("সঠিক নম্বর দিন", "Invalid number") : undefined}>
            <Input inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" />
          </Field>
          <Field label={tx("বাজার", "Market")}>
            <Select value={form.market_area} onChange={(e) => setForm({ ...form, market_area: e.target.value })}>
              {markets.map((m) => <option key={m.id} value={m.id}>{L(m)}</option>)}
            </Select>
          </Field>
          <Field label={tx("বিশেষত্ব", "Specialty")}>
            <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder={tx("যেমন: Honda পার্টস, হাফকাট", "e.g. Honda parts, half-cut")} />
          </Field>
          <Field label={tx("দায়িত্বপ্রাপ্ত মাঠকর্মী", "Field agent")}>
            <StaffSelect value={form.owner_agent} onChange={(owner_agent) => setForm({ ...form, owner_agent })} role="field_agent" className="w-full" />
          </Field>
        </div>
        <Button
          variant="brand"
          size="lg"
          full
          className="mt-4"
          disabled={!form.shop_name.trim() || !e164}
          onClick={() => {
            addLead({ ...form, shop_name: form.shop_name.trim(), phone: e164! });
            setForm({ ...form, shop_name: "", phone: "", specialty: "" });
            toast(tx("লিড যোগ হয়েছে", "Lead added"));
          }}
        >
          <Plus className="size-5" /> {tx("যোগ করুন", "Add lead")}
        </Button>
      </Panel>
    </OpsPage>
  );
}
