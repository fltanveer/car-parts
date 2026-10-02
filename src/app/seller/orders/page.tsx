"use client";

import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { SellerGate, useVendorId } from "@/components/seller/Gate";
import { OrderCard, type OrderTab, TAB_STATUSES } from "@/components/seller/orders/shared";
import { SellerPage } from "@/components/seller/SellerPage";
import { EmptyState, Tabs } from "@/components/ui/primitives";
import { vendorOrdersOf } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";

function Orders() {
  const { tx } = useT();
  const vid = useVendorId();
  const orders = useDb((s) => vendorOrdersOf(s, vid));
  const claimed = useDb((s) => new Set(s.claims.filter((c) => c.vendor_id === vid && !["closed", "resolved_rejected"].includes(c.status)).map((c) => c.vendor_order_id)));
  const [tab, setTab] = useState<OrderTab>(orders.some((o) => o.status === "pending_vendor") ? "new" : "ship");
  const inTab = (t: OrderTab) =>
    orders.filter((o) => (t === "problem" ? TAB_STATUSES.problem.includes(o.status) || claimed.has(o.id) : TAB_STATUSES[t].includes(o.status) && !(t === "done" && claimed.has(o.id))));
  const list = inTab(tab).sort((a, b) => (tab === "new" ? a.accept_by.localeCompare(b.accept_by) : (b.history[0]?.at ?? "").localeCompare(a.history[0]?.at ?? "")));
  return (
    <SellerPage
      title={tx("📦 অর্ডার", "📦 Orders")}
      guide={tx("নতুন অর্ডার সময়ের মধ্যে গ্রহণ করুন। তারপর প্যাক করে ছবি দিন। প্যাকেটে বড় করে অর্ডার কোড লিখুন।", "Accept new orders in time. Then pack and add a photo. Write the order code big on the parcel.")}
    >
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "new", label: tx("নতুন", "New"), count: inTab("new").length },
          { value: "ship", label: tx("পাঠাতে হবে", "To ship"), count: inTab("ship").length },
          { value: "way", label: tx("পথে", "On the way") },
          { value: "done", label: tx("পৌঁছেছে", "Delivered") },
          { value: "problem", label: tx("ফেরত/সমস্যা", "Returns/problems"), count: inTab("problem").length },
          { value: "cancel", label: tx("বাতিল", "Cancelled") },
        ]}
      />
      {list.length ? <div className="space-y-3">{list.map((o) => <OrderCard key={o.id} o={o} />)}</div> : <EmptyState icon="📦" title={tx("এখানে কোনো অর্ডার নেই", "No orders here")} />}
    </SellerPage>
  );
}

export default function Page() {
  return (
    <SellerGate>
      <Orders />
    </SellerGate>
  );
}
