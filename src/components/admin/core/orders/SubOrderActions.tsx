"use client";

import { Ban, CheckCircle2, Truck } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Sheet } from "@/components/ui/Sheet";
import { Button, Field, Input, Select } from "@/components/ui/primitives";
import { nextStatuses } from "@/lib/db/actions";
import { adminAcceptOnBehalf, adminCancelSubOrder, adminSetStatus } from "@/lib/db/actions-admin-core";
import { vendorOrderStatusLabel } from "@/lib/labels";
import type { VendorOrder, VendorOrderStatus } from "@/lib/types";
import { ReasonSheet } from "../ReasonSheet";

export const COURIERS = ["Pathao", "Steadfast", "RedX", "Sundarban", "eCourier"];

/** Only valid next statuses are offered (file 00 13). */
export function SubOrderActions({ vo }: { vo: VendorOrder }) {
  const { tx, L } = useT();
  const [dialog, setDialog] = useState<null | "accept" | "cancel" | "reject" | "ship" | { to: VendorOrderStatus }>(null);
  const [courier, setCourier] = useState(vo.courier ?? COURIERS[1]);
  const [tracking, setTracking] = useState(vo.tracking_no ?? "");
  const next = nextStatuses(vo);
  if (!next.length) return <p className="text-sm text-muted">{tx("এই অবস্থা থেকে আর কোনো ধাপ নেই।", "No further steps from this status.")}</p>;

  const click = (to: VendorOrderStatus) => {
    if (to === "accepted" && vo.status === "pending_vendor") return setDialog("accept");
    if (to === "cancelled") return setDialog("cancel");
    if (to === "rejected_by_vendor") return setDialog("reject");
    if (to === "shipped") return setDialog("ship");
    setDialog({ to });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {next.map((to) => (
        <Button key={to} size="sm" variant={to === "cancelled" || to === "rejected_by_vendor" || to === "qc_failed" ? "danger" : "outline"} onClick={() => click(to)}>
          {to === "cancelled" ? <Ban className="size-4" /> : to === "shipped" ? <Truck className="size-4" /> : <CheckCircle2 className="size-4" />}
          {to === "accepted" && vo.status === "pending_vendor" ? tx("বিক্রেতার পক্ষে গ্রহণ", "Accept for seller") : `→ ${L(vendorOrderStatusLabel[to])}`}
        </Button>
      ))}

      <ReasonSheet
        open={dialog === "accept"}
        onClose={() => setDialog(null)}
        title={tx("বিক্রেতার পক্ষে গ্রহণ", "Accept on seller's behalf")}
        label={tx("বিক্রেতার সম্মতির নোট (কে, কখন, কীভাবে বলেছে)", "Seller consent note (who, when, how)")}
        presets={[tx("দোকান মালিক ফোনে সম্মতি দিয়েছেন", "Shop owner agreed by phone"), tx("দোকানের কর্মচারী WhatsApp-এ নিশ্চিত করেছে", "Shop staff confirmed on WhatsApp")]}
        confirmLabel={tx("সম্মতি নিয়ে গ্রহণ করুন", "Accept with consent")}
        tone="ok"
        minLength={8}
        onSubmit={(note) => {
          adminAcceptOnBehalf(vo.id, note);
          toast(tx("গ্রহণ করা হয়েছে, কল লগে নোট রাখা হলো", "Accepted; consent saved in call log"));
        }}
      />
      <ReasonSheet
        open={dialog === "cancel"}
        onClose={() => setDialog(null)}
        title={tx(`${vo.sub_order_no} বাতিল করুন`, `Cancel ${vo.sub_order_no}`)}
        presets={[tx("দোকানে স্টক নেই", "Out of stock at shop"), tx("কাস্টমার বাতিল চেয়েছেন", "Customer asked to cancel"), tx("সময়সীমা পার হয়েছে", "Deadline breached"), tx("সন্দেহজনক অর্ডার", "Suspicious order")]}
        confirmLabel={tx("বাতিল করুন (টাকা থাকলে স্বয়ংক্রিয় রিফান্ড)", "Cancel (auto refund if paid)")}
        onSubmit={(reason) => {
          adminCancelSubOrder(vo.id, reason);
          toast(tx("বাতিল হয়েছে", "Cancelled"), "info");
        }}
      />
      <ReasonSheet
        open={dialog === "reject"}
        onClose={() => setDialog(null)}
        title={tx("দোকান দিতে পারেনি", "Seller declined")}
        presets={[tx("স্টক নেই", "No stock"), tx("দাম ভুল ছিল", "Wrong price")]}
        confirmLabel={tx("দোকানের প্রত্যাখ্যান হিসেবে রাখুন", "Record seller decline")}
        onSubmit={(reason) => adminSetStatus(vo.id, "rejected_by_vendor", reason, { reject_reason: reason })}
      />
      {typeof dialog === "object" && dialog && (
        <ReasonSheet
          open
          onClose={() => setDialog(null)}
          title={`${vo.sub_order_no} → ${L(vendorOrderStatusLabel[dialog.to])}`}
          label={tx("নোট (কেন অ্যাডমিন বদলাচ্ছে)", "Note (why admin changes it)")}
          presets={[tx("দোকান ফোনে জানিয়েছে", "Shop told us by phone"), tx("কুরিয়ার নিশ্চিত করেছে", "Courier confirmed")]}
          confirmLabel={tx("অবস্থা বদলান", "Change status")}
          tone="brand"
          onSubmit={(note) => {
            adminSetStatus(vo.id, dialog.to, note);
            toast(tx("অবস্থা বদলানো হয়েছে", "Status changed"));
          }}
        />
      )}
      <Sheet open={dialog === "ship"} onClose={() => setDialog(null)} title={tx("কুরিয়ারে পাঠানো হয়েছে", "Handed to courier")}>
        <div className="space-y-3 pb-2">
          <Field label={tx("কুরিয়ার", "Courier")}>
            <Select value={courier} onChange={(e) => setCourier(e.target.value)}>
              {COURIERS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label={tx("ট্র্যাকিং নম্বর", "Tracking number")}>
            <Input value={tracking} onChange={(e) => setTracking(e.target.value.toUpperCase())} />
          </Field>
          <Button
            full
            size="lg"
            variant="brand"
            disabled={tracking.trim().length < 4}
            onClick={() => {
              adminSetStatus(vo.id, "shipped", `${courier} ${tracking}`, { courier, tracking_no: tracking.trim() });
              setDialog(null);
              toast(tx("পাঠানো হিসেবে চিহ্নিত", "Marked shipped"));
            }}
          >
            <Truck className="size-5" /> {tx("পাঠানো হয়েছে", "Mark shipped")}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
