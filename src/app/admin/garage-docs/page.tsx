"use client";

import clsx from "clsx";
import { useState } from "react";
import { GarageTaskDetail } from "@/components/admin/ops/GarageTaskDetail";
import { FilterChips, OpsPage } from "@/components/admin/ops/ui";
import { useT } from "@/components/providers/LangProvider";
import { EmptyState } from "@/components/ui/primitives";
import { useDb } from "@/lib/db/store";
import { displayPhone } from "@/lib/format";

export default function GarageDocsPage() {
  const { tx, d, ago } = useT();
  const tasks = useDb((s) => s.garageTasks);
  const [status, setStatus] = useState<"open" | "done">("open");
  const [selected, setSelected] = useState<string | null>(null);
  const queue = tasks.filter((t) => t.status === status).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const current = queue.find((t) => t.id === selected) ?? queue[0] ?? null;

  return (
    <OpsPage
      title={tx("আমার গাড়ি: কাগজ যাচাই", "Garage docs queue")}
      guide={tx("কাস্টমার কাগজের ছবি দিয়ে গাড়ি সেট করতে বলেছেন। ছবি দেখে গাড়ির মডেল, সাল, ইঞ্জিন আর রেজিস্ট্রেশন নম্বর বসান, মেয়াদের তারিখ মিলিয়ে সেভ করুন। ছবি দেখা অডিট লগে যায়।", "Customers sent their papers to set up the car. Read the photo, set model, year, engine and registration, check expiry dates and save. Viewing is audited.")}
    >
      <FilterChips<"open" | "done">
        value={status}
        onChange={setStatus}
        items={[
          { value: "open", label: tx("বাকি", "Open"), count: tasks.filter((t) => t.status === "open").length },
          { value: "done", label: tx("সম্পন্ন", "Done"), count: tasks.filter((t) => t.status === "done").length },
        ]}
      />
      {queue.length === 0 ? (
        <div className="mt-4"><EmptyState icon="📄" title={tx("কিছু বাকি নেই", "Nothing pending")} /></div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[18rem_1fr]">
          <ul className="space-y-2">
            {queue.map((t) => (
              <li key={t.id}>
                <button type="button" onClick={() => setSelected(t.id)} className={clsx("w-full rounded-xl border-2 bg-card p-3 text-left", current?.id === t.id ? "border-brand" : "border-line hover:border-ink/30")}>
                  <p className="font-semibold">{t.kind === "setup_from_papers" ? tx("🚗 গাড়ি সেট", "🚗 Set car") : tx("📅 মেয়াদ যাচাই", "📅 Expiry check")}</p>
                  <p className="text-sm">{d(displayPhone(t.user_phone))}</p>
                  <p className="text-xs text-muted">{ago(t.created_at)}</p>
                </button>
              </li>
            ))}
          </ul>
          {current && <GarageTaskDetail key={current.id} task={current} />}
        </div>
      )}
    </OpsPage>
  );
}
