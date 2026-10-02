"use client";

import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { PhotoUploader } from "@/components/media/PhotoUploader";
import { addDonor, blankListing, logActivity, publishStatus, saveSellerListing } from "@/lib/db/actions-seller";
import { childCategories, describeVehicle, getCategory } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import { positionLabel } from "@/lib/labels";
import type { Grade, MediaItem, PositionKey, Vendor } from "@/lib/types";
import { useT } from "../../providers/LangProvider";
import { MakeLogo, toast } from "../../shared/Misc";
import { VehiclePicker } from "../../shared/VehiclePicker";
import { Button, Card, Chip, Field, Input, Notice } from "../../ui/primitives";
import { PriceSheet } from "../PriceSheet";
import { SellerPage } from "../SellerPage";
import { mediaToListing, useLocalDraft } from "../utils";
import { AddTabs } from "./AddTabs";

const GROUPS = ["engine-assembly", "gearbox", "lamps", "panels", "cuts", "mirrors", "handles-locks", "glass-parts", "interior-parts", "ac-parts", "modules", "rotating", "suspension-parts", "steering-parts", "cooling-system"];
const COLORS = ["সাদা", "কালো", "সিলভার", "লাল", "নীল", "অন্য"];

interface Row {
  key: string;
  categoryId: string;
  position: PositionKey[];
  photos: MediaItem[];
  grade: Grade | null;
  price: number;
}
interface Draft {
  step: 1 | 2 | 3;
  donorId: string | null;
  generationId: string | null;
  engineId: string | null;
  color: string;
  km: string;
  carPhotos: MediaItem[];
  rows: Row[];
}

