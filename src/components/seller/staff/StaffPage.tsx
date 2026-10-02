"use client";

import { useState } from "react";
import { inviteStaff, readActivity, removeStaff, setStaffPermission } from "@/lib/db/actions-seller";
import { displayPhone, normalizePhone } from "@/lib/format";
import type { Vendor, VendorStaff } from "@/lib/types";
import { useT } from "../../providers/LangProvider";
import { toast } from "../../shared/Misc";
import { Button, Card, EmptyState, Field, Input, Notice, SectionTitle, StatusPill, Toggle } from "../../ui/primitives";
import { ConfirmSheet } from "../Bits";
import { VoiceInput } from "../Dictate";
import { SellerPage } from "../SellerPage";

const PERMS: { key: VendorStaff["permissions"][number]; bn: string; en: string }[] = [
  { key: "listings", bn: "📦 পণ্য যোগ/সম্পাদনা", en: "📦 Add/edit products" },
  { key: "orders", bn: "🚚 অর্ডার", en: "🚚 Orders" },
  { key: "requests", bn: "🙋 দাম চাই", en: "🙋 Price requests" },
  { key: "chat", bn: "💬 মেসেজ", en: "💬 Messages" },
  { key: "finance", bn: "💰 টাকা দেখা", en: "💰 See money" },
];

export function StaffPage({ vendor }: { vendor: Vendor }) {
  const { tx, d, ago, lang } = useT();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [remove, setRemove] = useState<VendorStaff | null>(null);
  const [log, setLog] = useState(() => readActivity(vendor.id));
  const norm = normalizePhone(phone);
  const dup = !!norm && vendor.staff.some((s) => s.phone === norm);

  return (
    <SellerPage
      title={tx("👥 কর্মচারী", "👥 Staff")}
      guide={tx("কর্মচারীর ফোন নম্বর দিন, তার ফোনে SMS যাবে। কে কী করতে পারবে বড় সুইচ দিয়ে ঠিক করুন। টাকা দেখা সাধারণত বন্ধ রাখুন।", "Add a staff phone number; they get an SMS. Use the switches to choose what they can do. Keep money access off normally.")}
    >
      <Card className="space-y-3 p-4">
        <p className="font-bold">＋ {tx("নতুন কর্মচারী", "New staff member")}</p>
        <Field label={tx("নাম", "Name")}><VoiceInput value={name} onChange={setName} placeholder={tx("যেমন: রাকিব", "e.g. Rakib")} /></Field>
        <Field label={tx("ফোন নম্বর", "Phone")} error={phone && !norm ? tx("সঠিক নম্বর দিন", "Enter a valid number") : dup ? tx("এই নম্বর আগেই আছে", "Already added") : undefined}>
          <Input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
        </Field>
        <Button variant="brand" size="lg" full disabled={!name.trim() || !norm || dup} onClick={() => { inviteStaff(vendor.id, name.trim(), norm!); setName(""); setPhone(""); setLog(readActivity(vendor.id)); toast(tx("আমন্ত্রণ SMS পাঠানো হয়েছে", "Invite SMS sent")); }}>
          📩 {tx("আমন্ত্রণ পাঠান", "Send invite")}
        </Button>
      </Card>

      <section className="space-y-3">
        <SectionTitle>{tx("কর্মচারীরা", "Staff")} ({d(vendor.staff.length)})</SectionTitle>
        {vendor.staff.length ? vendor.staff.map((s) => (
          <Card key={s.id} className="space-y-2 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-lg font-bold">{s.name}</p>
                <p className="text-sm text-muted">{lang === "bn" ? d(displayPhone(s.phone)) : displayPhone(s.phone)} · {ago(s.invited_at)}</p>
              </div>
              <StatusPill tone={s.accepted ? "ok" : "wait"}>{s.accepted ? tx("যোগ দিয়েছে", "Joined") : tx("আমন্ত্রণ পাঠানো", "Invited")}</StatusPill>
            </div>
            {PERMS.map((p) => (
              <Toggle key={p.key} checked={s.permissions.includes(p.key)} onChange={(on) => setStaffPermission(vendor.id, s.id, p.key, on)} label={tx(p.bn, p.en)} />
            ))}
            {s.permissions.includes("finance") && <Notice tone="wait">{tx("এই কর্মচারী আপনার টাকার হিসাব দেখতে পারবে।", "This person can see your money.")}</Notice>}
            <Button variant="danger" size="sm" onClick={() => setRemove(s)}>🗑️ {tx("সরান", "Remove")}</Button>
          </Card>
        )) : <EmptyState icon="👥" title={tx("কোনো কর্মচারী নেই", "No staff yet")} />}
      </section>

      <section className="space-y-2">
        <SectionTitle>📝 {tx("কে কী করেছে", "Activity")}</SectionTitle>
        {log.length ? (
          <Card className="divide-y divide-line">
            {log.slice(0, 30).map((a, i) => (
              <p key={i} className="flex justify-between gap-3 p-3 text-sm">
                <span><b>{a.who}</b> · {a.what}</span>
                <span className="shrink-0 text-muted">{ago(a.at)}</span>
              </p>
            ))}
          </Card>
        ) : (
          <p className="text-muted">{tx("এখনো কিছু নেই", "Nothing yet")}</p>
        )}
      </section>

      <ConfirmSheet
        open={!!remove}
        onClose={() => setRemove(null)}
        title={tx("সরাবেন?", "Remove?")}
        body={remove?.name}
        confirmLabel={tx("🗑️ হ্যাঁ, সরান", "🗑️ Yes, remove")}
        tone="danger"
        onConfirm={() => { removeStaff(vendor.id, remove!.id); setRemove(null); setLog(readActivity(vendor.id)); }}
      />
    </SellerPage>
  );
}
