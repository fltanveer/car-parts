"use client";

import { BookA, Boxes, Car, ListChecks, ScrollText, SlidersHorizontal, Tags } from "lucide-react";
import { AdminPage, KpiCard, KpiGrid } from "@/components/admin/core";
import { TEMPLATES } from "@/components/admin/core/catalog/constants";
import { useAttributes, useBrands, useCategories, useProducts, useSynonyms, useVehicleImports } from "@/components/admin/core/catalog/overlay";
import { useT } from "@/components/providers/LangProvider";
import { generations, makes, models } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import type { DB } from "@/lib/db/seed";

const selListingStats = (s: DB) => ({ total: s.listings.length, unlinked: s.listings.filter((l) => !l.catalog_product_id).length, pending: s.listings.filter((l) => l.status === "pending_review").length });

export default function CatalogIndexPage() {
  const { tx, d } = useT();
  const cats = useCategories();
  const attrs = useAttributes();
  const products = useProducts();
  const synonyms = useSynonyms();
  const brands = useBrands();
  const imports = useVehicleImports();
  const ls = useDb(selListingStats);
  const icon = (I: typeof Boxes) => <I className="size-5" />;

  return (
    <AdminPage
      title={tx("ক্যাটালগ", "Catalog")}
      subtitle={tx("ক্যাটাগরি, অ্যাট্রিবিউট, গাড়ির ডেটা, মাস্টার পণ্য, লিস্টিং, শব্দভাণ্ডার", "Categories, attributes, vehicles, master products, listings, dictionary")}
      guide={tx(
        "ক্যাটালগের সব অংশ এখান থেকে খুলুন। প্রতিটা ঘরে সংখ্যা দেখাচ্ছে কতগুলো আছে। লাল ঘর মানে কাজ বাকি আছে।",
        "Open any part of the catalog from here. Each tile shows how many items exist. Red tiles have pending work.",
      )}
    >
      <KpiGrid>
        <KpiCard href="/admin/catalog/categories" icon={icon(ScrollText)} label={tx("ক্যাটাগরি ট্রি", "Category tree")} value={d(cats.length)} sub={tx(`${d(cats.filter((c) => c.level === 1).length)}টা বিভাগ`, `${cats.filter((c) => c.level === 1).length} divisions`)} />
        <KpiCard href="/admin/catalog/attributes" icon={icon(SlidersHorizontal)} label={tx("অ্যাট্রিবিউট টেমপ্লেট", "Attribute templates")} value={d(TEMPLATES.length)} sub={tx(`${d(attrs.length)}টা ফিল্ড`, `${attrs.length} fields`)} />
        <KpiCard href="/admin/catalog/vehicles" icon={icon(Car)} label={tx("গাড়ির ডেটা", "Vehicles")} value={d(generations.length + imports.length)} sub={tx(`${d(makes.length)} ব্র্যান্ড · ${d(models.length)} মডেল`, `${makes.length} makes · ${models.length} models`)} />
        <KpiCard href="/admin/catalog/products" icon={icon(Boxes)} label={tx("মাস্টার পণ্য", "Master products")} value={d(products.filter((p) => p.status !== "merged").length)} />
        <KpiCard href="/admin/catalog/listings" icon={icon(ListChecks)} label={tx("সব লিস্টিং", "All listings")} value={d(ls.total)} sub={tx(`${d(ls.pending)}টা অনুমোদনের অপেক্ষায়`, `${ls.pending} pending review`)} tone={ls.pending ? "wait" : "info"} />
        <KpiCard href="/admin/catalog/products" icon={icon(Boxes)} label={tx("মাস্টার ছাড়া লিস্টিং", "Listings without master")} value={d(ls.unlinked)} tone={ls.unlinked ? "wait" : "ok"} sub={tx("জোড়া লাগানোর কিউ দেখুন", "See the match queue")} />
        <KpiCard href="/admin/catalog/dictionary" icon={icon(BookA)} label={tx("শব্দভাণ্ডার", "Dictionary")} value={d(synonyms.length)} sub={tx("synonym / আঞ্চলিক শব্দ", "synonyms / dialect words")} />
        <KpiCard href="/admin/catalog/brands" icon={icon(Tags)} label={tx("ব্র্যান্ড", "Brands")} value={d(brands.length)} />
      </KpiGrid>
    </AdminPage>
  );
}