/** Half-cut donor car → tick parts → quick rows → post all (file 02 §5.3). */
export function DonorFlow({ vendor }: { vendor: Vendor }) {
  const { tx, d, L, lang, taka } = useT();
  const init: Draft = { step: 1, donorId: null, generationId: null, engineId: null, color: COLORS[0], km: "", carPhotos: [], rows: [] };
  const [f, setF, clear] = useLocalDraft<Draft>(`gaarihub:add-donor:${vendor.id}`, init);
  const [open, setOpen] = useState<string | null>(GROUPS[2]);
  const [priceFor, setPriceFor] = useState<string | null>(null);
  const myDonors = useDb((s) => s.donors.filter((x) => x.vendor_id === vendor.id));
  const set = (p: Partial<Draft>) => setF((x) => ({ ...x, ...p }));
  const vd = describeVehicle(f.generationId, f.engineId);

  const rowKey = (catId: string, pos: PositionKey | null) => `${catId}|${pos ?? ""}`;
  const toggle = (catId: string, pos: PositionKey | null) => {
    const k = rowKey(catId, pos);
    set({ rows: f.rows.some((r) => r.key === k) ? f.rows.filter((r) => r.key !== k) : [...f.rows, { key: k, categoryId: catId, position: pos ? [pos] : [], photos: [], grade: "B", price: 0 }] });
  };
  const patchRow = (k: string, p: Partial<Row>) => set({ rows: f.rows.map((r) => (r.key === k ? { ...r, ...p } : r)) });
  const label = (r: Pick<Row, "categoryId" | "position">) => {
    const c = getCategory(r.categoryId);
    return `${lang === "bn" ? c?.name_bn : c?.name}${r.position.length ? ` (${r.position.map((p) => L(positionLabel[p])).join(", ")})` : ""}`;
  };

  const step1Ok = !!f.donorId || (!!f.generationId && f.carPhotos.length >= 4);
  const ready = f.rows.filter((r) => r.price > 0 && r.grade && r.photos.length >= 1);

  const postAll = () => {
    let donorId = f.donorId;
    if (!donorId) {
      donorId = addDonor({ vendor_id: vendor.id, generation_id: f.generationId!, engine_id: f.engineId, color: f.color, odometer_km: f.km ? Number(f.km) : null, notes: null }).id;
    }
    const donor = myDonors.find((x) => x.id === donorId);
    const genId = donor?.generation_id ?? f.generationId!;
    const v = describeVehicle(genId);
    let posted = 0;
    ready.forEach((r) => {
      const base = blankListing(vendor, r.categoryId);
      const ps = publishStatus(vendor, r.categoryId);
      saveSellerListing({
        ...base, title_bn: `${v?.short ?? ""} ${label(r)}`.trim(), title: `${v?.short ?? ""} ${getCategory(r.categoryId)?.name ?? ""}`.trim(), source: "genuine",
        condition: "used_import", grade: r.grade, position: r.position, price: r.price, stock_qty: 1, donor_vehicle_id: donorId,
        fitments: v ? [{ make_id: v.make.id, model_id: v.model.id, generation_id: genId, engine_id: donor?.engine_id ?? f.engineId, notes: null }] : [],
        media: mediaToListing(r.photos), status: ps.status,
      });
      posted++;
    });
    logActivity(vendor.id, `হাফকাট থেকে ${posted}টা পার্টস পোস্ট`);
    toast(tx(`${d(posted)}টা পার্টস পোস্ট হয়েছে ✅`, `${posted} parts posted ✅`));
    const left = f.rows.filter((r) => !ready.includes(r));
    if (left.length) set({ rows: left, donorId });
    else clear();
  };

  return (
    <SellerPage
      title={tx("🚗 হাফকাট গাড়ি", "🚗 Half-cut car")}
      subtitle={tx("একটা গাড়ি যোগ করে তার পার্টসগুলো একসাথে পোস্ট করুন।", "Add one car, then post its parts together.")}
      guide={tx("প্রথমে গাড়ির মডেল, সাল আর ৪টা ছবি দিন। তারপর কী কী বিক্রি করবেন টিক দিন। শেষে প্রতিটার ছবি, গ্রেড আর দাম দিন।", "First add the car model, year and 4 photos. Then tick the parts you'll sell. Finally add a photo, grade and price for each.")}
    >
      <AddTabs />
      <div className="flex gap-1">{[1, 2, 3].map((s) => <span key={s} className={clsx("h-1.5 flex-1 rounded-full", s <= f.step ? "bg-seller" : "bg-line")} />)}</div>

      {f.step === 1 && (
        <div className="space-y-4">
          {myDonors.length > 0 && (
            <section className="space-y-2">
              <p className="font-semibold">{tx("আমার আগের গাড়ি থেকে", "From my earlier cars")}</p>
              {myDonors.map((dn) => {
                const v = describeVehicle(dn.generation_id, dn.engine_id);
                return (
                  <button key={dn.id} type="button" onClick={() => set({ donorId: f.donorId === dn.id ? null : dn.id, generationId: dn.generation_id, engineId: dn.engine_id })} className={clsx("flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-3 text-left", f.donorId === dn.id ? "border-brand bg-brand-soft/40" : "border-line bg-card")}>
                    {v && <MakeLogo make={v.make} size="sm" />}
                    <span className="font-semibold">{v?.full}</span>
                    <span className="text-sm text-muted">{dn.color}</span>
                  </button>
                );
              })}
            </section>
          )}
          {!f.donorId && (
            <>
              <p className="font-semibold">{tx("নতুন গাড়ি", "New car")}</p>
              {vd ? (
                <div className="flex items-center gap-3 rounded-2xl border-2 border-ok bg-ok-soft p-3">
                  <MakeLogo make={vd.make} />
                  <span className="flex-1 font-bold">{vd.full}</span>
                  <Button variant="outline" size="sm" onClick={() => set({ generationId: null, engineId: null })}>{tx("বদলান", "Change")}</Button>
                </div>
              ) : (
                <Card className="p-3">
                  <VehiclePicker onDone={(c) => (c.generation_id ? set({ generationId: c.generation_id, engineId: c.engine_id }) : toast(tx("সাল বাছাই করুন", "Pick the year"), "bad"))} />
                </Card>
              )}
              <Field label={tx("রঙ", "Colour")}>
                <div className="flex flex-wrap gap-2">{COLORS.map((c) => <Chip key={c} active={f.color === c} onClick={() => set({ color: c })} className="min-h-11">{c}</Chip>)}</div>
              </Field>
              <Field label={tx("কত কিমি চলেছে (জানা থাকলে)", "Mileage km (if known)")}>
                <Input inputMode="numeric" value={f.km} onChange={(e) => set({ km: e.target.value.replace(/\D/g, "") })} placeholder="78000" />
              </Field>
              <section className="space-y-2">
                <p className="font-semibold">📷 {tx("পুরো গাড়ির ৪টা ছবি (সামনে, পেছনে, দুই পাশ)", "4 photos of the whole car (front, back, both sides)")} · {d(f.carPhotos.length)}/{d(4)}</p>
                <PhotoUploader value={f.carPhotos} onChange={(carPhotos) => set({ carPhotos })} max={4} />
              </section>
            </>
          )}
          <Button variant="brand" size="xl" full disabled={!step1Ok} onClick={() => set({ step: 2 })}>{tx("পরের ধাপ →", "Next →")}</Button>
        </div>
      )}

      {f.step === 2 && (
        <div className="space-y-3">
          <p className="text-lg font-bold">{tx("এই গাড়ি থেকে কী কী বিক্রি করবেন?", "What will you sell from this car?")} <span className="text-brand">({d(f.rows.length)})</span></p>
          {GROUPS.map((gs) => {
            const g = getCategory(`c-${gs}`);
            if (!g) return null;
            const items = childCategories(g.id);
            const picked = f.rows.filter((r) => getCategory(r.categoryId)?.parent_id === g.id).length;
            return (
              <div key={gs} className="rounded-2xl border border-line bg-card">
                <button type="button" onClick={() => setOpen(open === gs ? null : gs)} className="flex min-h-14 w-full items-center justify-between px-4 font-semibold">
                  <span>{lang === "bn" ? g.name_bn : g.name} {picked > 0 && <span className="ml-1 rounded-full bg-ok px-2 text-sm text-white">{d(picked)}</span>}</span>
                  <ChevronDown className={clsx("size-5", open === gs && "rotate-180")} />
                </button>
                {open === gs && (
                  <div className="flex flex-wrap gap-2 px-4 pb-4">
                    {items.flatMap((c) =>
                      (g.needs_position ? (["driver", "passenger"] as PositionKey[]) : [null]).map((pos) => {
                        const on = f.rows.some((r) => r.key === rowKey(c.id, pos));
                        return (
                          <Chip key={rowKey(c.id, pos)} active={on} onClick={() => toggle(c.id, pos)} className="min-h-12 text-base">
                            {on ? "☑" : "☐"} {label({ categoryId: c.id, position: pos ? [pos] : [] })}
                          </Chip>
                        );
                      }),
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div className="flex gap-3">
            <Button variant="outline" size="lg" className="flex-1" onClick={() => set({ step: 1 })}>← {tx("পেছনে", "Back")}</Button>
            <Button variant="brand" size="xl" className="flex-[2]" disabled={!f.rows.length} onClick={() => set({ step: 3 })}>{tx("পরের ধাপ →", "Next →")}</Button>
          </div>
        </div>
      )}

      {f.step === 3 && (
        <div className="space-y-3">
          <Notice>🚗 {vd?.full ?? ""} · {tx("গাড়ি ও ফিটমেন্ট আগে থেকে বসানো", "Car & fitment pre-filled")}</Notice>
          {f.rows.map((r) => (
            <Card key={r.key} className="space-y-3 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold">{label(r)}</p>
                <button type="button" className="text-sm font-semibold text-bad" onClick={() => toggle(r.categoryId, r.position[0] ?? null)}>✕ {tx("বাদ", "Remove")}</button>
              </div>
              <PhotoUploader value={r.photos} onChange={(photos) => patchRow(r.key, { photos })} max={2} />
              <div className="flex flex-wrap gap-2">
                {(["A", "B", "C", "D"] as Grade[]).map((gr) => <Chip key={gr} active={r.grade === gr} onClick={() => patchRow(r.key, { grade: gr })} className="min-h-11">{tx("গ্রেড", "Grade")} {gr}</Chip>)}
              </div>
              <Button variant={r.price ? "outline" : "brand"} size="lg" full onClick={() => setPriceFor(r.key)}>
                💰 {r.price ? taka(r.price) : tx("দাম দিন", "Set price")}
              </Button>
            </Card>
          ))}
          <p className="text-center font-semibold">{tx(`${d(ready.length)}/${d(f.rows.length)}টা তৈরি (ছবি + গ্রেড + দাম)`, `${ready.length}/${f.rows.length} ready (photo + grade + price)`)}</p>
          <div className="flex gap-3">
            <Button variant="outline" size="lg" className="flex-1" onClick={() => set({ step: 2 })}>← {tx("পেছনে", "Back")}</Button>
            <Button variant="ok" size="xl" className="flex-[2]" disabled={!ready.length} onClick={postAll}>🚀 {tx(`${d(ready.length)}টা পোস্ট করুন`, `Post ${ready.length}`)}</Button>
          </div>
        </div>
      )}

      <PriceSheet
        open={!!priceFor}
        onClose={() => setPriceFor(null)}
        vendor={vendor}
        initial={f.rows.find((r) => r.key === priceFor)?.price ?? 0}
        categoryId={f.rows.find((r) => r.key === priceFor)?.categoryId ?? null}
        condition="used_import"
        onSave={(price) => priceFor && patchRow(priceFor, { price })}
      />
    </SellerPage>
  );
}
