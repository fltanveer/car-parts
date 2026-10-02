"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PhotoUploader } from "@/components/media/PhotoUploader";
import { blankListing, publishStatus, saveSellerListing } from "@/lib/db/actions-seller";
import { catalogProducts, fitsVehicle, getBrand, getCategory, offersForProduct } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import type { CatalogProduct, Condition, MediaItem, Vendor } from "@/lib/types";
import { useT } from "../../providers/LangProvider";
import { SourceBadge } from "../../shared/Badges";
import { toast } from "../../shared/Misc";
import { VehiclePicker } from "../../shared/VehiclePicker";
import { MediaImage } from "../../ui/MediaImage";
import { Button, Card, EmptyState, Input, Notice, Stepper } from "../../ui/primitives";
import { ConditionPicker } from "../Choices";
import { DictateButton } from "../Dictate";
import { PriceEditor } from "../PriceSheet";
import { SellerPage } from "../SellerPage";
import { mediaToListing } from "../utils";
import { AddTabs } from "./AddTabs";

function PriceRange({ productId }: { productId: string }) {
  const { tx, taka } = useT();
  const offers = useDb((s) => offersForProduct(s, productId));
  if (!offers.length) return <p className="text-sm text-muted">{tx("এখনো কেউ বিক্রি করছে না, আপনি প্রথম হোন!", "No one sells this yet. Be first!")}</p>;
  const prices = offers.map((o) => o.price);
  return (
    <p className="text-sm font-semibold text-ink-2">
      🏪 {tx("অন্য দোকানের দাম", "Other shops")}: {taka(Math.min(...prices))} {tx("থেকে", "to")} {taka(Math.max(...prices))}
    </p>
  );
}

