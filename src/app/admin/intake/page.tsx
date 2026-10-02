"use client";

import clsx from "clsx";
import { useState } from "react";
import { IntakeDetail } from "@/components/admin/ops/IntakeDetail";
import { FilterChips, OpsPage } from "@/components/admin/ops/ui";
import { useT } from "@/components/providers/LangProvider";
import { EmptyState, StatusPill } from "@/components/ui/primitives";
import { useDb } from "@/lib/db/store";
import { displayPhone } from "@/lib/format";

export default function IntakePage() {
  const { tx, d, ago } = useT();
  const items = useDb((s) => s.intake);
  const [status, setStatus] = useState<"new" | "handled">("new");
  const [selected, setSelected] = useState<string | null>(null);
  const queue = items.filter((i) => i.status === status).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const current = queue.find((i) => i.id === selected) ?? queue[0] ?? null;

  return (
    <OpsPage
      title={tx("WhatsApp ইনটেক", "WhatsApp intake")}
      guide={tx("WhatsApp-এ আসা ছবি, ভয়েস আর লেখা এখানে আসে। একটা বাছুন, তারপর ঠিক করুন এটা বিক্রেতার পণ্য, কাস্টমারের রিকোয়েস্ট, নাকি সাপোর্ট। সেই অনুযায়ী ফর্ম পূরণ করলে কাজ শেষ।", "Photos, voice and text from WhatsApp land here. Pick one and decide: seller listing, customer request or support. Fill the matching form to finish.")}
    >
      <FilterChips<"new" | "handled">
        value={status}
        onChange={setStatus}
        items={[
          { value: "new", label: tx("বাকি", "Pending"), count: items.filter((i) => i.status === "new").length },
          { value: "handled", label: tx("সম্পন্ন", "Handled"), count: items.filter((i) => i.status === "handled").length },
        ]}
      />
      {queue.length === 0 ? (
        <div className="mt-4"><EmptyState icon="📲" title={tx("কিছু বাকি নেই", "Nothing pending")} /></div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[20rem_1fr]">
          <ul className="space-y-2">
            {queue.map((i) => (
              <li key={i.id}>
                <button type="button" onClick={() => setSelected(i.id)} className={clsx("w-full rounded-xl border-2 bg-card p-3 text-left", current?.id === i.id ? "border-brand" : "border-line hover:border-ink/30")}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{d(displayPhone(i.from_phone))}</span>
                    <StatusPill tone={i.sender_kind === "vendor" ? "ok" : i.sender_kind === "customer" ? "info" : "wait"}>{i.sender_kind === "vendor" ? tx("বিক্রেতা", "Seller") : i.sender_kind === "customer" ? tx("কাস্টমার", "Customer") : tx("অজানা", "Unknown")}</StatusPill>
                  </div>
                  <p className="mt-1 truncate text-sm">{i.text ?? (i.has_voice ? "🎤" : "📷")}</p>
                  <p className="text-xs text-muted">📷 {d(i.media_count)} {i.has_voice && "· 🎤"} · {ago(i.created_at)}</p>
                </button>
              </li>
            ))}
          </ul>
          {current && <IntakeDetail key={current.id} item={current} />}
        </div>
      )}
    </OpsPage>
  );
}
