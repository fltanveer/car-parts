"use client";

import { useState } from "react";
import { AdminPage } from "@/components/admin/core";
import { MatchQueue } from "@/components/admin/core/catalog/MatchQueue";
import { MergeDuplicates } from "@/components/admin/core/catalog/MergeDuplicates";
import { linkListing, useKeepSeparate } from "@/components/admin/core/catalog/overlay";
import { ProductForm } from "@/components/admin/core/catalog/ProductForm";
import { ProductImport } from "@/components/admin/core/catalog/ProductImport";
import { ProductsTable } from "@/components/admin/core/catalog/ProductsTable";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Tabs } from "@/components/ui/primitives";
import type { DB } from "@/lib/db/seed";
import { useDb } from "@/lib/db/store";
import type { CatalogProduct, Listing } from "@/lib/types";

type Tab = "masters" | "queue" | "merge" | "import";
type FormState = { initial: CatalogProduct | null; prefill?: Partial<CatalogProduct>; linkId?: string; n: number };

const selUnlinked = (s: DB) => s.listings.filter((l) => !l.catalog_product_id && l.status !== "removed").map((l) => l.id);

export default function ProductsPage() {
  const { tx } = useT();
  const [tab, setTab] = useState<Tab>("masters");
  const [form, setForm] = useState<FormState | null>(null);
  const unlinked = useDb(selUnlinked);
  const separate = useKeepSeparate();
  const pending = unlinked.filter((id) => !separate.includes(id)).length;

  const fromListing = (l: Listing) =>
    setForm({
      initial: null,
      linkId: l.id,
      n: Date.now(),
      prefill: {
        category_id: l.category_id, name: l.title, name_bn: l.title_bn, brand_id: l.brand_id, source: l.source, part_number: l.part_number,
        attributes: l.attributes, is_universal: l.is_universal, fitments: l.fitments, description_bn: l.description_bn ?? "",
      },
    });

  return (
    <AdminPage
      back="/admin/catalog"
      title={tx("মাস্টার পণ্য", "Master products")}
      subtitle={tx("একটা নির্দিষ্ট পার্ট একবার, ভালোভাবে; সব বিক্রেতার দাম এক পেজে (ফাইল ০৪ সেকশন ৮)", "One part defined once; all sellers' prices on one page (file 04 §8)")}
      guide={tx(
        "প্রথম ট্যাবে সব মাস্টার পণ্য, সারিতে চাপ দিলে সম্পাদনা। \"জোড়া লাগানোর কিউ\" ট্যাবে বিক্রেতার পণ্য যেগুলো কোনো মাস্টারের সাথে মেলে, সেগুলো জোড়া দিন, নতুন মাস্টার বানান, বা আলাদা রাখুন। একই জিনিসের দুটো মাস্টার থাকলে \"একত্র\" ট্যাবে এক করুন। অনেক পণ্য একসাথে যোগ করতে CSV ট্যাব।",
        "The first tab lists all master products; tap a row to edit. In the match queue, link seller listings to a master, create a new master, or keep them separate. Merge duplicate masters in the merge tab. Use the CSV tab to add many at once.",
      )}
    >
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "masters", label: tx("মাস্টার পণ্য", "Masters") },
          { value: "queue", label: tx("জোড়া লাগানোর কিউ", "Match queue"), count: pending },
          { value: "merge", label: tx("ডুপ্লিকেট একত্র", "Merge duplicates") },
          { value: "import", label: tx("CSV ইমপোর্ট", "CSV import") },
        ]}
      />
      {tab === "masters" && <ProductsTable onEdit={(p) => setForm({ initial: p, n: Date.now() })} />}
      {tab === "queue" && <MatchQueue onNewMaster={fromListing} />}
      {tab === "merge" && <MergeDuplicates />}
      {tab === "import" && <ProductImport />}

      {form && (
        <ProductForm
          key={form.n}
          initial={form.initial}
          prefill={form.prefill}
          onClose={() => setForm(null)}
          onSaved={(p) => {
            if (form.linkId) {
              linkListing(form.linkId, p.id);
              toast(tx("নতুন মাস্টার বানিয়ে লিস্টিং জোড়া দেওয়া হয়েছে", "Master created and listing linked"));
            }
          }}
        />
      )}
    </AdminPage>
  );
}
