"use client";

import Link from "next/link";
import { describeVehicle, getCategory } from "@/lib/db/queries";
import { guestRequestsToday } from "@/lib/db/actions";
import { useDb } from "@/lib/db/store";
import { displayPhone, normalizePhone } from "@/lib/format";
import { conditionPrefLabel, neededByLabel, sourcePrefLabel } from "@/lib/labels";
import { locations, settings } from "@/lib/mock/settings";
import type { ConditionPreference, NeededBy, SourcePreference } from "@/lib/types";
import { useT } from "../../providers/LangProvider";
import { Card, ChoiceCard, Field, Input, Notice, Select } from "../../ui/primitives";
import type { Draft, SetDraft } from "./wizardDraft";

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-lg font-bold">{title}</legend>
      {children}
    </fieldset>
  );
}

/** Step 3: what quality — source, condition, and by when (file 01 §5.1). */
export function StepQuality({ draft, set }: { draft: Draft; set: SetDraft }) {
  const { tx, L } = useT();
  const src: { v: SourcePreference; icon: string; sbn: string; sen: string }[] = [
    { v: "genuine", icon: "🟢", sbn: "কোম্পানির আসল", sen: "Original from the car maker" },
    { v: "good_brand", icon: "🔵", sbn: "Denso, KYB, NGK এর মতো", sen: "Like Denso, KYB, NGK" },
    { v: "cheapest", icon: "💰", sbn: "যা সবচেয়ে কম দামে পাওয়া যায়", sen: "Lowest price available" },
    { v: "you_decide", icon: "🤝", sbn: "দোকান পরামর্শ দেবে", sen: "Shops will suggest" },
  ];
  const cond: { v: ConditionPreference; icon: string }[] = [
    { v: "new_only", icon: "🆕" },
    { v: "used_ok", icon: "♻️" },
    { v: "any", icon: "✳️" },
  ];
  const when: { v: NeededBy; icon: string }[] = [
    { v: "today", icon: "⚡" },
    { v: "2_3_days", icon: "📅" },
    { v: "no_rush", icon: "🐢" },
  ];
  return (
    <div className="space-y-6">
      <Group title={tx("কোন ধরনের পার্ট চান?", "What kind of part?")}>
        {src.map((o) => (
          <ChoiceCard key={o.v} selected={draft.source === o.v} onClick={() => set({ source: o.v })} icon={o.icon} title={L(sourcePrefLabel[o.v])} subtitle={tx(o.sbn, o.sen)} />
        ))}
      </Group>
      <Group title={tx("নতুন না পুরনো?", "New or used?")}>
        <div className="grid grid-cols-3 gap-2">
          {cond.map((o) => (
            <ChoiceCard key={o.v} selected={draft.condition === o.v} onClick={() => set({ condition: o.v })} title={`${o.icon} ${L(conditionPrefLabel[o.v])}`} className="justify-center text-center" />
          ))}
        </div>
      </Group>
      <Group title={tx("কবের মধ্যে লাগবে?", "Needed by when?")}>
        <div className="grid grid-cols-3 gap-2">
          {when.map((o) => (
            <ChoiceCard key={o.v} selected={draft.neededBy === o.v} onClick={() => set({ neededBy: o.v })} title={`${o.icon} ${L(neededByLabel[o.v])}`} className="justify-center text-center" />
          ))}
        </div>
      </Group>
    </div>
  );
}

export const contactError = (draft: Draft, loggedIn: boolean, lang: "bn" | "en") => {
  if (!draft.district || !draft.area) return lang === "bn" ? "জেলা ও এলাকা বাছাই করুন" : "Choose district and area";
  if (loggedIn) return null;
  const phone = normalizePhone(draft.phone);
  if (!phone) return lang === "bn" ? "সঠিক মোবাইল নম্বর দিন (০১...)" : "Enter a valid mobile number (01…)";
  if (guestRequestsToday(phone) >= settings.guest_requests_per_day)
    return lang === "bn" ? `এই নম্বর থেকে আজ ${settings.guest_requests_per_day}টার বেশি রিকোয়েস্ট দেওয়া যাবে না। লগইন করুন বা কল করুন।` : `Max ${settings.guest_requests_per_day} requests per day from this number. Log in or call us.`;
  return null;
};

