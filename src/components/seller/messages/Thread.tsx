"use client";

import { ImagePlus, Mic, Package, Send, Tag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PhotoUploader } from "@/components/media/PhotoUploader";
import { VoiceRecorder } from "@/components/media/VoiceRecorder";
import { markThreadRead, sendMessage } from "@/lib/db/actions";
import { sendListingCard, sendOfferCard } from "@/lib/db/actions-seller";
import { useDb } from "@/lib/db/store";
import { maskContactInfo } from "@/lib/rules";
import type { Listing, MediaItem, Vendor } from "@/lib/types";
import { useT } from "../../providers/LangProvider";
import { NumberPad, toast } from "../../shared/Misc";
import { Sheet } from "../../ui/Sheet";
import { Button, Chip, EmptyState, Input, Notice } from "../../ui/primitives";
import { ListingMini } from "../Bits";
import { DictateButton } from "../Dictate";
import { YouGet } from "../Money";
import { SellerPage } from "../SellerPage";
import { useLocalDraft } from "../utils";
import { Bubble } from "./Bubble";
import { ContextCard } from "./ContextCard";

const DEFAULT_REPLIES = ["আছে, পাঠাতে পারবো", "এই মডেলের নেই", "আজই পাঠাবো", "ছবি দিচ্ছি, একটু অপেক্ষা করুন"];

