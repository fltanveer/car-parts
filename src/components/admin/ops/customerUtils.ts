import type { DB } from "@/lib/db/seed";

/** Every phone we know as a customer (profiles, requests, orders, garages). */
export const customerPhones = (s: DB) =>
  [...new Set([...s.profiles.map((p) => p.phone), ...s.requests.map((r) => r.user_phone), ...s.orders.map((o) => o.user_phone), ...s.vehicles.map((v) => v.owner)])].filter((p) => p.startsWith("+"));

/** COD parcels the customer refused: COD sub-orders that came back or got cancelled after shipping. */
export const codRefusals = (s: DB, phone: string) => {
  const orders = s.orders.filter((o) => o.user_phone === phone && o.payment_method !== "online");
  const ids = new Set(orders.map((o) => o.id));
  return s.vendorOrders.filter((v) => ids.has(v.order_id) && v.cod_amount > 0 && (v.status === "returned" || (v.status === "cancelled" && v.history.some((h) => h.to === "shipped")))).length;
};

export const customerSummary = (s: DB, phone: string) => {
  const profile = s.profiles.find((p) => p.phone === phone) ?? null;
  const orders = s.orders.filter((o) => o.user_phone === phone);
  return {
    phone,
    profile,
    name: profile?.full_name ?? orders[0]?.customer_name ?? s.requests.find((r) => r.user_phone === phone && r.contact_name)?.contact_name ?? null,
    orders: orders.length,
    spent: orders.reduce((t, o) => t + o.grand_total, 0),
    requests: s.requests.filter((r) => r.user_phone === phone).length,
    claims: s.claims.filter((c) => c.user_phone === phone).length,
    cars: s.vehicles.filter((v) => v.owner === phone).length,
    codRefusals: codRefusals(s, phone),
    last: [...orders.map((o) => o.created_at), ...s.requests.filter((r) => r.user_phone === phone).map((r) => r.created_at)].sort().pop() ?? null,
  };
};
