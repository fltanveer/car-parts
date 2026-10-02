"use client";

import { useState } from "react";
import { PhotoUploader } from "@/components/media/PhotoUploader";
import { publishStatus, reportMasterError, saveSellerListing } from "@/lib/db/actions-seller";
import { getCategory, listingById } from "@/lib/db/queries";
import { getDb, useDb } from "@/lib/db/store";
import { listingStatusLabel } from "@/lib/labels";
import { listingQuality } from "@/lib/rules";
import type { Listing, Vendor } from "@/lib/types";
import { SpeakButton } from "../../layout/AudioGuide";
import { useT } from "../../providers/LangProvider";
import { toast } from "../../shared/Misc";
import { CategoryPicker } from "../../shared/CategoryPicker";
import { PositionPicker } from "../../shared/PositionPicker";
import { CategoryIcon } from "../../ui/CategoryIcon";
import { Sheet } from "../../ui/Sheet";
import { Button, Card, EmptyState, Field, Notice, Stat, StatusPill, Stepper, Tabs, Toggle } from "../../ui/primitives";
import { AttributeFields } from "../AttributeFields";
import { ConditionPicker, DispatchPicker, GradePicker, isUsed, ReturnsPicker, SourcePicker, WarrantyPicker } from "../Choices";
import { VoiceInput, VoiceTextarea } from "../Dictate";
import { FitmentEditor } from "../FitmentEditor";
import { PriceEditor } from "../PriceSheet";
import { SellerPage } from "../SellerPage";
import { listingToMedia, mediaToListing } from "../utils";

type Tab = "photos" | "what" | "car" | "quality" | "specs" | "price" | "rules";

