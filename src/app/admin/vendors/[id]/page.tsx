"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { OpsPage } from "@/components/admin/ops/ui";
import { VendorActions } from "@/components/admin/ops/vendor/VendorActions";
import { ListingsTab, OrdersTab, ProfileTab, QuotesTab, ReviewsTab, ScoreTab } from "@/components/admin/ops/vendor/VendorTabsA";
import { CallsVisitsTab, ClaimsTab, MessagesTab, MoneyTab, NotesTab, ReportsTab } from "@/components/admin/ops/vendor/VendorTabsB";
import { vendorMetrics } from "@/components/admin/ops/vendorUtils";
import { useT } from "@/components/providers/LangProvider";
import { VerifiedBadge } from "@/components/shared/Badges";
import { BackButton, ShopLogo, useNow } from "@/components/shared/Misc";
import { ButtonLink, EmptyState, StatusPill, Tabs } from "@/components/ui/primitives";
import { getMarket } from "@/lib/db/queries";
import { useDb, useHydrated } from "@/lib/db/store";
import { vendorStatusLabel } from "@/lib/labels";

type Tab = "profile" | "score" | "listings" | "orders" | "quotes" | "claims" | "reviews" | "reports" | "money" | "messages" | "calls" | "notes";

export default function Vendor360Page() {
  const { id } = useParams<{ id: string }>();
  const { tx, L, d, taka } = useT();
  const hydrated = useHydrated();
  const now = useNow();
  const db = useDb((s) => s);
  const v = db.vendors.find((x) => x.id === id) ?? null;
  const [tab, setTab] = useState<Tab>("profile");
  if (!hydrated) return null;
  if (!v) return <EmptyState icon="🏪" title={tx("বিক্রেতা পাওয়া যায়নি", "Seller not found")} action={<ButtonLink href="/admin/vendors">{tx("তালিকায় ফিরুন", "Back to list")}</ButtonLink>} />;
  const m = vendorMetrics(db, v, now);

  const tabs: { value: Tab; label: string; count?: number }[] = [
    { value: "profile", label: tx("প্রোফাইল ও কাগজ", "Profile & docs") },
    { value: "score", label: tx("স্কোর", "Score") },
    { value: "listings", label: tx("লিস্টিং", "Listings") },
    { value: "orders", label: tx("অর্ডার", "Orders") },
    { value: "quotes", label: tx("দাম ও জেতার হার", "Quotes & wins") },
    { value: "claims", label: tx("দাবি", "Claims"), count: m.claims },
    { value: "reviews", label: tx("রিভিউ", "Reviews") },
    { value: "reports", label: tx("রিপোর্ট", "Reports") },
    { value: "money", label: tx("লেজার ও পেআউট", "Ledger & payouts") },
    { value: "messages", label: tx("মেসেজ", "Messages"), count: v.contact_attempts },
    { value: "calls", label: tx("কল ও ভিজিট", "Calls & visits") },
    { value: "notes", label: tx("নোট", "Notes") },
  ];

  return (
    <OpsPage
      back={<BackButton href="/admin/vendors" label={tx("বিক্রেতা", "Sellers")} />}
      title={
        <span className="flex flex-wrap items-center gap-3">
          <ShopLogo name={v.shop_name_bn} color={v.logo_color} />
          {v.shop_name_bn}
          <StatusPill tone={vendorStatusLabel[v.status].tone}>{L(vendorStatusLabel[v.status])}</StatusPill>
          <VerifiedBadge vendor={v} />
        </span>
      }
      subtitle={`${L(getMarket(v.market_area))} · ${tx("স্তর", "Level")} ${d(v.verification_level)} · ${tx("স্কোর", "Score")} ${d(v.score)} · ${tx("৩০ দিনে", "30d")} ${taka(m.sales30Value)} · ${tx("কমিশন", "Commission")} ${d(v.commission_percent)}%`}
      guide={tx("উপরের ট্যাবে দোকানের সব তথ্য: কাগজ, স্কোর, পণ্য, অর্ডার, টাকা, মেসেজ। ডান দিকের বাক্সে কমিশন, ব্যাজ, সতর্কতা, জরিমানা, স্থগিত করার বাটন। সব কাজ অডিট লগে থাকে।", "Tabs show everything about the shop. The right box has commission, badges, warnings, penalties and suspension. All actions are audited.")}
    >
      <div className="grid gap-4 xl:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-4">
          <div className="px-4"><Tabs value={tab} onChange={setTab} items={tabs} /></div>
          {tab === "profile" && <ProfileTab v={v} />}
          {tab === "score" && <ScoreTab v={v} />}
          {tab === "listings" && <ListingsTab v={v} />}
          {tab === "orders" && <OrdersTab v={v} />}
          {tab === "quotes" && <QuotesTab v={v} winRate={m.winRate} quoted={m.quoted} />}
          {tab === "claims" && <ClaimsTab v={v} />}
          {tab === "reviews" && <ReviewsTab v={v} />}
          {tab === "reports" && <ReportsTab v={v} />}
          {tab === "money" && <MoneyTab v={v} now={now} />}
          {tab === "messages" && <MessagesTab v={v} />}
          {tab === "calls" && <CallsVisitsTab v={v} />}
          {tab === "notes" && <NotesTab target={`vendor:${v.id}`} />}
        </div>
        <VendorActions key={v.id} v={v} />
      </div>
    </OpsPage>
  );
}
