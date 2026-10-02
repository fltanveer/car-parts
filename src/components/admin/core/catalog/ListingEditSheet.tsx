"use client";

import { Check, ExternalLink, Save, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Sheet } from "@/components/ui/Sheet";
import { Button, Chip, Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { audit, patchListing } from "@/lib/db/actions";
import { notifyVendor } from "@/lib/db/actions-admin-core";
import { listingStatusLabel } from "@/lib/labels";
import { listingQuality } from "@/lib/rules";
import type { Listing, ListingStatus } from "@/lib/types";

const PRESETS_BN = ["দাম ভুল লেখা ছিল", "ছবি ও নাম মেলেনি", "স্টক শেষ জানিয়েছেন", "নিষিদ্ধ/সীমিত জিনিস", "বানান ঠিক করা হয়েছে"];
const PRESETS_EN = ["Price typo", "Photo and title mismatch", "Seller says out of stock", "Prohibited/restricted item", "Spelling fixed"];

/** Admin correction of one listing: audited and the seller is told why (file 03 §9.4). */
export function ListingEditSheet({ l, onClose }: { l: Listing; onClose: () => void }) {
  const { tx, L, lang, d, taka } = useT();
  const [f, setF] = useState({ price: String(l.price), stock_qty: String(l.stock_qty), status: l.status, title: l.title, title_bn: l.title_bn });
  const [reason, setReason] = useState("");
  const q = listingQuality(l);
  const presets = lang === "bn" ? PRESETS_BN : PRESETS_EN;

  const price = Number(f.price);
  const stock = Number(f.stock_qty);
  const patch: Partial<Listing> = {};
  if (price !== l.price) patch.price = price;
  if (stock !== l.stock_qty) patch.stock_qty = stock;
  if (f.status !== l.status) patch.status = f.status;
  if (f.title.trim() !== l.title) patch.title = f.title.trim();
  if (f.title_bn.trim() !== l.title_bn) patch.title_bn = f.title_bn.trim();
  const changed = Object.keys(patch);
  const valid = changed.length > 0 && price > 0 && Number.isInteger(stock) && stock >= 0 && f.title.trim() && f.title_bn.trim() && reason.trim().length >= 3;

  const save = () => {
    const diff = changed.map((k) => `${k}: ${String(l[k as keyof Listing])} → ${String(patch[k as keyof Listing])}`).join("; ");
    patchListing(l.id, patch);
    audit("লিস্টিং সংশোধন (অ্যাডমিন)", `${l.id}: ${diff} · কারণ: ${reason.trim()}`);
    notifyVendor(l.vendor_id, "অ্যাডমিন আপনার লিস্টিং সংশোধন করেছে", `${l.title_bn}: ${reason.trim()} (${diff})`, `/seller/products/${l.id}`);
    toast(tx("সংশোধন হয়েছে, বিক্রেতাকে জানানো হয়েছে", "Saved, seller notified"));
    onClose();
  };

  return (
    <Sheet open onClose={onClose} title={tx("লিস্টিং সংশোধন", "Edit listing")}>
      <div className="space-y-4 pb-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <code className="text-xs">{l.id}</code>
          <Link href={`/l/${l.id}`} target="_blank" className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
            {tx("কাস্টমার যেমন দেখে", "Customer view")} <ExternalLink className="size-3.5" />
          </Link>
          <Link href={`/admin/vendors/${l.vendor_id}`} className="font-semibold text-brand hover:underline">
            {tx("বিক্রেতা", "Seller")}
          </Link>
        </div>

        <div className="rounded-xl border border-line p-3">
          <p className="mb-2 font-semibold">
            {tx("মান স্কোর", "Quality score")}: <span className={q.score >= 70 ? "text-ok" : q.score >= 40 ? "text-wait" : "text-bad"}>{d(q.score)}/{d(100)}</span>
          </p>
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {q.checks.map((c) => (
              <li key={c.key} className="flex items-center gap-1.5">
                {c.ok ? <Check className="size-4 text-ok" /> : <X className="size-4 text-bad" />}
                {L(c)} <span className="text-xs text-muted">+{d(c.points)}</span>
              </li>
            ))}
          </ul>
        </div>

        <Field label={tx("বাংলা নাম", "Bangla title")}>
          <Input value={f.title_bn} onChange={(e) => setF({ ...f, title_bn: e.target.value })} />
        </Field>
        <Field label={tx("ইংরেজি নাম", "English title")}>
          <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={tx("দাম (৳)", "Price (৳)")} hint={tx(`আগে ${taka(l.price)}`, `Was ${taka(l.price)}`)} error={price > 0 ? undefined : tx("দাম দিন", "Enter price")}>
            <Input inputMode="numeric" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value.replace(/[^0-9]/g, "") })} />
          </Field>
          <Field label={tx("স্টক", "Stock")}>
            <Input inputMode="numeric" value={f.stock_qty} onChange={(e) => setF({ ...f, stock_qty: e.target.value.replace(/[^0-9]/g, "") })} />
          </Field>
          <Field label={tx("অবস্থা", "Status")}>
            <Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as ListingStatus })}>
              {(Object.keys(listingStatusLabel) as ListingStatus[]).map((s) => (
                <option key={s} value={s}>
                  {L(listingStatusLabel[s])}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div>
          <p className="mb-1.5 font-semibold">{tx("কারণ (বিক্রেতাকে জানানো হবে, বাধ্যতামূলক)", "Reason (sent to the seller, required)")}</p>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <Chip key={p} active={reason === p} onClick={() => setReason(p)}>
                {p}
              </Chip>
            ))}
          </div>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-20" />
        </div>

        <Button size="lg" variant="brand" full disabled={!valid} onClick={save}>
          <Save className="size-5" /> {changed.length ? tx(`${d(changed.length)}টা পরিবর্তন সংরক্ষণ`, `Save ${changed.length} change(s)`) : tx("কিছু বদলানো হয়নি", "Nothing changed")}
        </Button>
      </div>
    </Sheet>
  );
}
