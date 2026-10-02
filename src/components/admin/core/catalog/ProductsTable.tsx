"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { type Column, DataTable, FilterSelect } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { Button, StatusPill } from "@/components/ui/primitives";
import type { DB } from "@/lib/db/seed";
import { sourceLabel } from "@/lib/labels";
import { useDb } from "@/lib/db/store";
import type { CatalogProduct } from "@/lib/types";
import { pathLabel, useBrands, useCategories, useMergedInto, useProducts } from "./overlay";

export const selectOfferCounts = (s: DB) => {
  const out: Record<string, number> = {};
  s.listings.forEach((l) => {
    if (l.catalog_product_id && l.status !== "removed") out[l.catalog_product_id] = (out[l.catalog_product_id] ?? 0) + 1;
  });
  return out;
};

const STATUS_TONE = { active: "ok", pending_review: "wait", merged: "info", inactive: "bad" } as const;
export const productStatusLabel = (s: CatalogProduct["status"], tx: (bn: string, en: string) => string) =>
  ({ active: tx("চালু", "Active"), pending_review: tx("পর্যালোচনায়", "Pending review"), merged: tx("একত্র করা", "Merged"), inactive: tx("বন্ধ", "Inactive") })[s];

export function ProductsTable({ onEdit }: { onEdit: (p: CatalogProduct | null) => void }) {
  const { tx, lang, d, L } = useT();
  const products = useProducts();
  const cats = useCategories();
  const brands = useBrands();
  const merged = useMergedInto();
  const offers = useDb(selectOfferCounts);
  const [status, setStatus] = useState<"all" | CatalogProduct["status"]>("all");

  const rows = products.filter((p) => status === "all" || p.status === status);
  const brandName = (id: string | null) => brands.find((b) => b.id === id)?.name ?? "—";

  const cols: Column<CatalogProduct>[] = [
    {
      key: "name",
      header: tx("নাম", "Name"),
      sort: (p) => p.name_bn,
      cell: (p) => (
        <div className="min-w-48">
          <p className="font-semibold">{lang === "bn" ? p.name_bn : p.name}</p>
          <p className="text-xs text-muted">{lang === "bn" ? p.name : p.name_bn}</p>
        </div>
      ),
    },
    { key: "cat", header: tx("ক্যাটাগরি", "Category"), sort: (p) => pathLabel(cats, p.category_id, lang), cell: (p) => <span className="text-xs">{pathLabel(cats, p.category_id, lang)}</span>, hideOnMobile: true },
    { key: "brand", header: tx("ব্র্যান্ড", "Brand"), sort: (p) => brandName(p.brand_id), cell: (p) => brandName(p.brand_id) },
    { key: "source", header: tx("উৎস", "Source"), cell: (p) => <span className="text-xs font-semibold">{L(sourceLabel[p.source])}</span>, hideOnMobile: true },
    { key: "pn", header: tx("পার্ট নম্বর", "Part no."), cell: (p) => <code className="text-xs">{p.part_number ?? "—"}</code> },
    { key: "offers", header: tx("অফার", "Offers"), sort: (p) => offers[p.id] ?? 0, cell: (p) => <span className="font-bold tabular-nums">{d(offers[p.id] ?? 0)}</span> },
    {
      key: "status",
      header: tx("অবস্থা", "Status"),
      sort: (p) => p.status,
      cell: (p) => (
        <span className="space-y-0.5">
          <StatusPill tone={STATUS_TONE[p.status]}>{productStatusLabel(p.status, tx)}</StatusPill>
          {merged[p.id] && <span className="block text-[11px] text-muted">→ {products.find((x) => x.id === merged[p.id])?.name_bn ?? merged[p.id]}</span>}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={cols}
      rowKey={(p) => p.id}
      onRowClick={(p) => onEdit(p)}
      search={(p) => `${p.id} ${p.name} ${p.name_bn} ${p.part_number ?? ""} ${p.cross_ref_numbers.join(" ")} ${brandName(p.brand_id)}`}
      searchPlaceholder={tx("নাম, পার্ট নম্বর, ক্রস-রেফ…", "Name, part no., cross-ref…")}
      initialSort={{ key: "offers", dir: "desc" }}
      toolbar={
        <>
          <FilterSelect
            label={tx("অবস্থা", "Status")}
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: tx("সব অবস্থা", "All statuses") },
              ...(["active", "pending_review", "merged", "inactive"] as const).map((s) => ({ value: s, label: productStatusLabel(s, tx) })),
            ]}
          />
          <Button size="sm" variant="brand" onClick={() => onEdit(null)}>
            <Plus className="size-4" /> {tx("নতুন মাস্টার", "New master")}
          </Button>
        </>
      }
    />
  );
}
