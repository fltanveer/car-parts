"use client";

import { Camera, MapPin, Store, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Dictate } from "@/components/admin/ops/Dictate";
import { FilterChips, OpsPage, Panel } from "@/components/admin/ops/ui";
import { PhotoUploader } from "@/components/media/PhotoUploader";
import { useT } from "@/components/providers/LangProvider";
import { BackButton, toast, useNow } from "@/components/shared/Misc";
import { Button, ButtonLink, Field, Notice, Select, Stepper, Textarea, Toggle } from "@/components/ui/primitives";
import { audit, switchVendor } from "@/lib/db/actions";
import { addFieldVisit } from "@/lib/db/actions-admin-ops";
import { getMarket } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import type { FieldVisit, MediaItem } from "@/lib/types";

type Purpose = FieldVisit["purpose"];
const PURPOSES: { value: Purpose; bn: string; en: string }[] = [
  { value: "onboarding", bn: "অনবোর্ডিং", en: "Onboarding" },
  { value: "verification", bn: "যাচাই (স্তর ৩)", en: "Verification (L3)" },
  { value: "assisted_upload", bn: "পণ্য তুলে দেওয়া", en: "Assisted upload" },
  { value: "training", bn: "প্রশিক্ষণ", en: "Training" },
  { value: "audit", bn: "অডিট", en: "Audit" },
];