/** "আমার কাছেও আছে": pick a master product, set price + qty (file 02 §5.2). */
export function CatalogFlow({ vendor }: { vendor: Vendor }) {
  const { tx, lang } = useT();
  const [q, setQ] = useState("");
  const [genId, setGenId] = useState<string | null>(null);
  const [carPick, setCarPick] = useState(false);
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [condition, setCondition] = useState<Condition>("new");
  const [price, setPrice] = useState(0);
  const [qty, setQty] = useState(1);
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const mine = useDb((s) => s.listings.filter((l) => l.vendor_id === vendor.id && l.catalog_product_id && l.status !== "removed"));

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    return catalogProducts.filter((p) => {
      if (p.status !== "active") return false;
      if (genId && fitsVehicle(p.fitments, p.is_universal, genId) === false) return false;
      if (!t) return true;
      const c = getCategory(p.category_id);
      return [p.name, p.name_bn, p.part_number ?? "", ...p.cross_ref_numbers, c?.name ?? "", c?.name_bn ?? ""].some((x) => x.toLowerCase().includes(t));
    });
  }, [q, genId]);

  if (product) {
    const existing = mine.find((l) => l.catalog_product_id === product.id);
    const start = () => {
      const base = blankListing(vendor, product.category_id);
      const ps = publishStatus(vendor, product.category_id);
      saveSellerListing(
        {
          ...base, catalog_product_id: product.id, title: product.name, title_bn: product.name_bn, source: product.source, brand_id: product.brand_id,
          part_number: product.part_number, attributes: product.attributes, fitments: product.fitments, is_universal: product.is_universal, condition,
          price, stock_qty: qty, description_bn: product.description_bn || null,
          media: [...mediaToListing(photos), { url: `ph:${product.image}`, role: photos.length ? "other" : "main" }], status: ps.status,
        },
        `আমার কাছেও আছে: ${product.name_bn}`,
      );
      toast(ps.status === "active" ? tx("বিক্রি শুরু হয়েছে ✅", "Now selling ✅") : ps.status === "pending_review" ? tx("অনুমোদনের অপেক্ষায়", "Waiting for approval") : tx("ড্রাফট সেভ হয়েছে", "Saved as draft"));
      setProduct(null);
      setPrice(0);
      setQty(1);
      setPhotos([]);
    };
    return (
      <SellerPage title={tx("দাম ও পরিমাণ দিন", "Set price & stock")} guide={tx("শুধু অবস্থা, দাম আর কয়টা আছে দিন। তারপর সবুজ বাটন।", "Just set condition, price and quantity. Then the green button.")} action={<Button variant="ghost" onClick={() => setProduct(null)}>✕</Button>}>
        <Card className="flex gap-3 p-3">
          <MediaImage src={`ph:${product.image}`} alt={product.name_bn} className="size-20 shrink-0 rounded-xl" />
          <div className="min-w-0 space-y-1">
            <p className="font-bold">{lang === "bn" ? product.name_bn : product.name}</p>
            {product.part_number && <p className="text-sm text-muted"># {product.part_number}</p>}
            <SourceBadge source={product.source} />
            <PriceRange productId={product.id} />
          </div>
        </Card>
        {existing && <Notice tone="wait">{tx("এটা আপনার আগে থেকেই আছে।", "You already sell this.")} <Link className="font-bold underline" href={`/seller/products/${existing.id}`}>{tx("সেটা সম্পাদনা করুন", "Edit that one")}</Link></Notice>}
        <section className="space-y-2">
          <p className="font-semibold">{tx("অবস্থা", "Condition")}</p>
          <ConditionPicker value={condition} onChange={setCondition} allowForParts={false} />
        </section>
        <PriceEditor vendor={vendor} value={price} onChange={setPrice} categoryId={product.category_id} condition={condition} />
        <div className="flex items-center justify-between rounded-2xl border border-line bg-card p-3">
          <span className="font-semibold">📦 {tx("কয়টা আছে?", "How many?")}</span>
          <Stepper value={qty} onChange={setQty} min={1} />
        </div>
        <section className="space-y-2">
          <p className="font-semibold">📷 {tx("নিজের ছবি (ঐচ্ছিক)", "Your own photos (optional)")}</p>
          <p className="text-sm text-muted">{tx("আসল ছবি দিলে কাস্টমার বেশি বিশ্বাস করে।", "Real photos earn more trust.")}</p>
          <PhotoUploader value={photos} onChange={setPhotos} max={3} />
        </section>
        <Button variant="ok" size="xl" full disabled={price <= 0} onClick={start}>🚀 {tx("বিক্রি শুরু করুন", "Start selling")}</Button>
      </SellerPage>
    );
  }

  return (
    <SellerPage
      title={tx("📋 আমার কাছেও আছে", "📋 I have this too")}
      subtitle={tx("তালিকায় থাকা জিনিস খুঁজে শুধু দাম দিন, ১০ সেকেন্ডে বিক্রি শুরু।", "Find a listed item and just add your price.")}
      guide={tx("নাম, পার্ট নম্বর লিখুন বা মাইক চেপে বলুন। জিনিস পেলে চাপ দিন।", "Type a name or part number, or tap the mic and say it. Tap the item when you find it.")}
    >
      <AddTabs />
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tx("নাম বা পার্ট নম্বর", "Name or part number")} className="pl-12" />
        </div>
        <DictateButton onText={setQ} />
      </div>
      {carPick ? (
        <Card className="p-3">
          <VehiclePicker onDone={(c) => { setGenId(c.generation_id); setCarPick(false); }} />
        </Card>
      ) : (
        <Button variant="outline" full onClick={() => (genId ? setGenId(null) : setCarPick(true))}>
          🚗 {genId ? tx("গাড়ির ফিল্টার সরান", "Clear car filter") : tx("গাড়ি দিয়ে খুঁজুন", "Filter by car")}
        </Button>
      )}
      {results.length ? (
        <ul className="space-y-2">
          {results.map((p) => {
            const have = mine.some((l) => l.catalog_product_id === p.id);
            return (
              <li key={p.id}>
                <button type="button" onClick={() => setProduct(p)} className="flex w-full items-center gap-3 rounded-2xl border-2 border-line bg-card p-3 text-left hover:border-ink/30">
                  <MediaImage src={`ph:${p.image}`} alt={p.name_bn} className="size-16 shrink-0 rounded-xl" />
                  <span className="min-w-0 flex-1 space-y-0.5">
                    <span className="block font-bold leading-tight">{lang === "bn" ? p.name_bn : p.name}</span>
                    <span className="block text-xs text-muted">{[getBrand(p.brand_id)?.name, p.part_number].filter(Boolean).join(" · ")}</span>
                    <PriceRange productId={p.id} />
                    {have && <span className="text-xs font-bold text-ok">✓ {tx("আপনার আছে", "You sell this")}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon="🔍" title={tx("পাওয়া যায়নি", "Not found")} body={tx("ছবি তুলে নতুন পণ্য যোগ করুন।", "Add it as a new product with photos.")} action={<Link href="/seller/add/camera" className="font-bold text-brand underline">📷 {tx("ছবি তুলে যোগ", "Add with photos")}</Link>} />
      )}
    </SellerPage>
  );
}
