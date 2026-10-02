"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AdminPage } from "@/components/admin/core";
import { CatalogReport } from "@/components/admin/core/reports/CatalogReport";
import { FieldReport } from "@/components/admin/core/reports/FieldReport";
import { FinanceReport } from "@/components/admin/core/reports/FinanceReport";
import { FunnelReport } from "@/components/admin/core/reports/FunnelReport";
import { GarageReport } from "@/components/admin/core/reports/GarageReport";
import { HealthReport } from "@/components/admin/core/reports/HealthReport";
import { LegalReport } from "@/components/admin/core/reports/LegalReport";
import { MarketReport } from "@/components/admin/core/reports/MarketReport";
import { NoQuoteReport } from "@/components/admin/core/reports/NoQuoteReport";
import { PriceReport } from "@/components/admin/core/reports/PriceReport";
import { SearchReport } from "@/components/admin/core/reports/SearchReport";
import { SellerReport } from "@/components/admin/core/reports/SellerReport";
import { TrustReport } from "@/components/admin/core/reports/TrustReport";
import { selectAll } from "@/components/admin/core/reports/util";
import { useT } from "@/components/providers/LangProvider";
import { useNow } from "@/components/shared/Misc";
import { Tabs } from "@/components/ui/primitives";
import { useDb } from "@/lib/db/store";

const TABS = [
  { value: "health", bn: "মার্কেটপ্লেস স্বাস্থ্য", en: "Marketplace health" },
  { value: "funnel", bn: "রিকোয়েস্ট ফানেল", en: "Request funnel" },
  { value: "noquote", bn: "দাম না আসা", en: "No-quote requests" },
  { value: "sellers", bn: "বিক্রেতা পারফরম্যান্স", en: "Seller performance" },
  { value: "markets", bn: "বাজার/এলাকা", en: "Markets / areas" },
  { value: "catalog", bn: "ক্যাটালগ মান", en: "Catalog quality" },
  { value: "search", bn: "সার্চ", en: "Search" },
  { value: "prices", bn: "বাজারদর", en: "Price benchmarks" },
  { value: "trust", bn: "বিশ্বাস", en: "Trust" },
  { value: "finance", bn: "ফাইন্যান্স", en: "Finance" },
  { value: "field", bn: "মাঠকর্মী", en: "Field agents" },
  { value: "garage", bn: "আমার গাড়ি", en: "My car" },
  { value: "legal", bn: "আইনি", en: "Legal" },
] as const;
type Tab = (typeof TABS)[number]["value"];

function Reports() {
  const { tx, L } = useT();
  const router = useRouter();
  const params = useSearchParams();
  const s = useDb(selectAll);
  const now = useNow();
  const q = params.get("tab");
  const tab: Tab = TABS.some((t) => t.value === q) ? (q as Tab) : "health";

  return (
    <>
      <Tabs value={tab} onChange={(v) => router.replace(`/admin/reports?tab=${v}`, { scroll: false })} items={TABS.map((t) => ({ value: t.value, label: L(t) }))} />
      <h2 className="text-xl font-bold">{tx(TABS.find((t) => t.value === tab)!.bn, TABS.find((t) => t.value === tab)!.en)}</h2>
      {tab === "health" && <HealthReport s={s} now={now} />}
      {tab === "funnel" && <FunnelReport s={s} />}
      {tab === "noquote" && <NoQuoteReport s={s} now={now} />}
      {tab === "sellers" && <SellerReport s={s} now={now} />}
      {tab === "markets" && <MarketReport s={s} />}
      {tab === "catalog" && <CatalogReport s={s} />}
      {tab === "search" && <SearchReport />}
      {tab === "prices" && <PriceReport s={s} />}
      {tab === "trust" && <TrustReport s={s} />}
      {tab === "finance" && <FinanceReport s={s} now={now} />}
      {tab === "field" && <FieldReport s={s} now={now} />}
      {tab === "garage" && <GarageReport s={s} now={now} />}
      {tab === "legal" && <LegalReport s={s} now={now} />}
    </>
  );
}

export default function ReportsPage() {
  const { tx } = useT();
  return (
    <AdminPage
      title={tx("রিপোর্ট", "Reports")}
      subtitle={tx("ব্যবসা, বিক্রেতা, টাকা ও আইনি মান্যতা", "Business, sellers, money and legal compliance")}
      guide={tx(
        "উপরের ট্যাব থেকে রিপোর্ট বাছুন। সবুজ মানে লক্ষ্য পূরণ, হলুদ মানে নজর দিন, লাল মানে সমস্যা। প্রতিটা টেবিলের পাশে 'CSV নামান' চাপলে Excel-এ খোলার ফাইল পাবেন। আইনি ট্যাবের রিপোর্ট কর্তৃপক্ষ চাইলে দেওয়ার জন্য।",
        "Pick a report from the tabs. Green means on target, yellow needs attention, red is a problem. Press Export CSV next to any table to get a file for Excel. The Legal tab is the report to hand authorities on request.",
      )}
    >
      <Suspense fallback={null}>
        <Reports />
      </Suspense>
    </AdminPage>
  );
}
