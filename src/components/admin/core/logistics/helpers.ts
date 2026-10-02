import type { DB } from "@/lib/db/seed";
import type { PickupRound, VendorOrder } from "@/lib/types";

export const PICKUP_FULFILLMENT = new Set<VendorOrder["fulfillment"]>(["platform_pickup", "assured_hub"]);

const dhakaDay = (t: number | string) => new Date(t).toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
export const sameDay = (a: string, now: number) => dhakaDay(a) === dhakaDay(now);

export const activeRound = (r: PickupRound) => r.status !== "done";

/** Packed parcels that need a rider and are not yet on an open round (file 03 10.2). */
export const waitingParcels = (s: DB): VendorOrder[] => {
  const onRound = new Set(s.pickupRounds.filter(activeRound).flatMap((r) => r.vendor_order_ids));
  return s.vendorOrders.filter((v) => v.status === "ready_to_ship" && PICKUP_FULFILLMENT.has(v.fulfillment) && !onRound.has(v.id));
};

export const marketOf = (s: DB, vo: VendorOrder) => s.vendors.find((v) => v.id === vo.vendor_id)?.market_area ?? "other";