/** Phone-first field agent view (file 03 7.5). */
export default function FieldAppPage() {
  const { tx, L, ago } = useT();
  const router = useRouter();
  const now = useNow();
  const db = useDb((s) => s);
  const agents = db.staff.filter((s) => s.roles.includes("field_agent"));
  const meIsAgent = agents.some((a) => a.id === db.session.staffId);
  const [agentId, setAgentId] = useState(meIsAgent ? db.session.staffId! : agents[0]?.id ?? "");
  const [target, setTarget] = useState("");
  const [purpose, setPurpose] = useState<Purpose>("onboarding");
  const [checks, setChecks] = useState({ exists: true, signboard: true, stock: true });
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [listings, setListings] = useState(0);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadFor, setUploadFor] = useState("");

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const todayVisits = db.fieldVisits.filter((f) => f.agent_id === agentId && new Date(f.at).getTime() >= start.getTime());
  const scheduled = db.leads.filter((l) => l.owner_agent === agentId && (l.status === "visit_scheduled" || l.status === "contacted"));
  const [kind, id] = target.split(":");
  const vendorId = kind === "v" ? id : null;
  const leadId = kind === "l" ? id : null;

  const checkIn = () => {
    if (!target) return toast(tx("আগে দোকান বাছুন", "Pick a shop first"), "bad");
    setBusy(true);
    const save = (where: string) => {
      addFieldVisit({ agent_id: agentId, vendor_id: vendorId, lead_id: leadId, purpose, listings_created: 0, report: `${tx("চেক-ইন", "Check-in")}: ${where}` });
      setBusy(false);
      toast(tx("চেক-ইন হয়েছে", "Checked in"));
    };
    if (!navigator.geolocation) return save(tx("লোকেশন পাওয়া যায়নি", "no location"));
    navigator.geolocation.getCurrentPosition(
      (p) => save(`${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`),
      () => save(tx("লোকেশন অনুমতি নেই", "location denied")),
      { timeout: 8000 },
    );
  };

  const submitReport = () => {
    const report = [
      `${tx("দোকান আছে", "Shop exists")}: ${checks.exists ? "✅" : "❌"}`,
      `${tx("সাইনবোর্ড", "Signboard")}: ${checks.signboard ? "✅" : "❌"}`,
      `${tx("স্টক দেখা গেছে", "Stock seen")}: ${checks.stock ? "✅" : "❌"}`,
      `${tx("ছবি", "Photos")}: ${photos.length}`,
      notes.trim(),
    ].filter(Boolean).join(" · ");
    addFieldVisit({ agent_id: agentId, vendor_id: vendorId, lead_id: leadId, purpose, listings_created: listings, report });
    setPhotos([]);
    setNotes("");
    setListings(0);
    toast(tx("রিপোর্ট জমা হয়েছে", "Report submitted"));
  };

  const targetSelect = (value: string, onChange: (v: string) => void, vendorsOnly = false) => (
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{tx("দোকান বাছুন", "Choose shop")}</option>
      <optgroup label={tx("বিক্রেতা", "Sellers")}>
        {db.vendors.filter((v) => v.status !== "closed").map((v) => <option key={v.id} value={`v:${v.id}`}>{v.shop_name_bn} · {L(getMarket(v.market_area))}</option>)}
      </optgroup>
      {!vendorsOnly && (
        <optgroup label={tx("সম্ভাব্য", "Leads")}>
          {db.leads.filter((l) => l.status !== "onboarded").map((l) => <option key={l.id} value={`l:${l.id}`}>{l.shop_name} · {L(getMarket(l.market_area))}</option>)}
        </optgroup>
      )}
    </Select>
  );

  return (
    <OpsPage
      narrow
      back={<BackButton href="/admin/field" label={tx("মাঠকর্মী", "Field agents")} />}
      title={tx("মাঠকর্মী অ্যাপ", "Field app")}
      guide={tx("দোকানে পৌঁছে দোকান বাছুন আর চেক-ইন চাপুন। নতুন দোকান হলে নতুন বিক্রেতা বাটন। দোকানের হয়ে পণ্য তুলতে পণ্য আপলোড। শেষে পরিদর্শন রিপোর্ট পূরণ করে জমা দিন।", "At the shop, choose it and press Check in. New shop: New seller. Upload for the shop: Assisted upload. Finally fill and submit the inspection report.")}
    >
      <div className="space-y-4">
        {!meIsAgent && (
          <Field label={tx("কোন মাঠকর্মী হিসেবে", "Acting as agent")}>
            <Select value={agentId} onChange={(e) => setAgentId(e.target.value)}>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </Field>
        )}

        <Panel title={tx("আজকের কাজ", "Today")}>
          <ul className="space-y-2 text-sm">
            {scheduled.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2 rounded-xl bg-wait-soft p-3">
                <span>📅 <b>{l.shop_name}</b> · {L(getMarket(l.market_area))}</span>
                <Button size="sm" variant="outline" onClick={() => setTarget(`l:${l.id}`)}>{tx("বাছুন", "Pick")}</Button>
              </li>
            ))}
            {todayVisits.map((f) => (
              <li key={f.id} className="rounded-xl bg-ok-soft p-3">✅ {db.vendors.find((v) => v.id === f.vendor_id)?.shop_name_bn ?? db.leads.find((l) => l.id === f.lead_id)?.shop_name ?? "—"} · {f.report} <span className="text-xs text-muted">· {ago(f.at)}</span></li>
            ))}
            {!scheduled.length && !todayVisits.length && <li className="text-muted">{tx("আজ কোনো ভিজিট ঠিক নেই", "No visits planned today")}</li>}
          </ul>
        </Panel>

        <Panel title={tx("চেক-ইন", "Check in")}>
          <div className="space-y-3">
            {targetSelect(target, setTarget)}
            <FilterChips<Purpose> value={purpose} onChange={setPurpose} items={PURPOSES.map((p) => ({ value: p.value, label: L(p) }))} />
            <Button variant="ok" size="lg" full onClick={checkIn} disabled={busy}>
              <MapPin className="size-5" /> {busy ? tx("লোকেশন নিচ্ছে…", "Getting location…") : tx("এখানে চেক-ইন", "Check in here")}
            </Button>
          </div>
        </Panel>

        <div className="grid grid-cols-2 gap-3">
          <ButtonLink href="/seller/join" variant="outline" size="lg" className="flex-col py-3">
            <UserPlus className="size-6" /> {tx("নতুন বিক্রেতা", "New seller")}
          </ButtonLink>
          <div className="space-y-2">
            {targetSelect(uploadFor, setUploadFor, true)}
            <Button
              variant="outline"
              full
              disabled={!uploadFor}
              onClick={() => {
                const vid = uploadFor.slice(2);
                audit("বিক্রেতার পক্ষে পণ্য আপলোড (মাঠকর্মী)", db.vendors.find((v) => v.id === vid)?.shop_name_bn ?? vid);
                switchVendor(vid);
                router.push("/seller/add");
              }}
            >
              <Store className="size-4" /> {tx("পণ্য আপলোড", "Assisted upload")}
            </Button>
          </div>
        </div>
        <Notice>{tx("বিক্রেতার পক্ষে তোলা পণ্য বিক্রেতা অনুমোদন দিলে তবেই প্রকাশ হবে।", "Listings uploaded for a seller go live only after the seller approves.")}</Notice>

        <Panel title={tx("পরিদর্শন রিপোর্ট", "Inspection report")}>
          <div className="space-y-3">
            {targetSelect(target, setTarget)}
            <Toggle checked={checks.exists} onChange={(exists) => setChecks({ ...checks, exists })} label={tx("🏪 দোকান সত্যিই আছে?", "🏪 Shop exists?")} size="lg" />
            <Toggle checked={checks.signboard} onChange={(signboard) => setChecks({ ...checks, signboard })} label={tx("🪧 সাইনবোর্ড আছে?", "🪧 Signboard?")} size="lg" />
            <Toggle checked={checks.stock} onChange={(stock) => setChecks({ ...checks, stock })} label={tx("📦 স্টক দেখা গেছে?", "📦 Stock seen?")} size="lg" />
            <p className="flex items-center gap-1.5 font-semibold"><Camera className="size-4" /> {tx("ছবি", "Photos")}</p>
            <PhotoUploader value={photos} onChange={setPhotos} />
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold">{tx("আজ কয়টা লিস্টিং তৈরি", "Listings created")}</span>
              <Stepper value={listings} onChange={setListings} />
            </div>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={tx("অন্য কিছু (ঐচ্ছিক)", "Anything else (optional)")} />
            <Dictate onText={(t) => setNotes((s) => (s ? `${s} ${t}` : t))} />
            <Button variant="brand" size="xl" full disabled={!target || !agentId} onClick={submitReport}>
              {tx("রিপোর্ট জমা দিন", "Submit report")}
            </Button>
          </div>
        </Panel>
      </div>
    </OpsPage>
  );
}
