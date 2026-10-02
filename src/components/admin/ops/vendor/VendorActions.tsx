"use client";

import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { NumberPad, toast } from "@/components/shared/Misc";
import { Sheet } from "@/components/ui/Sheet";
import { Button, Field, Input, Notice, Textarea, Toggle } from "@/components/ui/primitives";
import { audit, switchVendor } from "@/lib/db/actions";
import {
  closeVendor, penalizeVendor, reactivateVendor, setCommission, setPayoutHold, setTier, suspendVendor, toggleBadge, useOps, warnVendor,
} from "@/lib/db/actions-admin-ops";
import { useDb } from "@/lib/db/store";
import type { Vendor } from "@/lib/types";
import { FilterChips, Panel } from "../ui";

type Dialog = null | "warn" | "penalty" | "suspend" | "close";
const BADGES: { key: Vendor["badges"][number]; bn: string; en: string }[] = [
  { key: "verified", bn: "✅ যাচাইকৃত", en: "✅ Verified" },
  { key: "trusted", bn: "🏅 বিশ্বস্ত", en: "🏅 Trusted" },
  { key: "assured_partner", bn: "✔️ Assured পার্টনার", en: "✔️ Assured partner" },
];

/** Admin actions on a seller (file 03 7.3). Every one is audited. */
export function VendorActions({ v }: { v: Vendor }) {
  const { tx, L, d } = useT();
  const router = useRouter();
  const held = useOps((s) => s.payoutHolds.includes(v.id));
  const pending = useDb((s) => s.vendorOrders.filter((o) => o.vendor_id === v.id && !["delivered", "completed", "cancelled", "rejected_by_vendor", "returned"].includes(o.status)).length);
  const [pct, setPct] = useState(String(v.commission_percent));
  const [dialog, setDialog] = useState<Dialog>(null);
  const [text, setText] = useState("");
  const [amount, setAmount] = useState(0);
  const [orders, setOrders] = useState<"let_finish" | "cancel_pending">("let_finish");
  const close = () => {
    setDialog(null);
    setText("");
    setAmount(0);
  };

  return (
    <Panel title={tx("কাজ", "Actions")}>
      <div className="space-y-4">
        <div className="flex items-end gap-2">
          <Field label={tx("কমিশন %", "Commission %")}>
            <Input type="number" min={0} max={30} step={0.5} value={pct} onChange={(e) => setPct(e.target.value)} className="min-h-10" />
          </Field>
          <Button size="sm" variant="outline" disabled={Number(pct) === v.commission_percent || Number.isNaN(Number(pct))} onClick={() => { setCommission(v.id, Number(pct)); toast(tx("কমিশন বদলেছে", "Commission updated")); }}>
            {tx("সেভ", "Save")}
          </Button>
        </div>
        <div>
          <p className="mb-1 text-sm font-semibold">{tx("সাবস্ক্রিপশন", "Subscription")}</p>
          <FilterChips<Vendor["subscription_tier"]> value={v.subscription_tier} onChange={(t) => setTier(v.id, t)} items={[{ value: "free", label: "Free" }, { value: "basic", label: "Basic" }, { value: "pro", label: "Pro" }]} />
        </div>
        <div>
          <p className="mb-1 text-sm font-semibold">{tx("ব্যাজ", "Badges")}</p>
          <div className="flex flex-wrap gap-2">
            {BADGES.map((b) => (
              <button key={b.key} type="button" onClick={() => toggleBadge(v.id, b.key)} aria-pressed={v.badges.includes(b.key)} className={`min-h-10 rounded-full border px-3 text-sm font-medium ${v.badges.includes(b.key) ? "border-ok bg-ok-soft text-ok" : "border-line"}`}>
                {L(b)}
              </button>
            ))}
          </div>
        </div>
        <Toggle checked={held} onChange={(h) => setPayoutHold(v.id, h)} label={tx("⛔ পেআউট আটকানো", "⛔ Hold payouts")} />
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => setDialog("warn")}>⚠️ {tx("সতর্কতা", "Warn")}</Button>
          <Button variant="outline" onClick={() => setDialog("penalty")}>💸 {tx("জরিমানা", "Penalty")}</Button>
          {v.status === "suspended" || v.status === "closed" ? (
            <Button variant="ok" onClick={() => { reactivateVendor(v.id); toast(tx("আবার চালু হয়েছে", "Reactivated")); }}>▶️ {tx("পুনরায় চালু", "Reactivate")}</Button>
          ) : (
            <Button variant="danger" onClick={() => setDialog("suspend")}>⏸️ {tx("স্থগিত", "Suspend")}</Button>
          )}
          <Button variant="danger" disabled={v.status === "closed"} onClick={() => setDialog("close")}>🚫 {tx("বন্ধ", "Close")}</Button>
        </div>
        <Button
          variant="primary"
          full
          onClick={() => {
            audit("ছদ্মবেশে দেখা (বিক্রেতা প্যানেল)", v.shop_name_bn);
            switchVendor(v.id);
            router.push("/seller");
          }}
        >
          <Eye className="size-4" /> {tx("বিক্রেতার চোখে দেখুন (অডিট হবে)", "View as seller (audited)")}
        </Button>
      </div>

      <Sheet open={dialog === "warn"} onClose={close} title={tx("বিক্রেতাকে সতর্কতা", "Warn seller")}>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={tx("যেমন: চ্যাটে নম্বর দেবেন না, পরের বার জরিমানা হবে।", "e.g. Don't share numbers in chat.")} />
        <Button full size="lg" className="mt-3" disabled={text.trim().length < 5} onClick={() => { warnVendor(v.id, text.trim()); close(); toast(tx("সতর্কতা পাঠানো হয়েছে", "Warning sent")); }}>
          {tx("পাঠান", "Send")}
        </Button>
      </Sheet>

      <Sheet open={dialog === "penalty"} onClose={close} title={tx("জরিমানা (লেজারে কাটা হবে)", "Penalty (ledger debit)")}>
        <NumberPad value={amount} onChange={setAmount} />
        <Field label={tx("কারণ", "Reason")}>
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={tx("যেমন: দেরিতে হস্তান্তর (GH-4630-A)", "e.g. Late handover")} />
        </Field>
        <Button variant="danger" full size="lg" className="mt-3" disabled={amount <= 0 || text.trim().length < 3} onClick={() => { penalizeVendor(v.id, amount, text.trim()); close(); toast(tx("জরিমানা যোগ হয়েছে", "Penalty added")); }}>
          {tx("জরিমানা করুন", "Apply penalty")}
        </Button>
      </Sheet>

      <Sheet open={dialog === "suspend"} onClose={close} title={tx("দোকান স্থগিত", "Suspend shop")}>
        <div className="space-y-3 pb-2">
          <Notice tone="bad">{tx("স্থগিত করলে দোকানের সব পণ্য সঙ্গে সঙ্গে সার্চ থেকে সরে যাবে।", "All listings leave search immediately.")}</Notice>
          <Field label={tx("কারণ (বাধ্যতামূলক)", "Reason (required)")}>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
          <p className="font-semibold">{tx(`চলমান অর্ডার: ${d(pending)}টা। এগুলোর কী হবে?`, `Active orders: ${pending}. What happens to them?`)}</p>
          <FilterChips<"let_finish" | "cancel_pending">
            value={orders}
            onChange={setOrders}
            items={[
              { value: "let_finish", label: tx("চলমানগুলো শেষ করতে দিন", "Let them finish") },
              { value: "cancel_pending", label: tx("গ্রহণ-বাকিগুলো বাতিল", "Cancel not-yet-accepted") },
            ]}
          />
          <Button variant="danger" full size="lg" disabled={text.trim().length < 5} onClick={() => { suspendVendor(v.id, text.trim(), orders); close(); toast(tx("দোকান স্থগিত", "Shop suspended"), "bad"); }}>
            {tx("স্থগিত করুন", "Suspend")}
          </Button>
        </div>
      </Sheet>

      <Sheet open={dialog === "close"} onClose={close} title={tx("দোকান বন্ধ", "Close shop")}>
        <Field label={tx("কারণ (বাধ্যতামূলক)", "Reason (required)")}>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        <Button variant="danger" full size="lg" className="mt-3" disabled={text.trim().length < 5} onClick={() => { closeVendor(v.id, text.trim()); close(); }}>
          {tx("বন্ধ করুন", "Close shop")}
        </Button>
      </Sheet>
    </Panel>
  );
}
