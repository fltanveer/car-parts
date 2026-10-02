"use client";

import { Ban, CheckCircle2, Hourglass, Zap } from "lucide-react";
import { useState } from "react";
import { type Column, DataTable, ReasonSheet } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { Countdown, toast } from "@/components/shared/Misc";
import { Button, Notice, StatusPill } from "@/components/ui/primitives";
import { type AppSettings, useAdminSettings } from "@/lib/db/actions-admin-core";
import type { DB } from "@/lib/db/seed";
import type { Claim, Order, Refund, VendorOrder } from "@/lib/types";
import { COD_NOT_COLLECTED, completeRefund, financeOverlay, markRefundProcessing, type RefundChannel, refundChannel } from "./overlay";
import { Money, OrderLink, useStaff } from "./shared";

export interface RefundRow {
  r: Refund;
  order: Order | null;
  vo: VendorOrder | null;
  claim: Claim | null;
  channel: RefundChannel;
  rule: "late" | "unfulfillable";
  onTime: boolean | null;
}

const HOUR = 3_600_000;

export const buildRefundRows = (s: DB, set: AppSettings): RefundRow[] =>
  s.refunds.map((r) => {
    const order = s.orders.find((o) => o.id === r.order_id) ?? null;
    const windowH = (new Date(r.due_by).getTime() - new Date(r.created_at).getTime()) / HOUR;
    return {
      r,
      order,
      vo: s.vendorOrders.find((v) => v.id === r.vendor_order_id) ?? null,
      claim: s.claims.find((c) => c.id === r.claim_id) ?? null,
      channel: refundChannel(order),
      rule: windowH > set.refund_hours_unfulfillable + 1 && windowH >= set.refund_days_late * 24 * 0.9 ? "late" : "unfulfillable",
      onTime: r.status === "done" && r.processed_at ? new Date(r.processed_at) <= new Date(r.due_by) : null,
    };
  });

