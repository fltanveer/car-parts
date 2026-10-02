"use client";

import { AlertTriangle, CheckCircle2, Download, Lock, Unlock } from "lucide-react";
import { useState } from "react";
import { type Column, DataTable, downloadCsv, ReasonSheet } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, Notice, StatusPill } from "@/components/ui/primitives";
import { useAdminSettings } from "@/lib/db/actions-admin-core";
import { vendorBalance } from "@/lib/db/queries";
import type { DB } from "@/lib/db/seed";
import type { PayoutMethod, Vendor } from "@/lib/types";
import { financeOverlay, payBatch, setPayoutHold } from "./overlay";
import { maskWallet, Money, VendorLink } from "./shared";

interface Row {
  v: Vendor;
  available: number;
  method: PayoutMethod | null;
  held: string | null;
  defaultInclude: boolean;
}

const methodName = (m: PayoutMethod["method"]) => ({ bkash: "bKash", nagad: "Nagad", bank: "Bank" })[m];

export function PayoutBatchPanel({ s, now }: { s: DB; now: number }) {
  const { tx, d, taka } = useT();
  const set = useAdminSettings();
  const holds = financeOverlay.useStore((o) => o.payoutHolds);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [paying, setPaying] = useState(false);
  const [holding, setHolding] = useState<Vendor | null>(null);

  const batchRef = `PB-${new Date(now).toISOString().slice(0, 10).replace(/-/g, "")}`;
  const rows: Row[] = s.vendors
    .map((v) => {
      const available = vendorBalance(s, v.id, now).available;
      const method = v.payout_methods.find((m) => m.is_default) ?? v.payout_methods[0] ?? null;
      const held = v.status === "suspended" ? tx("বিক্রেতা স্থগিত", "Seller suspended") : holds[v.id] ? `${tx("আটকানো", "On hold")}: ${holds[v.id].reason}` : null;
      return { v, available, method, held, defaultInclude: !held && !!method && method.verified };
    })
    .filter((r) => r.available > 0 && r.available >= set.payout_min);
  const included = (r: Row) => !r.held && !!r.method && (overrides[r.v.id] ?? r.defaultInclude);
  const chosen = rows.filter(included);
  const total = chosen.reduce((t, r) => t + r.available, 0);

  const exportCsv = () => {
    downloadCsv(`${batchRef}-bkash-bulk.csv`, [
      ["wallet", "method", "name", "amount", "reference"],
      ...chosen.map((r) => [maskWallet(r.method!.last4), methodName(r.method!.method), r.method!.account_name, r.available, `${batchRef}-${r.v.slug}`]),
    ]);
    toast(tx("ফাইল ডাউনলোড হয়েছে", "File downloaded"), "info");
  };

  const cols: Column<Row>[] = [
    {
      key: "inc", header: tx("নিন", "Include"),
      cell: (r) => (
        <input
          type="checkbox"
          className="size-5 accent-[var(--color-brand)]"
          aria-label={tx("ব্যাচে নিন", "Include in batch")}
          checked={included(r)}
          disabled={!!r.held || !r.method}
          onChange={(e) => setOverrides((o) => ({ ...o, [r.v.id]: e.target.checked }))}
        />
      ),
    },
    { key: "shop", header: tx("দোকান", "Shop"), sort: (r) => r.v.shop_name, cell: (r) => <VendorLink id={r.v.id} name={r.v.shop_name_bn} /> },
    { key: "amount", header: tx("দেয় (available)", "Available"), sort: (r) => r.available, cell: (r) => <Money value={r.available} /> },
    {
      key: "method", header: tx("পেআউট মাধ্যম", "Payout method"),
      cell: (r) =>
        r.method ? (
          <div className="text-xs">
            <p className="font-semibold">
              {methodName(r.method.method)} {maskWallet(r.method.last4)} · {r.method.account_name}
            </p>
            {!r.method.verified && (
              <p className="flex items-center gap-1 font-bold text-bad">
                <AlertTriangle className="size-3.5" aria-hidden /> {tx("নতুন/অযাচাইকৃত অ্যাকাউন্ট নম্বর: আগে ফোনে নিশ্চিত করুন", "New / unverified account: confirm by phone first")}
              </p>
            )}
          </div>
        ) : (
          <StatusPill tone="bad">{tx("পেআউট মাধ্যম নেই", "No payout method")}</StatusPill>
        ),
    },
    { key: "state", header: tx("অবস্থা", "State"), cell: (r) => (r.held ? <StatusPill tone="bad">{r.held}</StatusPill> : <StatusPill tone="ok">{tx("দেওয়া যাবে", "Payable")}</StatusPill>) },
    {
      key: "hold", header: "",
      cell: (r) =>
        r.v.status === "suspended" ? null : holds[r.v.id] ? (
          <Button size="sm" variant="outline" onClick={() => setPayoutHold(r.v.id, false, "")}>
            <Unlock className="size-4" /> {tx("ছেড়ে দিন", "Release")}
          </Button>
        ) : (
          <Button size="sm" variant="danger" onClick={() => setHolding(r.v)}>
            <Lock className="size-4" /> {tx("আটকান", "Hold")}
          </Button>
        ),
    },
  ];

  return (
    <div className="space-y-3">
      <Notice tone="info">
        {tx(
          `সাপ্তাহিক ব্যাচ (${batchRef}): যাদের available ব্যালেন্স ন্যূনতম ${taka(set.payout_min)} বা বেশি। স্থগিত বা আটকানো বিক্রেতা বাদ। অযাচাইকৃত অ্যাকাউন্ট নিজে টিক না দিলে বাদ থাকবে।`,
          `Weekly batch (${batchRef}): sellers with available balance of at least ${taka(set.payout_min)}. Suspended or held sellers are excluded. Unverified accounts stay out unless you tick them.`,
        )}
      </Notice>
      <DataTable
        rows={rows}
        columns={cols}
        rowKey={(r) => r.v.id}
        caption={tx("পেআউট তালিকা যাচাই করুন", "Review the payout list")}
        rowClassName={(r) => (r.held ? "opacity-60" : r.method && !r.method.verified ? "bg-bad-soft/40" : undefined)}
        empty={tx(`কারো available ব্যালেন্স ${taka(set.payout_min)} এর বেশি নেই`, `Nobody has more than ${taka(set.payout_min)} available`)}
      />
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-card p-4">
        <p className="mr-auto font-bold">
          {tx(`${d(chosen.length)} জন বিক্রেতা · মোট`, `${chosen.length} sellers · total`)} {taka(total)}
        </p>
        <Button variant="outline" onClick={exportCsv} disabled={!chosen.length}>
          <Download className="size-4" /> {tx("bKash বাল্ক CSV", "bKash bulk CSV")}
        </Button>
        <Button size="lg" variant="ok" onClick={() => setPaying(true)} disabled={!chosen.length}>
          <CheckCircle2 className="size-5" /> {tx("পরিশোধ হয়েছে, রেফারেন্স দিন", "Mark paid with reference")}
        </Button>
      </div>
      <ReasonSheet
        open={paying}
        onClose={() => setPaying(false)}
        tone="ok"
        title={tx("ব্যাচ পরিশোধ", "Batch paid")}
        label={tx("bKash বাল্ক / ব্যাংক রেফারেন্স (বাধ্যতামূলক)", "bKash bulk / bank reference (required)")}
        presets={[batchRef]}
        minLength={4}
        confirmLabel={tx(`${d(chosen.length)} জনকে পরিশোধ হিসেবে মার্ক করুন`, `Mark ${chosen.length} sellers paid`)}
        onSubmit={(ref) => {
          payBatch(chosen.map((r) => ({ vendor_id: r.v.id, amount: r.available, method_id: r.method!.id })), ref);
          setOverrides({});
          toast(tx("পেআউট সম্পন্ন, বিক্রেতারা SMS পেয়েছে", "Payouts done, sellers notified"));
        }}
      >
        <Notice tone="wait">{tx(`মোট ${taka(total)} · প্রত্যেকের লেজারে পেআউট এন্ট্রি হবে`, `Total ${taka(total)} · a payout entry is added to each ledger`)}</Notice>
      </ReasonSheet>
      <ReasonSheet
        open={!!holding}
        onClose={() => setHolding(null)}
        title={tx(`পেআউট আটকান: ${holding?.shop_name_bn ?? ""}`, `Hold payout: ${holding?.shop_name ?? ""}`)}
        presets={[tx("বিরোধ চলছে", "Open dispute"), tx("নতুন অ্যাকাউন্ট নম্বর যাচাই বাকি", "New account number unverified"), tx("প্রতারণার সন্দেহ", "Fraud suspicion")]}
        confirmLabel={tx("আটকান", "Hold")}
        onSubmit={(reason) => holding && setPayoutHold(holding.id, true, reason)}
      />
    </div>
  );
}
