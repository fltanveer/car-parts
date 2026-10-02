"use client";

import Link from "next/link";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { MediaImage } from "@/components/ui/MediaImage";
import { StatusPill } from "@/components/ui/primitives";
import { logisticsOverlay } from "@/lib/db/actions-admin-core";
import { useDb } from "@/lib/db/store";
import { claimStatusLabel, conditionLabel, fulfillmentLabel, sourceLabel, vendorOrderStatusLabel, warrantyLabel } from "@/lib/labels";
import type { VendorOrder } from "@/lib/types";
import { KV, Panel } from "../index";
import { AlternativeSellers } from "./AlternativeSellers";
import { allSlas } from "./sla";
import { SlaBadge } from "./SlaBadge";
import { SubOrderActions } from "./SubOrderActions";

const QC_KEYS: Record<string, { bn: string; en: string }> = {
  part_number: { bn: "পার্ট নম্বর মিলেছে", en: "Part number matches" },
  source: { bn: "উৎস দাবি ঠিক", en: "Source claim right" },
  condition: { bn: "অবস্থা ও গ্রেড ঠিক", en: "Condition & grade right" },
  no_damage: { bn: "ভাঙা/ফাটা নেই", en: "No cracks" },
  fitment: { bn: "কাস্টমারের গাড়িতে লাগবে", en: "Fits customer's car" },
  packing: { bn: "প্যাকিং ঠিক", en: "Packing OK" },
};
export { QC_KEYS };