export function RefundQueue({ rows, done }: { rows: RefundRow[]; done: boolean }) {
  const { tx, d, num, dateTime } = useT();
  const { nameOf } = useStaff();
  const notes = financeOverlay.useStore((o) => o.refundNotes);
  const [sending, setSending] = useState<RefundRow | null>(null);
  const set = useAdminSettings();

  const channelText = (x: RefundRow) => {
    const c = x.channel;
    if (c.kind === "gateway") return tx("গেটওয়ে: স্বয়ংক্রিয় ফেরত", "Gateway: automatic");
    if (c.kind === "manual") return tx(`${c.method === "bkash_manual" ? "bKash" : "Nagad"}: কাস্টমারের নম্বরে পাঠান (${d(x.r.destination)})`, `${c.method === "bkash_manual" ? "bKash" : "Nagad"}: send to customer (${x.r.destination})`);
    if (c.kind === "cod_collected") return tx(`কাস্টমারের bKash নম্বরে পাঠান (${d(x.r.destination)})`, `Send to customer bKash (${x.r.destination})`);
    return tx("COD: টাকা নেওয়া হয়নি", "COD: cash not collected");
  };

  const cols: Column<RefundRow>[] = [
    {
      key: "order", header: tx("অর্ডার", "Order"), sort: (x) => x.order?.order_no ?? "",
      cell: (x) => (
        <div>
          {x.order ? <OrderLink id={x.order.id} no={x.vo?.sub_order_no ?? x.order.order_no} /> : x.r.order_id}
          <p className="text-xs text-muted">{x.order?.customer_name}</p>
        </div>
      ),
    },
    { key: "amount", header: tx("পরিমাণ", "Amount"), sort: (x) => x.r.amount, cell: (x) => <Money value={x.r.amount} /> },
    {
      key: "rule", header: tx("নিয়ম", "Rule"),
      cell: (x) => (
        <div className="text-xs">
          <p className="font-semibold">
            {x.rule === "late"
              ? tx(`দেরিতে ডেলিভারি: ${num(set.refund_days_late)} দিনে ফেরত`, `Late delivery: ${set.refund_days_late}-day refund`)
              : tx(`সরবরাহ সম্ভব নয়: ${num(set.refund_hours_unfulfillable)} ঘণ্টায় ফেরত`, `Unfulfillable: ${set.refund_hours_unfulfillable}-hour refund`)}
          </p>
          {x.claim && <p className="text-muted">{tx("দাবি", "Claim")} {x.claim.claim_no}</p>}
        </div>
      ),
    },
    { key: "channel", header: tx("কোন মাধ্যমে", "Channel"), cell: (x) => <span className="text-xs font-semibold">{channelText(x)}</span> },
    done
      ? {
          key: "done", header: tx("সম্পন্ন", "Processed"), sort: (x) => x.r.processed_at ?? "",
          cell: (x) => (
            <div className="text-xs">
              <p>{x.r.processed_at ? dateTime(x.r.processed_at) : "—"}</p>
              <StatusPill tone={x.onTime ? "ok" : "bad"}>{x.onTime ? tx("সময়মতো", "On time") : tx("দেরিতে", "Late")}</StatusPill>
              <p className="mt-0.5 font-mono">{x.r.reference}</p>
            </div>
          ),
        }
      : {
          key: "due", header: tx("আইনি সময়সীমা", "Legal deadline"), sort: (x) => x.r.due_by,
          cell: (x) => (
            <div className="text-xs">
              <Countdown to={x.r.due_by} warnHours={24} />
              <p className="mt-0.5 text-muted">{dateTime(x.r.due_by)}</p>
            </div>
          ),
        },
    {
      key: "status", header: tx("অবস্থা", "Status"),
      cell: (x) => (
        <StatusPill tone={x.r.status === "done" ? "ok" : x.r.status === "processing" ? "wait" : "bad"}>
          {{ pending: tx("বাকি", "Pending"), processing: tx("প্রক্রিয়াধীন", "Processing"), done: tx("সম্পন্ন", "Done") }[x.r.status]}
        </StatusPill>
      ),
    },
  ];
  if (!done) {
    cols.push({
      key: "act", header: tx("কাজ", "Action"),
      cell: (x) => {
        if (x.channel.kind === "cod_not_collected") {
          return (
            <div className="max-w-56 space-y-1.5">
              <Notice tone="wait" className="px-2 py-1.5 text-xs">{tx("COD অর্ডারে টাকা নেওয়া হয়নি: রিফান্ড নেই, শুধু বাতিল।", "COD not collected: no refund, cancel only.")}</Notice>
              <Button size="sm" variant="outline" onClick={() => { completeRefund(x.r.id, COD_NOT_COLLECTED, true); toast(tx("রিফান্ড ছাড়া বন্ধ হয়েছে", "Closed without refund")); }}>
                <Ban className="size-4" /> {tx("রিফান্ড ছাড়া বন্ধ", "Close without refund")}
              </Button>
            </div>
          );
        }
        if (x.channel.kind === "gateway") {
          return (
            <Button size="sm" variant="ok" onClick={() => { completeRefund(x.r.id, `GW-RF-${Date.now().toString(36).toUpperCase()}`); toast(tx("গেটওয়ে দিয়ে ফেরত পাঠানো হয়েছে", "Refunded via gateway")); }}>
              <Zap className="size-4" /> {tx("গেটওয়ে দিয়ে ফেরত", "Refund via gateway")}
            </Button>
          );
        }
        return (
          <div className="flex flex-wrap gap-1.5">
            {x.r.status === "pending" && (
              <Button size="sm" variant="outline" onClick={() => { markRefundProcessing(x.r.id); toast(tx("প্রক্রিয়াধীন", "Processing"), "info"); }}>
                <Hourglass className="size-4" /> {tx("প্রক্রিয়া শুরু", "Start")}
              </Button>
            )}
            <Button size="sm" variant="ok" onClick={() => setSending(x)}>
              <CheckCircle2 className="size-4" /> {tx("পাঠানো হয়েছে", "Mark sent")}
            </Button>
          </div>
        );
      },
    });
  }

  return (
    <>
      <DataTable
        rows={rows}
        columns={cols}
        rowKey={(x) => x.r.id}
        initialSort={{ key: done ? "done" : "due", dir: done ? "desc" : "asc" }}
        search={(x) => `${x.order?.order_no ?? ""} ${x.vo?.sub_order_no ?? ""} ${x.r.reference ?? ""} ${x.order?.customer_name ?? ""}`}
        empty={done ? tx("এখনো কোনো রিফান্ড সম্পন্ন হয়নি", "No processed refunds yet") : tx("কোনো রিফান্ড বাকি নেই 🎉", "No refunds pending 🎉")}
        expanded={(x) =>
          notes[x.r.id]?.length ? (
            <ul className="space-y-0.5 pt-2 text-xs text-muted">
              {notes[x.r.id].map((n, i) => (
                <li key={i}>
                  {dateTime(n.at)} · {nameOf(n.by)} · {n.text}
                </li>
              ))}
            </ul>
          ) : null
        }
      />
      <ReasonSheet
        open={!!sending}
        onClose={() => setSending(null)}
        tone="ok"
        title={tx("ফেরত পাঠানো হয়েছে", "Refund sent")}
        label={tx("bKash/Nagad Transaction ID বা রেফারেন্স (বাধ্যতামূলক)", "bKash/Nagad Transaction ID or reference (required)")}
        minLength={6}
        confirmLabel={tx("সম্পন্ন করুন ও কাস্টমারকে জানান", "Complete and notify customer")}
        onSubmit={(ref) => {
          if (!sending) return;
          completeRefund(sending.r.id, ref.toUpperCase());
          toast(tx("রিফান্ড সম্পন্ন", "Refund completed"));
        }}
      >
        {sending && (
          <Notice tone="info">
            {tx("পাঠান", "Send")} <Money value={sending.r.amount} /> → <span className="font-mono">{d(sending.r.destination)}</span> ({channelText(sending)})
          </Notice>
        )}
      </ReasonSheet>
    </>
  );
}
