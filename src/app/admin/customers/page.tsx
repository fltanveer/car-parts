"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { customerPhones, customerSummary } from "@/components/admin/ops/customerUtils";
import { DataTable, FilterChips, OpsPage } from "@/components/admin/ops/ui";
import { useT } from "@/components/providers/LangProvider";
import { Input, StatusPill } from "@/components/ui/primitives";
import { useDb } from "@/lib/db/store";
import { displayPhone, toEnDigits } from "@/lib/format";

type View = "all" | "flagged" | "cod" | "claims";

export default function CustomersPage() {
  const { tx, d, taka, ago } = useT();
  const router = useRouter();
  const db = useDb((s) => s);
  const [q, setQ] = useState("");
  const [view, setView] = useState<View>("all");
  const rows = useMemo(() => customerPhones(db).map((p) => customerSummary(db, p)), [db]);
  const t = toEnDigits(q.trim().toLowerCase());
  const views: Record<View, (r: (typeof rows)[number]) => boolean> = {
    all: () => true,
    flagged: (r) => !!r.profile?.is_blocked || !!r.profile?.force_advance,
    cod: (r) => r.codRefusals > 0,
    claims: (r) => r.claims > 0,
  };
  const shown = rows.filter(views[view]).filter((r) => !t || r.phone.includes(t) || (r.name ?? "").toLowerCase().includes(t));

  return (
    <OpsPage
      title={tx("কাস্টমার", "Customers")}
      subtitle={tx(`মোট ${d(rows.length)} জন`, `${rows.length} customers`)}
      guide={tx("নাম বা ফোন দিয়ে কাস্টমার খুঁজুন। সারিতে চাপলে তার সব তথ্য খুলবে: গাড়ি, অর্ডার, রিকোয়েস্ট, দাবি, আর ব্লক বা অগ্রিম বাধ্যতামূলক করার সুইচ।", "Search by name or phone. Click a row for the full view: cars, orders, requests, claims, and the block / force-advance switches.")}
    >
      <div className="mb-3 space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tx("নাম বা ফোন…", "Name or phone…")} className="min-h-10 pl-9" />
        </div>
        <FilterChips<View>
          value={view}
          onChange={setView}
          items={[
            { value: "all", label: tx("সব", "All"), count: rows.length },
            { value: "flagged", label: tx("🚫 ব্লক/অগ্রিম বাধ্যতামূলক", "🚫 Blocked / force advance"), count: rows.filter(views.flagged).length },
            { value: "cod", label: tx("📦 COD ফেরত দিয়েছে", "📦 Refused COD"), count: rows.filter(views.cod).length },
            { value: "claims", label: tx("⚖️ দাবি আছে", "⚖️ Has claims"), count: rows.filter(views.claims).length },
          ]}
        />
      </div>
      <DataTable
        rows={shown}
        rowKey={(r) => r.phone}
        onRowClick={(r) => router.push(`/admin/customers/${encodeURIComponent(r.phone)}`)}
        initialSort={{ key: "last", dir: "desc" }}
        columns={[
          { key: "n", header: tx("নাম", "Name"), sort: (r) => r.name ?? "", cell: (r) => <span><b>{r.name ?? tx("নাম নেই", "No name")}</b><span className="block text-xs text-muted">{d(displayPhone(r.phone))}</span></span> },
          { key: "o", header: tx("অর্ডার", "Orders"), sort: (r) => r.orders, cell: (r) => d(r.orders) },
          { key: "s", header: tx("মোট কেনা", "Spent"), sort: (r) => r.spent, cell: (r) => taka(r.spent) },
          { key: "r", header: tx("রিকোয়েস্ট", "Requests"), sort: (r) => r.requests, cell: (r) => d(r.requests) },
          { key: "c", header: tx("দাবি", "Claims"), sort: (r) => r.claims, cell: (r) => d(r.claims) },
          { key: "car", header: tx("গাড়ি", "Cars"), sort: (r) => r.cars, cell: (r) => d(r.cars) },
          { key: "cod", header: tx("COD ফেরত", "COD refused"), sort: (r) => r.codRefusals, cell: (r) => <span className={r.codRefusals ? "font-bold text-bad" : ""}>{d(r.codRefusals)}</span> },
          {
            key: "f", header: tx("অবস্থা", "Flags"),
            cell: (r) => (
              <span className="flex flex-wrap gap-1">
                {r.profile?.is_blocked && <StatusPill tone="bad">{tx("ব্লক", "Blocked")}</StatusPill>}
                {r.profile?.force_advance && <StatusPill tone="wait">{tx("অগ্রিম", "Advance")}</StatusPill>}
                {!r.profile && <StatusPill>{tx("অতিথি", "Guest")}</StatusPill>}
              </span>
            ),
          },
          { key: "last", header: tx("শেষ কাজ", "Last activity"), sort: (r) => r.last ?? "", cell: (r) => (r.last ? ago(r.last) : "—") },
        ]}
      />
    </OpsPage>
  );
}
