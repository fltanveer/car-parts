"use client";

import { ArrowRight, BookOpen, CreditCard, HandCoins, Truck, Undo2 } from "lucide-react";
import Link from "next/link";
import { AdminPage, KpiCard, KpiGrid, Panel } from "@/components/admin/core";
import { ledgerTotals } from "@/components/admin/core/finance/Balances";
import { financeOverlay } from "@/components/admin/core/finance/overlay";
import { buildPayRows } from "@/components/admin/core/finance/PaymentsQueue";
import { effectiveNow, pct, selectAll } from "@/components/admin/core/finance/shared";
import { useT } from "@/components/providers/LangProvider";
import { useNow } from "@/components/shared/Misc";
import { useAdminSettings } from "@/lib/db/actions-admin-core";
import { vendorBalance } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";

export default function FinancePage() {
  const { tx, d, taka } = useT();
  const set = useAdminSettings();
  const s = useDb(selectAll);
  const now = effectiveNow(s, useNow());
  const fin = financeOverlay.useStore((o) => o);

  const payments = buildPayRows(s, set.manual_advance_max_percent);
  const flagged = payments.filter((r) => r.over || r.dups.length).length;
  const refundsOpen = s.refunds.filter((r) => r.status !== "done");
  const overdue = refundsOpen.filter((r) => new Date(r.due_by).getTime() < now).length;
  const refundsDone = s.refunds.filter((r) => r.status === "done");
  const onTime = refundsDone.filter((r) => r.processed_at && r.processed_at <= r.due_by).length;
  const payable = s.vendors
    .filter((v) => v.status !== "suspended" && !fin.payoutHolds[v.id])
    .map((v) => vendorBalance(s, v.id, now).available)
    .filter((a) => a >= set.payout_min && a > 0);
  const requests = s.payouts.filter((p) => p.status === "requested" || p.status === "processing").length;
  const pendingAdj = fin.adjustments.filter((a) => a.status === "pending").length;
  const lastCod = fin.codBatches[0];
  const totals = ledgerTotals(s);

  const links = [
    { href: "/admin/finance/payments", icon: CreditCard, title: tx("পেমেন্ট যাচাই", "Payment verification"), body: tx(`${d(payments.length)}টা বাকি${flagged ? `, ${d(flagged)}টা লাল` : ""}`, `${payments.length} waiting${flagged ? `, ${flagged} flagged` : ""}`), tone: flagged ? "text-bad" : payments.length ? "text-wait" : "text-ok" },
    { href: "/admin/finance/cod", icon: Truck, title: tx("COD মেলানো", "COD reconciliation"), body: lastCod ? tx(`শেষ ব্যাচ পার্থক্য ${taka(lastCod.difference)}`, `Last batch difference ${taka(lastCod.difference)}`) : tx("কুরিয়ারের ফাইল আপলোড করুন", "Upload a courier file"), tone: lastCod?.status === "mismatch" ? "text-bad" : "text-ok" },
    { href: "/admin/finance/refunds", icon: Undo2, title: tx("রিফান্ড", "Refunds"), body: tx(`${d(refundsOpen.length)}টা বাকি${overdue ? `, ${d(overdue)}টা সময় পার` : ""}`, `${refundsOpen.length} pending${overdue ? `, ${overdue} overdue` : ""}`), tone: overdue ? "text-bad" : refundsOpen.length ? "text-wait" : "text-ok" },
    { href: "/admin/finance/payouts", icon: HandCoins, title: tx("পেআউট", "Payouts"), body: tx(`${d(payable.length)} জন বিক্রেতা · ${taka(payable.reduce((t, a) => t + a, 0))}${requests ? ` · ${d(requests)}টা অনুরোধ` : ""}`, `${payable.length} sellers · ${taka(payable.reduce((t, a) => t + a, 0))}${requests ? ` · ${requests} requests` : ""}`), tone: requests ? "text-wait" : "text-ok" },
    { href: "/admin/finance/ledger", icon: BookOpen, title: tx("লেজার", "Ledger"), body: tx(`${d(s.ledger.length)}টা এন্ট্রি${pendingAdj ? ` · ${d(pendingAdj)}টা সমন্বয় অনুমোদন বাকি` : ""}`, `${s.ledger.length} entries${pendingAdj ? ` · ${pendingAdj} adjustments to approve` : ""}`), tone: pendingAdj ? "text-wait" : "text-ok" },
  ];

  return (
    <AdminPage
      title={tx("ফাইন্যান্স", "Finance")}
      subtitle={tx("পেমেন্ট, COD, রিফান্ড, পেআউট ও লেজার", "Payments, COD, refunds, payouts and ledger")}
      guide={tx(
        "টাকার সব কাজ এখানে। প্রতিদিন আগে লাল কাজ: সময় পার হওয়া রিফান্ড আর সন্দেহজনক পেমেন্ট। তারপর হলুদ: যাচাই বাকি পেমেন্ট, অনুমোদন বাকি সমন্বয়। সপ্তাহে একবার COD ফাইল মেলান আর পেআউট ব্যাচ পাঠান। নিচের যেকোনো কার্ডে চাপ দিলে সেই কাজের তালিকা খুলবে।",
        "All money work lives here. Every day do red items first: overdue refunds and suspicious payments. Then yellow: payments to verify, adjustments to approve. Once a week reconcile the COD file and send the payout batch. Tap any card below to open that queue.",
      )}
    >
      <KpiGrid>
        <KpiCard label={tx("যাচাই বাকি পেমেন্ট", "Payments to verify")} value={d(payments.length)} tone={flagged ? "bad" : payments.length ? "wait" : "ok"} icon="💳" href="/admin/finance/payments" />
        <KpiCard label={tx("রিফান্ড বাকি", "Refunds pending")} value={d(refundsOpen.length)} sub={overdue ? tx(`${d(overdue)}টা সময় পার`, `${overdue} overdue`) : taka(refundsOpen.reduce((t, r) => t + r.amount, 0))} tone={overdue ? "bad" : refundsOpen.length ? "wait" : "ok"} icon="💸" href="/admin/finance/refunds" />
        <KpiCard label={tx("সময়সীমার মধ্যে রিফান্ড", "Refunds on time")} value={refundsDone.length ? `${d(pct(onTime, refundsDone.length))}%` : "—"} tone={refundsDone.length && onTime < refundsDone.length ? "bad" : "ok"} icon="⏱" />
        <KpiCard label={tx("এই সপ্তাহের পেআউট", "This week's payouts")} value={taka(payable.reduce((t, a) => t + a, 0))} sub={tx(`${d(payable.length)} জন বিক্রেতা`, `${payable.length} sellers`)} icon="📤" href="/admin/finance/payouts" />
        <KpiCard label={tx("প্ল্যাটফর্ম কমিশন", "Platform commission")} value={taka(totals.commission)} tone="ok" icon="🏦" href="/admin/finance/ledger" />
        <KpiCard label={tx("COD গরমিল", "COD mismatch")} value={taka(fin.codBatches.filter((b) => b.status === "mismatch").reduce((t, b) => t + b.difference, 0))} tone={fin.codBatches.some((b) => b.status === "mismatch") ? "bad" : "ok"} icon="🚚" href="/admin/finance/cod" />
        <KpiCard label={tx("সমন্বয় অনুমোদন বাকি", "Adjustments to approve")} value={d(pendingAdj)} tone={pendingAdj ? "wait" : "ok"} icon="✍️" href="/admin/finance/ledger" />
        <KpiCard label={tx("পেআউট অনুরোধ", "Payout requests")} value={d(requests)} tone={requests ? "wait" : "ok"} icon="🙋" href="/admin/finance/payouts" />
      </KpiGrid>
      <Panel title={tx("কাজের তালিকা", "Queues")} bodyClass="p-0">
        <ul className="divide-y divide-line">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-surface/60">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface">
                  <l.icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{l.title}</span>
                  <span className={`block text-sm font-semibold ${l.tone}`}>{l.body}</span>
                </span>
                <ArrowRight className="size-5 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </AdminPage>
  );
}