/** Step 4: contact — only what's needed (rule 8). Sellers never see it. */
export function StepContact({ draft, set }: { draft: Draft; set: SetDraft }) {
  const { tx, d, lang } = useT();
  const phone = useDb((s) => s.session.customerPhone);
  const districts = locations.flatMap((l) => l.districts);
  const areas = districts.find((x) => x.name === draft.district)?.areas ?? [];
  const err = contactError(draft, !!phone, lang);
  return (
    <div className="space-y-4">
      {phone ? (
        <Card className="p-4">
          <p className="text-sm text-muted">{tx("দাম এলে এই নম্বরে জানাবো", "We'll notify this number")}</p>
          <p className="text-lg font-bold tabular-nums">{d(displayPhone(phone))}</p>
        </Card>
      ) : (
        <>
          <Field label={tx("📱 আপনার মোবাইল নম্বর", "📱 Your mobile number")} hint={tx("দাম এলে SMS যাবে। লগইন লাগবে না।", "We'll SMS you when prices come in. No login needed.")}>
            <Input type="tel" inputMode="numeric" autoComplete="tel" value={draft.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="01XXXXXXXXX" />
          </Field>
          <p className="text-sm text-muted">
            {tx("আগে লগইন করেছেন?", "Have an account?")}{" "}
            <Link href={`/login?next=${encodeURIComponent("/request")}`} className="font-semibold text-brand-ink underline">
              {tx("লগইন করুন", "Log in")}
            </Link>
          </p>
        </>
      )}
      <Field label={tx("🙂 নাম (ঐচ্ছিক)", "🙂 Name (optional)")}>
        <Input value={draft.name} onChange={(e) => set({ name: e.target.value })} autoComplete="name" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={tx("📍 জেলা", "📍 District")}>
          <Select value={draft.district} onChange={(e) => set({ district: e.target.value, area: "" })}>
            {districts.map((x) => (
              <option key={x.name} value={x.name}>
                {x.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={tx("এলাকা", "Area")}>
          <Select value={draft.area} onChange={(e) => set({ area: e.target.value })}>
            <option value="">{tx("বাছুন", "Choose")}</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Notice>🔒 {tx("দোকান আপনার নাম-নম্বর দেখবে না, শুধু জেলা ও এলাকা।", "Shops won't see your name or number, only district and area.")}</Notice>
      {err && (draft.phone || draft.area) && <Notice tone="bad">{err}</Notice>}
    </div>
  );
}

/** Step 5: check everything, with an edit link per step. */
export function StepReview({ draft, goto }: { draft: Draft; goto: (step: number) => void }) {
  const { tx, lang, L, d } = useT();
  const v = describeVehicle(draft.generationId, draft.engineId, lang);
  const cat = getCategory(draft.categoryId);
  const rows: { step: number; icon: string; label: string; value: string }[] = [
    {
      step: 0, icon: "🔧", label: tx("কী লাগবে", "What"),
      value: [draft.text.trim(), draft.voice.length ? tx(`🎤 ${d(draft.voice.length)}টা ভয়েস`, `🎤 ${draft.voice.length} voice`) : "", draft.photos.length ? tx(`📷 ${d(draft.photos.length)}টা ছবি`, `📷 ${draft.photos.length} photos`) : "", cat ? (lang === "bn" ? cat.name_bn : cat.name) : ""].filter(Boolean).join(" · "),
    },
    { step: 1, icon: "🚗", label: tx("গাড়ি", "Car"), value: v?.full ?? (draft.vehicleText || tx("জানা নেই", "Not set")) },
    {
      step: 2, icon: "🏷️", label: tx("মান", "Quality"),
      value: [draft.source && L(sourcePrefLabel[draft.source]), draft.condition && L(conditionPrefLabel[draft.condition]), draft.neededBy && L(neededByLabel[draft.neededBy])].filter(Boolean).join(" · "),
    },
    { step: 3, icon: "📍", label: tx("এলাকা", "Area"), value: `${draft.area}, ${draft.district}` },
  ];
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <button key={r.step} type="button" onClick={() => goto(r.step)} className="flex w-full items-start gap-3 rounded-2xl border border-line bg-card p-4 text-left hover:border-ink/30">
          <span className="text-2xl" aria-hidden>
            {r.icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm text-muted">{r.label}</span>
            <span className="block font-semibold">{r.value || "—"}</span>
          </span>
          <span className="text-sm font-semibold text-brand-ink">✏️ {tx("বদলান", "Edit")}</span>
        </button>
      ))}
      <Notice tone="ok">🛡️ {tx("দাম দেখে পছন্দ না হলে কিছুই কিনতে হবে না। রিকোয়েস্ট দেওয়া একদম ফ্রি।", "No obligation to buy. Sending a request is free.")}</Notice>
    </div>
  );
}
