"use client";

import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { CategoryPicker } from "@/components/shared/CategoryPicker";
import { toast } from "@/components/shared/Misc";
import { MediaImage } from "@/components/ui/MediaImage";
import { Sheet } from "@/components/ui/Sheet";
import { Button, ButtonLink, Field, Input, Notice, Select, StatusPill } from "@/components/ui/primitives";
import { createDraftListingFor, markIntakeHandled, setIntakeType } from "@/lib/db/actions-admin-ops-trust";
import { categoryPath } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import { displayPhone } from "@/lib/format";
import { conditionLabel, sourceLabel } from "@/lib/labels";
import type { Condition, Source, WhatsAppIntake } from "@/lib/types";
import { CallLogForm } from "./CallLogForm";
import { DeskVoicePlayer } from "./DeskVoicePlayer";
import { FilterChips, Panel } from "./ui";

type Kind = "listing" | "request" | "support";

export function IntakeDetail({ item }: { item: WhatsAppIntake }) {
  const { tx, L, d, dateTime } = useT();
  const vendors = useDb((s) => s.vendors.filter((v) => v.status !== "closed"));
  const [kind, setKind] = useState<Kind>(item.type ?? (item.sender_kind === "vendor" ? "listing" : "request"));
  const [vendorId, setVendorId] = useState(item.vendor_id ?? "");
  const [catOpen, setCatOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [condition, setCondition] = useState<Condition>("used_import");
  const [source, setSource] = useState<Source>("genuine");
  const media = Array.from({ length: item.media_count }, (_, i) => `ph:${["light", "body", "mirror", "engine"][i % 4]}`);
  const handled = item.status === "handled";
  const choose = (k: Kind) => {
    setKind(k);
    setIntakeType(item.id, k);
  };

  return (
    <div className="space-y-4">
      <Panel title={`💬 ${d(displayPhone(item.from_phone))}`} action={<StatusPill tone={handled ? "ok" : "wait"}>{handled ? tx("সম্পন্ন", "Handled") : tx("নতুন", "New")}</StatusPill>}>
        <p className="text-sm text-muted">
          {item.sender_kind === "vendor" ? tx(`বিক্রেতা: ${vendors.find((v) => v.id === item.vendor_id)?.shop_name_bn ?? ""}`, `Seller: ${vendors.find((v) => v.id === item.vendor_id)?.shop_name ?? ""}`) : item.sender_kind === "customer" ? tx("কাস্টমার", "Customer") : tx("অজানা প্রেরক", "Unknown sender")} · {dateTime(item.created_at)}
        </p>
        {item.text && <p className="mt-2 rounded-xl bg-surface p-3">“{item.text}”</p>}
        {item.has_voice && <div className="mt-3"><DeskVoicePlayer src="" duration={18} /></div>}
        {media.length > 0 && (
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {media.map((m, i) => <MediaImage key={i} src={m} alt="" className="size-24 shrink-0 rounded-xl" />)}
          </div>
        )}
      </Panel>

      <Panel title={tx("এটা কী?", "What is it?")}>
        <FilterChips<Kind>
          value={kind}
          onChange={choose}
          items={[
            { value: "listing", label: tx("📦 বিক্রেতার পণ্য", "📦 Seller listing") },
            { value: "request", label: tx("🙋 কাস্টমারের রিকোয়েস্ট", "🙋 Customer request") },
            { value: "support", label: tx("🎧 সাপোর্ট", "🎧 Support") },
          ]}
        />
        <div className="mt-4">
          {kind === "listing" && (
            <div className="space-y-3">
              <Notice>{tx("ড্রাফট হিসেবে তৈরি হবে। বিক্রেতা নিজের প্যানেলে দেখে \"অনুমোদন দিন\" চাপলে তবেই প্রকাশ।", "Created as a draft. It goes live only after the seller approves it in their panel.")}</Notice>
              <Field label={tx("বিক্রেতা", "Seller")}>
                <Select value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
                  <option value="">{tx("বাছুন", "Choose")}</option>
                  {vendors.map((v) => <option key={v.id} value={v.id}>{v.shop_name_bn}</option>)}
                </Select>
              </Field>
              <Button variant="outline" full onClick={() => setCatOpen(true)}>
                {categoryId ? categoryPath(categoryId).map((c) => c.name_bn).join(" › ") : tx("ক্যাটাগরি বাছুন", "Choose category")}
              </Button>
              <Field label={tx("নাম", "Title")}>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={tx("দাম (৳, বাধ্যতামূলক)", "Price (৳, required)")}>
                  <Input type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} />
                </Field>
                <Field label={tx("স্টক", "Stock")}>
                  <Input type="number" min={1} value={stock} onChange={(e) => setStock(e.target.value)} />
                </Field>
              </div>
              <FilterChips<Condition> value={condition} onChange={setCondition} items={(["new", "used_import", "used_local", "refurbished"] as Condition[]).map((c) => ({ value: c, label: L(conditionLabel[c]) }))} />
              <FilterChips<Source> value={source} onChange={setSource} items={(["genuine", "oem_brand", "aftermarket", "local_made", "unknown"] as Source[]).map((c) => ({ value: c, label: L(sourceLabel[c]) }))} />
              <Button
                variant="brand"
                size="lg"
                full
                disabled={!vendorId || !categoryId || !title.trim() || !(Number(price) > 0) || handled}
                onClick={() => {
                  createDraftListingFor(vendorId, { category_id: categoryId!, title_bn: title.trim(), price: Number(price), stock_qty: Math.max(1, Number(stock) || 1), condition, source, media });
                  markIntakeHandled(item.id);
                  toast(tx("ড্রাফট তৈরি, বিক্রেতাকে জানানো হয়েছে", "Draft created, seller notified"));
                }}
              >
                {tx("ড্রাফট লিস্টিং বানান", "Create draft listing")}
              </Button>
            </div>
          )}
          {kind === "request" && (
            <div className="space-y-3">
              <p className="text-sm">{tx("রিকোয়েস্ট এন্ট্রি ফর্মে ফোন নম্বর ও লেখা আগে থেকে বসানো থাকবে। পাঠানোর পর এটা নিজে থেকে সম্পন্ন হবে।", "The request entry form opens prefilled; this item is marked handled when you send.")}</p>
              <ButtonLink href={`/admin/requests/new?phone=${encodeURIComponent(item.from_phone)}&intake=${item.id}&text=${encodeURIComponent(item.text ?? "")}`} variant="brand" size="lg" full>
                {tx("রিকোয়েস্ট এন্ট্রি খুলুন", "Open request entry")}
              </ButtonLink>
            </div>
          )}
          {kind === "support" && <CallLogForm key={item.id} phone={item.from_phone} purpose="বিক্রেতা সাপোর্ট" onDone={() => markIntakeHandled(item.id)} submitLabel={tx("লগ করে সম্পন্ন করুন", "Log & mark handled")} />}
        </div>
        {!handled && (
          <Button variant="ghost" className="mt-3" onClick={() => markIntakeHandled(item.id)}>
            ✔️ {tx("শুধু সম্পন্ন চিহ্ন দিন", "Just mark handled")}
          </Button>
        )}
      </Panel>

      <Sheet open={catOpen} onClose={() => setCatOpen(false)} title={tx("ক্যাটাগরি বাছুন", "Choose category")}>
        <CategoryPicker
          onPick={(c) => {
            setCategoryId(c.id);
            if (!title) setTitle(c.name_bn);
            setCatOpen(false);
          }}
        />
      </Sheet>
    </div>
  );
}
