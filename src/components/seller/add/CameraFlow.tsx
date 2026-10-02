"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PhotoUploader } from "@/components/media/PhotoUploader";
import { blankListing, publishStatus, saveSellerListing } from "@/lib/db/actions-seller";
import { describeVehicle, getCategory } from "@/lib/db/queries";
import { positionLabel } from "@/lib/labels";
import type { Condition, Fitment, Grade, Listing, MediaItem, PositionKey, Source, Vendor } from "@/lib/types";
import { AudioGuide } from "../../layout/AudioGuide";
import { useT } from "../../providers/LangProvider";
import { CategoryPicker } from "../../shared/CategoryPicker";
import { HelpCall, useNow } from "../../shared/Misc";
import { PositionPicker } from "../../shared/PositionPicker";
import { CategoryIcon } from "../../ui/CategoryIcon";
import { Button, Container, Field, Notice, Stepper } from "../../ui/primitives";
import { AttributeFields, missingRequired } from "../AttributeFields";
import { ConditionPicker, DispatchPicker, GradePicker, isUsed, ReturnsPicker, SourcePicker, WarrantyPicker } from "../Choices";
import { VoiceInput, VoiceTextarea } from "../Dictate";
import { FitmentEditor, rememberCar } from "../FitmentEditor";
import { PriceEditor } from "../PriceSheet";
import { mediaToListing, prohibitedCheck, useLocalDraft } from "../utils";
import { AddTabs } from "./AddTabs";
import { ListingPreview } from "./ListingPreview";
import { PhotoCheck } from "./PhotoCheck";

interface Draft {
  step: number;
  photos: MediaItem[];
  categoryId: string | null;
  fitments: Fitment[];
  universal: boolean;
  position: PositionKey[];
  source: Source | null;
  condition: Condition | null;
  grade: Grade | null;
  attributes: Record<string, string | string[] | number>;
  price: number;
  stock: number;
  warranty: number;
  returnable: boolean;
  returnDays: number;
  dispatch: number;
  title: string;
  description: string;
  partNumber: string;
}

type StepKey = "photos" | "category" | "car" | "position" | "kind" | "specs" | "price" | "rules" | "preview";

