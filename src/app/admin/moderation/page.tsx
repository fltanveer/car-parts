"use client";

import clsx from "clsx";
import { Shuffle } from "lucide-react";
import { useState } from "react";
import { ModerationDetail } from "@/components/admin/ops/ModerationDetail";
import { FilterChips, OpsPage, Panel } from "@/components/admin/ops/ui";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, EmptyState, StatusPill } from "@/components/ui/primitives";
import { sampleRandomAudit } from "@/lib/db/actions-admin-ops-trust";
import { useDb } from "@/lib/db/store";
import { settings } from "@/lib/mock/settings";
import type { ModerationReason } from "@/lib/types";

// Spec 8.1: what to check for each reason.
const REASONS: Record<ModerationReason, { icon: string; bn: string; en: string; check_bn: string; check_en: string }> = {
  new_vendor: { icon: "🆕", bn: "নতুন বিক্রেতার পণ্য", en: "New seller's item", check_bn: "ছবি আসল কিনা, ক্যাটাগরি/উৎস/অবস্থা ঠিক কিনা", check_en: "Real photos? Category/source/condition right?" },
  restricted_category: { icon: "⛔", bn: "সীমিত ক্যাটাগরি", en: "Restricted category", check_bn: "ইঞ্জিন/তেল/CNG/এয়ারব্যাগের নিয়ম, ইঞ্জিন নম্বর", check_en: "Engine/oil/CNG/airbag rules, engine number" },
  duplicate_image: { icon: "🖼️", bn: "ডুপ্লিকেট ছবি", en: "Duplicate image", check_bn: "অন্য বিক্রেতার/ইন্টারনেটের ছবি কিনা", check_en: "Another seller's or internet photo?" },
  price_anomaly: { icon: "💲", bn: "অস্বাভাবিক দাম", en: "Price anomaly", check_bn: "বাজারদরের অনেক নিচে (প্রতারণা) বা উপরে (ভুল)", check_en: "Far below (fraud) or above (typo) market" },
  stolen_risk: { icon: "🚨", bn: "চুরির ঝুঁকি", en: "Stolen risk", check_bn: "একই দিনে অস্বাভাবিক সংখ্যায় মিরর/লাইট/লোগো", check_en: "Unusual number of mirrors/lights/logos in a day" },
  reported: { icon: "🚩", bn: "রিপোর্ট করা", en: "Reported", check_bn: "কাস্টমারের রিপোর্ট", check_en: "Customer report" },
  contact_sharing: { icon: "📵", bn: "নম্বর শেয়ার", en: "Contact sharing", check_bn: "চ্যাটে বারবার নম্বর দেওয়ার চেষ্টা", check_en: "Repeated number sharing in chat" },
  random_audit: { icon: "🎲", bn: "র‍্যান্ডম অডিট", en: "Random audit", check_bn: `যাচাইকৃত বিক্রেতার প্রকাশিত পণ্যের দৈনিক ${settings.random_audit_percent}% নমুনা`, check_en: `Daily ${settings.random_audit_percent}% sample of verified sellers' live items` },
};
const PRIO = { 1: { bn: "জরুরি", en: "Urgent", tone: "bad" }, 2: { bn: "মাঝারি", en: "Medium", tone: "wait" }, 3: { bn: "সাধারণ", en: "Low", tone: "info" } } as const;

