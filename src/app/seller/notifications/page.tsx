"use client";

import { useRouter } from "next/navigation";
import { useT } from "@/components/providers/LangProvider";
import { SellerGate, useVendorId } from "@/components/seller/Gate";
import { SellerPage } from "@/components/seller/SellerPage";
import { Button, EmptyState } from "@/components/ui/primitives";
import { markNotificationsRead } from "@/lib/db/actions";
import { markNotificationRead } from "@/lib/db/actions-seller";
import { useDb } from "@/lib/db/store";

function Notifications() {
  const { tx, ago } = useT();
  const router = useRouter();
  const vid = useVendorId();
  const list = useDb((s) => s.notifications.filter((n) => n.audience === "vendor" && n.target === vid).sort((a, b) => b.created_at.localeCompare(a.created_at)));
  const unread = list.filter((n) => !n.read).length;
  return (
    <SellerPage
      title={tx("🔔 নোটিফিকেশন", "🔔 Notifications")}
      back="/seller"
      guide={tx("নতুন অর্ডার, দাম চাওয়া, টাকা আসা সব এখানে। চাপ দিলে সেই জায়গায় যাবে।", "New orders, requests and payments show here. Tap one to open it.")}
      action={unread > 0 ? <Button variant="outline" size="sm" onClick={() => markNotificationsRead("vendor", vid)}>✓ {tx("সব পড়া", "Mark all read")}</Button> : undefined}
    >
      {list.length ? (
        <ul className="space-y-2">
          {list.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => {
                  markNotificationRead(n.id);
                  if (n.link) router.push(n.link);
                }}
                className={`flex w-full items-start gap-3 rounded-2xl border-2 p-3 text-left ${n.read ? "border-line bg-card" : "border-brand/40 bg-brand-soft/40"}`}
              >
                <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: n.read ? "transparent" : "var(--color-bad)" }} />
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{n.title}</span>
                  <span className="block text-sm text-ink-2">{n.body}</span>
                  <span className="block text-xs text-muted">{ago(n.created_at)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon="🔔" title={tx("কোনো নোটিফিকেশন নেই", "No notifications")} />
      )}
    </SellerPage>
  );
}

export default function Page() {
  return (
    <SellerGate>
      <Notifications />
    </SellerGate>
  );
}
