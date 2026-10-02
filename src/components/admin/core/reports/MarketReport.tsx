"use client";

import { BarList, type Column, DataTable } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { markets } from "@/lib/db/queries";
import type { DB } from "@/lib/db/seed";
import { Grid2, liveOrderIds, pct, ReportBlock, sum } from "./util";

interface MarketRow {
  id: string;
  name: string;
  vendors: number;
  active: number;
  orders: number;
  sales: number;
}
interface DistrictRow {
  district: string;
  orders: number;
  gmv: number;
  cod: number;
  codReturns: number;
}

const DEAD = ["cancelled", "rejected_by_vendor", "qc_failed"];

/** Market / area (file 03 §20): sellers & sales by market; orders & COD returns by customer district. */
export function MarketReport({ s }: { s: DB }) {
  const { tx, d, taka, L } = useT();
  const live = liveOrderIds(s);
  const mrows: MarketRow[] = markets
    .map((m) => {
      const vs = s.vendors.filter((v) => v.market_area === m.id || (m.id === "other" && !markets.some((x) => x.id === v.market_area)));
      const ids = new Set(vs.map((v) => v.id));
      const vos = s.vendorOrders.filter((o) => ids.has(o.vendor_id) && !DEAD.includes(o.status));
      return { id: m.id, name: L(m), vendors: vs.length, active: vs.filter((v) => v.status === "active").length, orders: vos.length, sales: sum(vos.map((o) => o.subtotal)) };
    })
    .filter((r) => r.vendors || r.orders);

  const districts = [...new Set(s.orders.map((o) => o.address.district))];
  const drows: DistrictRow[] = districts.map((district) => {
    const os = s.orders.filter((o) => o.address.district === district);
    const ids = new Set(os.map((o) => o.id));
    const codSubs = s.vendorOrders.filter((v) => ids.has(v.order_id) && v.cod_amount > 0);
    return {
      district,
      orders: os.filter((o) => live.has(o.id)).length,
      gmv: sum(os.filter((o) => live.has(o.id)).map((o) => o.grand_total)),
      cod: codSubs.length,
      codReturns: codSubs.filter((v) => v.status === "returned" || v.status === "return_requested").length,
    };
  });

  const mcols: Column<MarketRow>[] = [
    { key: "name", header: tx("বাজার", "Market"), sort: (r) => r.name, cell: (r) => r.name },
    { key: "v", header: tx("বিক্রেতা (সক্রিয়)", "Sellers (active)"), sort: (r) => r.vendors, cell: (r) => `${d(r.vendors)} (${d(r.active)})` },
    { key: "o", header: tx("সাব-অর্ডার", "Sub-orders"), sort: (r) => r.orders, cell: (r) => d(r.orders) },
    { key: "s", header: tx("বিক্রি", "Sales"), sort: (r) => r.sales, cell: (r) => taka(r.sales) },
  ];
  const dcols: Column<DistrictRow>[] = [
    { key: "d", header: tx("জেলা", "District"), sort: (r) => r.district, cell: (r) => r.district },
    { key: "o", header: tx("অর্ডার", "Orders"), sort: (r) => r.orders, cell: (r) => d(r.orders) },
    { key: "g", header: "GMV", sort: (r) => r.gmv, cell: (r) => taka(r.gmv) },
    { key: "c", header: tx("COD পার্সেল", "COD parcels"), sort: (r) => r.cod, cell: (r) => d(r.cod) },
    { key: "r", header: tx("COD ফেরত", "COD returns"), sort: (r) => r.codReturns, cell: (r) => <span className={r.codReturns ? "font-bold text-bad" : ""}>{d(r.codReturns)} ({d(pct(r.codReturns, r.cod))}%)</span> },
  ];

  return (
    <div className="space-y-5">
      <Grid2>
        <ReportBlock title={tx("বাজার অনুযায়ী বিক্রি", "Sales by market")}>
          <BarList data={mrows.map((r) => ({ label: r.name, value: r.sales, sub: tx(`${d(r.vendors)} বিক্রেতা`, `${r.vendors} sellers`) }))} format={taka} />
        </ReportBlock>
        <ReportBlock title={tx("কাস্টমারের জেলা অনুযায়ী অর্ডার", "Orders by customer district")}>
          <BarList data={drows.map((r) => ({ label: r.district, value: r.orders, tone: r.codReturns ? "wait" : "info" }))} />
        </ReportBlock>
      </Grid2>
      <ReportBlock title={tx("বাজার", "Markets")} csvName="markets.csv" csv={[["market", "sellers", "active_sellers", "sub_orders", "sales"], ...mrows.map((r) => [r.id, r.vendors, r.active, r.orders, r.sales])]}>
        <DataTable rows={mrows} columns={mcols} rowKey={(r) => r.id} initialSort={{ key: "s", dir: "desc" }} />
      </ReportBlock>
      <ReportBlock title={tx("জেলা", "Districts")} csvName="districts.csv" csv={[["district", "orders", "gmv", "cod_parcels", "cod_returns"], ...drows.map((r) => [r.district, r.orders, r.gmv, r.cod, r.codReturns])]}>
        <DataTable rows={drows} columns={dcols} rowKey={(r) => r.district} initialSort={{ key: "o", dir: "desc" }} />
      </ReportBlock>
    </div>
  );
}
