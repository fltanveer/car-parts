"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "../../providers/LangProvider";

/** Small method tabs above every add screen (file 02 §5). */
export function AddTabs() {
  const { tx } = useT();
  const path = usePathname();
  const tabs = [
    { href: "/seller/add/camera", match: ["/seller/add", "/seller/add/camera"], label: tx("📷 ছবি তুলে", "📷 Photo") },
    { href: "/seller/add/catalog", match: ["/seller/add/catalog"], label: tx("📋 আমার কাছেও আছে", "📋 I have this too") },
    { href: "/seller/add/donor", match: ["/seller/add/donor"], label: tx("🚗 হাফকাট", "🚗 Half-cut") },
    { href: "/seller/add/bulk", match: ["/seller/add/bulk"], label: tx("📊 Excel", "📊 Excel") },
  ];
  return (
    <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" aria-label={tx("যোগ করার পদ্ধতি", "Ways to add")}>
      {tabs.map((t) => {
        const on = t.match.includes(path);
        return (
          <Link key={t.href} href={t.href} aria-current={on ? "page" : undefined} className={clsx("inline-flex min-h-11 shrink-0 items-center rounded-xl px-3.5 text-sm font-semibold", on ? "bg-seller text-white" : "bg-card text-ink-2 ring-1 ring-line")}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
