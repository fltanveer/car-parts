"use client";

import clsx from "clsx";
import { vendorOrderStatusLabel } from "@/lib/labels";
import type { VendorOrder, VendorOrderStatus } from "@/lib/types";
import { useT } from "../../providers/LangProvider";

interface Step {
  key: VendorOrderStatus;
  icon: string;
  bn: string;
  en: string;
}

const BAD: VendorOrderStatus[] = ["rejected_by_vendor", "cancelled", "qc_failed"];

const stepsFor = (vo: VendorOrder): Step[] => {
  const pickup = vo.fulfillment === "store_pickup";
  return [
    { key: "pending_vendor", icon: "📥", bn: "অর্ডার পেয়েছে", en: "Order received" },
    { key: "accepted", icon: "✅", bn: "দোকান নিশ্চিত করেছে", en: "Shop confirmed" },
    { key: "ready_to_ship", icon: "📦", bn: pickup ? "প্যাক হয়েছে, নিতে আসুন" : "প্যাক হয়েছে", en: pickup ? "Packed, ready to collect" : "Packed" },
    ...(vo.fulfillment === "assured_hub" ? [{ key: "at_hub_qc" as const, icon: "🔎", bn: "যাচাই হচ্ছে (Assured)", en: "Being checked (Assured)" }] : []),
    ...(!pickup ? [{ key: "shipped" as const, icon: "🚚", bn: "পথে", en: "On the way" }] : []),
    { key: "delivered", icon: "🏁", bn: pickup ? "হাতে পেয়েছেন" : "পৌঁছেছে", en: pickup ? "Collected" : "Delivered" },
  ];
};

/** Which timeline step a status sits on. */
const stepKey = (status: VendorOrderStatus, vo: VendorOrder): VendorOrderStatus => {
  if (status === "picked_up") return vo.fulfillment === "assured_hub" ? "at_hub_qc" : "shipped";
  if (["completed", "return_requested", "returned"].includes(status)) return "delivered";
  return status;
};

/** 📥 → ✅ → 📦 → (🔎) → 🚚 → 🏁 per parcel (file 01 §7.1). */
export function ParcelTimeline({ vo }: { vo: VendorOrder }) {
  const { tx, L, dateTime } = useT();
  const steps = stepsFor(vo);
  const bad = BAD.includes(vo.status);
  // For a failed parcel, show progress up to the last good status.
  const lastGood = bad ? [...vo.history].reverse().find((h) => !BAD.includes(h.to as VendorOrderStatus))?.to ?? "pending_vendor" : vo.status;
  const cur = steps.findIndex((s) => s.key === stepKey(lastGood as VendorOrderStatus, vo));
  const at = (k: VendorOrderStatus) => vo.history.find((h) => h.to === k || (k === "shipped" && h.to === "picked_up" && vo.fulfillment === "platform_pickup"))?.at;

  return (
    <ol className="space-y-0">
      {steps.map((s, i) => {
        const isDone = i < cur || (i === cur && ["delivered", "completed", "returned", "return_requested"].includes(vo.status));
        const isCur = i === cur && !isDone && !bad;
        const t = at(s.key);
        return (
          <li key={s.key} className="relative flex gap-3 pb-4 last:pb-0">
            {i < steps.length - 1 && <span className={clsx("absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-0.5", i < cur ? "bg-ok" : "bg-line")} aria-hidden />}
            <span
              className={clsx(
                "grid size-10 shrink-0 place-items-center rounded-full text-lg",
                isDone ? "bg-ok-soft ring-2 ring-ok" : isCur ? "bg-wait-soft ring-2 ring-wait-bg" : "bg-surface opacity-50 grayscale",
              )}
              aria-hidden
            >
              {s.icon}
            </span>
            <span className="min-w-0 pt-1.5">
              <span className={clsx("block font-semibold", !isDone && !isCur && "text-muted")}>
                {tx(s.bn, s.en)}
                {isCur && <span className="ml-2 text-xs font-bold text-wait">● {tx("এখন", "Now")}</span>}
              </span>
              {t && (isDone || isCur) && <span className="block text-xs text-muted">{dateTime(t)}</span>}
            </span>
          </li>
        );
      })}
      {bad && (
        <li className="mt-3 flex items-center gap-3 rounded-xl bg-bad-soft p-3 font-semibold text-bad">
          <span className="grid size-10 place-items-center rounded-full bg-card text-lg" aria-hidden>
            ✖️
          </span>
          {L(vendorOrderStatusLabel[vo.status])}
          {vo.reject_reason && <span className="font-normal">· {vo.reject_reason}</span>}
        </li>
      )}
    </ol>
  );
}
