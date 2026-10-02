"use client";

import { PhoneCall } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AdminPage } from "@/components/admin/core";
import { OrdersTable } from "@/components/admin/core/orders/OrdersTable";
import type { SlaKind } from "@/components/admin/core/orders/sla";
import { SlaView } from "@/components/admin/core/orders/SlaView";
import { useT } from "@/components/providers/LangProvider";
import { useNow } from "@/components/shared/Misc";
import { ButtonLink, Tabs } from "@/components/ui/primitives";

function OrdersScreen() {
  const { tx } = useT();
  const params = useSearchParams();
  const now = useNow();
  const [tab, setTab] = useState<"orders" | "sla">(params.get("tab") === "sla" ? "sla" : "orders");
  const [kind, setKind] = useState<SlaKind | "all">((params.get("sla") as SlaKind | null) ?? "all");

  return (
    <AdminPage
      title={tx("অর্ডার", "Orders")}
      subtitle={tx("প্যারেন্ট অর্ডার ও ভেতরে প্রতিটা দোকানের সাব-অর্ডার", "Parent orders with one sub-order per seller")}
      guide={tx(
        "প্রতিটা অর্ডারের নিচে দোকান অনুযায়ী সাব-অর্ডার আছে। উপরের ফিল্টার দিয়ে অবস্থা, দোকান, এলাকা বা SLA লঙ্ঘন বেছে নিন। লাল মানে সময়সীমা পার হয়ে গেছে। ফোনে অর্ডার নিতে ডানের বোতাম চাপুন।",
        "Each order lists its per-seller sub-orders. Use the filters for status, seller, area or SLA breach. Red means a deadline has passed. Use the button on the right to take a phone order.",
      )}
      actions={
        <ButtonLink href="/admin/orders/new" variant="brand" size="lg">
          <PhoneCall className="size-5" /> {tx("ফোনে অর্ডার নিন", "Take phone order")}
        </ButtonLink>
      }
    >
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "orders", label: tx("সব অর্ডার", "All orders") },
          { value: "sla", label: tx("SLA ভিউ", "SLA view") },
        ]}
      />
      {tab === "orders" ? <OrdersTable now={now} initialBreach={params.get("breach") === "1"} /> : <SlaView now={now} kind={kind} onKind={setKind} />}
    </AdminPage>
  );
}

export default function OrdersPage() {
  return (
    <Suspense>
      <OrdersScreen />
    </Suspense>
  );
}
