"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { AdminPage, type Column, DataTable, FilterSelect, Panel } from "@/components/admin/core";
import { BRAND_TYPES } from "@/components/admin/core/catalog/constants";
import { addBrand, useBrands, useProducts } from "@/components/admin/core/catalog/overlay";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, Field, Input, Select, StatusPill } from "@/components/ui/primitives";
import type { DB } from "@/lib/db/seed";
import { useDb } from "@/lib/db/store";
import type { Brand } from "@/lib/types";

const selBrandCounts = (s: DB) => {
  const out: Record<string, number> = {};
  s.listings.forEach((l) => l.brand_id && l.status !== "removed" && (out[l.brand_id] = (out[l.brand_id] ?? 0) + 1));
  return out;
};

type BType = Brand["type"];

export default function BrandsPage() {
  const { tx, d, L } = useT();
  const brands = useBrands();
  const products = useProducts();
  const counts = useDb(selBrandCounts);
  const [type, setType] = useState<"all" | BType>("all");
  const [name, setName] = useState("");
  const [newType, setNewType] = useState<BType>("aftermarket");
  const [country, setCountry] = useState("");

  const dup = brands.some((b) => b.name.toLowerCase() === name.trim().toLowerCase());
  const valid = name.trim() && country.trim() && !dup;
  const added = (b: Brand) => b.id.startsWith("br-new-");

  const cols: Column<Brand>[] = [
    { key: "name", header: tx("নাম", "Name"), sort: (b) => b.name, cell: (b) => <span className="font-semibold">{b.name} {added(b) && <StatusPill tone="ok">{tx("নতুন", "new")}</StatusPill>}</span> },
    { key: "type", header: tx("ধরন", "Type"), sort: (b) => b.type, cell: (b) => L(BRAND_TYPES[b.type]) },
    { key: "country", header: tx("দেশ", "Country"), sort: (b) => b.country, cell: (b) => b.country },
    { key: "products", header: tx("মাস্টার পণ্য", "Masters"), sort: (b) => products.filter((p) => p.brand_id === b.id).length, cell: (b) => d(products.filter((p) => p.brand_id === b.id).length) },
    { key: "listings", header: tx("লিস্টিং", "Listings"), sort: (b) => counts[b.id] ?? 0, cell: (b) => <span className="font-bold tabular-nums">{d(counts[b.id] ?? 0)}</span> },
  ];

  return (
    <AdminPage
      back="/admin/catalog"
      title={tx("ব্র্যান্ড", "Brands")}
      subtitle={tx("গাড়ির কোম্পানি, নামী সাপ্লায়ার, অন্য ব্র্যান্ড, দেশি", "Vehicle makers, OEM suppliers, aftermarket, local")}
      guide={tx(
        "সব পার্টস ব্র্যান্ডের তালিকা, প্রতিটায় কতগুলো লিস্টিং আছে। তালিকায় না থাকলে নিচের ফর্মে নাম, ধরন আর দেশ দিয়ে নতুন ব্র্যান্ড যোগ করুন।",
        "All part brands with their listing counts. If a brand is missing, add it below with name, type and country.",
      )}
    >
      <DataTable
        rows={brands.filter((b) => type === "all" || b.type === type)}
        columns={cols}
        rowKey={(b) => b.id}
        search={(b) => `${b.name} ${b.country}`}
        initialSort={{ key: "listings", dir: "desc" }}
        toolbar={
          <FilterSelect
            label={tx("ধরন", "Type")}
            value={type}
            onChange={setType}
            options={[{ value: "all", label: tx("সব ধরন", "All types") }, ...(Object.keys(BRAND_TYPES) as BType[]).map((t) => ({ value: t, label: L(BRAND_TYPES[t]) }))]}
          />
        }
      />
      <Panel title={tx("নতুন ব্র্যান্ড যোগ", "Add brand")}>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label={tx("নাম", "Name")} error={dup ? tx("এই নাম আগেই আছে", "Already exists") : undefined}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aisin" />
          </Field>
          <Field label={tx("ধরন", "Type")}>
            <Select value={newType} onChange={(e) => setNewType(e.target.value as BType)}>
              {(Object.keys(BRAND_TYPES) as BType[]).map((t) => (
                <option key={t} value={t}>
                  {L(BRAND_TYPES[t])}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={tx("দেশ", "Country")}>
            <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Japan" />
          </Field>
        </div>
        <Button
          size="lg"
          variant="brand"
          className="mt-4"
          disabled={!valid}
          onClick={() => {
            addBrand({ name: name.trim(), type: newType, country: country.trim() });
            toast(tx("ব্র্যান্ড যোগ হয়েছে", "Brand added"));
            setName("");
            setCountry("");
          }}
        >
          <Plus className="size-5" /> {tx("ব্র্যান্ড যোগ করুন", "Add brand")}
        </Button>
      </Panel>
    </AdminPage>
  );
}
