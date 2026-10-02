"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { PhotoUploader } from "@/components/media/PhotoUploader";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { MediaImage } from "@/components/ui/MediaImage";
import { Button, Chip, Field, Input, Notice, Select, Textarea } from "@/components/ui/primitives";
import { recordQc } from "@/lib/db/actions-admin-core";
import { describeVehicle, getBrand } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import { conditionLabel, gradeLabel, sourceLabel } from "@/lib/labels";
import type { MediaItem, VendorOrder } from "@/lib/types";
import { KV, Panel } from "../index";
import { COURIERS } from "../orders/SubOrderActions";
import { QC_KEYS } from "../orders/SubOrderCard";

const FAIL_REASONS = [
  { bn: "পার্ট নম্বর মেলেনি", en: "Part number mismatch" },
  { bn: "জেনুইন বলা হয়েছিল, কিন্তু কপি", en: "Claimed genuine, is a copy" },
  { bn: "গ্রেড কম", en: "Grade lower than claimed" },
  { bn: "ভাঙা/ফাটা", en: "Cracked / broken" },
  { bn: "কাস্টমারের গাড়িতে লাগবে না", en: "Won't fit customer's car" },
];

/** Listing claims side by side with the QC checklist (file 03 10.3). */
export function QcPanel({ vo }: { vo: VendorOrder }) {
  const { tx, L, lang, d } = useT();
  const order = useDb((s) => s.orders.find((o) => o.id === vo.order_id) ?? null);
  const listings = useDb((s) => s.listings.filter((l) => vo.items.some((i) => i.listing_id === l.id)));
  const vehicle = useDb((s) => s.vehicles.find((v) => v.id === order?.user_vehicle_id) ?? null);
  const [check, setCheck] = useState<Record<string, boolean>>({});
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [note, setNote] = useState("");
  const [courier, setCourier] = useState(COURIERS[1]);
  const [tracking, setTracking] = useState("");
  const [after, setAfter] = useState<"refund" | "alternative">("refund");

  const allOk = Object.keys(QC_KEYS).every((k) => check[k]);
  const photosOk = photos.length >= 2;
  const vd = vehicle ? describeVehicle(vehicle.generation_id, vehicle.engine_id, lang) : null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title={tx("বিক্রেতা যা দাবি করেছে", "What the seller claimed")}>
        {vo.items.map((it) => {
          const l = listings.find((x) => x.id === it.listing_id);
          return (
            <div key={it.id} className="mb-4 space-y-2">
              <div className="flex gap-2 overflow-x-auto">
                {(l?.media ?? [{ url: it.snapshot.image, role: "main" as const }]).map((m, i) => (
                  <MediaImage key={i} src={m.url} alt={it.snapshot.title} className="size-24 shrink-0 rounded-xl" />
                ))}
              </div>
              <p className="font-semibold">{it.snapshot.title} × {d(it.qty)}</p>
              <KV
                rows={[
                  [tx("উৎস", "Source"), L(sourceLabel[it.snapshot.source])],
                  [tx("অবস্থা", "Condition"), L(conditionLabel[it.snapshot.condition])],
                  [tx("গ্রেড", "Grade"), it.snapshot.grade ? `${it.snapshot.grade} · ${L(gradeLabel[it.snapshot.grade])}` : "—"],
                  [tx("পার্ট নম্বর", "Part number"), l?.part_number ?? "—"],
                  [tx("ব্র্যান্ড", "Brand"), getBrand(l?.brand_id ?? null)?.name ?? "—"],
                  [tx("কাস্টমারের গাড়ি", "Customer's car"), vd?.full ?? tx("সেট করা নেই", "Not set")],
                  [tx("ফিট দাবি", "Fit claim"), it.snapshot.fits_user_vehicle === true ? tx("✅ ফিট লেখা", "✅ Listed as fitting") : it.snapshot.fits_user_vehicle === false ? tx("⚠️ ফিট লেখা নেই", "⚠️ Not listed") : "—"],
                ]}
              />
              {l?.description_bn && <p className="text-sm text-ink-2">{l.description_bn}</p>}
            </div>
          );
        })}
        {vo.packing_photo && (
          <figure>
            <figcaption className="mb-1 text-xs font-semibold text-muted">{tx("বিক্রেতার প্যাকিং ছবি", "Seller packing photo")}</figcaption>
            <MediaImage src={vo.packing_photo} alt="packing" className="size-28 rounded-xl" />
          </figure>
        )}
      </Panel>
      <Panel title={tx("হাতের পণ্য মিলিয়ে দেখুন", "Check the item in hand")}>
        <ul className="space-y-2">
          {Object.entries(QC_KEYS).map(([k, l]) => (
            <li key={k}>
              <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 border-line px-3 has-[:checked]:border-ok has-[:checked]:bg-ok-soft">
                <input type="checkbox" className="size-5" checked={!!check[k]} onChange={(e) => setCheck((c) => ({ ...c, [k]: e.target.checked }))} />
                <span className="font-semibold">{L(l)}</span>
              </label>
            </li>
          ))}
        </ul>
        <p className="mb-1 mt-4 font-semibold">{tx("QC ছবি (কমপক্ষে ২টা)", "QC photos (at least 2)")}</p>
        <PhotoUploader value={photos} onChange={setPhotos} max={6} />
        {!photosOk && <p className="mt-1 text-sm text-wait">{tx(`আরও ${d(2 - photos.length)}টা ছবি লাগবে`, `${2 - photos.length} more photo(s) needed`)}</p>}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Field label={tx("কুরিয়ার", "Courier")}>
            <Select value={courier} onChange={(e) => setCourier(e.target.value)}>{COURIERS.map((c) => <option key={c}>{c}</option>)}</Select>
          </Field>
          <Field label={tx("ট্র্যাকিং নম্বর", "Tracking no")}><Input value={tracking} onChange={(e) => setTracking(e.target.value.toUpperCase())} /></Field>
        </div>
        <Button
          full
          size="lg"
          variant="ok"
          className="mt-3"
          disabled={!allOk || !photosOk || tracking.trim().length < 4}
          onClick={() => {
            recordQc(vo.id, { checklist: check, photos: photos.map((p) => p.url), note: note || null, result: "pass" }, { courier, tracking: tracking.trim() });
            toast(tx("QC পাস, পাঠানো হয়েছে", "QC passed, shipped"));
          }}
        >
          <CheckCircle2 className="size-5" /> {tx("পাস — প্যাক করে পাঠান", "Pass — pack & ship")}
        </Button>
        <div className="mt-5 space-y-2 border-t border-line pt-4">
          <p className="font-semibold text-bad">{tx("ফেল হলে", "If it fails")}</p>
          <div className="flex flex-wrap gap-2">
            {FAIL_REASONS.map((r) => (
              <Chip key={r.en} active={note === r.bn} onClick={() => setNote(r.bn)}>{L(r)}</Chip>
            ))}
          </div>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={tx("কারণ লিখুন (বাধ্যতামূলক)", "Reason (required)")} className="min-h-20" />
          <div className="flex flex-wrap gap-2">
            <Chip active={after === "refund"} onClick={() => setAfter("refund")}>💸 {tx("কাস্টমারকে রিফান্ড", "Refund customer")}</Chip>
            <Chip active={after === "alternative"} onClick={() => setAfter("alternative")}>🔁 {tx("বিকল্প প্রস্তাব", "Offer alternative")}</Chip>
          </div>
          <Notice tone="info">{tx("ফেল করলে বিক্রেতার স্কোর কাটা যাবে, পণ্য বিক্রেতাকে ফেরত যাবে। টাকা নেওয়া থাকলে রিফান্ড কিউতে স্বয়ংক্রিয়ভাবে যাবে।", "Failing deducts seller score and returns the item to the seller. Paid money goes to the refund queue automatically.")}</Notice>
          <Button
            full
            size="lg"
            variant="danger"
            disabled={note.trim().length < 3 || !photosOk}
            onClick={() => {
              recordQc(vo.id, { checklist: check, photos: photos.map((p) => p.url), note: `${note} · ${after === "refund" ? "রিফান্ড" : "বিকল্প প্রস্তাব"}`, result: "fail" });
              toast(tx("QC ফেল রেকর্ড হয়েছে", "QC fail recorded"), "info");
            }}
          >
            <XCircle className="size-5" /> {tx("ফেল — বিক্রেতাকে ফেরত", "Fail — return to seller")}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
