"use client";

import { useState } from "react";
import { PhotoUploader } from "@/components/media/PhotoUploader";
import { submitQuote } from "@/lib/db/actions";
import { logActivity } from "@/lib/db/actions-seller";
import { categoryPath, describeVehicle, fitsVehicle, vendorListings } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import { maskContactInfo } from "@/lib/rules";
import type { Condition, Grade, Listing, MediaItem, PartRequest, Source, Vendor } from "@/lib/types";
import { useT } from "../../providers/LangProvider";
import { toast } from "../../shared/Misc";
import { Button, Card, Chip, Notice } from "../../ui/primitives";
import { ConfirmSheet, ListingMini } from "../Bits";
import { ConditionPicker, DispatchPicker, GradePicker, isUsed, ReturnsPicker, SourcePicker, WarrantyPicker } from "../Choices";
import { VoiceTextarea } from "../Dictate";
import { PriceEditor } from "../PriceSheet";
import { useLocalDraft } from "../utils";

interface QuoteDraft {
  itemIndex: number;
  listingId: string | null;
  photos: MediaItem[];
  source: Source | null;
  condition: Condition | null;
  grade: Grade | null;
  price: number;
  dispatch: number;
  warranty: number;
  returnable: boolean;
  note: string;
}

/** One-screen quote form, all big buttons (file 02 §7.2). */
export function QuoteForm({ r, vendor, onDone }: { r: PartRequest; vendor: Vendor; onDone: () => void }) {
  const { tx, d } = useT();
  const [f, setF, clear] = useLocalDraft<QuoteDraft>(`gaarihub:quote:${vendor.id}:${r.id}`, {
    itemIndex: 0, listingId: null, photos: [], source: null, condition: null, grade: null, price: 0, dispatch: 0,
    warranty: vendor.default_warranty_days, returnable: vendor.default_return_days > 0, note: "",
  });
  const [mode, setMode] = useState<"pick" | "new">(f.photos.length ? "new" : "pick");
  const [showAll, setShowAll] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const set = (p: Partial<QuoteDraft>) => setF((x) => ({ ...x, ...p }));

  const item = r.items[f.itemIndex] ?? r.items[0];
  const division = categoryPath(item?.category_id ?? null)[0]?.id;
  const mine = useDb((s) => vendorListings(s, vendor.id).filter((l) => !["removed", "rejected", "draft"].includes(l.status)));
  const scored = mine
    .map((l) => {
      let sc = 0;
      if (l.category_id === item?.category_id) sc += 3;
      else if (categoryPath(l.category_id)[1]?.id === categoryPath(item?.category_id ?? null)[1]?.id) sc += 2;
      else if (categoryPath(l.category_id)[0]?.id === division) sc += 1;
      const fits = fitsVehicle(l.fitments, l.is_universal, r.generation_id);
      if (fits) sc += 2;
      if (fits === false) sc -= 2;
      return { l, sc };
    })
    .filter((x) => x.sc > 0 || showAll)
    .sort((a, b) => b.sc - a.sc);
  const suggestions = showAll ? scored : scored.slice(0, 4);
  const picked = mine.find((l) => l.id === f.listingId) ?? null;

  const pick = (l: Listing) =>
    set({ listingId: l.id, source: l.source, condition: l.condition, grade: l.grade, price: l.price, warranty: l.warranty_days, returnable: l.is_returnable, dispatch: l.dispatch_days });

  const noteCheck = maskContactInfo(f.note);
  const media = picked ? picked.media.map((m) => m.url) : f.photos.map((p) => p.url);
  const errors: string[] = [];
  if (!picked && f.photos.length < 1) errors.push(tx("আসল ছবি দিন (কমপক্ষে ১টা)", "Add a real photo (at least 1)"));
  if (!f.source) errors.push(tx("উৎস বাছুন", "Pick source"));
  if (!f.condition) errors.push(tx("অবস্থা বাছুন", "Pick condition"));
  if (f.condition && isUsed(f.condition) && !f.grade) errors.push(tx("গ্রেড বাছুন", "Pick grade"));
  if (f.price <= 0) errors.push(tx("দাম লিখুন", "Enter price"));

  const send = () => {
    const vd = describeVehicle(r.generation_id);
    const res = submitQuote(r.id, vendor.id, {
      item_index: f.itemIndex, listing_id: picked?.id ?? null, title: picked?.title_bn ?? `${vd?.short ?? ""} ${item?.name ?? ""}`.trim(),
      source: f.source!, condition: f.condition!, grade: f.condition && isUsed(f.condition) ? f.grade : null, brand_id: picked?.brand_id ?? null,
      part_number: picked?.part_number ?? null, price: f.price, dispatch_days: f.dispatch, warranty_days: f.warranty, is_returnable: f.returnable,
      media, note_bn: f.note.trim() || null,
    });
    setConfirm(false);
    if ("error" in res) {
      toast(res.error === "limit" ? tx("এই রিকোয়েস্টে দাম দেওয়ার সীমা শেষ", "Quote limit reached for this request") : tx("রিকোয়েস্ট বন্ধ হয়ে গেছে", "Request is closed"), "bad");
      return;
    }
    logActivity(vendor.id, `দাম দেওয়া ${r.request_no}: ৳${f.price}`);
    clear();
    toast(tx("দাম পাঠানো হয়েছে ✅", "Quote sent ✅"));
    onDone();
  };

  const step = (n: number, title: string) => (
    <p className="mb-2 flex items-center gap-2 text-lg font-bold">
      <span className="grid size-8 place-items-center rounded-full bg-ink text-sm text-white">{d(n)}</span>
      {title}
    </p>
  );

  return (
    <div className="space-y-6">
      {r.items.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {r.items.map((it, i) => (
            <Chip key={i} active={f.itemIndex === i} onClick={() => set({ itemIndex: i, listingId: null })} className="min-h-12">
              {it.name}
            </Chip>
          ))}
        </div>
      )}

      <section>
        {step(1, tx("কোন জিনিস দেবেন?", "Which item?"))}
        <div className="mb-3 grid grid-cols-2 gap-2">
          <Button variant={mode === "pick" ? "primary" : "outline"} size="lg" onClick={() => setMode("pick")}>📦 {tx("আমার পণ্য থেকে", "From my products")}</Button>
          <Button variant={mode === "new" ? "primary" : "outline"} size="lg" onClick={() => { setMode("new"); set({ listingId: null }); }}>📷 {tx("নতুন ছবি", "New photo")}</Button>
        </div>
        {mode === "pick" ? (
          <div className="space-y-2">
            {suggestions.length ? suggestions.map(({ l }) => <ListingMini key={l.id} listing={l} selected={f.listingId === l.id} onClick={() => pick(l)} />) : <Notice>{tx("মিলে যাওয়া পণ্য নেই। নতুন ছবি দিন।", "No matching products. Add a new photo.")}</Notice>}
            {!showAll && mine.length > suggestions.length && (
              <Button variant="ghost" full onClick={() => setShowAll(true)}>{tx("আমার সব পণ্য দেখুন", "Show all my products")}</Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Notice tone="wait">📷 {tx("এখনই জিনিসটার ছবি তুলুন (১-৩টা)। ইন্টারনেটের ছবি চলবে না।", "Take 1–3 photos of the item now. Internet photos are not allowed.")}</Notice>
            <PhotoUploader value={f.photos} onChange={(photos) => set({ photos })} max={3} />
          </div>
        )}
      </section>

      <section className="space-y-3">
        {step(2, tx("কেমন জিনিস?", "What kind?"))}
        <p className="font-semibold">{tx("উৎস (কোন কোম্পানির?)", "Source")}</p>
        <SourcePicker value={f.source} onChange={(source) => set({ source })} />
        <p className="font-semibold">{tx("অবস্থা", "Condition")}</p>
        <ConditionPicker value={f.condition} onChange={(condition) => set({ condition, grade: isUsed(condition) ? f.grade : null })} />
        {f.condition && isUsed(f.condition) && (
          <>
            <p className="font-semibold">{tx("গ্রেড", "Grade")}</p>
            <GradePicker value={f.grade} onChange={(grade) => set({ grade })} />
          </>
        )}
      </section>

      <section>
        {step(3, tx("দাম", "Price"))}
        <PriceEditor vendor={vendor} value={f.price} onChange={(price) => set({ price })} categoryId={item?.category_id ?? null} condition={f.condition ?? "new"} />
      </section>

      <section>
        {step(4, tx("কবে পাঠাতে পারবেন?", "When can you ship?"))}
        <DispatchPicker value={f.dispatch} onChange={(dispatch) => set({ dispatch })} />
      </section>

      <section className="space-y-3">
        {step(5, tx("ওয়ারেন্টি ও ফেরত", "Warranty & returns"))}
        <WarrantyPicker value={f.warranty} onChange={(warranty) => set({ warranty })} />
        <ReturnsPicker returnable={f.returnable} days={vendor.default_return_days} onChange={(returnable) => set({ returnable })} />
      </section>

      <section>
        {step(6, tx("নোট (ঐচ্ছিক)", "Note (optional)"))}
        <VoiceTextarea value={f.note} onChange={(note) => set({ note })} placeholder={tx("যেমন: গ্লাস একদম পরিষ্কার", "e.g. lens is perfectly clear")} />
        {noteCheck.found && <Notice tone="bad" className="mt-2">{tx("ফোন নম্বর বা লিংক লুকানো হবে। নম্বর শেয়ার করা যাবে না।", "Phone numbers or links will be hidden. Sharing numbers isn't allowed.")}</Notice>}
      </section>

      {errors.length > 0 && <Card className="p-3 text-sm text-bad">{errors.map((e) => <p key={e}>• {e}</p>)}</Card>}
      <Button variant="ok" size="xl" full disabled={errors.length > 0} onClick={() => setConfirm(true)}>
        📨 {tx("দাম পাঠান", "Send quote")}
      </Button>

      <ConfirmSheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title={tx("নিশ্চিত করুন", "Confirm")}
        body={tx("কাস্টমার নিলে এই দামেই দিতে হবে। ঠিক আছে?", "If the customer accepts, you must sell at this price. OK?")}
        confirmLabel={tx("✅ ঠিক আছে, পাঠান", "✅ OK, send")}
        onConfirm={send}
      />
    </div>
  );
}
