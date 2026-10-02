"use client";

import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { StatusPill } from "@/components/ui/primitives";
import { DataTable, type Column } from "../DataTable";
import { Panel } from "../Panel";
import { sampleInspections, sampleInspectors, type SampleBooking } from "./phaseSamples";
import { SampleTag } from "./SampleTag";

const statusTone = { requested: "wait", scheduled: "info", done: "ok" } as const;
const statusLabel: Record<SampleBooking["status"], [string, string]> = { requested: ["নতুন", "New"], scheduled: ["সময় ঠিক", "Scheduled"], done: ["রিপোর্ট তৈরি", "Report ready"] };

/** Booking queue + inspector assignment (local sample state only). */
export function InspectionQueue() {
  const { tx, d, taka } = useT();
  const [rows, setRows] = useState(sampleInspections);

  const assign = (id: string, inspector: string) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, inspector: inspector || null, status: inspector && r.status === "requested" ? "scheduled" : r.status } : r)));
    const name = sampleInspectors.find((i) => i.id === inspector)?.name;
    toast(name ? tx(`নমুনা: ${name} কে দেওয়া হলো`, `Sample: assigned to ${name}`) : tx("নমুনা: ইন্সপেক্টর সরানো হলো", "Sample: unassigned"), "info");
  };

  const cols: Column<SampleBooking>[] = [
    { key: "id", header: tx("বুকিং", "Booking"), cell: (r) => <span className="font-semibold">{r.id}<span className="block text-xs font-normal text-muted">{r.car}</span></span> },
    { key: "cust", header: tx("কাস্টমার", "Customer"), hideOnMobile: true, cell: (r) => <span>{r.customer}<span className="block text-xs text-muted">{r.area}</span></span> },
    { key: "slot", header: tx("সময়", "Slot"), cell: (r) => tx(r.slot_bn, r.slot_en) },
    { key: "fee", header: tx("ফি", "Fee"), cell: (r) => <span className="tabular-nums">{taka(r.fee)}</span> },
    {
      key: "insp", header: tx("ইন্সপেক্টর", "Inspector"),
      cell: (r) => (
        <select value={r.inspector ?? ""} disabled={r.status === "done"} onChange={(e) => assign(r.id, e.target.value)} aria-label={tx("ইন্সপেক্টর", "Inspector")} className="min-h-10 rounded-lg border border-line bg-card px-2 text-sm">
          <option value="">{tx("দেওয়া হয়নি", "Unassigned")}</option>
          {sampleInspectors.map((i) => (
            <option key={i.id} value={i.id}>{i.name} ({d(i.today)})</option>
          ))}
        </select>
      ),
    },
    { key: "st", header: tx("অবস্থা", "Status"), cell: (r) => <StatusPill tone={statusTone[r.status]}>{tx(...statusLabel[r.status])}</StatusPill> },
  ];

  return (
    <>
      <DataTable caption={<>{tx("বুকিং কিউ ও ইন্সপেক্টর", "Booking queue & inspectors")}<SampleTag /></>} rows={rows} columns={cols} rowKey={(r) => r.id} />
      <Panel title={<>{tx("আরও পরিকল্পনা", "Also planned")}<SampleTag /></>}>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>{tx("ইন্সপেক্টরের মোবাইল ভিউ: চেকলিস্ট ধাপে ধাপে, ছবি, অফলাইনে চলবে", "Inspector mobile view: step-by-step checklist, photos, works offline")}</li>
          <li>{tx("রিপোর্ট PDF তৈরি, বিজ্ঞাপন/কাস্টমারের গাড়ির সাথে যুক্ত (🔍 পরীক্ষিত ব্যাজ)", "PDF report linked to the ad or customer's car (🔍 Inspected badge)")}</li>
          <li>{tx("সময়সূচি ক্যালেন্ডার ও ইন্সপেক্টরের এলাকা", "Schedule calendar and inspector areas")}</li>
        </ul>
      </Panel>
    </>
  );
}
