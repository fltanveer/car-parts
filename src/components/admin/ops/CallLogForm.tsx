"use client";

import { PhoneCall } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, Field, Input, Textarea } from "@/components/ui/primitives";
import { logCall } from "@/lib/db/actions-admin-ops";
import { normalizePhone } from "@/lib/format";
import type { CallLog } from "@/lib/types";
import { Dictate } from "./Dictate";
import { FilterChips } from "./ui";

const PURPOSES = [
  { bn: "রিকোয়েস্ট পরিষ্কার", en: "Clarify request" },
  { bn: "অর্ডারের খবর", en: "Order status" },
  { bn: "পেমেন্ট", en: "Payment" },
  { bn: "দাবি/বিরোধ", en: "Claim/dispute" },
  { bn: "বিক্রেতা সাপোর্ট", en: "Seller support" },
  { bn: "যাচাই কল", en: "Verification call" },
  { bn: "অন্য", en: "Other" },
];

/** Quick call log (file 03 14.2): phone, channel, purpose, linked ref, summary, follow-up. */
export function CallLogForm({ phone: initialPhone = "", refNo = "", purpose: initialPurpose, onDone, submitLabel }: { phone?: string; refNo?: string; purpose?: string; onDone?: (id: string) => void; submitLabel?: string }) {
  const { tx, L } = useT();
  const [phone, setPhone] = useState(initialPhone.replace(/^\+88/, ""));
  const [channel, setChannel] = useState<CallLog["channel"]>("phone_out");
  const [purpose, setPurpose] = useState(initialPurpose ?? PURPOSES[0].bn);
  const [ref, setRef] = useState(refNo);
  const [summary, setSummary] = useState("");
  const [followUp, setFollowUp] = useState("");
  const e164 = normalizePhone(phone);

  const save = () => {
    if (!e164 || !summary.trim()) return;
    const id = logCall({ phone: e164, channel, purpose, ref: ref.trim() || null, summary: summary.trim(), followUp: followUp || null });
    toast(tx("কল লগ সেভ হয়েছে", "Call logged"));
    setSummary("");
    setFollowUp("");
    onDone?.(id);
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={tx("ফোন", "Phone")} error={phone && !e164 ? tx("সঠিক নম্বর দিন", "Enter a valid number") : undefined}>
          <Input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
        </Field>
        <Field label={tx("যুক্ত নম্বর (রিকোয়েস্ট/অর্ডার/দাবি/দোকান)", "Linked ref (request/order/claim/shop)")}>
          <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="R-10231 / GH-4821 / C-5012" />
        </Field>
      </div>
      <FilterChips<CallLog["channel"]>
        value={channel}
        onChange={setChannel}
        items={[
          { value: "phone_in", label: tx("📥 কল এসেছে", "📥 Incoming") },
          { value: "phone_out", label: tx("📤 কল করেছি", "📤 Outgoing") },
          { value: "whatsapp", label: "💬 WhatsApp" },
        ]}
      />
      <FilterChips<string> value={purpose} onChange={setPurpose} items={PURPOSES.map((p) => ({ value: p.bn, label: L(p) }))} />
      <Field label={tx("কী কথা হলো", "Summary")}>
        <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder={tx("সংক্ষেপে লিখুন বা বলুন", "Type or dictate")} />
      </Field>
      <div className="flex flex-wrap items-end gap-3">
        <Dictate onText={(t) => setSummary((s) => (s ? `${s} ${t}` : t))} />
        <Field label={tx("ফলো-আপ (ঐচ্ছিক)", "Follow-up (optional)")}>
          <Input type="datetime-local" value={followUp} onChange={(e) => setFollowUp(e.target.value)} className="min-h-10" />
        </Field>
      </div>
      <Button variant="brand" size="lg" full onClick={save} disabled={!e164 || !summary.trim()}>
        <PhoneCall className="size-5" /> {submitLabel ?? tx("কল লগ সেভ করুন", "Save call log")}
      </Button>
    </div>
  );
}