export function SubOrderCard({ vo, now }: { vo: VendorOrder; now: number }) {
  const { tx, L, taka, d, lang } = useT();
  const vendor = useDb((s) => s.vendors.find((v) => v.id === vo.vendor_id) ?? null);
  const ledger = useDb((s) => s.ledger.filter((e) => e.vendor_order_id === vo.id));
  const claims = useDb((s) => s.claims.filter((c) => c.vendor_order_id === vo.id));
  const qc = logisticsOverlay.useStore((o) => o.qc[vo.id] ?? null);
  const picked = logisticsOverlay.useStore((o) => o.picked[vo.id] ?? null);
  const [showAlt, setShowAlt] = useState(["rejected_by_vendor", "qc_failed", "cancelled"].includes(vo.status));

  return (
    <Panel
      id={vo.id}
      title={
        <span className="flex flex-wrap items-center gap-2">
          {vo.sub_order_no}
          <StatusPill tone={vendorOrderStatusLabel[vo.status].tone}>{L(vendorOrderStatusLabel[vo.status])}</StatusPill>
        </span>
      }
      actions={
        <span className="flex flex-wrap gap-1">
          {allSlas(vo, now).map((s) => (
            <SlaBadge key={s.kind} sla={s} />
          ))}
        </span>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          <p className="text-sm">
            {tx("দোকান:", "Seller:")}{" "}
            <Link href={`/admin/vendors/${vo.vendor_id}`} className="font-semibold text-brand hover:underline">{vendor?.shop_name_bn ?? vo.vendor_id}</Link>
            <span className="text-muted"> · {L(fulfillmentLabel[vo.fulfillment])}</span>
          </p>
          <ul className="space-y-2">
            {vo.items.map((it) => (
              <li key={it.id} className="flex gap-3 rounded-xl border border-line p-2">
                <MediaImage src={it.snapshot.image} alt={it.snapshot.title} className="size-14 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 text-sm">
                  {it.listing_id ? (
                    <Link href={`/admin/catalog/listings?q=${it.listing_id}`} className="font-semibold hover:underline">{it.snapshot.title}</Link>
                  ) : (
                    <p className="font-semibold">{it.snapshot.title}</p>
                  )}
                  <p className="text-xs text-muted">
                    {L(sourceLabel[it.snapshot.source])} · {L(conditionLabel[it.snapshot.condition])}
                    {it.snapshot.grade ? ` · ${tx("গ্রেড", "Grade")} ${it.snapshot.grade}` : ""} · {warrantyLabel(it.snapshot.warranty_days, lang)} ·{" "}
                    {it.snapshot.is_returnable ? tx(`${d(it.snapshot.return_window_days)} দিনে ফেরত`, `${it.snapshot.return_window_days}-day return`) : tx("ফেরত নয়", "No return")}
                    {it.snapshot.is_electrical && ` · ${tx("ইলেকট্রিক্যাল", "Electrical")}`}
                  </p>
                  <p className="text-xs">
                    {it.snapshot.fits_user_vehicle === true && <span className="text-ok">✅ {tx("কাস্টমারের গাড়িতে ফিট লেখা ছিল", "Listed as fitting customer's car")}</span>}
                    {it.snapshot.fits_user_vehicle === false && <span className="text-bad">⚠️ {tx("কাস্টমারের গাড়িতে ফিট লেখা ছিল না", "Not listed for customer's car")}</span>}
                    {it.snapshot.fits_user_vehicle === null && <span className="text-muted">{tx("কাস্টমার গাড়ি সেট করেননি", "Customer car not set")}</span>}
                  </p>
                </div>
                <p className="shrink-0 text-right text-sm tabular-nums">
                  {d(it.qty)} × {taka(it.unit_price)}
                  <br />
                  <b>{taka(it.line_total)}</b>
                </p>
              </li>
            ))}
          </ul>
          <KV
            rows={[
              [tx("সাবটোটাল", "Subtotal"), taka(vo.subtotal)],
              [tx("ডেলিভারি চার্জ", "Delivery"), taka(vo.delivery_charge)],
              [tx("COD আদায়", "COD to collect"), taka(vo.cod_amount)],
              [tx("কমিশন / বিক্রেতা পাবে", "Commission / payable"), `${taka(vo.commission_amount)} / ${taka(vo.vendor_payable)}`],
              [tx("কুরিয়ার / ট্র্যাকিং", "Courier / tracking"), vo.tracking_no ? `${vo.courier} · ${vo.tracking_no}` : "—"],
              ...(vo.pickup_code ? ([[tx("পিকআপ কোড", "Pickup code"), vo.pickup_code]] as [string, string][]) : []),
              ...(vo.reject_reason ? ([[tx("কারণ", "Reason"), vo.reject_reason]] as [string, string][]) : []),
              ...(picked ? ([[tx("রাইডার পিকআপ", "Rider pickup"), picked.at.slice(0, 16).replace("T", " ")]] as [string, string][]) : []),
            ]}
          />
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <figure>
              <figcaption className="mb-1 text-xs font-semibold text-muted">{tx("প্যাকিং ছবি", "Packing photo")}</figcaption>
              {vo.packing_photo ? <MediaImage src={vo.packing_photo} alt="packing" className="aspect-square w-full rounded-xl" /> : <p className="grid aspect-square place-items-center rounded-xl bg-surface text-xs text-muted">{tx("নেই", "None")}</p>}
            </figure>
            <figure>
              <figcaption className="mb-1 text-xs font-semibold text-muted">{tx("QC ছবি", "QC photo")}</figcaption>
              {qc?.photos[0] ? <MediaImage src={qc.photos[0]} alt="qc" className="aspect-square w-full rounded-xl" /> : <p className="grid aspect-square place-items-center rounded-xl bg-surface text-xs text-muted">{vo.fulfillment === "assured_hub" ? tx("QC বাকি", "QC pending") : tx("প্রযোজ্য নয়", "N/A")}</p>}
            </figure>
          </div>
          {vo.qc && (
            <div className="text-sm">
              <StatusPill tone={vo.qc.result === "pass" ? "ok" : "bad"}>{vo.qc.result === "pass" ? tx("QC পাস", "QC passed") : tx("QC ফেল", "QC failed")}</StatusPill>
              {vo.qc.note && <span className="ml-2 text-muted">{vo.qc.note}</span>}
              {qc && (
                <ul className="mt-1 grid grid-cols-1 gap-0.5 text-xs sm:grid-cols-2">
                  {Object.entries(QC_KEYS).map(([k, l]) => (
                    <li key={k}>{qc.checklist[k] ? "✅" : "❌"} {L(l)}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {ledger.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-muted">{tx("লেজার এন্ট্রি", "Ledger entries")}</p>
              <ul className="space-y-0.5 text-xs">
                {ledger.map((e) => (
                  <li key={e.id} className="flex justify-between gap-2">
                    <span>{e.entry_type} · {e.note}</span>
                    <span className={e.amount < 0 ? "font-bold text-bad" : "font-bold text-ok"}>{taka(e.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {claims.map((c) => (
            <Link key={c.id} href={`/admin/disputes/${c.id}`} className="flex items-center justify-between rounded-xl border border-line px-3 py-2 text-sm hover:border-ink/30">
              <span>⚖️ {c.claim_no}</span>
              <StatusPill tone={claimStatusLabel[c.status].tone}>{L(claimStatusLabel[c.status])}</StatusPill>
            </Link>
          ))}
        </div>
      </div>
      <div className="mt-4 space-y-3 border-t border-line pt-3">
        <SubOrderActions vo={vo} />
        <button type="button" onClick={() => setShowAlt((x) => !x)} className="text-sm font-semibold text-brand hover:underline">
          🔁 {tx("বিকল্প বিক্রেতা খুঁজুন", "Find alternative seller")}
        </button>
        {showAlt && <AlternativeSellers vo={vo} />}
      </div>
    </Panel>
  );
}
