"use client";

import clsx from "clsx";
import { Bell, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getState, markNotificationsRead, useStore } from "@/lib/store";
import { useT } from "../providers/LangProvider";
import { Card, SectionTitle } from "../ui/primitives";

// Spec 7.17 in-site notifications. Marked read once the list is on screen;
// items that were unread keep their highlight for this visit.
export function NotificationList() {
  const { tx, dateTime, d } = useT();
  const notifications = useStore((s) => s.notifications);
  const ref = useRef<HTMLElement>(null);
  const [freshIds, setFreshIds] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.location.hash === "#notifications") el.scrollIntoView({ block: "start" });
    const markSeen = () => {
      const unread = getState().notifications.filter((n) => !n.read).map((n) => n.id);
      if (!unread.length) return;
      setFreshIds((cur) => new Set([...cur, ...unread]));
      markNotificationsRead();
    };
    if (typeof IntersectionObserver === "undefined") {
      markSeen();
      return;
    }
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && markSeen(), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [notifications.length]);

  return (
    <section id="notifications" ref={ref} className="scroll-mt-20">
      <SectionTitle>
        <span className="inline-flex items-center gap-2">
          <Bell className="size-5" aria-hidden /> {tx("নোটিফিকেশন", "Notifications")}
          {freshIds.size > 0 && (
            <span className="rounded-full bg-danger px-2 text-xs font-bold leading-5 text-white">
              {d(freshIds.size)} {tx("নতুন", "new")}
            </span>
          )}
        </span>
      </SectionTitle>
      {notifications.length === 0 ? (
        <Card className="p-4 text-center text-muted">{tx("এখনো কোনো নোটিফিকেশন নেই।", "No notifications yet.")}</Card>
      ) : (
        <Card className="divide-y divide-line overflow-hidden">
          {notifications.map((n) => {
            const fresh = freshIds.has(n.id) || !n.read;
            return (
              <Link
                key={n.id}
                href={n.link}
                className={clsx("flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-surface", fresh && "bg-accent-soft/50")}
              >
                <span className={clsx("size-2.5 shrink-0 rounded-full", fresh ? "bg-danger" : "bg-transparent")} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{n.title}</span>
                  <span className="block text-sm text-ink-2">{n.body}</span>
                  <span className="block text-xs text-muted">{dateTime(n.created_at)}</span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
              </Link>
            );
          })}
        </Card>
      )}
    </section>
  );
}
