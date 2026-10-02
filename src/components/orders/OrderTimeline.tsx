"use client";

import { orderStatusLabel } from "@/lib/i18n";
import type { Order } from "@/lib/types";
import { useT } from "../providers/LangProvider";
import { StatusTimeline } from "../status/StatusTimeline";
import { orderFlow } from "./helpers";

// Order status history on top of the shared StatusTimeline.
export function OrderTimeline({ order }: { order: Order }) {
  const { lang, tx } = useT();
  const flow = orderFlow(order);
  const at = (s: string) => [...order.history].reverse().find((h) => h.status === s)?.at ?? null;
  const steps = flow.map((s) => ({ key: s, label: orderStatusLabel[s][lang], at: at(s) }));

  let current = flow.indexOf(order.status);
  let stopped: string | null = null;
  if (order.status === "delivered") current = flow.length;
  if (order.status === "cancelled" || order.status === "returned") {
    const reached = order.history.map((h) => flow.indexOf(h.status as (typeof flow)[number])).filter((i) => i >= 0);
    current = reached.length ? Math.max(...reached) + 1 : 0;
    stopped = order.status === "cancelled" ? tx("অর্ডার বাতিল হয়েছে", "Order cancelled") : tx("পার্ট ফেরত এসেছে", "Part returned");
  }
  if (current < 0) current = 0;

  return <StatusTimeline steps={steps} currentIndex={current} stopped={stopped} />;
}
