"use client";

import clsx from "clsx";
import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { markNotificationsRead } from "@/lib/db/actions";
import { useDb } from "@/lib/db/store";
import { useT } from "../../providers/LangProvider";
import { Button, SectionTitle } from "../../ui/primitives";

/** Customer notifications (audience customer, target = phone) (file 01 §12). */
export function NotificationList({ phone }: { phone: string }) {
  const { tx, d, ago } = useT();
  const list = useDb((s) => s.notifications.filter((n) => n.audience === "customer" && n.target === phone));
  const [all, setAll] = useState(false);
  const unread = list.filter((n) => !n.read).length;
  const shown = all ? list : list.slice(0, 5);
  return (
    <section>
      <SectionTitle
        action={
          unread > 0 && (
            <Button variant="ghost" size="sm" onClick={() => markNotificationsRead("customer", phone)}>
              <CheckCheck className="size-4" aria-hidden /> {tx("সব পড়া হয়েছে", "Mark all read")}
            </Button>
          )
        }
      >
        <Bell className="mr-1 inline size-5" aria-hidden /> {tx("নোটিফিকেশন", "Notifications")} {unread > 0 && <span className="rounded-full bg-bad px-2 text-sm text-white">{d(unread)}</span>}
      </SectionTitle>
      {list.length === 0 ? (
        <p className="text-muted">{tx("কোনো নোটিফিকেশন নেই", "No notifications")}</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
          {shown.map((n) => (
            <li key={n.id}>
              <Link href={n.link} onClick={() => markNotificationsRead("customer", phone)} className={clsx("block p-4 hover:bg-surface", !n.read && "bg-brand-soft/30")}>
                <p className="flex items-center gap-2 font-semibold">
                  {!n.read && <span className="size-2 shrink-0 rounded-full bg-bad" aria-hidden />}
                  {n.title}
                </p>
                <p className="text-sm text-muted">{n.body}</p>
                <p className="text-xs text-muted">{ago(n.created_at)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {list.length > 5 && !all && (
        <Button variant="ghost" full onClick={() => setAll(true)} className="mt-2">
          {tx("সব দেখুন", "See all")}
        </Button>
      )}
    </section>
  );
}
