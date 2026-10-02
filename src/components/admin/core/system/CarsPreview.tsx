"use client";

import Link from "next/link";
import { useT } from "@/components/providers/LangProvider";
import { StatusPill } from "@/components/ui/primitives";
import { DataTable, type Column } from "../DataTable";
import { KpiCard, KpiGrid, Panel } from "../Panel";
import { carDocLabel, docStateLabel, docStateTone, sampleCarAds, sampleFraud, type CarDoc, type SampleCarAd } from "./phaseSamples";
import { SampleTag } from "./SampleTag";

const DOCS: CarDoc[] = ["registration", "tax_token", "fitness", "insurance"];

export function CarsPreview() {
  const { tx, d, taka } = useT();
  const flagged = sampleCarAds.filter((a) => a.flags.length).length;
  const docPending = sampleCarAds.filter((a) => DOCS.some((k) => a.docs[k] === "pending")).length;

  const queueCols: Column<SampleCarAd>[] = [
    { key: "ad", header: tx("বিজ্ঞাপন", "Ad"), cell: (a) => <Link href={`/admin/cars/${a.id}`} className="font-semibold text-brand hover:underline">{a.title}</Link> },
    { key: "seller", header: tx("বিক্রেতা", "Seller"), hideOnMobile: true, cell: (a) => <span>{a.seller}<span className="block text-xs text-muted">{a.seller_type === "dealer" ? tx("ডিলার", "Dealer") : tx("ব্যক্তি", "Individual")} · {a.area}</span></span> },
    { key: "price", header: tx("দাম", "Price"), sort: (a) => a.price, cell: (a) => <span className="font-bold tabular-nums">{taka(a.price)}<span className="block text-xs font-normal text-muted">{tx("বাজারদর", "Market")} {taka(a.market_mid)}</span></span> },
    { key: "photos", header: tx("ছবি", "Photos"), cell: (a) => <StatusPill tone={a.photos >= 6 ? "ok" : "wait"}>{d(a.photos)}</StatusPill> },
    { key: "flags", header: tx("সংকেত", "Signals"), cell: (a) => a.flags.length ? <span className="flex flex-col gap-1">{a.flags.map((f) => <StatusPill key={f.en} tone={f.tone}>{tx(f.bn, f.en)}</StatusPill>)}</span> : <StatusPill tone="ok">{tx("কিছু নেই", "None")}</StatusPill> },
    { key: "age", header: tx("কখন", "Age"), sort: (a) => a.hoursAgo, cell: (a) => <span className="whitespace-nowrap">{tx(`${d(a.hoursAgo)} ঘণ্টা আগে`, `${a.hoursAgo} h ago`)}</span> },
  ];

  const docCols: Column<SampleCarAd>[] = [
    { key: "ad", header: tx("বিজ্ঞাপন", "Ad"), cell: (a) => <Link href={`/admin/cars/${a.id}`} className="font-semibold text-brand hover:underline">{a.title}</Link> },
    ...DOCS.map((k): Column<SampleCarAd> => ({ key: k, header: tx(...carDocLabel[k]), cell: (a) => <StatusPill tone={docStateTone[a.docs[k]]}>{tx(...docStateLabel[a.docs[k]])}</StatusPill> })),
  ];

  return (
    <>
      <KpiGrid>
        <KpiCard label={<>{tx("অনুমোদনের অপেক্ষায়", "Awaiting approval")}<SampleTag /></>} value={d(sampleCarAds.length)} tone="wait" />
        <KpiCard label={tx("কাগজ যাচাই বাকি", "Docs to verify")} value={d(docPending)} tone="wait" />
        <KpiCard label={tx("প্রতারণা সংকেত", "Fraud signals")} value={d(flagged)} tone="bad" />
        <KpiCard label={tx("বিজ্ঞাপনের মেয়াদ", "Ad lifetime")} value={tx(`${d(60)} দিন`, "60 days")} />
      </KpiGrid>

      <DataTable caption={<>{tx("অনুমোদন কিউ: ছবি আসল? দাম যুক্তিসঙ্গত? ডুপ্লিকেট? সাল/মডেল মেলে?", "Approval queue: real photos? fair price? duplicate? year/model consistent?")}<SampleTag /></>} rows={sampleCarAds} columns={queueCols} rowKey={(a) => a.id} initialSort={{ key: "age", dir: "asc" }} />

      <DataTable caption={<>{tx("কাগজ যাচাই → ব্যাজ (কাগজ পাবলিক নয়)", "Document check → badges (papers stay private)")}<SampleTag /></>} rows={sampleCarAds} columns={docCols} rowKey={(a) => a.id} />

      <Panel title={<>{tx("প্রতারণা সংকেত", "Fraud signals")}<SampleTag /></>}>
        <ul className="grid gap-2 sm:grid-cols-2">
          {sampleFraud.map((f) => (
            <li key={f.signal_en} className="flex items-center justify-between gap-2 rounded-xl border border-line p-3">
              <span className="font-semibold">{tx(f.signal_bn, f.signal_en)}</span>
              <StatusPill tone={f.tone}>{d(f.count)}</StatusPill>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">
          {tx("আরও পরিকল্পনা: ডিলার ব্যবস্থাপনা (বিক্রেতা মডিউলে), প্রচার/সাবস্ক্রিপশন, মডেল অনুযায়ী বাজারদর রিপোর্ট।", "Also planned: dealer management (seller module), boosts/subscriptions, market price report by model.")}
        </p>
      </Panel>
    </>
  );
}
