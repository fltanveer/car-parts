"use client";

import { ShoppingCart, Trash2 } from "lucide-react";
import { useT } from "@/components/providers/LangProvider";
import { Select, Stepper } from "@/components/ui/primitives";
import { useAdminSettings } from "@/lib/db/actions-admin-core";
import { useDb } from "@/lib/db/store";
import { fulfillmentLabel } from "@/lib/labels";
import { subOrderDeliveryCharge } from "@/lib/rules";
import type { Fulfillment, Listing, Vendor } from "@/lib/types";
import { Panel } from "../../index";

export interface PhoneCartLine {
  listingId: string;
  qty: number;
}

export interface VendorGroup {
  vendor: Vendor;
  lines: { listing: Listing; qty: number }[];
  fulfillment: Fulfillment;
  delivery: number;
  subtotal: number;
}

/** Groups cart lines per seller (one parcel each) with delivery charge (file 00 8.1). */
export function useVendorGroups(cart: PhoneCartLine[], fulfillment: Record<string, Fulfillment>, district: string): VendorGroup[] {
  const listings = useDb((s) => s.listings);
  const vendors = useDb((s) => s.vendors);
  const map = new Map<string, VendorGroup>();
  for (const c of cart) {
    const l = listings.find((x) => x.id === c.listingId);
    const v = l && vendors.find((x) => x.id === l.vendor_id);
    if (!l || !v) continue;
    const g = map.get(v.id) ?? { vendor: v, lines: [], fulfillment: fulfillment[v.id] ?? v.default_fulfillment, delivery: 0, subtotal: 0 };
    g.lines.push({ listing: l, qty: c.qty });
    map.set(v.id, g);
  }
  return [...map.values()].map((g) => ({
    ...g,
    subtotal: g.lines.reduce((t, x) => t + x.listing.price * x.qty, 0),
    delivery: subOrderDeliveryCharge(district, g.lines.map((x) => x.listing.size_class), g.fulfillment),
  }));
}

export const fulfillmentOptions = (g: VendorGroup, assuredOn: boolean): Fulfillment[] => {
  const out: Fulfillment[] = ["platform_pickup", "vendor_ship"];
  if (assuredOn && g.lines.every((x) => x.listing.is_assured_eligible)) out.push("assured_hub");
  if (g.vendor.allows_store_pickup) out.push("store_pickup");
  return out;
};

export function CartReview({ groups, setQty, setFulfillment }: { groups: VendorGroup[]; setQty: (id: string, qty: number) => void; setFulfillment: (vendorId: string, f: Fulfillment) => void }) {
  const { tx, L, taka, d } = useT();
  const cfg = useAdminSettings();
  return (
    <Panel title={<span className="flex items-center gap-2"><ShoppingCart className="size-5" /> {tx("৩. কার্ট", "3. Cart")} ({d(groups.reduce((n, g) => n + g.lines.length, 0))})</span>}>
      {groups.length === 0 && <p className="text-sm text-muted">{tx("এখনো কিছু যোগ হয়নি", "Nothing added yet")}</p>}
      {groups.length > 1 && <p className="mb-2 text-sm text-wait">{tx(`${d(groups.length)} জন বিক্রেতা = ${d(groups.length)}টা আলাদা প্যাকেট ও ডেলিভারি চার্জ`, `${groups.length} sellers = ${groups.length} parcels and delivery charges`)}</p>}
      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g.vendor.id} className="rounded-xl border border-line">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
              <p className="font-semibold">{g.vendor.shop_name_bn}</p>
              <Select value={g.fulfillment} onChange={(e) => setFulfillment(g.vendor.id, e.target.value as Fulfillment)} className="min-h-10 w-auto text-sm">
                {fulfillmentOptions(g, cfg.feature_flags.assured).map((f) => (
                  <option key={f} value={f}>{L(fulfillmentLabel[f])}</option>
                ))}
              </Select>
            </div>
            <ul className="divide-y divide-line">
              {g.lines.map(({ listing: l, qty }) => (
                <li key={l.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">{l.title_bn}</span>
                  <Stepper value={qty} min={1} max={l.stock_qty} onChange={(n) => setQty(l.id, n)} />
                  <span className="w-24 text-right font-semibold tabular-nums">{taka(l.price * qty)}</span>
                  <button type="button" onClick={() => setQty(l.id, 0)} className="grid size-10 place-items-center rounded-lg text-bad hover:bg-bad-soft" aria-label={tx("সরান", "Remove")}>
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
            <p className="flex justify-between border-t border-line px-3 py-2 text-sm text-muted">
              <span>{tx("ডেলিভারি চার্জ", "Delivery charge")}</span>
              <span className="tabular-nums">{taka(g.delivery)}</span>
            </p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
