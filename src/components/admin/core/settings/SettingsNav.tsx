"use client";

import clsx from "clsx";
import { Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/components/providers/LangProvider";
import { Notice } from "@/components/ui/primitives";
import { staffRoleLabel } from "@/lib/labels";
import { useStaffAccess } from "../system/permissions";

const TABS = [
  { href: "/admin/settings", bn: "সাধারণ", en: "General", icon: "⚙️" },
  { href: "/admin/settings/commission", bn: "কমিশন", en: "Commission", icon: "％" },
  { href: "/admin/settings/policies", bn: "পলিসি", en: "Policies", icon: "📜" },
  { href: "/admin/settings/notifications", bn: "SMS টেমপ্লেট", en: "Templates", icon: "✉️" },
  { href: "/admin/settings/delivery", bn: "ডেলিভারি রেট", en: "Delivery", icon: "🚚" },
  { href: "/admin/settings/items", bn: "নিষিদ্ধ জিনিস", en: "Prohibited items", icon: "⛔" },
  { href: "/admin/settings/markets", bn: "বাজার", en: "Markets", icon: "🏪" },
  { href: "/admin/settings/audio", bn: "অডিও গাইড", en: "Audio guide", icon: "🔊" },
  { href: "/admin/settings/weights", bn: "স্কোরের ওজন", en: "Weights", icon: "⚖️" },
];

/** Tab links between all settings sub-pages. */
export function SettingsNav() {
  const path = usePathname();
  const { tx } = useT();
  return (
    <nav aria-label={tx("সেটিংস বিভাগ", "Settings sections")} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={path === t.href ? "page" : undefined}
          className={clsx(
            "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold",
            path === t.href ? "bg-ink text-white" : "bg-card text-ink-2 ring-1 ring-line hover:ring-ink/30",
          )}
        >
          <span aria-hidden>{t.icon}</span>
          {tx(t.bn, t.en)}
        </Link>
      ))}
    </nav>
  );
}

/** Super-admin gate for settings/commission/staff (file 03 §2). */
export function useSettingsAccess() {
  return useStaffAccess("settings");
}

export function ReadOnlyNotice({ show }: { show: boolean }) {
  const { tx, L } = useT();
  const { me } = useSettingsAccess();
  if (!show) return null;
  return (
    <Notice tone="wait" className="flex items-start gap-2">
      <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        {tx("শুধু দেখার অনুমতি। সেটিংস, কমিশন ও স্টাফ বদলাতে পারেন শুধু সুপার অ্যাডমিন।", "Read-only. Only a super admin can change settings, commission and staff.")}{" "}
        {me && (
          <span className="font-semibold">
            ({me.name}: {me.roles.map((r) => L(staffRoleLabel[r])).join(", ")})
          </span>
        )}
      </span>
    </Notice>
  );
}
