"use client";

import clsx from "clsx";
import { useState } from "react";
import { VerificationDetail } from "@/components/admin/ops/VerificationDetail";
import { nextLevel } from "@/components/admin/ops/vendorUtils";
import { OpsPage } from "@/components/admin/ops/ui";
import { useT } from "@/components/providers/LangProvider";
import { BackButton, ShopLogo } from "@/components/shared/Misc";
import { EmptyState } from "@/components/ui/primitives";
import { getMarket } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";

export default function VerificationQueuePage() {
  const { tx, d, L, ago } = useT();
  const queue = useDb((s) => s.vendors.filter((v) => v.status !== "closed" && nextLevel(v) && (v.status === "pending_verification" || v.status === "onboarding" || v.verifications.some((x) => x.status === "submitted"))));
  const [selected, setSelected] = useState<string | null>(null);
  const current = queue.find((v) => v.id === selected) ?? queue[0] ?? null;

  return (
    <OpsPage
      back={<BackButton href="/admin/vendors" label={tx("বিক্রেতা", "Sellers")} />}
      title={tx("যাচাইয়ের কিউ", "Verification queue")}
      guide={tx("বাম দিকের তালিকা থেকে দোকান বাছুন। NID দুই পাশ আর সেলফি পাশাপাশি দেখে নাম মিলছে কিনা টিক দিন। দরকার হলে যাচাই কল করে লগ করুন। শেষে অনুমোদন, আরও তথ্য চাই, বা বাতিল চাপুন।", "Pick a shop on the left. Compare both NID sides with the selfie and tick the name checks. Log a verification call if needed. Then approve, ask for more info, or reject.")}
    >
      {queue.length === 0 ? (
        <EmptyState icon="✅" title={tx("যাচাইয়ের কিছু বাকি নেই", "Nothing to verify")} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
          <div className="space-y-4">
            {([1, 2, 3] as const).map((lvl) => {
              const list = queue.filter((v) => nextLevel(v) === lvl);
              if (!list.length) return null;
              return (
                <section key={lvl}>
                  <h2 className="mb-2 text-sm font-bold text-ink-2">{tx(`স্তর ${d(lvl)} এর জন্য (${d(list.length)})`, `For level ${lvl} (${list.length})`)}</h2>
                  <ul className="space-y-2">
                    {list.map((v) => (
                      <li key={v.id}>
                        <button type="button" onClick={() => setSelected(v.id)} className={clsx("flex w-full items-center gap-2 rounded-xl border-2 bg-card p-2.5 text-left", current?.id === v.id ? "border-brand" : "border-line hover:border-ink/30")}>
                          <ShopLogo name={v.shop_name_bn} color={v.logo_color} size="sm" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold">{v.shop_name_bn}</span>
                            <span className="block text-xs text-muted">{L(getMarket(v.market_area))} · {ago(v.joined_at)}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
          {current && <VerificationDetail key={current.id} vendorId={current.id} />}
        </div>
      )}
    </OpsPage>
  );
}
