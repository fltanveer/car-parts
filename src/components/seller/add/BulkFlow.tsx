"use client";

import clsx from "clsx";
import { Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { patchListing } from "@/lib/db/actions";
import { blankListing, logActivity, publishStatus, saveSellerListing } from "@/lib/db/actions-seller";
import { categories, describeVehicle } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import type { Condition, Source, Vendor } from "@/lib/types";
import { useT } from "../../providers/LangProvider";
import { toast, useNow } from "../../shared/Misc";
import { Button, Card, Notice } from "../../ui/primitives";
import { SellerPage } from "../SellerPage";
import { AddTabs } from "./AddTabs";
import { type CheckedRow, checkRows, gradeOf, parseCsv, templateCsv, toObjects } from "./bulk-csv";

/** Excel/CSV bulk upload with green/yellow/red preview (file 02 §5.5). */
export function BulkFlow({ vendor }: { vendor: Vendor }) {
  const { tx, d, taka } = useT();
  const now = useNow();
  const file = useRef<HTMLInputElement>(null);
  const mine = useDb((s) => s.listings.filter((l) => l.vendor_id === vendor.id));
  const [rows, setRows] = useState<CheckedRow[] | null>(null);
  const [name, setName] = useState("");

  const download = () => {
    const blob = new Blob([templateCsv()], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "gaarihub-products-template.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const text = await f.text();
    const objs = toObjects(parseCsv(text));
    if (!objs.length) {
      toast(tx("ফাইলে কোনো সারি পাওয়া যায়নি", "No rows found in the file"), "bad");
      return;
    }
    setName(f.name);
    setRows(checkRows(objs, mine, now));
    if (file.current) file.current.value = "";
  };

  const publish = () => {
    if (!rows) return;
    let created = 0;
    let updated = 0;
    rows.filter((r) => r.tone !== "bad").forEach(({ row, update }) => {
      if (update) {
        const qty = row.qty ? Number(row.qty) : update.stock_qty;
        patchListing(update.id, {
          price: row.price ? Number(row.price) : update.price,
          stock_qty: qty,
          status: qty === 0 && update.status === "active" ? "sold_out" : qty > 0 && update.status === "sold_out" ? "active" : update.status,
        });
        updated++;
        return;
      }
      const cat = categories.find((c) => c.slug === row.category || c.id === row.category)!;
      const v = row.vehicle && row.vehicle !== "all" ? describeVehicle(row.vehicle) : null;
      const ps = publishStatus(vendor, cat.id);
      saveSellerListing({
        ...blankListing(vendor, cat.id), title_bn: row.title!, title: row.title!, source: row.source as Source, condition: row.condition as Condition,
        grade: row.condition === "new" ? null : gradeOf(row.grade), price: Number(row.price), stock_qty: row.qty ? Number(row.qty) : 1,
        part_number: row.part_no || null, is_universal: row.vehicle === "all",
        fitments: v ? [{ make_id: v.make.id, model_id: v.model.id, generation_id: v.generation.id, engine_id: null, notes: null }] : [],
        media: [{ url: row.image_url || `ph:${cat.icon}`, role: "main" }], status: ps.status,
      });
      created++;
    });
    logActivity(vendor.id, `Excel আপলোড: ${created}টা নতুন, ${updated}টা আপডেট`);
    toast(tx(`${d(created)}টা নতুন, ${d(updated)}টা আপডেট হয়েছে ✅`, `${created} new, ${updated} updated ✅`));
    setRows(null);
  };

  const count = (t: CheckedRow["tone"]) => rows?.filter((r) => r.tone === t).length ?? 0;
  const tone = { ok: "border-ok/40 bg-ok-soft", wait: "border-wait-bg/50 bg-wait-soft", bad: "border-bad/40 bg-bad-soft" };

  return (
    <SellerPage
      title={tx("📊 Excel / CSV আপলোড", "📊 Excel / CSV upload")}
      subtitle={tx("বড় দোকানের জন্য: একসাথে শত শত পণ্য, বা দাম-স্টক আপডেট।", "For big shops: hundreds of products at once, or bulk price/stock updates.")}
      guide={tx("প্রথমে টেমপ্লেট নামান। Excel এ পূরণ করে CSV হিসেবে সেভ করুন। তারপর আপলোড করুন। সবুজ আর হলুদ সারি প্রকাশ হবে, লাল সারি ঠিক করতে হবে।", "Download the template, fill it in Excel, save as CSV and upload. Green and yellow rows are published; fix the red ones.")}
    >
      <AddTabs />
      <div className="grid gap-3 sm:grid-cols-2">
        <Button variant="outline" size="lg" onClick={download}><Download className="size-5" /> {tx("টেমপ্লেট ডাউনলোড", "Download template")}</Button>
        <Button variant="brand" size="lg" onClick={() => file.current?.click()}><Upload className="size-5" /> {tx("CSV আপলোড", "Upload CSV")}</Button>
      </div>
      <input ref={file} type="file" accept=".csv,text/csv" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
      <Notice>
        {tx("আগের পণ্যের দাম/স্টক বদলাতে 'আইডি/SKU' ঘরে পণ্যের আইডি দিন। ছবি: 'ছবির লিংক' ঘরে লিংক দিন, না হলে পরে যোগ করুন।", "To update existing products, put the product ID in 'id'. Photos: add a link in 'image_url' or add later.")}
      </Notice>

      {rows && (
        <section className="space-y-3">
          <p className="font-semibold">📄 {name}</p>
          <div className="grid grid-cols-3 gap-2 text-center text-sm font-bold">
            <p className="rounded-xl bg-ok-soft p-2 text-ok">🟢 {tx("ঠিক", "OK")}: {d(count("ok"))}</p>
            <p className="rounded-xl bg-wait-soft p-2 text-wait">🟡 {tx("তথ্য কম", "Partial")}: {d(count("wait"))}</p>
            <p className="rounded-xl bg-bad-soft p-2 text-bad">🔴 {tx("ভুল", "Error")}: {d(count("bad"))}</p>
          </div>
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.line} className={clsx("rounded-2xl border-2 p-3", tone[r.tone])}>
                <p className="font-semibold">
                  {tx("সারি", "Row")} {d(r.line)} · {r.update ? `✏️ ${r.update.title_bn}` : r.row.title || "—"}
                  {r.row.price && ` · ${taka(Number(r.row.price) || 0)}`}
                </p>
                {r.reasons.length > 0 && <p className="text-sm">{r.reasons.map((x) => tx(x.bn, x.en)).join(" · ")}</p>}
              </li>
            ))}
          </ul>
          <Card className="space-y-2 p-3">
            <Button variant="ok" size="xl" full disabled={count("ok") + count("wait") === 0} onClick={publish}>
              🚀 {tx(`${d(count("ok") + count("wait"))}টা প্রকাশ করুন`, `Publish ${count("ok") + count("wait")}`)}
            </Button>
            <Button variant="ghost" full onClick={() => setRows(null)}>{tx("বাতিল", "Cancel")}</Button>
          </Card>
        </section>
      )}
    </SellerPage>
  );
}