export function CameraFlow({ vendor }: { vendor: Vendor }) {
  const { tx, d, L, lang } = useT();
  const now = useNow();
  const router = useRouter();
  const initial: Draft = {
    step: 0, photos: [], categoryId: null, fitments: [], universal: false, position: [], source: null, condition: null, grade: null, attributes: {},
    price: 0, stock: 1, warranty: vendor.default_warranty_days, returnable: vendor.default_return_days > 0, returnDays: vendor.default_return_days, dispatch: 0,
    title: "", description: "", partNumber: "",
  };
  const [f, setF, clear] = useLocalDraft<Draft>(`gaarihub:add-camera:${vendor.id}`, initial);
  const [posted, setPosted] = useState<Listing | null>(null);
  const [editRules, setEditRules] = useState(false);
  const set = (p: Partial<Draft>) => setF((x) => ({ ...x, ...p }));
  const cat = getCategory(f.categoryId);

  const steps: StepKey[] = ["photos", "category", "car", ...(cat?.needs_position ? (["position"] as StepKey[]) : []), "kind", "specs", "price", "rules", "preview"];
  const idx = Math.min(f.step, steps.length - 1);
  const key = steps[idx];
  const go = (n: number) => set({ step: Math.max(0, Math.min(steps.length - 1, n)) });

  const vd = describeVehicle(f.fitments[0]?.generation_id ?? null);
  const autoTitle = [cat?.name_bn, vd?.short, f.position.map((p) => positionLabel[p].bn).join(" ")].filter(Boolean).join(" ");
  const minPhotos = Math.max(2, cat?.min_photos ?? 2);
  const issues = prohibitedCheck({ categoryId: f.categoryId, condition: f.condition, title: f.title || autoTitle, attributes: f.attributes }, now);
  const blocked = issues.some((i) => i.block);

  const build = (): Listing | null => {
    if (!cat) return null;
    const base = blankListing(vendor, cat.id);
    const title_bn = f.title.trim() || autoTitle;
    return {
      ...base, title_bn, title: [cat.name, vd?.short].filter(Boolean).join(" "), source: f.source ?? "unknown", condition: f.condition ?? "new",
      grade: f.condition && isUsed(f.condition) ? f.grade : null, attributes: f.attributes, position: f.position, price: f.price, stock_qty: f.stock,
      warranty_days: f.warranty, is_returnable: f.returnable, return_window_days: f.returnDays, dispatch_days: f.dispatch, is_universal: f.universal,
      fitments: f.fitments, description_bn: f.description.trim() || null, part_number: f.partNumber.trim() || null, media: mediaToListing(f.photos),
    };
  };

  const canNext: Record<StepKey, boolean> = {
    photos: f.photos.length >= 1,
    category: !!cat,
    car: f.universal || f.fitments.length > 0,
    position: true,
    kind: !!f.source && !!f.condition && (!f.condition || !isUsed(f.condition) || !!f.grade) && !blocked,
    specs: !cat || missingRequired(cat, f.attributes).length === 0,
    price: f.price > 0 && f.stock > 0,
    rules: true,
    preview: f.photos.length >= minPhotos && !blocked,
  };

  const post = () => {
    const l = build();
    if (!l) return;
    const ps = publishStatus(vendor, l.category_id);
    const saved = saveSellerListing({ ...l, status: ps.status }, `পণ্য যোগ: ${l.title_bn}`);
    rememberCar(vendor.id, f.fitments[0]);
    setPosted(saved);
  };

  if (posted) {
    const msg = posted.status === "active" ? tx("✅ পোস্ট হয়েছে! কাস্টমার এখন দেখতে পাবে।", "✅ Posted! Customers can see it now.") : posted.status === "pending_review" ? tx("⏳ অনুমোদনের অপেক্ষায় (সাধারণত ৪ ঘণ্টা)।", "⏳ Waiting for approval (usually 4 hours).") : tx("📝 ড্রাফট সেভ হয়েছে। যাচাই সম্পূর্ণ হলে পোস্ট করতে পারবেন।", "📝 Saved as draft. Post after verification.");
    return (
      <Container className="space-y-4">
        <Notice tone={posted.status === "active" ? "ok" : "wait"} className="text-lg font-bold">{msg}</Notice>
        {posted.status === "draft" && <Link href="/seller/verify" className="block text-center font-bold text-brand underline">{tx("যাচাই করুন", "Verify now")}</Link>}
        <Button variant="brand" size="xl" full onClick={() => { clear(); setPosted(null); }}>📷 {tx("আরেকটা যোগ করুন", "Add another")}</Button>
        <Button variant="outline" size="lg" full onClick={() => { setF({ ...f, step: 0, photos: [], stock: 1 }); setPosted(null); }}>📄 {tx("এর মতো আরেকটা (কপি)", "Copy this one")}</Button>
        <Button variant="ghost" size="lg" full onClick={() => { clear(); router.push("/seller/products"); }}>{tx("শেষ", "Done")}</Button>
        <HelpCall />
      </Container>
    );
  }

  const guides: Record<StepKey, [string, string, string, string]> = {
    photos: ["📷 ছবি তুলুন", "📷 Take photos", "পুরো জিনিসটা ফ্রেমে আনুন। ২ থেকে ৬টা ছবি দিন। আরও ছবি মানে বেশি বিক্রি।", "Fit the whole item in the frame. Take 2 to 6 photos. More photos sell more."],
    category: ["🔧 কী জিনিস?", "🔧 What is it?", "জিনিসটার ছবি বা নাম দেখে বাছাই করুন। খুঁজতেও পারেন।", "Pick what the item is. You can search too."],
    car: ["🚗 কোন গাড়ির?", "🚗 Which car?", "গাড়ির লোগো, মডেল, সাল বাছাই করুন। আরও গাড়িতে লাগলে টিক দিন।", "Pick the brand, model and year. Tick other cars it fits."],
    position: ["📍 কোন দিকের?", "📍 Which side?", "গাড়ির ছবিতে ট্যাপ করুন। ডান দিকে চালকের সিট।", "Tap on the car picture. The driver sits on the right."],
    kind: ["♻️ কেমন জিনিস?", "♻️ What kind?", "কোন কোম্পানির আর নতুন নাকি পুরনো, বড় বাটন চেপে বলুন।", "Tap who made it and whether it's new or used."],
    specs: ["📋 বিশেষ তথ্য", "📋 Details", "লাল তারকা দেওয়াগুলো দিতে হবে। বাকিগুলো ঐচ্ছিক।", "Starred ones are needed. The rest are optional."],
    price: ["💰 দাম ও পরিমাণ", "💰 Price & stock", "সংখ্যা চেপে দাম দিন। নিচে দেখুন আপনি কত পাবেন।", "Tap the numbers for the price. See below what you get."],
    rules: ["🛡️ ফেরত ও ওয়ারেন্টি", "🛡️ Returns & warranty", "দোকানের নিয়ম আগে থেকে বসানো। বদলাতে চাইলে চাপুন।", "Your shop defaults are set. Tap to change."],
    preview: ["👀 দেখে নিন", "👀 Check", "কাস্টমার যেভাবে দেখবে। ঠিক থাকলে পোস্ট করুন।", "This is how customers will see it. Post if it looks right."],
  };
  const g = guides[key];
  const draftListing = build();

  return (
    <Container className="space-y-5">
      <AddTabs />
      <div>
        <div className="mb-2 flex items-center justify-between text-sm font-semibold text-muted">
          <span>{tx("ধাপ", "Step")} {d(idx + 1)}/{d(steps.length)}</span>
          {(f.photos.length > 0 || f.categoryId) && (
            <button type="button" className="underline" onClick={clear}>{tx("নতুন করে শুরু", "Start over")}</button>
          )}
        </div>
        <div className="mb-3 flex gap-1">{steps.map((s, i) => <span key={s} className={`h-1.5 flex-1 rounded-full ${i <= idx ? "bg-seller" : "bg-line"}`} />)}</div>
        <h1 className="text-2xl font-bold">{lang === "bn" ? g[0] : g[1]}</h1>
        <AudioGuide text={lang === "bn" ? g[2] : g[3]} className="mt-2" />
      </div>

      {key === "photos" && (
        <div className="space-y-3">
          <PhotoUploader value={f.photos} onChange={(photos) => set({ photos })} max={6} />
          <PhotoCheck photos={f.photos} />
          <p className="text-center font-semibold text-brand-ink">📸 {tx("আরও ছবি = বেশি বিক্রি", "More photos = more sales")} ({d(f.photos.length)}/{d(6)})</p>
        </div>
      )}
      {key === "category" &&
        (cat ? (
          <div className="space-y-3">
            <div className="flex min-h-16 items-center gap-3 rounded-2xl border-2 border-ok bg-ok-soft p-3">
              <CategoryIcon icon={cat.icon} className="size-8" />
              <span className="flex-1 text-lg font-bold">{lang === "bn" ? cat.name_bn : cat.name}</span>
              <Button variant="outline" size="sm" onClick={() => set({ categoryId: null, attributes: {}, position: [] })}>{tx("বদলান", "Change")}</Button>
            </div>
          </div>
        ) : (
          <CategoryPicker onPick={(c) => set({ categoryId: c.id, attributes: {}, step: idx + 1 })} />
        ))}
      {key === "car" && <FitmentEditor vendorId={vendor.id} value={f.fitments} universal={f.universal} onChange={(fitments, universal) => set({ fitments, universal })} />}
      {key === "position" && <PositionPicker value={f.position} onChange={(position) => set({ position })} />}
      {key === "kind" && (
        <div className="space-y-3">
          <p className="font-semibold">{tx("উৎস (কোন কোম্পানির?)", "Source")}</p>
          <SourcePicker value={f.source} onChange={(source) => set({ source })} />
          <p className="font-semibold">{tx("অবস্থা", "Condition")}</p>
          <ConditionPicker value={f.condition} onChange={(condition) => set({ condition, grade: isUsed(condition) ? f.grade : null })} />
          {f.condition && isUsed(f.condition) && (
            <>
              <p className="font-semibold">{tx("গ্রেড (ছবি দেখে)", "Grade")}</p>
              <GradePicker value={f.grade} onChange={(grade) => set({ grade })} />
              {(f.grade === "A" || f.grade === "B") && <Notice>{tx("গ্রেড A/B দিলে কাছ থেকে তোলা ছবি দিন, পরে প্রমাণ হিসেবে লাগবে।", "For grade A/B add close-up photos as proof.")}</Notice>}
            </>
          )}
        </div>
      )}
      {key === "specs" && cat && (
        <div className="space-y-4">
          <AttributeFields category={cat} value={f.attributes} onChange={(attributes) => set({ attributes })} />
          <Field label={tx("পার্ট নম্বর (ঐচ্ছিক)", "Part number (optional)")}>
            <VoiceInput value={f.partNumber} onChange={(partNumber) => set({ partNumber })} placeholder="04465-12592" />
          </Field>
        </div>
      )}
      {key === "price" && (
        <div className="space-y-4">
          <PriceEditor vendor={vendor} value={f.price} onChange={(price) => set({ price })} categoryId={f.categoryId} condition={f.condition ?? "new"} />
          <div className="flex items-center justify-between rounded-2xl border border-line bg-card p-3">
            <span className="font-semibold">📦 {tx("কয়টা আছে?", "How many?")}</span>
            <Stepper value={f.stock} onChange={(stock) => set({ stock })} min={1} />
          </div>
        </div>
      )}
      {key === "rules" &&
        (editRules ? (
          <div className="space-y-4">
            <p className="font-semibold">{tx("ফেরত", "Returns")}</p>
            <ReturnsPicker returnable={f.returnable} days={f.returnDays} onChange={(returnable, returnDays) => set({ returnable, returnDays })} />
            <p className="font-semibold">{tx("ওয়ারেন্টি", "Warranty")}</p>
            <WarrantyPicker value={f.warranty} onChange={(warranty) => set({ warranty })} />
            <p className="font-semibold">{tx("কবে পাঠাতে পারবেন?", "Dispatch")}</p>
            <DispatchPicker value={f.dispatch} onChange={(dispatch) => set({ dispatch })} />
          </div>
        ) : (
          <button type="button" onClick={() => setEditRules(true)} className="w-full space-y-1 rounded-2xl border-2 border-line bg-card p-4 text-left">
            <p>↩️ {f.returnable ? tx(`${d(f.returnDays)} দিনে ফেরত`, `${f.returnDays}-day returns`) : tx("ফেরত নেই", "No returns")}</p>
            <p>🛡️ {f.warranty ? tx(`${d(f.warranty)} দিন ওয়ারেন্টি`, `${f.warranty}-day warranty`) : tx("ওয়ারেন্টি নেই", "No warranty")}</p>
            <p className="pt-2 font-semibold text-brand">✏️ {tx("বদলাতে চাইলে চাপুন", "Tap to change")}</p>
          </button>
        ))}
      {key === "preview" && draftListing && (
        <div className="space-y-4">
          <Field label={tx("নাম (ঠিক না থাকলে বদলান)", "Title (edit if needed)")}>
            <VoiceInput value={f.title || autoTitle} onChange={(title) => set({ title })} />
          </Field>
          <Field label={tx("বিবরণ (ঐচ্ছিক)", "Description (optional)")}>
            <VoiceTextarea value={f.description} onChange={(description) => set({ description })} />
          </Field>
          <ListingPreview l={{ ...draftListing, title_bn: f.title || autoTitle }} vendor={vendor} />
          {f.photos.length < minPhotos && <Notice tone="bad">{tx(`কমপক্ষে ${d(minPhotos)}টা ছবি লাগবে।`, `At least ${minPhotos} photos needed.`)} <button type="button" className="font-bold underline" onClick={() => go(0)}>{tx("ছবি যোগ", "Add photos")}</button></Notice>}
          {cat?.requires_video && <Notice tone="wait">🎥 {tx("ইঞ্জিন/গিয়ারবক্সে চালু অবস্থার ভিডিও দিন, বা 'টেস্ট করা হয়নি' বলুন।", "Add a running video for engines/gearboxes, or mark as not tested.")}</Notice>}
        </div>
      )}

      {issues.length > 0 && (key === "kind" || key === "preview" || key === "specs") && (
        <div className="space-y-2">
          {issues.map((i) => <Notice key={i.bn} tone={i.block ? "bad" : "wait"}>{i.block ? "⛔" : "⚠️"} {tx(i.bn, i.en)} <Link href="/seller/help#rules" className="underline">{tx("নিয়ম", "Rules")}</Link></Notice>)}
        </div>
      )}

      <div className="flex gap-3">
        {idx > 0 && <Button variant="outline" size="lg" className="flex-1" onClick={() => go(idx - 1)}>← {tx("পেছনে", "Back")}</Button>}
        {key === "preview" ? (
          <Button variant="ok" size="xl" className="flex-[2]" disabled={!canNext.preview} onClick={post}>🚀 {tx("পোস্ট করুন", "Post")}</Button>
        ) : (
          <Button variant="brand" size="xl" className="flex-[2]" disabled={!canNext[key]} onClick={() => go(idx + 1)}>
            {key === "position" && !f.position.length ? tx("দিক নেই, পরের ধাপ →", "No side, next →") : tx("পরের ধাপ →", "Next →")}
          </Button>
        )}
      </div>
      {f.position.length > 0 && key !== "position" && <p className="text-center text-sm text-muted">📍 {f.position.map((p) => L(positionLabel[p])).join(" · ")}</p>}
      <p className="text-center text-xs text-muted">💾 {tx("প্রতিটা ধাপ নিজে থেকে সেভ হয়, নেট গেলেও হারাবে না।", "Every step saves itself, even offline.")}</p>
      <HelpCall />
    </Container>
  );
}
