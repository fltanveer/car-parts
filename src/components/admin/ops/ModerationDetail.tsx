"use client";

import Link from "next/link";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { ConditionBadge, SourceBadge, VerifiedBadge, WarrantyBadge } from "@/components/shared/Badges";
import { ShopLogo, toast } from "@/components/shared/Misc";
import { MediaImage } from "@/components/ui/MediaImage";
import { Button, Input, Notice, StatusPill, Textarea } from "@/components/ui/primitives";
import { penalizeVendor, suspendVendor, warnVendor } from "@/lib/db/actions-admin-ops";
import { decideModeration, type ModerationDecision } from "@/lib/db/actions-admin-ops-trust";
import { benchmarkFor, categoryPath, getMarket } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import { listingStatusLabel } from "@/lib/labels";
import { priceAnomaly } from "@/lib/rules";
import type { ModerationItem } from "@/lib/types";
import { FilterChips, Panel } from "./ui";

export const READY_REASONS = [
  { bn: "ছবি অস্পষ্ট, পরিষ্কার আসল ছবি দিন", en: "Photo unclear, add clear real photos" },
  { bn: "ইন্টারনেটের ছবি, নিজের তোলা ছবি দিন", en: "Internet photo, use your own" },
  { bn: "ক্যাটাগরি ভুল হয়েছে", en: "Wrong category" },
  { bn: "উৎস বা অবস্থা ঠিক লেখা হয়নি", en: "Source or condition wrong" },
  { bn: "দাম বাজারদরের সাথে মিলছে না, যাচাই করুন", en: "Price doesn't match market" },
  { bn: "ইঞ্জিন/চেসিস নম্বরের ছবি লাগবে", en: "Engine/chassis number photo needed" },
  { bn: "এই পণ্য প্ল্যাটফর্মে বিক্রি নিষেধ", en: "This item is prohibited" },
  { bn: "চুরির সন্দেহ: কোথা থেকে এসেছে তার প্রমাণ দিন", en: "Stolen suspect: show origin proof" },
  { bn: "চ্যাটে নম্বর শেয়ার করা যাবে না", en: "Don't share numbers in chat" },
];

