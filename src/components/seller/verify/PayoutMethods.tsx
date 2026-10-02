"use client";

import { useState } from "react";
import { addPayoutMethod, removePayoutMethod, setDefaultPayout } from "@/lib/db/actions-seller";
import type { PayoutMethod, Vendor } from "@/lib/types";
import { useT } from "../../providers/LangProvider";
import { toast } from "../../shared/Misc";
import { Button, Card, Field, Input, Notice, StatusPill } from "../../ui/primitives";
import { OptionGrid } from "../Choices";

const NAMES = { bkash: "bKash", nagad: "Nagad", bank: "Bank" } as const;

/** Where money goes: bKash/Nagad/bank in the owner's own name (file 02 §3). */
export function PayoutMethods({ vendor }: { vendor: Vendor }) {
  const { tx, d } = useT();
  const [adding, setAdding] = useState(vendor.payout_methods.length === 0);
  const [method, setMethod] = useState<PayoutMethod["method"]>("bkash");
  const [number, setNumber] = useState("");
  const [name, setName] = useState(vendor.owner_name);
  const digits = number.replace(/\D/g, "");
  const validNo = method === "bank" ? digits.length >= 8 : /^01[3-9]\d{8}$/.test(digits);
  const ownName = name.trim() === vendor.owner_name.trim();

  return (
    <div className="space-y-3">
      {vendor.payout_methods.map((p) => (
        <Card key={p.id} className="flex items-center gap-3 p-3">
          <span className="text-2xl">{p.method === "bank" ? "🏦" : "📱"}</span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">{NAMES[p.method]} •••• {d(p.last4)}</span>
            <span className="block text-sm text-muted">{p.account_name}</span>
          </span>
          {p.is_default ? <StatusPill tone="ok">{tx("ডিফল্ট", "Default")}</StatusPill> : <Button size="sm" variant="outline" onClick={() => setDefaultPayout(vendor.id, p.id)}>{tx("ডিফল্ট করুন", "Make default")}</Button>}
          {!p.verified && <StatusPill tone="wait">{tx("যাচাই বাকি", "Pending")}</StatusPill>}
          <button type="button" aria-label={tx("মুছুন", "Remove")} className="px-2 text-bad" onClick={() => removePayoutMethod(vendor.id, p.id)}>✕</button>
        </Card>
      ))}
      {adding ? (
        <Card className="space-y-3 p-4">
          <OptionGrid value={method} onChange={setMethod} cols={3} options={[{ value: "bkash", icon: "📱", title: "bKash" }, { value: "nagad", icon: "📱", title: "Nagad" }, { value: "bank", icon: "🏦", title: tx("ব্যাংক", "Bank") }]} />
          <Field label={method === "bank" ? tx("অ্যাকাউন্ট নম্বর", "Account number") : tx("নম্বর", "Number")}>
            <Input inputMode="numeric" value={number} onChange={(e) => setNumber(e.target.value)} placeholder={method === "bank" ? "1234567890" : "01XXXXXXXXX"} />
          </Field>
          <Field label={tx("কার নামে", "Account name")} hint={tx("দোকান মালিকের নিজের নামে হতে হবে", "Must be in the owner's own name")}>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          {!ownName && <Notice tone="bad">{tx(`নাম "${vendor.owner_name}" এর সাথে মিলতে হবে। অন্যের নামে টাকা পাঠানো হয় না।`, `Name must match "${vendor.owner_name}". We don't pay to other people's accounts.`)}</Notice>}
          <Button variant="ok" size="lg" full disabled={!validNo || !ownName} onClick={() => { addPayoutMethod(vendor.id, { method, account_name: name.trim(), number: digits }); setNumber(""); setAdding(false); toast(tx("সেভ হয়েছে, টিম যাচাই করবে", "Saved, the team will verify")); }}>
            💾 {tx("সেভ করুন", "Save")}
          </Button>
        </Card>
      ) : (
        <Button variant="outline" full onClick={() => setAdding(true)}>＋ {tx("নতুন পদ্ধতি যোগ", "Add method")}</Button>
      )}
    </div>
  );
}
