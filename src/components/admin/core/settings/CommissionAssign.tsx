"use client";

import Link from "next/link";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { toast, useNow } from "@/components/shared/Misc";
import { Button, Select, StatusPill } from "@/components/ui/primitives";
import { audit, updateVendor } from "@/lib/db/actions";
import { notifyVendor } from "@/lib/db/actions-admin-core";
import { useDb } from "@/lib/db/store";
import { vendorStatusLabel } from "@/lib/labels";
import type { Vendor } from "@/lib/types";
import { DataTable, type Column } from "../DataTable";
import { Panel } from "../Panel";
import { commissionOverlay, recordAssignment, type CommissionPlan } from "./overlay";
import { usePlans } from "./CommissionPlans";

const MONTH = 30 * 24 * 3_600_000;

const assign = (v: Vendor, plan: CommissionPlan) => {
  updateVendor(v.id, { commission_percent: plan.percent });
  recordAssignment(v.id, plan.id);
  notifyVendor(v.id, `কমিশন প্ল্যান: ${plan.name_bn}`, `এখন থেকে আপনার কমিশন ${plan.percent}%`, "/seller/money");
  audit("কমিশন প্ল্যান অ্যাসাইন", `${v.shop_name_bn}: ${plan.name_bn} (${plan.percent}%)`);
};

export function CommissionAssign({ canEdit }: { canEdit: boolean }) {
  const { tx, d, L, date } = useT();
  const now = useNow();
  const vendors = useDb((s) => s.vendors);
  const plans = usePlans();
  const assignments = commissionOverlay.useStore((o) => o.assignments);
  const promoMonths = commissionOverlay.useStore((o) => o.promo_months);
  const [vendorId, setVendorId] = useState("");
  const [planId, setPlanId] = useState("default");

  const planOf = (v: Vendor) => plans.find((p) => p.id === assignments[v.id]) ?? plans.find((p) => p.percent === v.commission_percent) ?? null;
  const isNew = (v: Vendor) => now - new Date(v.joined_at).getTime() < promoMonths * MONTH;
  const promo = plans.find((p) => p.id === "promo")!;
  const eligible = vendors.filter((v) => v.status !== "closed" && isNew(v) && v.commission_percent !== promo.percent);

  const doAssign = () => {
    const v = vendors.find((x) => x.id === vendorId);
    const p = plans.find((x) => x.id === planId);
    if (!v || !p) return toast(tx("বিক্রেতা ও প্ল্যান বাছাই করুন", "Pick a seller and a plan"), "bad");
    assign(v, p);
    toast(tx(`${v.shop_name_bn}: ${p.percent}% সেট হয়েছে`, `${v.shop_name}: set to ${p.percent}%`));
  };
  const applyPromo = () => {
    eligible.forEach((v) => assign(v, promo));
    toast(tx(`${eligible.length}টা নতুন দোকানে প্রচারমূলক প্ল্যান`, `Promo plan applied to ${eligible.length} new sellers`));
  };

  const cols: Column<Vendor>[] = [
    { key: "shop", header: tx("দোকান", "Shop"), sort: (v) => v.shop_name_bn, cell: (v) => <Link href={`/admin/vendors/${v.id}`} className="font-semibold text-brand hover:underline">{v.shop_name_bn}</Link> },
    { key: "status", header: tx("অবস্থা", "Status"), cell: (v) => <StatusPill tone={vendorStatusLabel[v.status].tone}>{L(vendorStatusLabel[v.status])}</StatusPill> },
    { key: "joined", header: tx("যোগদান", "Joined"), sort: (v) => v.joined_at, hideOnMobile: true, cell: (v) => <span>{date(v.joined_at)} {isNew(v) && <StatusPill tone="ok">{tx("নতুন", "New")}</StatusPill>}</span> },
    { key: "pct", header: tx("কমিশন", "Commission"), sort: (v) => v.commission_percent, cell: (v) => <span className="font-bold tabular-nums">{d(v.commission_percent)}%</span> },
    { key: "plan", header: tx("প্ল্যান", "Plan"), cell: (v) => { const p = planOf(v); return p ? tx(p.name_bn, p.name_en) : <span className="text-muted">{tx("আলাদা", "Custom")}</span>; } },
    {
      key: "act", header: "", cell: (v) => canEdit ? (
        <Button size="sm" variant="outline" onClick={() => { setVendorId(v.id); document.getElementById("assign-box")?.scrollIntoView({ behavior: "smooth" }); }}>
          {tx("বদলান", "Change")}
        </Button>
      ) : null,
    },
  ];

  return (
    <>
      {canEdit && (
        <Panel id="assign-box" title={tx("বিক্রেতাকে প্ল্যান দিন", "Assign plan to seller")}>
          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-56 flex-1">
              <span className="mb-1 block text-sm font-semibold">{tx("বিক্রেতা", "Seller")}</span>
              <Select value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
                <option value="">{tx("বাছাই করুন…", "Select…")}</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.shop_name_bn} ({d(v.commission_percent)}%)</option>
                ))}
              </Select>
            </label>
            <label className="min-w-56 flex-1">
              <span className="mb-1 block text-sm font-semibold">{tx("প্ল্যান", "Plan")}</span>
              <Select value={planId} onChange={(e) => setPlanId(e.target.value)}>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{tx(p.name_bn, p.name_en)} · {d(p.percent)}%</option>
                ))}
              </Select>
            </label>
            <Button variant="brand" size="lg" onClick={doAssign} disabled={!vendorId}>{tx("প্ল্যান দিন", "Assign plan")}</Button>
          </div>
          {eligible.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-ok-soft p-3 text-sm text-ok">
              <span className="flex-1">{tx(`${d(eligible.length)}টা নতুন দোকান প্রচারমূলক প্ল্যান পাওয়ার যোগ্য (প্রথম ${d(promoMonths)} মাস)।`, `${eligible.length} new sellers qualify for the promo plan (first ${promoMonths} months).`)}</span>
              <Button size="sm" variant="ok" onClick={applyPromo}>{tx("সবাইকে দিন", "Apply to all")}</Button>
            </div>
          )}
        </Panel>
      )}
      <DataTable
        caption={tx("বিক্রেতা ও বর্তমান কমিশন", "Sellers and current commission")}
        rows={vendors}
        columns={cols}
        rowKey={(v) => v.id}
        search={(v) => `${v.shop_name} ${v.shop_name_bn}`}
        initialSort={{ key: "pct", dir: "desc" }}
      />
    </>
  );
}