export function ProductEdit({ id, vendor }: { id: string; vendor: Vendor }) {
  const { tx, d, L, lang } = useT();
  const stored = useDb((s) => listingById(s, id));
  const [l, setL] = useState<Listing | null>(stored && stored.vendor_id === vendor.id ? stored : null);
  const [tab, setTab] = useState<Tab>(stored?.status === "rejected" ? "rules" : "photos");
  const [catPick, setCatPick] = useState(false);
  const [report, setReport] = useState(false);
  const [reportText, setReportText] = useState("");

  if (!l || !stored) {
    return (
      <SellerPage title={tx("পণ্য", "Product")} back="/seller/products">
        <EmptyState icon="📦" title={tx("পণ্য পাওয়া যায়নি", "Product not found")} />
      </SellerPage>
    );
  }
  const set = (p: Partial<Listing>) => setL({ ...l, ...p });
  const cat = getCategory(l.category_id);
  const locked = !!l.catalog_product_id;
  const quality = listingQuality(l);
  const changed = JSON.stringify(l) !== JSON.stringify(stored);

  const save = (resubmit = false) => {
    let status = l.status;
    if (resubmit || l.status === "rejected") status = publishStatus(vendor, l.category_id).status;
    if (l.stock_qty === 0 && status === "active") status = "sold_out";
    if (l.stock_qty > 0 && status === "sold_out") status = "active";
    saveSellerListing({ ...l, status, rejection_reason: resubmit ? null : l.rejection_reason }, `পণ্য সম্পাদনা: ${l.title_bn}`);
    setL(listingById(getDb(), l.id));
    toast(resubmit ? tx("আবার জমা দেওয়া হয়েছে", "Resubmitted") : tx("সেভ হয়েছে ✅", "Saved ✅"));
  };

  const lockNote = locked && (
    <Notice>
      🔒 {tx("এই তথ্য তালিকার মূল পণ্য থেকে আসে, বদলানো যাবে না।", "This comes from the master product and can't be changed.")}{" "}
      <button type="button" className="font-bold underline" onClick={() => setReport(true)}>{tx("ভুল দেখলে জানান", "Report a mistake")}</button>
    </Notice>
  );

  return (
    <SellerPage
      title={lang === "bn" ? l.title_bn : l.title}
      subtitle={<StatusPill tone={listingStatusLabel[l.status].tone}>{L(listingStatusLabel[l.status])}</StatusPill>}
      back="/seller/products"
      guide={tx("উপরের ট্যাব থেকে যা বদলাতে চান বাছুন। শেষে নিচের সবুজ বাটনে সেভ করুন।", "Pick a tab above for what you want to change, then save with the green button.")}
    >
      <div className="grid grid-cols-3 gap-2">
        <Stat label={tx("দেখেছে", "Views")} value={d(l.views)} />
        <Stat label={tx("বিক্রি", "Sold")} value={d(l.sold)} />
        <Stat label={tx("মান", "Quality")} value={`${d(quality.score)}`} tone={quality.score >= 70 ? "ok" : quality.score >= 50 ? "wait" : "bad"} />
      </div>
      {l.status === "rejected" && (
        <Notice tone="bad">
          ❌ {tx("বাতিলের কারণ", "Rejected because")}: <b>{l.rejection_reason ?? "—"}</b>. {tx("ঠিক করে নিচে 'আবার জমা দিন' চাপুন।", "Fix it and tap 'Resubmit' below.")}
        </Notice>
      )}
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "photos", label: tx("📷 ছবি", "📷 Photos") },
          { value: "what", label: tx("🔧 কী জিনিস", "🔧 What") },
          { value: "car", label: tx("🚗 গাড়ি", "🚗 Car") },
          { value: "quality", label: tx("♻️ মান", "♻️ Quality") },
          { value: "specs", label: tx("📋 তথ্য", "📋 Specs") },
          { value: "price", label: tx("💰 দাম-স্টক", "💰 Price/stock") },
          { value: "rules", label: tx("🛡️ নিয়ম", "🛡️ Rules") },
        ]}
      />

      {tab === "photos" && (
        <div className="space-y-3">
          <PhotoUploader value={listingToMedia(l)} onChange={(items) => set({ media: mediaToListing(items) })} max={8} />
          {l.media.length > 1 && (
            <Toggle
              checked={l.media[l.media.length - 1]?.role === "label"}
              onChange={(on) => set({ media: l.media.map((m, i) => (i === l.media.length - 1 ? { ...m, role: on ? "label" : "other" } : i === 0 ? { ...m, role: "main" } : m)) })}
              label={tx("শেষ ছবিটা পার্ট নম্বরের লেবেল", "Last photo shows the part-number label")}
            />
          )}
        </div>
      )}
      {tab === "what" && (
        <div className="space-y-4">
          {lockNote}
          <Field label={tx("নাম", "Title")}>
            {locked ? <p className="rounded-xl bg-surface px-3 py-3 font-semibold">{l.title_bn}</p> : <VoiceInput value={l.title_bn} onChange={(title_bn) => set({ title_bn })} />}
          </Field>
          <div className="flex min-h-14 items-center gap-3 rounded-2xl border border-line bg-card p-3">
            <CategoryIcon icon={cat?.icon ?? "part"} className="size-6" />
            <span className="flex-1 font-semibold">{lang === "bn" ? cat?.name_bn : cat?.name}</span>
            {!locked && <Button variant="outline" size="sm" onClick={() => setCatPick(!catPick)}>{tx("বদলান", "Change")}</Button>}
          </div>
          {catPick && <CategoryPicker onPick={(c) => { set({ category_id: c.id, attributes: {} }); setCatPick(false); }} />}
          {cat?.needs_position && <PositionPicker value={l.position} onChange={(position) => set({ position })} />}
          <Field label={tx("বিবরণ", "Description")}>
            <VoiceTextarea value={l.description_bn ?? ""} onChange={(v) => set({ description_bn: v || null })} />
          </Field>
        </div>
      )}
      {tab === "car" && (
        <div className="space-y-3">
          {lockNote}
          <FitmentEditor vendorId={vendor.id} value={l.fitments} universal={l.is_universal} locked={locked} onChange={(fitments, is_universal) => set({ fitments, is_universal })} />
        </div>
      )}
      {tab === "quality" && (
        <div className="space-y-3">
          {locked ? (
            <p className="font-semibold">{tx("উৎস তালিকা থেকে", "Source from master")}</p>
          ) : (
            <>
              <p className="font-semibold">{tx("উৎস", "Source")}</p>
              <SourcePicker value={l.source} onChange={(source) => set({ source })} />
            </>
          )}
          <p className="font-semibold">{tx("অবস্থা", "Condition")}</p>
          <ConditionPicker value={l.condition} onChange={(condition) => set({ condition, grade: isUsed(condition) ? l.grade : null })} />
          {isUsed(l.condition) && <GradePicker value={l.grade} onChange={(grade) => set({ grade })} />}
          <Card className="space-y-2 p-3">
            <div className="flex items-center justify-between">
              <p className="font-bold">{tx("লিস্টিং মান", "Listing quality")}: {d(quality.score)}/{d(100)}</p>
              <SpeakButton text={quality.checks.filter((c) => !c.ok).map((c) => L(c)).join("। ") || tx("সব ঠিক আছে", "All good")} />
            </div>
            {quality.checks.map((c) => (
              <p key={c.key} className={c.ok ? "text-ok" : "text-bad"}>
                {c.ok ? "✅" : "➕"} {L(c)} <span className="text-xs text-muted">(+{d(c.points)})</span>
              </p>
            ))}
          </Card>
        </div>
      )}
      {tab === "specs" && cat && (
        <div className="space-y-4">
          {lockNote}
          <AttributeFields category={cat} value={l.attributes} onChange={(attributes) => set({ attributes })} locked={locked} />
          <Field label={tx("পার্ট নম্বর", "Part number")}>
            {locked ? <p className="rounded-xl bg-surface px-3 py-3">{l.part_number ?? "—"}</p> : <VoiceInput value={l.part_number ?? ""} onChange={(v) => set({ part_number: v || null })} />}
          </Field>
        </div>
      )}
      {tab === "price" && (
        <div className="space-y-4">
          <PriceEditor vendor={vendor} value={l.price} onChange={(price) => set({ price })} categoryId={l.category_id} condition={l.condition} />
          <div className="flex items-center justify-between rounded-2xl border border-line bg-card p-3">
            <span className="font-semibold">📦 {tx("স্টক", "Stock")}</span>
            <Stepper value={l.stock_qty} onChange={(stock_qty) => set({ stock_qty })} />
          </div>
        </div>
      )}
      {tab === "rules" && (
        <div className="space-y-4">
          <p className="font-semibold">{tx("ফেরত", "Returns")}</p>
          <ReturnsPicker returnable={l.is_returnable} days={l.return_window_days} onChange={(is_returnable, return_window_days) => set({ is_returnable, return_window_days })} />
          <p className="font-semibold">{tx("ওয়ারেন্টি", "Warranty")}</p>
          <WarrantyPicker value={l.warranty_days} onChange={(warranty_days) => set({ warranty_days })} />
          <p className="font-semibold">{tx("কবে পাঠাবেন", "Dispatch")}</p>
          <DispatchPicker value={l.dispatch_days} onChange={(dispatch_days) => set({ dispatch_days })} />
        </div>
      )}

      <div className="sticky bottom-24 z-20 space-y-2">
        {l.status === "rejected" ? (
          <Button variant="ok" size="xl" full disabled={l.price <= 0} onClick={() => save(true)}>🔁 {tx("ঠিক করে আবার জমা দিন", "Fix & resubmit")}</Button>
        ) : (
          <Button variant="ok" size="xl" full disabled={!changed || l.price <= 0} onClick={() => save()}>💾 {tx("সেভ করুন", "Save")}</Button>
        )}
      </div>

      <Sheet open={report} onClose={() => setReport(false)} title={tx("ভুল জানান", "Report a mistake")}>
        <div className="space-y-3 pb-2">
          <p className="text-muted">{tx("কী ভুল আছে বলুন বা লিখুন। ক্যাটালগ টিম ঠিক করবে।", "Say or write what's wrong. The catalog team will fix it.")}</p>
          <VoiceTextarea value={reportText} onChange={setReportText} />
          <Button variant="brand" size="lg" full disabled={!reportText.trim()} onClick={() => { reportMasterError(vendor.id, l.id, reportText.trim()); setReport(false); setReportText(""); toast(tx("জানানো হয়েছে, ধন্যবাদ", "Reported, thanks")); }}>
            📨 {tx("পাঠান", "Send")}
          </Button>
        </div>
      </Sheet>
    </SellerPage>
  );
}
