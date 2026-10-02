"use client";

import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { type Column, DataTable, ReasonSheet } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, StatusPill } from "@/components/ui/primitives";
import { type CodBatch, financeOverlay, resolveCodBatch } from "./overlay";
import { Money, useStaff } from "./shared";

export function CodBatches() {
  const { tx, d, dateTime } = useT();
  const { nameOf } = useStaff();
  const batches = financeOverlay.useStore((o) => o.codBatches);
  const [resolving, setResolving] = useState<string | null>(null);

  const cols: Column<CodBatch>[] = [
    { key: "at", header: tx("সংরক্ষণ", "Saved"), sort: (b) => b.at, cell: (b) => dateTime(b.at) },
    { key: "period", header: tx("সময়কাল", "Period"), cell: (b) => b.period },
    { key: "courier", header: tx("কুরিয়ার", "Courier"), cell: (b) => b.courier },
    { key: "exp", header: tx("পাওয়ার কথা", "Expected"), sort: (b) => b.expected, cell: (b) => <Money value={b.expected} /> },
    { key: "got", header: tx("পাওয়া", "Received"), sort: (b) => b.received, cell: (b) => <Money value={b.received} /> },
    { key: "diff", header: tx("পার্থক্য", "Difference"), sort: (b) => b.difference, cell: (b) => <Money value={b.difference} signed /> },
    {
      key: "counts", header: tx("গরমিল", "Issues"), hideOnMobile: true,
      cell: (b) => tx(`কম ${d(b.counts.short)} · ফেরত ${d(b.counts.returned)} · অজানা ${d(b.counts.unknown)} · নেই ${d(b.counts.missing)}`, `short ${b.counts.short} · returned ${b.counts.returned} · unknown ${b.counts.unknown} · missing ${b.counts.missing}`),
    },
    {
      key: "status", header: tx("অবস্থা", "Status"),
      cell: (b) => (
        <StatusPill tone={b.status === "mismatch" ? "bad" : "ok"}>
          {{ matched: tx("মিলেছে", "Matched"), mismatch: tx("গরমিল", "Mismatch"), resolved: tx("মীমাংসা হয়েছে", "Resolved") }[b.status]}
        </StatusPill>
      ),
    },
    { key: "by", header: tx("কে", "By"), cell: (b) => nameOf(b.by), hideOnMobile: true },
    {
      key: "act", header: "",
      cell: (b) =>
        b.status === "mismatch" ? (
          <Button size="sm" variant="outline" onClick={() => setResolving(b.id)}>
            <CheckCircle2 className="size-4" /> {tx("মীমাংসা", "Resolve")}
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <DataTable rows={batches} columns={cols} rowKey={(b) => b.id} caption={tx("ব্যাচের ইতিহাস", "Batch history")} empty={tx("এখনো কোনো ব্যাচ সংরক্ষণ হয়নি", "No batches saved yet")} />
      <ReasonSheet
        open={!!resolving}
        onClose={() => setResolving(null)}
        tone="ok"
        title={tx("গরমিল মীমাংসা", "Resolve mismatch")}
        label={tx("কীভাবে মীমাংসা হলো (বাধ্যতামূলক)", "How was it resolved (required)")}
        presets={[tx("কুরিয়ার বাকি টাকা পাঠিয়েছে", "Courier paid the balance"), tx("পার্সেল ফেরত এসেছে, হিসাব ঠিক", "Parcel returned, accounts fine")]}
        confirmLabel={tx("মীমাংসা হয়েছে", "Mark resolved")}
        onSubmit={(note) => {
          if (resolving) resolveCodBatch(resolving, note);
          toast(tx("মীমাংসা হয়েছে", "Resolved"));
        }}
      />
    </>
  );
}