/** Listing as the customer sees it + seller info + decision buttons (file 03 8.2). */
export function ModerationDetail({ item }: { item: ModerationItem }) {
  const { tx, L, taka, d } = useT();
  const db = useDb((s) => s);
  const listing = item.target_type === "listing" ? db.listings.find((l) => l.id === item.target_id) ?? null : null;
  const vendor = db.vendors.find((v) => v.id === (listing?.vendor_id ?? (item.target_type === "vendor" ? item.target_id : ""))) ?? null;
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const done = item.status !== "open";
  const anomaly = listing ? priceAnomaly(listing.price, benchmarkFor(listing.category_id, listing.condition)) : null;
  const sameImage = listing ? db.listings.filter((l) => l.id !== listing.id && l.vendor_id !== listing.vendor_id && l.media.some((m) => !m.url.startsWith("ph:") && listing.media.some((x) => x.url === m.url))) : [];

  const decide = (dec: ModerationDecision) => {
    if (dec !== "approve" && !reason.trim()) return toast(tx("কারণ বাছুন", "Pick a reason"), "bad");
    decideModeration(item.id, dec, dec === "approve" ? null : reason.trim());
    toast(dec === "approve" ? tx("অনুমোদিত", "Approved") : tx("বিক্রেতাকে জানানো হয়েছে", "Seller notified"));
  };

  return (
    <div className="space-y-4">
      {listing ? (
        <Panel title={tx("কাস্টমার যেমন দেখবে", "As the customer sees it")} action={<StatusPill tone={listingStatusLabel[listing.status].tone}>{L(listingStatusLabel[listing.status])}</StatusPill>}>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {listing.media.map((m, i) => <MediaImage key={i} src={m.url} alt={listing.title_bn} className="size-36 shrink-0 rounded-xl" />)}
          </div>
          <p className="mt-3 text-xs text-muted">{categoryPath(listing.category_id).map((c) => c.name_bn).join(" › ")}</p>
          <h3 className="text-xl font-bold">{listing.title_bn}</h3>
          <p className="text-2xl font-bold">{taka(listing.price)}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <SourceBadge source={listing.source} />
            <ConditionBadge condition={listing.condition} grade={listing.grade} />
            <WarrantyBadge days={listing.warranty_days} />
          </div>
          <p className="mt-2 text-sm">{tx("স্টক", "Stock")} {d(listing.stock_qty)} · {tx("পার্ট নম্বর", "Part no.")} {listing.part_number ?? "—"} · {tx("মান", "Quality")} {d(listing.quality_score)}</p>
          {listing.description_bn && <p className="mt-2 text-sm text-ink-2">{listing.description_bn}</p>}
          {anomaly && <Notice tone={anomaly === "too_low" ? "bad" : "wait"} className="mt-3">{anomaly === "too_low" ? tx("⚠️ বাজারদরের চেয়ে অনেক কম (প্রতারণার ঝুঁকি)", "⚠️ Far below market (fraud risk)") : tx("⚠️ বাজারদরের চেয়ে অনেক বেশি (ভুল দাম?)", "⚠️ Far above market (typo?)")}</Notice>}
          {sameImage.length > 0 && <Notice tone="bad" className="mt-3">{tx(`একই ছবি অন্য দোকানের ${d(sameImage.length)}টা লিস্টিংয়ে`, `Same photo on ${sameImage.length} other sellers' listings`)}</Notice>}
          {listing.rejection_reason && <p className="mt-2 text-sm text-bad">{tx("আগের কারণ", "Last reason")}: {listing.rejection_reason}</p>}
        </Panel>
      ) : item.target_type !== "vendor" ? (
        <Notice>{tx(`লক্ষ্য: ${item.target_type} ${item.target_id}`, `Target: ${item.target_type} ${item.target_id}`)}</Notice>
      ) : null}

      {vendor && (
        <Panel title={tx("বিক্রেতা", "Seller")} action={<Link href={`/admin/vendors/${vendor.id}`} className="text-sm font-semibold text-brand">{tx("৩৬০ ভিউ", "360 view")}</Link>}>
          <div className="flex items-center gap-3">
            <ShopLogo name={vendor.shop_name_bn} color={vendor.logo_color} />
            <div>
              <p className="font-bold">{vendor.shop_name_bn} <VerifiedBadge vendor={vendor} withLabel={false} /></p>
              <p className="text-sm text-muted">{L(getMarket(vendor.market_area))} · {tx("স্তর", "Level")} {d(vendor.verification_level)} · {tx("স্কোর", "Score")} {d(vendor.score)} · {vendor.status}</p>
              <p className="text-sm text-muted">{tx("লিস্টিং", "Listings")} {d(db.listings.filter((l) => l.vendor_id === vendor.id).length)} · {tx("নম্বর শেয়ারের চেষ্টা", "Contact attempts")} <b className={vendor.contact_attempts >= 3 ? "text-bad" : ""}>{d(vendor.contact_attempts)}</b></p>
            </div>
          </div>
        </Panel>
      )}

      <Panel title={done ? tx(`সিদ্ধান্ত হয়েছে: ${item.status}`, `Decided: ${item.status}`) : tx("সিদ্ধান্ত", "Decision")}>
        {item.decision_note && <p className="mb-2 text-sm">📝 {item.decision_note}</p>}
        <p className="mb-1.5 text-sm font-semibold">{tx("তৈরি কারণ (বিক্রেতা সহজ বাংলায় পাবে)", "Ready reasons (seller sees plain Bangla)")}</p>
        <FilterChips<string> value={reason} onChange={setReason} items={READY_REASONS.map((r) => ({ value: r.bn, label: L(r) }))} />
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} className="mt-2 min-h-20" placeholder={tx("বা নিজে লিখুন", "Or write your own")} />
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button variant="ok" size="lg" disabled={done} onClick={() => decide("approve")}>✅ {tx("অনুমোদন", "Approve")}</Button>
          <Button variant="outline" size="lg" disabled={done || !listing} onClick={() => decide("changes")}>✏️ {tx("সংশোধন চাই", "Request changes")}</Button>
          <Button variant="danger" size="lg" disabled={done} onClick={() => decide("reject")}>❌ {tx("বাতিল", "Reject")}</Button>
        </div>
        {vendor && (
          <div className="mt-4 border-t border-line pt-3">
            <p className="mb-2 text-sm font-semibold">{tx("বিক্রেতার উপর ব্যবস্থা", "Action on the seller")}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" disabled={!reason.trim()} onClick={() => { warnVendor(vendor.id, reason.trim()); toast(tx("সতর্কতা পাঠানো হয়েছে", "Warning sent")); }}>⚠️ {tx("সতর্কতা", "Warn")}</Button>
              <div className="w-24"><Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="৳" className="min-h-9" /></div>
              <Button size="sm" variant="outline" disabled={!reason.trim() || !(Number(amount) > 0)} onClick={() => { penalizeVendor(vendor.id, Number(amount), reason.trim(), item.target_id); setAmount(""); toast(tx("জরিমানা হয়েছে", "Penalty applied")); }}>💸 {tx("জরিমানা", "Penalty")}</Button>
              <Button size="sm" variant="danger" disabled={!reason.trim() || vendor.status === "suspended"} onClick={() => { suspendVendor(vendor.id, reason.trim(), "let_finish"); toast(tx("দোকান স্থগিত", "Shop suspended"), "bad"); }}>⏸️ {tx("স্থগিত", "Suspend")}</Button>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