export default function ModerationPage() {
  const { tx, L, d, ago } = useT();
  const items = useDb((s) => s.moderation);
  const listings = useDb((s) => s.listings);
  const vendors = useDb((s) => s.vendors);
  const [status, setStatus] = useState<"open" | "done">("open");
  const [reason, setReason] = useState<ModerationReason | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [legend, setLegend] = useState(false);

  const queue = items
    .filter((m) => (status === "open" ? m.status === "open" : m.status !== "open"))
    .filter((m) => reason === "all" || m.reason === reason)
    .sort((a, b) => a.priority - b.priority || a.created_at.localeCompare(b.created_at));
  const current = queue.find((m) => m.id === selected) ?? queue[0] ?? null;
  const label = (targetType: string, id: string) =>
    targetType === "listing" ? listings.find((l) => l.id === id)?.title_bn ?? id : targetType === "vendor" ? vendors.find((v) => v.id === id)?.shop_name_bn ?? id : `${targetType} ${id}`;

  return (
    <OpsPage
      title={tx("মডারেশন কিউ", "Moderation queue")}
      guide={tx("লাল (জরুরি) গুলো আগে দেখুন। ডানে পণ্যটা কাস্টমার যেমন দেখবে তেমন দেখাবে। তৈরি কারণ থেকে একটা বাছুন, তারপর অনুমোদন, সংশোধন চাই বা বাতিল চাপুন। বিক্রেতা কারণটা সহজ বাংলায় পাবে।", "Handle red (urgent) first. The right side shows the item as customers see it. Pick a ready reason, then Approve, Request changes or Reject. The seller gets the reason in plain Bangla.")}
      actions={
        <Button variant="outline" onClick={() => { const n = sampleRandomAudit(); toast(tx(`${d(n)}টা র‍্যান্ডম নমুনা যোগ হয়েছে`, `${n} random samples added`)); }}>
          <Shuffle className="size-4" /> {tx(`আজকের ${d(settings.random_audit_percent)}% র‍্যান্ডম অডিট`, `Today's ${settings.random_audit_percent}% random audit`)}
        </Button>
      }
    >
      <Panel title={tx("কোন কারণে কী দেখবেন", "What to check per reason")} action={<Button size="sm" variant="ghost" onClick={() => setLegend(!legend)}>{legend ? tx("লুকান", "Hide") : tx("দেখুন", "Show")}</Button>} className="mb-4" bodyClass={legend ? "p-0" : "hidden"}>
        <table className="w-full text-sm">
          <tbody>
            {(Object.keys(REASONS) as ModerationReason[]).map((k) => (
              <tr key={k} className="border-t border-line first:border-0">
                <td className="px-4 py-2 font-semibold">{REASONS[k].icon} {L(REASONS[k])}</td>
                <td className="px-4 py-2 text-ink-2">{tx(REASONS[k].check_bn, REASONS[k].check_en)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div className="mb-3 space-y-2">
        <FilterChips<"open" | "done"> value={status} onChange={setStatus} items={[{ value: "open", label: tx("খোলা", "Open"), count: items.filter((m) => m.status === "open").length }, { value: "done", label: tx("সিদ্ধান্ত হয়েছে", "Decided") }]} />
        <FilterChips<ModerationReason | "all">
          value={reason}
          onChange={setReason}
          items={[{ value: "all", label: tx("সব কারণ", "All reasons") }, ...(Object.keys(REASONS) as ModerationReason[]).map((k) => ({ value: k, label: `${REASONS[k].icon} ${L(REASONS[k])}`, count: items.filter((m) => m.reason === k && (status === "open" ? m.status === "open" : m.status !== "open")).length }))]}
        />
      </div>

      {queue.length === 0 ? (
        <EmptyState icon="🛡️" title={tx("কিউ খালি", "Queue is empty")} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
          <ul className="space-y-2">
            {queue.map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => setSelected(m.id)} className={clsx("w-full rounded-xl border-2 bg-card p-3 text-left", current?.id === m.id ? "border-brand" : "border-line hover:border-ink/30")}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{REASONS[m.reason].icon} {L(REASONS[m.reason])}</span>
                    <StatusPill tone={PRIO[m.priority].tone}>{L(PRIO[m.priority])}</StatusPill>
                  </div>
                  <p className="mt-1 truncate text-sm">{label(m.target_type, m.target_id)}</p>
                  <p className="text-xs text-muted">{m.target_type} · {ago(m.created_at)}</p>
                </button>
              </li>
            ))}
          </ul>
          {current && <ModerationDetail key={current.id} item={current} />}
        </div>
      )}
    </OpsPage>
  );
}
