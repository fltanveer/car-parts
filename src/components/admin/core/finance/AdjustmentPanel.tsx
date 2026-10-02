"use client";

import { CheckCircle2, Minus, Plus, Send, XCircle } from "lucide-react";
import { useState } from "react";
import { type Column, DataTable, Panel, ReasonSheet } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, Chip, Field, Input, Notice, Select, StatusPill, Textarea } from "@/components/ui/primitives";
import type { DB } from "@/lib/db/seed";
import { type ApproveError, approveAdjustment, canDecideAdjustment, financeOverlay, type PendingAdjustment, proposeAdjustment, rejectAdjustment } from "./overlay";
import { Money, useStaff, VendorLink } from "./shared";

export function AdjustmentPanel({ s }: { s: DB }) {
  const { tx, dateTime } = useT();
  const { staffId, me, isSuper, nameOf } = useStaff();
  const adjustments = financeOverlay.useStore((o) => o.adjustments);
  const [vendor, setVendor] = useState(s.vendors[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [sign, setSign] = useState<1 | -1>(1);
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState<string | null>(null);
  const value = Math.round(Math.abs(Number(amount) || 0)) * sign;
  const canSubmit = !!vendor && value !== 0 && reason.trim().length >= 5;
  const vName = (id: string) => s.vendors.find((v) => v.id === id)?.shop_name_bn ?? id;

  const errText = (e: ApproveError) =>
    ({
      same_person: tx("যিনি প্রস্তাব করেছেন তিনি অনুমোদন করতে পারবেন না", "The creator can't approve their own adjustment"),
      not_super: tx("শুধু সুপার অ্যাডমিন অনুমোদন করতে পারেন", "Only a super admin can approve"),
      not_pending: tx("আর বাকি নেই", "No longer pending"),
    })[e];

  const submit = () => {
    proposeAdjustment(vendor, value, reason.trim());
    setAmount("");
    setReason("");
    toast(tx("প্রস্তাব জমা হয়েছে, এখন অন্য একজন সুপার অ্যাডমিন অনুমোদন দেবেন", "Proposed; another super admin must approve"));
  };

  const cols: Column<PendingAdjustment>[] = [
    { key: "at", header: tx("কবে", "When"), sort: (a) => a.created_at, cell: (a) => dateTime(a.created_at) },
    { key: "vendor", header: tx("বিক্রেতা", "Seller"), cell: (a) => <VendorLink id={a.vendor_id} name={vName(a.vendor_id)} /> },
    { key: "amount", header: tx("টাকা", "Amount"), sort: (a) => a.amount, cell: (a) => <Money value={a.amount} signed /> },
    { key: "reason", header: tx("কারণ", "Reason"), cell: (a) => <span className="text-xs">{a.reason}{a.decision_note && <span className="block text-bad">↳ {a.decision_note}</span>}</span> },
    { key: "by", header: tx("প্রস্তাব / সিদ্ধান্ত", "Proposed / decided"), cell: (a) => <span className="text-xs">{nameOf(a.created_by)}{a.decided_by && <span className="block text-muted">→ {nameOf(a.decided_by)}</span>}</span> },
    {
      key: "status", header: tx("অবস্থা", "Status"),
      cell: (a) => (
        <StatusPill tone={a.status === "approved" ? "ok" : a.status === "rejected" ? "bad" : "wait"}>
          {{ pending: tx("অনুমোদন বাকি", "Awaiting approval"), approved: tx("অনুমোদিত", "Approved"), rejected: tx("বাতিল", "Rejected") }[a.status]}
        </StatusPill>
      ),
    },
    {
      key: "act", header: tx("কাজ", "Action"),
      cell: (a) => {
        if (a.status !== "pending") return null;
        const err = canDecideAdjustment(a, staffId);
        return (
          <div className="space-y-1">
            <div className="flex flex-wrap gap-1.5">
              <Button
                size="sm"
                variant="ok"
                disabled={!!err}
                onClick={() => {
                  const e = approveAdjustment(a.id);
                  toast(e ? errText(e) : tx("অনুমোদিত, লেজারে লেখা হয়েছে", "Approved and posted"), e ? "bad" : "ok");
                }}
              >
                <CheckCircle2 className="size-4" /> {tx("অনুমোদন", "Approve")}
              </Button>
              <Button size="sm" variant="danger" disabled={!!err} onClick={() => setRejecting(a.id)}>
                <XCircle className="size-4" /> {tx("বাতিল", "Reject")}
              </Button>
            </div>
            {err && <p className="text-xs font-semibold text-wait">{errText(err)}</p>}
          </div>
        );
      },
    },
  ];

  return (
    <Panel title={tx("ম্যানুয়াল সমন্বয় (দুই জনের অনুমোদন)", "Manual adjustment (two-person approval)")}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <div className="space-y-3">
          <Field label={tx("বিক্রেতা", "Seller")}>
            <Select value={vendor} onChange={(e) => setVendor(e.target.value)}>
              {s.vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.shop_name_bn}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={tx("টাকা", "Amount")}>
            <div className="flex gap-2">
              <Chip active={sign === 1} onClick={() => setSign(1)} aria-label={tx("যোগ", "Add")}>
                <Plus className="size-4" /> {tx("যোগ", "Credit")}
              </Chip>
              <Chip active={sign === -1} onClick={() => setSign(-1)} aria-label={tx("কাটা", "Deduct")}>
                <Minus className="size-4" /> {tx("কাটা", "Debit")}
              </Chip>
              <Input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))} placeholder="0" />
            </div>
          </Field>
          <Field label={tx("কারণ (বাধ্যতামূলক)", "Reason (required)")}>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={tx("যেমন: কুরিয়ার ক্ষতিপূরণ GH-4790-B", "e.g. courier compensation GH-4790-B")} />
          </Field>
          <Button full size="lg" variant="brand" disabled={!canSubmit} onClick={submit}>
            <Send className="size-5" /> {tx("প্রস্তাব জমা দিন", "Propose adjustment")}
          </Button>
          <p className="text-xs text-muted">
            {tx("আপনি", "You are")}: <b>{me?.name ?? "—"}</b>
            {isSuper ? ` (${tx("সুপার অ্যাডমিন", "super admin")})` : ""}
          </p>
        </div>
        <div className="min-w-0 space-y-3">
          <Notice tone="info">
            {tx(
              "নিয়ম: যিনি প্রস্তাব করেন তিনি নিজে অনুমোদন দিতে পারবেন না। অন্য একজন সুপার অ্যাডমিন অনুমোদন দিলে তবেই লেজারে লেখা হবে। পরীক্ষার জন্য উপরের স্টাফ বাছাই থেকে অন্য স্টাফ হিসেবে ঢুকুন।",
              "Rule: the creator can't approve their own adjustment. It's posted to the ledger only after a different super admin approves. To try it, switch staff from the header picker.",
            )}
          </Notice>
          <DataTable rows={adjustments} columns={cols} rowKey={(a) => a.id} caption={tx("সমন্বয়ের তালিকা", "Adjustments")} empty={tx("কোনো সমন্বয় নেই", "No adjustments")} />
        </div>
      </div>
      <ReasonSheet
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        title={tx("সমন্বয় বাতিল", "Reject adjustment")}
        confirmLabel={tx("বাতিল করুন", "Reject")}
        onSubmit={(note) => {
          const e = rejecting ? rejectAdjustment(rejecting, note) : null;
          toast(e ? errText(e) : tx("বাতিল হয়েছে", "Rejected"), e ? "bad" : "info");
        }}
      />
    </Panel>
  );
}
