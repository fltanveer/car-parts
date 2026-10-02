"use client";

import { CheckCircle2, MapPin, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { MediaImage } from "@/components/ui/MediaImage";
import { Button, Field, Notice, StatusPill, Textarea } from "@/components/ui/primitives";
import { audit } from "@/lib/db/actions";
import { approveVerification, LEVEL_DOCS, rejectVerification, requestMoreInfo } from "@/lib/db/actions-admin-ops";
import { getMarket } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import { displayPhone } from "@/lib/format";
import { verificationPerks } from "@/lib/rules";
import type { VerificationDoc } from "@/lib/types";
import { CallLogForm } from "./CallLogForm";
import { FilterChips, Panel } from "./ui";
import { nextLevel } from "./vendorUtils";

const DOC_LABEL: Record<VerificationDoc, { bn: string; en: string }> = {
  nid_front: { bn: "NID সামনে", en: "NID front" },
  nid_back: { bn: "NID পেছনে", en: "NID back" },
  selfie: { bn: "সেলফি", en: "Selfie" },
  trade_license: { bn: "ট্রেড লাইসেন্স", en: "Trade licence" },
  shop_photo: { bn: "দোকানের ছবি", en: "Shop photo" },
  visit_report: { bn: "পরিদর্শন রিপোর্ট", en: "Visit report" },
};
const MORE_INFO_REASONS = [
  { bn: "NID-এর ছবি ঝাপসা, আবার তুলুন", en: "NID photo blurry, retake" },
  { bn: "সেলফিতে মুখ পরিষ্কার নয়", en: "Face not clear in selfie" },
  { bn: "NID-এর নাম আর পেআউট অ্যাকাউন্টের নাম মেলে না", en: "NID name doesn't match payout account" },
  { bn: "ট্রেড লাইসেন্সের মেয়াদ শেষ", en: "Trade licence expired" },
  { bn: "দোকানের সাইনবোর্ডসহ ছবি দিন", en: "Send a shop photo with the signboard" },
];

export function VerificationDetail({ vendorId }: { vendorId: string }) {
  const { tx, L, d, ago } = useT();
  const v = useDb((s) => s.vendors.find((x) => x.id === vendorId)!);
  const visits = useDb((s) => s.fieldVisits.filter((f) => f.vendor_id === vendorId && f.report));
  const calls = useDb((s) => s.callLogs.filter((c) => c.ref === v.shop_name_bn || c.ref === v.id || c.phone === v.owner_phone));
  const target = nextLevel(v) ?? 3;
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [mode, setMode] = useState<"approve" | "more" | "reject">("approve");
  const [reason, setReason] = useState("");
  const [docsAsk, setDocsAsk] = useState<VerificationDoc[]>([]);
  const [revealed, setRevealed] = useState(false);
  const docs = ([1, 2, 3] as const).filter((l) => l <= target).flatMap((l) => LEVEL_DOCS[l]);
  const payout = v.payout_methods.find((p) => p.is_default) ?? v.payout_methods[0];
  const needsVisit = target === 3 && visits.length === 0 && !v.verifications.some((x) => x.doc_type === "visit_report" && x.status === "submitted");
  const missing = docs.filter((dt) => LEVEL_DOCS[target].includes(dt) && (v.verifications.find((x) => x.doc_type === dt)?.status ?? "missing") === "missing");

  const check = (key: string, label: string, detail?: string) => (
    <label className="flex items-start gap-2 rounded-lg bg-surface p-2.5 text-sm">
      <input type="checkbox" className="mt-0.5 size-5" checked={!!checks[key]} onChange={(e) => setChecks({ ...checks, [key]: e.target.checked })} />
      <span>
        <span className="font-semibold">{label}</span>
        {detail && <span className="block text-xs text-muted">{detail}</span>}
      </span>
    </label>
  );

  return (
    <div className="space-y-4">
      <Panel title={<span>{v.shop_name_bn} <span className="text-sm font-normal text-muted">· {L(getMarket(v.market_area))}</span></span>} action={<Link href={`/admin/vendors/${v.id}`} className="text-sm font-semibold text-brand">{tx("৩৬০ ভিউ", "360 view")}</Link>}>
        <p className="text-sm">
          {tx("এখন স্তর", "Now level")} <b>{d(v.verification_level)}</b> → {tx("চাইছে", "requesting")} <b>{d(target)}</b> · {L(verificationPerks[target])}
        </p>
        <p className="text-sm text-muted">{v.owner_name} · {d(displayPhone(v.owner_phone))} · {tx("যোগ", "joined")} {ago(v.joined_at)}</p>
      </Panel>

      <Panel title={tx("কাগজপত্র (গোপনীয়)", "Documents (private)")} action={!revealed && <Button size="sm" variant="outline" onClick={() => { setRevealed(true); audit("যাচাইয়ের কাগজ দেখা", v.shop_name_bn); }}>{tx("🔒 দেখুন (অডিট হবে)", "🔒 View (audited)")}</Button>}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {docs.map((dt) => {
            const doc = v.verifications.find((x) => x.doc_type === dt);
            const st = doc?.status ?? "missing";
            return (
              <figure key={dt} className="space-y-1">
                <MediaImage src={revealed && doc?.file_url ? doc.file_url : null} alt={L(DOC_LABEL[dt])} className={`aspect-[4/3] w-full rounded-xl ${revealed ? "" : "blur-sm"}`} />
                <figcaption className="flex items-center justify-between gap-1 text-xs">
                  <span className="font-semibold">{L(DOC_LABEL[dt])}</span>
                  <StatusPill tone={st === "approved" ? "ok" : st === "submitted" ? "wait" : "bad"}>{st}</StatusPill>
                </figcaption>
                {doc?.notes && <p className="text-xs text-muted">{doc.notes}</p>}
              </figure>
            );
          })}
        </div>
        {missing.length > 0 && <Notice tone="wait" className="mt-3">{tx(`বাকি কাগজ: ${missing.map((x) => DOC_LABEL[x].bn).join(", ")}`, `Missing: ${missing.map((x) => DOC_LABEL[x].en).join(", ")}`)}</Notice>}
      </Panel>

      <Panel title={tx("মিলিয়ে দেখুন", "Checks")}>
        <div className="grid gap-2 md:grid-cols-2">
          {check("nid_name", tx("NID-এর নাম = মালিকের নাম", "NID name = owner name"), v.owner_name)}
          {check("selfie", tx("সেলফির মুখ NID ছবির সাথে মেলে", "Selfie matches NID photo"))}
          {check("payout", tx("পেআউট অ্যাকাউন্টের নাম মেলে", "Payout account name matches"), payout ? `${payout.method} · ${payout.account_name} · ••${payout.last4}` : tx("পেআউট অ্যাকাউন্ট নেই", "No payout account"))}
          {target >= 2 && check("licence", tx("ট্রেড লাইসেন্স: নাম, ঠিকানা, মেয়াদ ঠিক", "Trade licence: name, address, expiry OK"), v.address || undefined)}
          {target >= 2 && check("call", tx("যাচাই ফোন কল হয়েছে", "Verification call done"), calls.length ? tx(`${d(calls.length)}টা কল লগ আছে`, `${calls.length} call logs`) : tx("এখনো কল লগ নেই", "No call logged yet"))}
        </div>
        {target >= 2 && (
          <a href={`https://maps.google.com/?q=${v.lat},${v.lng}`} target="_blank" rel="noreferrer" className="mt-3 flex min-h-24 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-surface text-sm font-semibold text-brand">
            <MapPin className="size-5" /> {tx("ম্যাপে দোকানের লোকেশন দেখুন", "Open shop location on map")} ({d(v.lat.toFixed(3))}, {d(v.lng.toFixed(3))})
          </a>
        )}
      </Panel>

      {target >= 2 && (
        <Panel title={tx("যাচাই কল লগ", "Verification call log")}>
          <CallLogForm phone={v.owner_phone} refNo={v.shop_name_bn} purpose="যাচাই কল" />
        </Panel>
      )}

      {target === 3 && (
        <Panel title={tx("মাঠকর্মীর পরিদর্শন রিপোর্ট", "Field visit report")}>
          {visits.length ? (
            <ul className="space-y-2 text-sm">{visits.map((f) => <li key={f.id} className="rounded-lg bg-surface p-2">📝 {f.report} <span className="text-xs text-muted">· {ago(f.at)}</span></li>)}</ul>
          ) : (
            <Notice tone="bad">
              {tx("স্তর ৩ এর জন্য পরিদর্শন রিপোর্ট লাগবে।", "Level 3 needs a visit report.")} <Link href="/admin/field/app" className="font-semibold underline">{tx("মাঠকর্মী ভিউ খুলুন", "Open field app")}</Link>
            </Notice>
          )}
        </Panel>
      )}

      <Panel title={tx("সিদ্ধান্ত", "Decision")}>
        <FilterChips<"approve" | "more" | "reject">
          value={mode}
          onChange={setMode}
          items={[
            { value: "approve", label: tx("✅ অনুমোদন", "✅ Approve") },
            { value: "more", label: tx("🟡 আরও তথ্য চাই", "🟡 Need more info") },
            { value: "reject", label: tx("❌ বাতিল", "❌ Reject") },
          ]}
        />
        <div className="mt-3 space-y-3">
          {mode === "approve" && (
            <>
              {needsVisit && <Notice tone="bad">{tx("পরিদর্শন রিপোর্ট ছাড়া স্তর ৩ দেওয়া যাবে না।", "Level 3 can't be granted without a visit report.")}</Notice>}
              <Button
                variant="ok"
                size="lg"
                full
                disabled={needsVisit || !checks.nid_name}
                onClick={() => {
                  approveVerification(v.id, target);
                  toast(tx(`স্তর ${d(target)} অনুমোদিত`, `Level ${target} approved`));
                }}
              >
                <CheckCircle2 className="size-5" /> {tx(`স্তর ${d(target)} অনুমোদন করুন`, `Approve level ${target}`)}
              </Button>
              {!checks.nid_name && <p className="text-xs text-muted">{tx("অন্তত নাম মিলেছে টিক দিন।", "Tick at least the name check.")}</p>}
            </>
          )}
          {mode === "more" && (
            <>
              <div className="flex flex-wrap gap-2">
                {docs.map((dt) => (
                  <label key={dt} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm">
                    <input type="checkbox" checked={docsAsk.includes(dt)} onChange={(e) => setDocsAsk(e.target.checked ? [...docsAsk, dt] : docsAsk.filter((x) => x !== dt))} />
                    {L(DOC_LABEL[dt])}
                  </label>
                ))}
              </div>
              <FilterChips<string> value={reason} onChange={setReason} items={MORE_INFO_REASONS.map((r) => ({ value: r.bn, label: L(r) }))} />
              <Field label={tx("বিক্রেতাকে SMS (কারণ)", "SMS to seller (reason)")}>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
              </Field>
              <Button variant="primary" size="lg" full disabled={!reason.trim() || !docsAsk.length} onClick={() => { requestMoreInfo(v.id, docsAsk, reason.trim()); toast(tx("বিক্রেতাকে SMS পাঠানো হয়েছে", "SMS sent to seller")); }}>
                {tx("আরও তথ্য চেয়ে SMS পাঠান", "Send SMS asking for more")}
              </Button>
            </>
          )}
          {mode === "reject" && (
            <>
              <Field label={tx("বাতিলের কারণ (বিক্রেতা দেখবে)", "Reason (seller sees this)")}>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
              </Field>
              <Button variant="danger" size="lg" full disabled={reason.trim().length < 5} onClick={() => { rejectVerification(v.id, reason.trim()); toast(tx("যাচাই বাতিল", "Verification rejected"), "bad"); }}>
                <XCircle className="size-5" /> {tx("বাতিল করুন", "Reject")}
              </Button>
            </>
          )}
        </div>
      </Panel>
    </div>
  );
}
