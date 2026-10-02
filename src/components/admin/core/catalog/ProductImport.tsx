"use client";

import { Upload } from "lucide-react";
import { useState } from "react";
import { CsvImport, Panel } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, StatusPill } from "@/components/ui/primitives";
import { uid } from "@/lib/db/seed";
import type { Brand, CatalogProduct, Source } from "@/lib/types";
import { SOURCES } from "./constants";
import { normalizePart } from "./match";
import { type AdminCategory, importProducts, pathLabel, useBrands, useCategories, useProducts } from "./overlay";

const SAMPLE = [
  ["category", "name", "name_bn", "brand", "source", "part_number", "cross_refs", "universal", "description_bn"],
  ["filters--oil-filter", "Denso Oil Filter 260340-0500", "ডেনসো মবিল ফিল্টার", "Denso", "oem_brand", "260340-0500", "90915-YZZE1|C-110", "no", "Toyota 1NZ/2NZ ইঞ্জিনে লাগে"],
  ["ignition--spark-plug", "NGK Iridium ILKAR7B11", "NGK ইরিডিয়াম প্লাগ", "NGK", "oem_brand", "ILKAR7B11", "", "no", ""],
  ["brake-parts--brake-pad", "Sakura Front Pad AN-697WK", "সাকুরা সামনের ব্রেক প্যাড", "Sakura", "aftermarket", "AN-697WK", "04465-12592", "no", ""],
];

type Row = { p: Omit<CatalogProduct, "id">; cat: AdminCategory | null; errors: string[]; warnings: string[] };

const findCat = (cats: AdminCategory[], v: string) => {
  const t = v.trim();
  return cats.find((c) => c.slug === t || c.id === t || c.id === `c-${t}` || c.name_bn === t || c.name.toLowerCase() === t.toLowerCase()) ?? null;
};

export function ProductImport() {
  const { tx, d, lang } = useT();
  const cats = useCategories();
  const brands = useBrands();
  const products = useProducts();
  const [raw, setRaw] = useState<Record<string, string>[] | null>(null);
  const t = (bn: string, en: string) => (lang === "bn" ? bn : en);

  const known = new Set(products.flatMap((p) => [p.part_number, ...p.cross_ref_numbers]).map(normalizePart).filter(Boolean));
  const seen = new Set<string>();
  const rows: Row[] = (raw ?? []).map((r) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const cat = findCat(cats, r.category ?? "");
    if (!cat) errors.push(t("ক্যাটাগরি পাওয়া যায়নি", "category not found"));
    if (!(r.name ?? "").trim() || !(r.name_bn ?? "").trim()) errors.push(t("নাম খালি", "name missing"));
    const source = ((r.source ?? "").trim() || "unknown") as Source;
    if (!SOURCES.includes(source)) errors.push(t("উৎস ভুল", "bad source"));
    const brand: Brand | undefined = (r.brand ?? "").trim() ? brands.find((b) => b.name.toLowerCase() === r.brand.trim().toLowerCase()) : undefined;
    if ((r.brand ?? "").trim() && !brand) warnings.push(t("ব্র্যান্ড তালিকায় নেই (খালি থাকবে)", "brand unknown (left empty)"));
    const pn = normalizePart(r.part_number);
    if (pn && known.has(pn)) warnings.push(t("এই পার্ট নম্বর আগেই আছে", "part number already exists"));
    if (pn && seen.has(pn)) warnings.push(t("ফাইলে দুইবার", "duplicate in file"));
    if (pn) seen.add(pn);
    const universal = /^(yes|y|1|true|হ্যাঁ)$/i.test((r.universal ?? "").trim());
    if (!universal) warnings.push(t("গাড়ি পরে যোগ করতে হবে", "add fitments later"));
    return {
      cat, errors, warnings,
      p: {
        category_id: cat?.id ?? "", name: (r.name ?? "").trim(), name_bn: (r.name_bn ?? "").trim(), slug: "", brand_id: brand?.id ?? null, source,
        part_number: (r.part_number ?? "").trim() || null, cross_ref_numbers: (r.cross_refs ?? "").split(/[|;]/).map((x) => x.trim().toUpperCase()).filter(Boolean),
        attributes: {}, description_bn: (r.description_bn ?? "").trim(), image: cat?.icon ?? "part", is_universal: universal, fitments: [],
        status: universal ? "active" : "pending_review",
      },
    };
  });
  const ok = rows.filter((r) => !r.errors.length);

  return (
    <Panel title={tx("CSV থেকে মাস্টার পণ্য ইমপোর্ট", "Import master products from CSV")}>
      <p className="mb-3 text-sm text-muted">
        {tx("জনপ্রিয় নতুন পার্টস (ফিল্টার, প্লাগ, প্যাড) আগে থেকে তৈরি রাখুন যাতে বিক্রেতারা \"আমার কাছেও আছে\" চাপতে পারে। গাড়ি ছাড়া পণ্য \"পর্যালোচনায়\" থাকবে।", "Pre-create popular new parts (filters, plugs, pads) so sellers can tap \"I have this too\". Products without fitments stay \"pending review\".")}
      </p>
      <CsvImport sample={SAMPLE} sampleName="master-products-sample.csv" onRows={setRaw} />
      {raw && (
        <div className="mt-4 space-y-3">
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-xs text-muted">
                <tr>
                  {["#", tx("ক্যাটাগরি", "Category"), tx("নাম", "Name"), tx("পার্ট নম্বর", "Part no."), tx("যাচাই", "Check")].map((h) => (
                    <th key={h} className="whitespace-nowrap px-2 py-1.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={r.errors.length ? "bg-bad-soft/50" : r.warnings.length ? "bg-wait-soft/40" : ""}>
                    <td className="px-2 py-1.5">{d(i + 1)}</td>
                    <td className="px-2 py-1.5 text-xs">{r.cat ? pathLabel(cats, r.cat.id, lang) : "—"}</td>
                    <td className="px-2 py-1.5">
                      <span className="font-semibold">{r.p.name_bn}</span>
                      <span className="block text-xs text-muted">{r.p.name}</span>
                    </td>
                    <td className="px-2 py-1.5 font-mono text-xs">{r.p.part_number ?? "—"}</td>
                    <td className="space-x-1 px-2 py-1.5">
                      {r.errors.map((e) => <StatusPill key={e} tone="bad">{e}</StatusPill>)}
                      {r.warnings.map((e) => <StatusPill key={e} tone="wait">{e}</StatusPill>)}
                      {!r.errors.length && !r.warnings.length && <StatusPill tone="ok">{tx("ঠিক আছে", "OK")}</StatusPill>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            size="lg"
            variant="brand"
            disabled={!ok.length}
            onClick={() => {
              importProducts(ok.map((r) => {
                const id = `cp-imp-${uid()}`;
                return { ...r.p, id, slug: `${r.p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${id.slice(-4)}` };
              }));
              toast(tx(`${d(ok.length)}টা মাস্টার পণ্য যোগ হয়েছে`, `${ok.length} master products added`));
              setRaw(null);
            }}
          >
            <Upload className="size-5" /> {tx(`${d(ok.length)}টা সারি ইমপোর্ট করুন`, `Import ${ok.length} rows`)}
          </Button>
        </div>
      )}
    </Panel>
  );
}
