"use client";

import { useState } from "react";
import { SellerGate, useVendorId } from "@/components/seller/Gate";
import { SellerPage } from "@/components/seller/SellerPage";
import { otherQuoteCount, type ReqTab, RequestCard, requestTab } from "@/components/seller/requests/shared";
import { useT } from "@/components/providers/LangProvider";
import { EmptyState, Notice, Tabs } from "@/components/ui/primitives";
import { useDb } from "@/lib/db/store";
import { useVendor } from "@/components/seller/Gate";

function Requests() {
  const { tx } = useT();
  const vid = useVendorId();
  const v = useVendor()!;
  const [tab, setTab] = useState<ReqTab>("new");
  const rows = useDb((s) =>
    s.requests
      .map((r) => ({ r, tab: requestTab(s, r, vid), others: otherQuoteCount(s, r.id, vid) }))
      .filter((x) => x.tab)
      .sort((a, b) => b.r.created_at.localeCompare(a.r.created_at)),
  );
  const count = (t: ReqTab) => rows.filter((x) => x.tab === t).length;
  const list = rows.filter((x) => x.tab === tab);
  return (
    <SellerPage
      title={tx("🙋 দাম চাই", "🙋 Price requests")}
      subtitle={tx("কাস্টমার যা খুঁজছে। আপনার কাছে থাকলে দাম দিন।", "What customers are looking for. Quote if you have it.")}
      guide={tx(
        "এখানে কাস্টমাররা পার্ট খুঁজছে। কার্ডে চাপ দিন। জিনিস থাকলে সবুজ বাটন চেপে দাম দিন। না থাকলে 'নেই' চাপুন, এতে স্কোর কমে না।",
        "Customers are looking for these parts. Tap a card. If you have it, tap the green button and quote. If not, tap 'Don't have', it won't hurt your score.",
      )}
    >
      {!v.is_open && <Notice tone="wait">{tx("দোকান বন্ধ, তাই নতুন রিকোয়েস্ট আসছে না। হোম থেকে খুলুন।", "Shop closed, so no new requests. Open it from home.")}</Notice>}
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "new", label: tx("নতুন", "New"), count: count("new") },
          { value: "quoted", label: tx("দাম দিয়েছি", "Quoted") },
          { value: "won", label: tx("বিক্রি হয়েছে", "Won") },
          { value: "lost", label: tx("হাতছাড়া", "Lost") },
        ]}
      />
      {list.length ? (
        <div className="space-y-3">
          {list.map((x) => (
            <RequestCard key={x.r.id} r={x.r} others={x.others} tab={tab} />
          ))}
        </div>
      ) : (
        <EmptyState icon="🙋" title={tab === "new" ? tx("এখন নতুন রিকোয়েস্ট নেই", "No new requests") : tx("এখানে কিছু নেই", "Nothing here")} body={tab === "new" ? tx("নতুন এলে শব্দ ও SMS পাবেন।", "You'll get a sound and SMS when one arrives.") : undefined} />
      )}
    </SellerPage>
  );
}

export default function Page() {
  return (
    <SellerGate>
      <Requests />
    </SellerGate>
  );
}