export function Thread({ id, vendor }: { id: string; vendor: Vendor }) {
  const { tx, taka } = useT();
  const t = useDb((s) => s.threads.find((x) => x.id === id && x.vendor_id === vendor.id) ?? null);
  const listings = useDb((s) => s.listings.filter((l) => l.vendor_id === vendor.id && ["active", "paused", "sold_out"].includes(l.status)));
  const [text, setText] = useState("");
  const [sheet, setSheet] = useState<null | "photo" | "voice" | "listing" | "offer" | "replies">(null);
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [offerListing, setOfferListing] = useState<Listing | null>(null);
  const [offerPrice, setOfferPrice] = useState(0);
  const [replies, setReplies] = useLocalDraft<{ list: string[] }>(`gaarihub:quick-replies:${vendor.id}`, { list: DEFAULT_REPLIES });
  const [newReply, setNewReply] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const count = t?.messages.length ?? 0;
  const unread = t?.unread_vendor ?? 0;

  useEffect(() => {
    if (unread) markThreadRead(id, "vendor");
  }, [id, unread]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [count]);

  if (!t) {
    return (
      <SellerPage title={tx("মেসেজ", "Messages")} back="/seller/messages">
        <EmptyState icon="💬" title={tx("কথোপকথন পাওয়া যায়নি", "Conversation not found")} />
      </SellerPage>
    );
  }
  const isSupport = t.type === "vendor_support";
  const warn = maskContactInfo(text).found;
  const send = (body: string) => {
    if (!body.trim()) return;
    sendMessage(id, "vendor", { type: "text", body: body.trim() });
    setText("");
  };

  return (
    <SellerPage
      title={isSupport ? tx("🛟 গাড়িহাব সাপোর্ট", "🛟 GaariHub support") : (t.customer_name?.split(" ")[0] ?? tx("কাস্টমার", "Customer"))}
      back="/seller/messages"
      guide={tx("নিচে লিখুন বা মাইক চেপে বলুন। 📦 দিয়ে নিজের পণ্য পাঠান, 🏷️ দিয়ে এই কাস্টমারের জন্য বিশেষ দাম দিন। নম্বর শেয়ার করবেন না।", "Type or tap the mic. Use 📦 to send your product, 🏷️ for a special price for this customer. Don't share numbers.")}
    >
      <ContextCard t={t} />
      <div className="space-y-2">
        {t.messages.map((m) => <Bubble key={m.id} m={m} />)}
        <div ref={end} />
      </div>

      <div className="sticky bottom-24 z-20 space-y-2 rounded-2xl border border-line bg-card p-2 shadow-lg">
        {warn && <Notice tone="bad">🚫 {tx("নম্বর শেয়ার করা যাবে না, কাস্টমার দেখতে পাবে না। বারবার করলে স্কোর কমবে।", "Numbers can't be shared and will be hidden. Repeating this lowers your score.")}</Notice>}
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {replies.list.slice(0, 6).map((r) => <Chip key={r} onClick={() => send(r)} className="text-xs">{r}</Chip>)}
          <Chip onClick={() => setSheet("replies")} className="text-xs">✏️ {tx("তৈরি উত্তর", "Saved replies")}</Chip>
        </div>
        <div className="flex gap-1.5">
          <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(text)} placeholder={tx("লিখুন…", "Type…")} />
          <DictateButton onText={(s) => setText((x) => (x ? `${x} ${s}` : s))} />
          <button type="button" onClick={() => send(text)} disabled={!text.trim()} aria-label={tx("পাঠান", "Send")} className="grid size-12 shrink-0 place-items-center rounded-xl bg-seller text-white disabled:opacity-40">
            <Send className="size-5" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
          <button type="button" onClick={() => setSheet("photo")} className="flex min-h-12 flex-col items-center justify-center rounded-xl bg-surface"><ImagePlus className="size-5" />{tx("ছবি", "Photo")}</button>
          <button type="button" onClick={() => setSheet("voice")} className="flex min-h-12 flex-col items-center justify-center rounded-xl bg-surface"><Mic className="size-5" />{tx("ভয়েস", "Voice")}</button>
          {!isSupport && <button type="button" onClick={() => setSheet("listing")} className="flex min-h-12 flex-col items-center justify-center rounded-xl bg-surface"><Package className="size-5" />{tx("পণ্য", "Product")}</button>}
          {!isSupport && <button type="button" onClick={() => setSheet("offer")} className="flex min-h-12 flex-col items-center justify-center rounded-xl bg-surface"><Tag className="size-5" />{tx("বিশেষ দাম", "Offer")}</button>}
        </div>
      </div>

      <Sheet open={sheet === "photo"} onClose={() => setSheet(null)} title={tx("ছবি পাঠান", "Send a photo")}>
        <div className="space-y-3 pb-2">
          <PhotoUploader value={photos} onChange={setPhotos} max={3} />
          <Button variant="brand" size="lg" full disabled={!photos.length} onClick={() => { photos.forEach((p) => sendMessage(id, "vendor", { type: "image", image: p })); setPhotos([]); setSheet(null); }}>📨 {tx("পাঠান", "Send")}</Button>
        </div>
      </Sheet>
      <Sheet open={sheet === "voice"} onClose={() => setSheet(null)} title={tx("ভয়েস পাঠান", "Send voice")}>
        <div className="pb-2">
          <VoiceRecorder sendLabel={tx("পাঠান", "Send")} onSaved={(v) => { sendMessage(id, "vendor", { type: "voice", voice: v }); setSheet(null); }} />
        </div>
      </Sheet>
      <Sheet open={sheet === "listing"} onClose={() => setSheet(null)} title={tx("নিজের পণ্য পাঠান", "Send my product")}>
        <div className="space-y-2 pb-2">
          {listings.map((l) => <ListingMini key={l.id} listing={l} onClick={() => { sendListingCard(id, l); setSheet(null); }} />)}
        </div>
      </Sheet>
      <Sheet open={sheet === "offer"} onClose={() => { setSheet(null); setOfferListing(null); }} title={tx("বিশেষ দাম কার্ড", "Special price card")}>
        <div className="space-y-3 pb-2">
          {!offerListing ? (
            <>
              <p className="text-muted">{tx("কোন পণ্যে বিশেষ দাম দেবেন? কাস্টমার এক ট্যাপে কার্টে নিতে পারবে।", "Which product? The customer can add it to cart in one tap.")}</p>
              {listings.map((l) => <ListingMini key={l.id} listing={l} onClick={() => { setOfferListing(l); setOfferPrice(l.price); }} />)}
            </>
          ) : (
            <>
              <ListingMini listing={offerListing} />
              <NumberPad value={offerPrice} onChange={setOfferPrice} />
              <YouGet vendor={vendor} price={offerPrice} />
              <Button variant="ok" size="xl" full disabled={offerPrice <= 0} onClick={() => { sendOfferCard(id, offerListing, offerPrice); toast(tx(`${taka(offerPrice)} দামের কার্ড পাঠানো হয়েছে`, `Offer of ${taka(offerPrice)} sent`)); setOfferListing(null); setSheet(null); }}>
                🏷️ {tx("বিশেষ দাম পাঠান", "Send offer")}
              </Button>
            </>
          )}
        </div>
      </Sheet>
      <Sheet open={sheet === "replies"} onClose={() => setSheet(null)} title={tx("তৈরি উত্তর", "Saved replies")}>
        <div className="space-y-3 pb-2">
          {replies.list.map((r) => (
            <div key={r} className="flex items-center gap-2">
              <button type="button" className="min-h-12 flex-1 rounded-xl bg-surface px-3 text-left font-semibold" onClick={() => { send(r); setSheet(null); }}>{r}</button>
              <button type="button" className="min-h-12 rounded-xl px-3 text-bad" aria-label={tx("মুছুন", "Delete")} onClick={() => setReplies({ list: replies.list.filter((x) => x !== r) })}>✕</button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input value={newReply} onChange={(e) => setNewReply(e.target.value)} placeholder={tx("নতুন উত্তর", "New reply")} />
            <DictateButton onText={setNewReply} />
          </div>
          <Button variant="brand" full disabled={!newReply.trim()} onClick={() => { setReplies({ list: [...replies.list, newReply.trim()] }); setNewReply(""); }}>＋ {tx("সেভ করুন", "Save")}</Button>
        </div>
      </Sheet>
    </SellerPage>
  );
}
