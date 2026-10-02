"use client";

import { Lightbulb } from "lucide-react";
import { useT } from "@/components/providers/LangProvider";
import { Notice, StatusPill } from "@/components/ui/primitives";
import { claimTypeLabel } from "@/lib/labels";
import { getClaimOptions } from "@/lib/rules";
import type { Claim, Order, OrderItem, VendorOrder } from "@/lib/types";
import { KV, Panel } from "../index";
import { liabilityLabel } from "./ClaimCard";

export type Resolution = "refund" | "partial_refund" | "replace" | "rejected";

/** Rule from file 00 §9.1 evaluated at the time the claim was filed. */
export const suggestFor = (claim: Claim, vo: VendorOrder, item: OrderItem) => {
  const opt = getClaimOptions(item.snapshot, vo.delivered_at, new Date(claim.created_at).getTime()).find((o) => o.type === claim.type) ?? null;
  const liability = opt?.liability ?? claim.liability;
  const resolution: Resolution = liability === "vendor" ? "refund" : liability === "customer" ? (claim.type === "change_of_mind" && opt?.eligible ? "refund" : "rejected") : "partial_refund";
  const shippingPayer: "seller" | "customer" | "platform" = liability === "vendor" ? "seller" : liability === "customer" ? "customer" : "platform";
  return { opt, liability, resolution, shippingPayer };
};

export function RuleSuggestion({ claim, vo, item, order }: { claim: Claim; vo: VendorOrder; item: OrderItem; order: Order }) {
  const { tx, L, lang } = useT();
  const { opt, liability, resolution } = suggestFor(claim, vo, item);
  const snap = item.snapshot;
  const yes = tx("হ্যাঁ", "Yes");
  const no = tx("না", "No");
  const resText: Record<Resolution, string> = {
    refund: tx("পূর্ণ রিফান্ড বা বদল", "Full refund or replacement"),
    partial_refund: tx("প্রমাণ দেখে আংশিক / পূর্ণ", "Partial or full after evidence"),
    replace: tx("বদল", "Replacement"),
    rejected: tx("দাবি বাতিল (বা কাস্টমারের খরচে ফেরত)", "Reject (or return at buyer's cost)"),
  };
  return (
    <Panel title={<span className="flex items-center gap-2"><Lightbulb className="size-5 text-wait" /> {tx("নিয়মের সাজেশন", "Rule suggestion")}</span>}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-lg">{claimTypeLabel[claim.type].icon}</span>
        <b>{L(claimTypeLabel[claim.type])}</b>
        <StatusPill tone={liabilityLabel[liability].tone}>{L(liabilityLabel[liability])}</StatusPill>
      </div>
      {opt && <Notice tone={liability === "vendor" ? "bad" : liability === "customer" ? "info" : "wait"}>{lang === "bn" ? opt.rule_bn : opt.rule_en}</Notice>}
      {opt && !opt.eligible && (
        <Notice tone="wait" className="mt-2">
          {tx("দাবির সময় নিয়মের শর্ত পূরণ হয়নি: ", "Rule condition not met when filed: ")}
          {lang === "bn" ? opt.reason_bn : opt.reason_en}
        </Notice>
      )}
      <KV
        className="mt-3"
        rows={[
          [tx("কাস্টমার 'আমার গাড়ি' সেট করেছিল?", "Customer set 'My car'?"), order.user_vehicle_id ? yes : no],
          [tx("লিস্টিংয়ে ওই গাড়িতে ফিট লেখা?", "Listing claimed fit?"), snap.fits_user_vehicle === null ? "—" : snap.fits_user_vehicle ? yes : tx("না (⚠️ সতর্কতা উপেক্ষা)", "No (⚠️ warning ignored)")],
          [tx("ইলেকট্রিক্যাল?", "Electrical?"), snap.is_electrical ? yes : no],
          [tx("প্যাকিং ছবি আছে?", "Packing photo?"), vo.packing_photo ? yes : no],
          [tx("QC পাস করেছিল?", "Passed QC?"), vo.qc ? (vo.qc.result === "pass" ? yes : no) : "—"],
        ]}
      />
      <p className="mt-3 text-sm">
        {tx("প্রস্তাবিত সিদ্ধান্ত: ", "Suggested decision: ")}
        <b>{resText[resolution]}</b>
      </p>
    </Panel>
  );
}
