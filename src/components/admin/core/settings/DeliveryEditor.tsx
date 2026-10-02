"use client";

import clsx from "clsx";
import Link from "next/link";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button } from "@/components/ui/primitives";
import { audit } from "@/lib/db/actions";
import { fulfillmentLabel } from "@/lib/labels";
import type { Fulfillment, SizeClass } from "@/lib/types";
import { Panel } from "../Panel";
import { NumCell } from "./NumCell";
import { deliveryOverlay, marketsOverlay, saveExtra, saveRate } from "./overlay";

const sizeLabel: Record<SizeClass, [string, string]> = {
  small: ["ছোট (হাতে নেওয়া যায়)", "Small"],
  medium: ["মাঝারি", "Medium"],
  large_heavy: ["বড়/ভারী", "Large/heavy"],
};
const zoneLabel: Record<"same_city" | "other", [string, string]> = { same_city: ["একই শহর (ঢাকা)", "Same city (Dhaka)"], other: ["অন্য শহর", "Other cities"] };

export function DeliveryEditor({ canEdit }: { canEdit: boolean }) {
  const { tx, taka, d, L } = useT();
  const rates = deliveryOverlay.useStore((o) => o.rates);
  const extras = deliveryOverlay.useStore((o) => o.extras);
  const markets = marketsOverlay.useStore((o) => o.markets);

  const onSaveRate = (i: number, field: "charge" | "courier_cost", v: number) => {
    saveRate(i, { [field]: v });
    toast(tx("রেট সেভ হয়েছে", "Rate saved"));
  };

  return (
    <>
      <Panel title={tx("জোন × সাইজ: কাস্টমারের চার্জ ও কুরিয়ার খরচ", "Zone × size: customer charge & courier cost")}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <thead className="text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-2 py-2">{tx("জোন", "Zone")}</th>
                <th className="px-2 py-2">{tx("সাইজ", "Size")}</th>
                <th className="px-2 py-2 text-right">{tx("কাস্টমারের চার্জ ৳", "Charge ৳")}</th>
                <th className="px-2 py-2 text-right">{tx("কুরিয়ার খরচ ৳", "Courier cost ৳")}</th>
                <th className="px-2 py-2 text-right">{tx("মার্জিন", "Margin")}</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r, i) => {
                const margin = r.charge - r.courier_cost;
                return (
                  <tr key={`${r.zone}-${r.size_class}`} className="border-t border-line">
                    <td className="px-2 py-2 font-semibold">{tx(...zoneLabel[r.zone])}</td>
                    <td className="px-2 py-2">{tx(...sizeLabel[r.size_class])}</td>
                    <td className="px-2 py-2 text-right">
                      <NumCell key={r.charge} value={r.charge} canEdit={canEdit} label={tx("চার্জ", "Charge")} onSave={(v) => onSaveRate(i, "charge", v)} />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <NumCell key={r.courier_cost} value={r.courier_cost} canEdit={canEdit} label={tx("কুরিয়ার খরচ", "Courier cost")} onSave={(v) => onSaveRate(i, "courier_cost", v)} />
                    </td>
                    <td className={clsx("px-2 py-2 text-right font-bold tabular-nums", margin < 0 ? "text-bad" : "text-ok")}>{taka(margin)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">{tx("চার্জ প্রতি সাব-অর্ডারে (প্রতিটা দোকান আলাদা প্যাকেট)। লাল মার্জিন মানে লোকসান।", "Charged per sub-order (one parcel per shop). Red margin means loss.")}</p>
      </Panel>

      <Panel title={tx("পাঠানোর পদ্ধতি অনুযায়ী বাড়তি চার্জ", "Fulfillment extras")}>
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(extras) as Fulfillment[]).map((f) => (
            <div key={f} className="flex items-center justify-between gap-2 rounded-xl border border-line p-3">
              <span className="font-semibold">{L(fulfillmentLabel[f])}</span>
              <span className="flex items-center gap-1">
                +<NumCell key={extras[f]} value={extras[f]} canEdit={canEdit} label={L(fulfillmentLabel[f])} onSave={(v) => { saveExtra(f, v); toast(tx("সেভ হয়েছে", "Saved")); }} /> ৳
              </span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title={tx("পিকআপ রাউন্ডের সময়সূচি", "Pickup round schedule")} actions={<Link href="/admin/settings/markets" className="text-sm font-semibold text-brand hover:underline">{tx("বাজার সম্পাদনা →", "Edit markets →")}</Link>}>
        <ul className="divide-y divide-line">
          {markets.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="font-semibold">{tx(m.bn, m.en)}</span>
              <span className="text-sm text-muted">{m.slots.length ? m.slots.join(" · ") : tx("রাউন্ড নেই (বিক্রেতা নিজে পাঠায়)", "No round (seller ships)")}</span>
            </li>
          ))}
        </ul>
      </Panel>

      {canEdit && (
        <Button
          variant="ghost"
          onClick={() => {
            deliveryOverlay.reset();
            audit("ডেলিভারি রেট ডিফল্টে ফেরানো", "delivery_rates");
            toast(tx("ডিফল্টে ফেরানো হয়েছে", "Reset to default"), "info");
          }}
        >
          {tx("সব রেট ডিফল্টে ফেরান", "Reset all rates to default")} ({d(rates.length)})
        </Button>
      )}
    </>
  );
}
