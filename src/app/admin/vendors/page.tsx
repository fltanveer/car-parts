"use client";

import { ClipboardCheck, ListChecks, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DataTable, FilterChips, OpsPage, type Column } from "@/components/admin/ops/ui";
import { vendorMetrics } from "@/components/admin/ops/vendorUtils";
import { useT } from "@/components/providers/LangProvider";
import { ShopLogo, useNow } from "@/components/shared/Misc";
import { ButtonLink, Input, Select, StatusPill } from "@/components/ui/primitives";
import { getMarket, markets } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import { vendorStatusLabel, vendorTypeLabel } from "@/lib/labels";
import { settings } from "@/lib/mock/settings";
import type { Vendor, VendorStatus } from "@/lib/types";

type View = "all" | "verify" | "falling" | "nosales" | "claims";
type Row = Vendor & { m: ReturnType<typeof vendorMetrics> };

export default function VendorsPage() {
  const { tx, L, d, taka } = useT();
  const router = useRouter();
  const now = useNow();
  const db = useDb((s) => s);
  const [view, setView] = useState<View>("all");
  const [market, setMarket] = useState("");
  const [status, setStatus] = useState<VendorStatus | "">("");
  const [q, setQ] = useState("");

  const all: Row[] = useMemo(() => db.vendors.map((v) => ({ ...v, m: vendorMetrics(db, v, now) })), [db, now]);
  const views: Record<View, (r: Row) => boolean> = {
    all: () => true,
    verify: (r) => r.m.pendingVerification,
    falling: (r) => r.m.scoreFalling,
    nosales: (r) => r.status === "active" && r.m.sales30 === 0,
    claims: (r) => r.m.claimRate >= 2,
  };
  const t = q.trim().toLowerCase();
  const rows = all
    .filter(views[view])
    .filter((r) => !market || getMarket(r.market_area).id === market)
    .filter((r) => !status || r.status === status)
    .filter((r) => !t || r.shop_name.toLowerCase().includes(t) || r.shop_name_bn.includes(t) || r.owner_phone.includes(t) || r.owner_name.includes(t));
  const staff = db.staff;

  const columns: Column<Row>[] = [
    {
      key: "shop", header: tx("দোকান", "Shop"), sort: (r) => r.shop_name,
      cell: (r) => (
        <span className="flex items-center gap-2">
          <ShopLogo name={r.shop_name_bn} color={r.logo_color} size="sm" />
          <span>
            <span className="block font-semibold">{r.shop_name_bn}</span>
            <span className="block text-xs text-muted">{r.owner_name}</span>
          </span>
        </span>
      ),
    },
    { key: "market", header: tx("বাজার", "Market"), sort: (r) => r.market_area, cell: (r) => L(getMarket(r.market_area)) },
    { key: "types", header: tx("ধরন", "Types"), cell: (r) => r.vendor_types.map((x) => vendorTypeLabel[x].icon).join(" ") },
    { key: "level", header: tx("স্তর", "Level"), sort: (r) => r.verification_level, cell: (r) => d(r.verification_level) },
    { key: "score", header: tx("স্কোর", "Score"), sort: (r) => r.score, cell: (r) => <b className={r.score < settings.vendor_score_suspend ? "text-bad" : r.score < settings.vendor_score_warn ? "text-wait" : ""}>{d(r.score)}</b> },
    { key: "listings", header: tx("সক্রিয় লিস্টিং", "Active listings"), sort: (r) => r.m.activeListings, cell: (r) => d(r.m.activeListings) },
    { key: "sales", header: tx("৩০ দিনের বিক্রি", "30d sales"), sort: (r) => r.m.sales30Value, cell: (r) => <span>{d(r.m.sales30)} · <span className="text-muted">{taka(r.m.sales30Value)}</span></span> },
    { key: "resp", header: tx("রিকোয়েস্টে সাড়া", "Quote response"), sort: (r) => r.m.quoteResponse ?? -1, cell: (r) => (r.m.quoteResponse == null ? "—" : `${d(r.m.quoteResponse)}%`) },
    { key: "claim", header: tx("দাবির হার", "Claim rate"), sort: (r) => r.m.claimRate, cell: (r) => <span className={r.m.claimRate >= 2 ? "font-bold text-bad" : ""}>{d(r.m.claimRate)}%</span> },
    { key: "status", header: tx("অবস্থা", "Status"), sort: (r) => r.status, cell: (r) => <StatusPill tone={vendorStatusLabel[r.status].tone}>{L(vendorStatusLabel[r.status])}</StatusPill> },
    { key: "comm", header: tx("কমিশন", "Commission"), sort: (r) => r.commission_percent, cell: (r) => `${d(r.commission_percent)}% · ${r.subscription_tier}` },
    { key: "agent", header: tx("যোগদানকারী", "Onboarded by"), cell: (r) => staff.find((s) => s.id === r.onboarded_by)?.name ?? "—" },
  ];

  return (
    <OpsPage
      title={tx("বিক্রেতা", "Sellers")}
      subtitle={tx(`মোট ${d(db.vendors.length)} দোকান`, `${db.vendors.length} shops`)}
      guide={tx("উপরের সেভ করা ভিউ থেকে বাছুন, যেমন যাচাই বাকি বা স্কোর কমছে। কলামের নামে চাপলে সাজানো বদলাবে। সারিতে চাপলে দোকানের পুরো তথ্য খুলবে।", "Pick a saved view like Verification pending. Click a column name to sort. Click a row to open the shop's 360 view.")}
      actions={
        <>
          <ButtonLink href="/admin/vendors/verification" variant="outline" size="sm"><ClipboardCheck className="size-4" /> {tx("যাচাই কিউ", "Verification")}</ButtonLink>
          <ButtonLink href="/admin/vendors/leads" variant="outline" size="sm"><ListChecks className="size-4" /> {tx("সম্ভাব্য বিক্রেতা", "Leads")}</ButtonLink>
        </>
      }
    >
      <div className="mb-3 space-y-3">
        <FilterChips<View>
          value={view}
          onChange={setView}
          items={[
            { value: "all", label: tx("সব", "All"), count: all.length },
            { value: "verify", label: tx("⏳ যাচাই বাকি", "⏳ Verification pending"), count: all.filter(views.verify).length },
            { value: "falling", label: tx("📉 স্কোর কমছে", "📉 Score falling"), count: all.filter(views.falling).length },
            { value: "nosales", label: tx("💤 ৩০ দিন বিক্রি নেই", "💤 No sales 30 days"), count: all.filter(views.nosales).length },
            { value: "claims", label: tx("⚠️ উচ্চ দাবির হার", "⚠️ High claim rate"), count: all.filter(views.claims).length },
          ]}
        />
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tx("দোকান, মালিক, ফোন…", "Shop, owner, phone…")} className="min-h-10 pl-9" />
          </div>
          <div className="w-44"><Select value={market} onChange={(e) => setMarket(e.target.value)} className="min-h-10">
            <option value="">{tx("সব বাজার", "All markets")}</option>
            {markets.map((m) => <option key={m.id} value={m.id}>{L(m)}</option>)}
          </Select></div>
          <div className="w-44"><Select value={status} onChange={(e) => setStatus(e.target.value as VendorStatus | "")} className="min-h-10">
            <option value="">{tx("সব অবস্থা", "All statuses")}</option>
            {(Object.keys(vendorStatusLabel) as VendorStatus[]).map((s) => <option key={s} value={s}>{L(vendorStatusLabel[s])}</option>)}
          </Select></div>
        </div>
      </div>
      <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} onRowClick={(r) => router.push(`/admin/vendors/${r.id}`)} initialSort={{ key: "score", dir: "desc" }} />
      <p className="mt-2 text-xs text-muted">{tx("৩০ দিনের বিক্রি: ডেমোতে আজীবন বিক্রির মাসিক অংশ যোগ করা নমুনা সংখ্যা।", "30d sales: demo estimate folding in a monthly share of lifetime sales.")}</p>
    </OpsPage>
  );
}
