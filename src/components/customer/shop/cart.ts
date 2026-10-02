// Cart → per-shop groups (one group = one parcel = one sub-order, file 00 8.1).
import { fitsVehicle, isPublic, listingById, offersForProduct, quoteSizeClass, vendorById } from "@/lib/db/queries";
import type { CheckoutLine } from "@/lib/db/actions";
import type { DB } from "@/lib/db/seed";
import { smallOrderShortfall, smallOrderSurcharge, subOrderDeliveryCharge } from "@/lib/rules";
import type { Fulfillment, Listing, Quote, SizeClass, Vendor } from "@/lib/types";
import { activeVehicleOf, homeDistrict } from "./data";

export interface CartRow {
  index: number;
  qty: number;
  listing: Listing | null;
  quote: Quote | null;
  vendorId: string;
  title: string;
  image: string;
  price: number;
  size: SizeClass;
  dispatchDays: number;
  fit: boolean | null;
  available: boolean;
  maxQty: number;
}

export interface CartGroupData {
  vendor: Vendor;
  rows: CartRow[];
  subtotal: number;
  sizes: SizeClass[];
  dispatchDays: number;
  shortfall: number;
  assuredEligible: boolean;
}

export const cartRows = (s: DB): CartRow[] => {
  const gen = activeVehicleOf(s)?.generation_id ?? null;
  return s.cart
    .map((c, index): CartRow | null => {
      if (c.listing_id) {
        const l = listingById(s, c.listing_id);
        if (!l) return null;
        return {
          index, qty: c.qty, listing: l, quote: null, vendorId: l.vendor_id, title: l.title_bn, image: l.media[0]?.url ?? "ph:part", price: l.price, size: l.size_class,
          dispatchDays: l.dispatch_days, fit: fitsVehicle(l.fitments, l.is_universal, gen), available: isPublic(s, l), maxQty: Math.max(1, l.stock_qty),
        };
      }
      const q = s.quotes.find((x) => x.id === c.quote_id);
      if (!q) return null;
      const req = s.requests.find((r) => r.id === q.request_id);
      const size: SizeClass = quoteSizeClass(s, q);
      return {
        index, qty: c.qty, listing: null, quote: q, vendorId: q.vendor_id, title: q.title, image: q.media[0] ?? "ph:part", price: q.price, size,
        // A quote was given for the customer's own car.
        dispatchDays: q.dispatch_days, fit: true, available: q.status === "submitted" || q.status === "accepted", maxQty: req?.items[q.item_index]?.qty ?? 1,
      };
    })
    .filter((r): r is CartRow => !!r);
};

export const cartGroups = (s: DB): CartGroupData[] => {
  const map = new Map<string, CartRow[]>();
  cartRows(s).forEach((r) => map.set(r.vendorId, [...(map.get(r.vendorId) ?? []), r]));
  return [...map.entries()]
    .map(([vid, rows]) => {
      const vendor = vendorById(s, vid);
      if (!vendor) return null;
      const subtotal = rows.filter((r) => r.available).reduce((t, r) => t + r.price * r.qty, 0);
      return {
        vendor, rows, subtotal, sizes: rows.map((r) => r.size), dispatchDays: Math.max(...rows.map((r) => r.dispatchDays)),
        shortfall: smallOrderShortfall(subtotal), assuredEligible: rows.every((r) => r.listing?.is_assured_eligible),
      };
    })
    .filter((g): g is CartGroupData => !!g);
};

// Same formula as placeOrder(), so the total shown is the total charged.
export const groupDelivery = (g: CartGroupData, district: string, f: Fulfillment = "platform_pickup") =>
  subOrderDeliveryCharge(district, g.sizes, f) + (f === "store_pickup" ? 0 : smallOrderSurcharge(g.subtotal));

export const cartTotals = (s: DB, groups: CartGroupData[], fulfillment: Record<string, Fulfillment> = {}, district = homeDistrict(s)) => {
  const subtotal = groups.reduce((t, g) => t + g.subtotal, 0);
  const delivery = groups.reduce((t, g) => t + groupDelivery(g, district, fulfillment[g.vendor.id]), 0);
  return { subtotal, delivery, total: subtotal + delivery };
};

/** Same product offered by another shop already in the cart → fewer parcels. */
export const sameShopAlternatives = (s: DB, groups: CartGroupData[]) => {
  if (groups.length < 2) return [];
  const inCartVendors = new Set(groups.map((g) => g.vendor.id));
  return groups.flatMap((g) =>
    g.rows
      .filter((r) => r.listing?.catalog_product_id)
      .flatMap((r) =>
        offersForProduct(s, r.listing!.catalog_product_id!)
          .filter((o) => o.vendor_id !== g.vendor.id && inCartVendors.has(o.vendor_id))
          .map((alt) => ({ row: r, alt, altVendor: vendorById(s, alt.vendor_id)! })),
      ),
  );
};

export const checkoutLines = (groups: CartGroupData[]): CheckoutLine[] =>
  groups.flatMap((g) => g.rows.filter((r) => r.available).map((r) => ({ vendor_id: g.vendor.id, listing: r.listing, quote: r.quote, qty: r.qty })));
